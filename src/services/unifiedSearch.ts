/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductRecord, NutritionFacts, EvidenceSource } from '../types/index.ts';
import {
  searchOpenFoodFactsPaged,
  fetchProductByBarcode,
  OffSearchResultItem,
  parseIngredientsText
} from './openFoodFacts.ts';
import {
  searchUsdaFoodData,
  fetchUsdaFoodById,
  usdaItemToProductRecord,
  usdaItemToNutrition,
  UsdaFoodItem,
  USDA_STANDARD_BENCHMARKS,
  findUsdaStandardBenchmark
} from './usdaFoodData.ts';
import {
  searchFoodCatalog,
  CatalogItem,
  catalogItemToProductRecord,
  FOOD_CATALOG
} from '../data/foodCatalog.ts';
import { SAMPLE_SCENARIOS, getSampleScenario } from '../data/sampleScenarios.ts';

export type SearchItemSource =
  | 'open_food_facts'
  | 'usda_fdc'
  | 'catalog'
  | 'scenario'
  | 'direct_barcode';

export type DataAvailabilityStatus = boolean | 'unverified';
export type AllergenAvailabilityStatus = 'declared' | 'none_declared' | 'unverified';

export interface UnifiedSearchResultItem {
  id: string; // e.g. "off-016000275287" or "usda-171689"
  source: SearchItemSource;
  sourceLabel: string; // "Open Food Facts" | "USDA FoodData Central" | "Curated Food Catalog" | "Verified Demo"
  sourceBadgeClass: string;
  sourceIdentifier: string; // "UPC: 016000275287" or "FDC ID: 171689"
  rawId: string; // Barcode or FDC number
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  calories?: number;
  servingSize?: string;
  category?: string;
  dataType?: string; // e.g. "Foundation Food", "SR Legacy", "Branded Food"
  ingredientPreview?: string;
  availableData: {
    hasIngredients: DataAvailabilityStatus;
    hasNutrition: DataAvailabilityStatus;
    hasAllergens: boolean | 'unverified' | 'none_declared';
    allergenStatus: AllergenAvailabilityStatus;
    hasImage: boolean;
  };
  rawOffItem?: OffSearchResultItem;
  rawUsdaItem?: UsdaFoodItem;
  catalogItem?: CatalogItem;
  localProduct?: ProductRecord;
}

export interface UnifiedSearchResponse {
  query: string;
  results: UnifiedSearchResultItem[];
  totalResults: number; // Count of distinct loaded/displayed results in this response
  displayedCount: number; // Accurately reflects loaded results displayed
  sourceCounts: {
    openFoodFacts: number; // Loaded Open Food Facts results count
    openFoodFactsReportedTotal?: number; // Total reported by remote server if available
    usdaFoodData: number; // Loaded USDA results count
    catalog: number;
    scenarios: number;
  };
  partialFailures: {
    openFoodFacts?: boolean;
    usdaFoodData?: boolean;
  };
  isBarcodeMatch?: boolean;
}

// In-memory cache for resolved ProductRecords to prevent redundant network round-trips
const resolvedProductCache = new Map<string, ProductRecord>();

/**
 * Truncates an ingredient string cleanly for unified result previews.
 */
export function createIngredientPreview(text?: string, maxLength = 85): string | undefined {
  if (!text || !text.trim()) return undefined;
  const cleaned = text.replace(/^(ingredients?|contents?)\s*[:\-]\s*/i, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + '...';
}

/**
 * Updates availability indicators and preview on a search result item when full details are resolved.
 */
export function updateItemWithResolvedProduct(
  item: UnifiedSearchResultItem,
  record: ProductRecord
): void {
  item.localProduct = record;
  const hasIngredients = Boolean(record.ingredientsText && record.ingredientsText.trim().length > 0);
  const hasNutrition = Boolean(
    record.nutritionFacts &&
    (record.nutritionFacts.calories !== undefined || record.nutritionFacts.protein !== undefined)
  );

  let hasAllergens: boolean | 'unverified' | 'none_declared' = 'unverified';
  let allergenStatus: AllergenAvailabilityStatus = 'unverified';

  if (record.declaredAllergens && record.declaredAllergens.length > 0) {
    hasAllergens = true;
    allergenStatus = 'declared';
  } else if (record.sourceType === 'usda_fdc') {
    hasAllergens = 'unverified';
    allergenStatus = 'unverified';
  } else if (record.ingredientsText && record.ingredientsText.trim().length > 0) {
    hasAllergens = 'none_declared';
    allergenStatus = 'none_declared';
  } else {
    hasAllergens = 'unverified';
    allergenStatus = 'unverified';
  }

  const hasImage = Boolean(
    record.imageUrl &&
    record.imageUrl.trim().length > 0 &&
    !record.imageUrl.includes('placeholder')
  );

  item.availableData = {
    hasIngredients,
    hasNutrition,
    hasAllergens,
    allergenStatus,
    hasImage
  };

  if (hasIngredients && record.ingredientsText) {
    item.ingredientPreview = createIngredientPreview(record.ingredientsText);
  }

  if (record.nutritionFacts?.calories !== undefined) {
    item.calories = record.nutritionFacts.calories;
  }
  if (record.servingSize && !item.servingSize) {
    item.servingSize = record.servingSize;
  }
  if (record.imageUrl && !item.imageUrl) {
    item.imageUrl = record.imageUrl;
  }
  if (record.brand && !item.brand) {
    item.brand = record.brand;
  }
}

/**
 * Normalizes Open Food Facts search result into common format without discarding source-specific data.
 * Accurately represents data availability without inferring ingredient or allergen presence from unrelated fields.
 * Distinguishes between explicitly declared allergens, no allergens declared in record, and missing/unverified allergen info.
 */
export function normalizeOffSearchResult(item: OffSearchResultItem): UnifiedSearchResultItem {
  // Only declare ingredients available if actual ingredient text is present
  const hasIngredients: DataAvailabilityStatus =
    item.ingredientsText !== undefined
      ? Boolean(item.ingredientsText && item.ingredientsText.trim().length > 0)
      : 'unverified';

  // Only declare nutrition available if actual nutritional values are present
  const hasNutrition: DataAvailabilityStatus =
    item.calories !== undefined
      ? true
      : item.nutriments && Object.keys(item.nutriments).length > 0
      ? true
      : item.nutriments !== undefined
      ? false
      : 'unverified';

  // Allergen availability:
  // Distinguish between declared allergens, no allergens declared in record, and unverified/missing
  let hasAllergens: boolean | 'unverified' | 'none_declared' = 'unverified';
  let allergenStatus: AllergenAvailabilityStatus = 'unverified';

  const hasExplicitAllergenData =
    item.allergensTags !== undefined || item.allergens !== undefined;

  if (hasExplicitAllergenData) {
    const hasDeclared = Boolean(
      (item.allergensTags && item.allergensTags.length > 0) ||
      (item.allergens && item.allergens.trim().length > 0)
    );
    if (hasDeclared) {
      hasAllergens = true;
      allergenStatus = 'declared';
    } else {
      hasAllergens = 'none_declared';
      allergenStatus = 'none_declared';
    }
  } else {
    hasAllergens = 'unverified';
    allergenStatus = 'unverified';
  }

  const hasImage = Boolean(
    item.imageUrl &&
    item.imageUrl.trim().length > 0 &&
    !item.imageUrl.includes('placeholder')
  );

  const ingredientPreview =
    item.ingredientsText && item.ingredientsText.trim().length > 0
      ? createIngredientPreview(item.ingredientsText)
      : undefined;

  return {
    id: `off-${item.code}`,
    source: 'open_food_facts',
    sourceLabel: 'Open Food Facts',
    sourceBadgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    sourceIdentifier: `UPC: ${item.code}`,
    rawId: item.code,
    name: item.name,
    brand: item.brand,
    barcode: item.code,
    imageUrl: item.imageUrl,
    calories: item.calories,
    servingSize: item.servingSize,
    category: item.categories,
    dataType: 'Public Database',
    ingredientPreview,
    availableData: {
      hasIngredients,
      hasNutrition,
      hasAllergens,
      allergenStatus,
      hasImage
    },
    rawOffItem: item
  };
}

/**
 * Normalizes USDA FoodData Central item into common format without discarding source-specific data.
 * Sets allergen status to unverified because USDA analytical profiles do not record commercial package allergen declarations.
 */
export function normalizeUsdaFoodItem(food: UsdaFoodItem): UnifiedSearchResultItem {
  const nutrition = usdaItemToNutrition(food);
  const hasIngredients = Boolean(food.ingredients && food.ingredients.trim().length > 0);
  const hasNutrition =
    nutrition.calories !== undefined ||
    nutrition.protein !== undefined ||
    (food.foodNutrients && food.foodNutrients.length > 0);

  return {
    id: `usda-${food.fdcId}`,
    source: 'usda_fdc',
    sourceLabel: 'USDA FoodData Central',
    sourceBadgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
    sourceIdentifier: `FDC ID: ${food.fdcId}`,
    rawId: String(food.fdcId),
    name: food.description,
    brand: food.brandOwner || 'USDA Analytical Baseline',
    barcode: undefined,
    imageUrl: undefined,
    calories: nutrition.calories,
    servingSize: nutrition.servingSize,
    dataType: food.dataType || 'Analytical Reference',
    ingredientPreview: createIngredientPreview(food.ingredients),
    availableData: {
      hasIngredients,
      hasNutrition,
      hasAllergens: 'unverified', // USDA analytical records do not carry commercial allergen declarations
      allergenStatus: 'unverified',
      hasImage: false
    },
    rawUsdaItem: food
  };
}

/**
 * Normalizes local catalog item into common format.
 */
export function normalizeCatalogItem(item: CatalogItem): UnifiedSearchResultItem {
  const hasAllergens: boolean | 'unverified' | 'none_declared' =
    item.declaredAllergens && item.declaredAllergens.length > 0
      ? true
      : 'none_declared';

  return {
    id: `cat-${item.id}`,
    source: 'catalog',
    sourceLabel: 'Curated Catalog',
    sourceBadgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    sourceIdentifier: `UPC: ${item.code}`,
    rawId: item.code,
    name: item.name,
    brand: item.brand,
    barcode: item.code,
    imageUrl: undefined,
    calories: item.calories,
    servingSize: item.servingSize,
    category: item.category,
    dataType: 'Audited Catalog',
    ingredientPreview: createIngredientPreview(item.ingredientsText),
    availableData: {
      hasIngredients: Boolean(item.ingredientsText && item.ingredientsText.trim().length > 0),
      hasNutrition: item.calories !== undefined,
      hasAllergens,
      allergenStatus: hasAllergens === true ? 'declared' : 'none_declared',
      hasImage: false
    },
    catalogItem: item
  };
}

/**
 * Normalizes sample demo scenario into common format.
 */
export function normalizeScenarioItem(scenario: ProductRecord): UnifiedSearchResultItem {
  const hasAllergens: boolean | 'unverified' | 'none_declared' =
    scenario.declaredAllergens && scenario.declaredAllergens.length > 0
      ? true
      : 'none_declared';

  return {
    id: `scenario-${scenario.id}`,
    source: 'scenario',
    sourceLabel: 'Verified Demo',
    sourceBadgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
    sourceIdentifier: scenario.barcode ? `UPC: ${scenario.barcode}` : `ID: ${scenario.id}`,
    rawId: scenario.id,
    name: scenario.name,
    brand: scenario.brand,
    barcode: scenario.barcode,
    imageUrl: scenario.imageUrl,
    calories: scenario.nutritionFacts?.calories,
    servingSize: scenario.servingSize,
    dataType: 'Audited Demonstration',
    ingredientPreview: createIngredientPreview(scenario.ingredientsText),
    availableData: {
      hasIngredients: Boolean(scenario.ingredientsText && scenario.ingredientsText.trim().length > 0),
      hasNutrition: Boolean(
        scenario.nutritionFacts &&
        (scenario.nutritionFacts.calories !== undefined || scenario.nutritionFacts.protein !== undefined)
      ),
      hasAllergens,
      allergenStatus: hasAllergens === true ? 'declared' : 'none_declared',
      hasImage: Boolean(scenario.imageUrl && scenario.imageUrl.trim().length > 0)
    },
    localProduct: scenario
  };
}

/**
 * Executes a unified, non-exclusive search across Open Food Facts, USDA FoodData Central,
 * and local catalog sources with parallel querying, fault tolerance, and accurate counts.
 */
export async function searchUnified(
  query: string,
  category = 'All',
  pageSize = 40
): Promise<UnifiedSearchResponse> {
  const trimmed = query.trim();
  const cleanDigits = trimmed.replace(/[-\s]/g, '');
  const isNumericBarcode = /^\d{4,16}$/.test(cleanDigits);

  const response: UnifiedSearchResponse = {
    query: trimmed,
    results: [],
    totalResults: 0,
    displayedCount: 0,
    sourceCounts: {
      openFoodFacts: 0,
      usdaFoodData: 0,
      catalog: 0,
      scenarios: 0
    },
    partialFailures: {},
    isBarcodeMatch: isNumericBarcode
  };

  // If query is a direct numeric barcode:
  // Trigger a direct Open Food Facts barcode lookup and local catalog check.
  // USDA is NOT queried with barcodes as though they were food names.
  if (isNumericBarcode) {
    // 1. Check local scenario matches by barcode
    const scenarioMatches = SAMPLE_SCENARIOS.filter((s) => s.barcode === cleanDigits).map(normalizeScenarioItem);
    response.sourceCounts.scenarios = scenarioMatches.length;

    // 2. Check local curated catalog matches by barcode
    const catalogMatches = FOOD_CATALOG.filter((c) => c.code === cleanDigits).map(normalizeCatalogItem);
    response.sourceCounts.catalog = catalogMatches.length;

    // 3. Check in-memory resolved product cache or query Open Food Facts directly
    const cachedRecord =
      resolvedProductCache.get(cleanDigits) ||
      resolvedProductCache.get(`off-${cleanDigits}`);

    let offRecord: ProductRecord | null = cachedRecord || null;

    if (!offRecord) {
      try {
        offRecord = await fetchProductByBarcode(cleanDigits);
      } catch {
        response.partialFailures.openFoodFacts = true;
      }
    }

    const matches: UnifiedSearchResultItem[] = [];

    // Add local scenarios
    scenarioMatches.forEach((s) => matches.push(s));

    // Add catalog matches (preserving source separation)
    catalogMatches.forEach((c) => {
      if (!matches.some((m) => m.id === c.id)) {
        matches.push(c);
      }
    });

    // Add confirmed Open Food Facts record if found
    if (offRecord) {
      // Cache both by barcode and by off- ID to avoid duplicate lookups
      resolvedProductCache.set(cleanDigits, offRecord);
      resolvedProductCache.set(`off-${cleanDigits}`, offRecord);
      if (offRecord.id) {
        resolvedProductCache.set(offRecord.id, offRecord);
      }

      const hasIngredients = Boolean(offRecord.ingredientsText && offRecord.ingredientsText.trim().length > 0);
      const hasNutrition = Boolean(
        offRecord.nutritionFacts &&
        (offRecord.nutritionFacts.calories !== undefined || offRecord.nutritionFacts.protein !== undefined)
      );
      const hasAllergens: boolean | 'unverified' | 'none_declared' =
        offRecord.declaredAllergens.length > 0
          ? true
          : offRecord.ingredientsText
          ? 'none_declared'
          : 'unverified';
      const allergenStatus: AllergenAvailabilityStatus =
        offRecord.declaredAllergens.length > 0
          ? 'declared'
          : offRecord.ingredientsText
          ? 'none_declared'
          : 'unverified';
      const hasImage = Boolean(
        offRecord.imageUrl &&
        offRecord.imageUrl.trim().length > 0 &&
        !offRecord.imageUrl.includes('placeholder')
      );

      const offItem: UnifiedSearchResultItem = {
        id: `off-${cleanDigits}`,
        source: 'open_food_facts',
        sourceLabel: 'Open Food Facts',
        sourceBadgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        sourceIdentifier: `UPC: ${cleanDigits}`,
        rawId: cleanDigits,
        name: offRecord.name,
        brand: offRecord.brand,
        barcode: cleanDigits,
        imageUrl: offRecord.imageUrl,
        calories: offRecord.nutritionFacts?.calories,
        servingSize: offRecord.servingSize,
        dataType: 'Public Database',
        ingredientPreview: createIngredientPreview(offRecord.ingredientsText),
        availableData: {
          hasIngredients,
          hasNutrition,
          hasAllergens,
          allergenStatus,
          hasImage
        },
        localProduct: offRecord
      };

      if (!matches.some((m) => m.id === offItem.id)) {
        matches.push(offItem);
      }
      response.sourceCounts.openFoodFacts = 1;
    } else {
      response.sourceCounts.openFoodFacts = 0;
    }

    // Explicitly 0 for USDA: USDA is NEVER queried using numeric barcodes as food names
    response.sourceCounts.usdaFoodData = 0;

    response.results = matches;
    response.totalResults = matches.length;
    response.displayedCount = matches.length;
    return response;
  }

  // If text query is too short and no category
  if (trimmed.length < 2 && category === 'All') {
    return response;
  }

  const qLower = trimmed.toLowerCase();

  // 1. Gather instant local results (0ms latency)
  const localCatalogMatches = searchFoodCatalog(trimmed, category).map(normalizeCatalogItem);
  response.sourceCounts.catalog = localCatalogMatches.length;

  const scenarioMatches = trimmed.length > 0
    ? SAMPLE_SCENARIOS.filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          (s.brand && s.brand.toLowerCase().includes(qLower))
      ).map(normalizeScenarioItem)
    : [];
  response.sourceCounts.scenarios = scenarioMatches.length;

  // 2. Query Open Food Facts and USDA FoodData Central in parallel with fault tolerance
  const resultsPromise = Promise.allSettled([
    // Open Food Facts remote query
    trimmed.length >= 2
      ? searchOpenFoodFactsPaged(trimmed, 1, pageSize)
      : Promise.resolve({ products: [], totalCount: 0, page: 1, pageSize }),
    // USDA FoodData Central remote query
    trimmed.length >= 2
      ? searchUsdaFoodData(trimmed)
      : Promise.resolve([])
  ]);

  const [offSettled, usdaSettled] = await resultsPromise;

  const offResults: UnifiedSearchResultItem[] = [];
  let offReportedTotal: number | undefined = undefined;

  if (offSettled.status === 'fulfilled') {
    const paged = offSettled.value;
    paged.products.forEach((p) => {
      offResults.push(normalizeOffSearchResult(p));
    });
    offReportedTotal = paged.totalCount;
  } else {
    response.partialFailures.openFoodFacts = true;
  }

  const usdaResults: UnifiedSearchResultItem[] = [];
  if (usdaSettled.status === 'fulfilled') {
    const foods = usdaSettled.value;
    foods.forEach((f) => {
      usdaResults.push(normalizeUsdaFoodItem(f));
    });
  } else {
    response.partialFailures.usdaFoodData = true;
    // Fall back to standard reference benchmark if offline
    const fallbackBenchmark = findUsdaStandardBenchmark(trimmed);
    if (fallbackBenchmark) {
      usdaResults.push(normalizeUsdaFoodItem(fallbackBenchmark));
    }
  }

  // 3. Assemble and rank unified results responsibly without destructive deduplication
  // Each record from each source retains its identity and data
  const combinedMap = new Map<string, UnifiedSearchResultItem>();

  // Add local scenario matches (high priority for verified testing)
  scenarioMatches.forEach((item) => combinedMap.set(item.id, item));

  // Add catalog matches
  localCatalogMatches.forEach((item) => {
    if (!combinedMap.has(item.id)) {
      combinedMap.set(item.id, item);
    }
  });

  // Interleave USDA and Open Food Facts results so both sources are represented prominently
  const maxRemote = Math.max(offResults.length, usdaResults.length);
  for (let i = 0; i < maxRemote; i++) {
    if (i < usdaResults.length) {
      const u = usdaResults[i];
      if (!combinedMap.has(u.id)) {
        combinedMap.set(u.id, u);
      }
    }
    if (i < offResults.length) {
      const o = offResults[i];
      if (!combinedMap.has(o.id)) {
        combinedMap.set(o.id, o);
      }
    }
  }

  const allItems = Array.from(combinedMap.values());
  response.results = allItems;
  response.displayedCount = allItems.length;
  response.totalResults = allItems.length;

  const actualOffCount = allItems.filter((i) => i.source === 'open_food_facts').length;
  const actualUsdaCount = allItems.filter((i) => i.source === 'usda_fdc').length;
  const actualCatalogCount = allItems.filter((i) => i.source === 'catalog').length;
  const actualScenarioCount = allItems.filter((i) => i.source === 'scenario').length;

  response.sourceCounts = {
    openFoodFacts: actualOffCount,
    openFoodFactsReportedTotal: offReportedTotal,
    usdaFoodData: actualUsdaCount,
    catalog: actualCatalogCount,
    scenarios: actualScenarioCount
  };

  return response;
}

/**
 * Resolves a selected UnifiedSearchResultItem into a full ProductRecord for inspection and comparison.
 * Never fabricates values or returns synthetic placeholders if a product is not found.
 */
export async function resolveUnifiedProductRecord(
  item: UnifiedSearchResultItem
): Promise<ProductRecord | null> {
  // Check in-memory cache first
  if (resolvedProductCache.has(item.id)) {
    const cached = resolvedProductCache.get(item.id)!;
    updateItemWithResolvedProduct(item, cached);
    return cached;
  }

  // Option 1: Sample scenario
  if (item.source === 'scenario' && item.localProduct) {
    resolvedProductCache.set(item.id, item.localProduct);
    updateItemWithResolvedProduct(item, item.localProduct);
    return item.localProduct;
  }

  // Option 2: Pre-parsed food catalog item
  if (item.source === 'catalog' && item.catalogItem) {
    const record = catalogItemToProductRecord(item.catalogItem);
    resolvedProductCache.set(item.id, record);
    updateItemWithResolvedProduct(item, record);
    return record;
  }

  // Option 3: USDA FoodData Central record
  if (item.source === 'usda_fdc') {
    if (item.rawUsdaItem) {
      const record = usdaItemToProductRecord(item.rawUsdaItem);
      resolvedProductCache.set(item.id, record);
      updateItemWithResolvedProduct(item, record);
      return record;
    }

    const fdcId = Number(item.rawId);
    if (!isNaN(fdcId)) {
      const fetched = await fetchUsdaFoodById(fdcId);
      if (fetched) {
        const record = usdaItemToProductRecord(fetched);
        resolvedProductCache.set(item.id, record);
        updateItemWithResolvedProduct(item, record);
        return record;
      }
    }
  }

  // Option 4: Open Food Facts record or direct barcode
  if (item.source === 'open_food_facts' || item.source === 'direct_barcode') {
    if (item.localProduct) {
      resolvedProductCache.set(item.id, item.localProduct);
      updateItemWithResolvedProduct(item, item.localProduct);
      return item.localProduct;
    }

    const barcode = item.rawId;
    try {
      const fetched = await fetchProductByBarcode(barcode);
      if (fetched) {
        resolvedProductCache.set(item.id, fetched);
        resolvedProductCache.set(barcode, fetched);
        updateItemWithResolvedProduct(item, fetched);
        return fetched;
      }
    } catch {
      return null;
    }

    return null;
  }

  return null;
}

/**
 * Universal product resolver for deep links and URL paths (e.g. /product/:id).
 * Handles USDA IDs (usda-171689), barcodes (016000275287), catalog IDs (cat-1), and scenario IDs (demo-oat-milk).
 */
export async function fetchUnifiedProductById(id: string): Promise<ProductRecord | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;

  if (resolvedProductCache.has(cleanId)) {
    return resolvedProductCache.get(cleanId)!;
  }

  // 1. Check verified demo scenarios
  const scenario =
    getSampleScenario(cleanId) ||
    SAMPLE_SCENARIOS.find((s) => s.id === cleanId || s.barcode === cleanId);
  if (scenario) {
    resolvedProductCache.set(cleanId, scenario);
    return scenario;
  }

  // 2. Check USDA IDs (usda-171689 or FDC-171689)
  if (cleanId.startsWith('usda-') || cleanId.startsWith('FDC-')) {
    const rawNumber = cleanId.replace(/^(usda|FDC)-/i, '');
    const fdcId = Number(rawNumber);
    if (!isNaN(fdcId)) {
      // Check standard benchmarks first
      const benchmark = Object.values(USDA_STANDARD_BENCHMARKS).find((b) => b.fdcId === fdcId);
      if (benchmark) {
        const record = usdaItemToProductRecord(benchmark);
        resolvedProductCache.set(cleanId, record);
        return record;
      }

      // Fetch from USDA
      const food = await fetchUsdaFoodById(fdcId);
      if (food) {
        const record = usdaItemToProductRecord(food);
        resolvedProductCache.set(cleanId, record);
        return record;
      }
    }
  }

  // 3. Check local food catalog
  if (cleanId.startsWith('cat-')) {
    const rawCatId = cleanId.replace(/^cat-/, '');
    const catItem = FOOD_CATALOG.find(
      (c) => c.id === rawCatId || c.id === cleanId || `cat-${c.id}` === cleanId
    );
    if (catItem) {
      const record = catalogItemToProductRecord(catItem);
      resolvedProductCache.set(cleanId, record);
      return record;
    }
  }

  // Also check FOOD_CATALOG directly by ID or code
  const directCatItem = FOOD_CATALOG.find((c) => c.id === cleanId || c.code === cleanId);
  if (directCatItem) {
    const record = catalogItemToProductRecord(directCatItem);
    resolvedProductCache.set(cleanId, record);
    return record;
  }

  // 4. Default: Barcode lookup via Open Food Facts (only if candidate has >= 4 digits)
  const numericCandidate = cleanId.replace(/^off-/i, '').replace(/[^\d]/g, '');
  if (numericCandidate.length >= 4) {
    try {
      const barcodeRecord = await fetchProductByBarcode(numericCandidate);
      if (barcodeRecord) {
        resolvedProductCache.set(cleanId, barcodeRecord);
        resolvedProductCache.set(numericCandidate, barcodeRecord);
        return barcodeRecord;
      }
    } catch {
      return null;
    }
  }

  return null;
}
