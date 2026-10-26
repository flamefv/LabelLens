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
    hasIngredients: boolean;
    hasNutrition: boolean;
    hasAllergens: boolean;
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
  totalResults: number;
  sourceCounts: {
    openFoodFacts: number;
    usdaFoodData: number;
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
function createIngredientPreview(text?: string, maxLength = 85): string | undefined {
  if (!text || !text.trim()) return undefined;
  const cleaned = text.replace(/^(ingredients?|contents?)\s*[:\-]\s*/i, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + '...';
}

/**
 * Normalizes Open Food Facts search result into common format without discarding source-specific data.
 */
export function normalizeOffSearchResult(item: OffSearchResultItem): UnifiedSearchResultItem {
  const hasIngredients = Boolean(item.categories || item.servingSize); // Detailed ingredients populated upon record inspection
  const hasNutrition = item.calories !== undefined;

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
    ingredientPreview: undefined, // Fetched during full record lookup
    availableData: {
      hasIngredients,
      hasNutrition,
      hasAllergens: true, // Evaluated on full record
      hasImage: Boolean(item.imageUrl)
    },
    rawOffItem: item
  };
}

/**
 * Normalizes USDA FoodData Central item into common format without discarding source-specific data.
 */
export function normalizeUsdaFoodItem(food: UsdaFoodItem): UnifiedSearchResultItem {
  const nutrition = usdaItemToNutrition(food);
  const hasIngredients = Boolean(food.ingredients && food.ingredients.trim().length > 0);
  const hasNutrition = nutrition.calories !== undefined || nutrition.protein !== undefined;

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
      hasAllergens: false, // USDA analytical records do not carry commercial allergen declarations
      hasImage: false
    },
    rawUsdaItem: food
  };
}

/**
 * Normalizes local catalog item into common format.
 */
export function normalizeCatalogItem(item: CatalogItem): UnifiedSearchResultItem {
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
      hasIngredients: Boolean(item.ingredientsText),
      hasNutrition: item.calories !== undefined,
      hasAllergens: (item.declaredAllergens?.length || 0) > 0,
      hasImage: false
    },
    catalogItem: item
  };
}

/**
 * Normalizes sample demo scenario into common format.
 */
export function normalizeScenarioItem(scenario: ProductRecord): UnifiedSearchResultItem {
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
      hasIngredients: Boolean(scenario.ingredientsText),
      hasNutrition: Boolean(scenario.nutritionFacts),
      hasAllergens: scenario.declaredAllergens.length > 0,
      hasImage: Boolean(scenario.imageUrl)
    },
    localProduct: scenario
  };
}

/**
 * Executes a unified, non-exclusive search across both Open Food Facts and USDA FoodData Central
 * in parallel with graceful degradation if either service is unreachable.
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
    sourceCounts: {
      openFoodFacts: 0,
      usdaFoodData: 0,
      catalog: 0,
      scenarios: 0
    },
    partialFailures: {},
    isBarcodeMatch: isNumericBarcode
  };

  // If query is a direct numeric barcode
  if (isNumericBarcode) {
    const directItem: UnifiedSearchResultItem = {
      id: `direct-barcode-${cleanDigits}`,
      source: 'direct_barcode',
      sourceLabel: 'Barcode Query',
      sourceBadgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      sourceIdentifier: `UPC: ${cleanDigits}`,
      rawId: cleanDigits,
      name: `Look up Barcode #${cleanDigits}`,
      brand: 'Direct Database Query',
      barcode: cleanDigits,
      dataType: 'Universal Product Code',
      availableData: {
        hasIngredients: false,
        hasNutrition: false,
        hasAllergens: false,
        hasImage: false
      }
    };

    // Check if barcode matches local catalog or scenarios first
    const catalogMatch = FOOD_CATALOG.find((c) => c.code === cleanDigits);
    const scenarioMatch = SAMPLE_SCENARIOS.find((s) => s.barcode === cleanDigits);

    const matches: UnifiedSearchResultItem[] = [directItem];
    if (scenarioMatch) {
      matches.push(normalizeScenarioItem(scenarioMatch));
      response.sourceCounts.scenarios++;
    }
    if (catalogMatch) {
      matches.push(normalizeCatalogItem(catalogMatch));
      response.sourceCounts.catalog++;
    }

    response.results = matches;
    response.totalResults = matches.length;
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
  if (offSettled.status === 'fulfilled') {
    const paged = offSettled.value;
    paged.products.forEach((p) => {
      offResults.push(normalizeOffSearchResult(p));
    });
    response.sourceCounts.openFoodFacts = paged.totalCount || offResults.length;
  } else {
    response.partialFailures.openFoodFacts = true;
  }

  const usdaResults: UnifiedSearchResultItem[] = [];
  if (usdaSettled.status === 'fulfilled') {
    const foods = usdaSettled.value;
    foods.forEach((f) => {
      usdaResults.push(normalizeUsdaFoodItem(f));
    });
    response.sourceCounts.usdaFoodData = usdaResults.length;
  } else {
    response.partialFailures.usdaFoodData = true;
    // Fall back to standard reference benchmark if offline
    const fallbackBenchmark = findUsdaStandardBenchmark(trimmed);
    if (fallbackBenchmark) {
      usdaResults.push(normalizeUsdaFoodItem(fallbackBenchmark));
      response.sourceCounts.usdaFoodData = 1;
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
  response.totalResults =
    scenarioMatches.length +
    localCatalogMatches.length +
    response.sourceCounts.openFoodFacts +
    response.sourceCounts.usdaFoodData;

  return response;
}

/**
 * Resolves a selected UnifiedSearchResultItem into a full ProductRecord for inspection and comparison.
 */
export async function resolveUnifiedProductRecord(
  item: UnifiedSearchResultItem
): Promise<ProductRecord | null> {
  // Check in-memory cache first
  if (resolvedProductCache.has(item.id)) {
    return resolvedProductCache.get(item.id)!;
  }

  // Option 1: Sample scenario
  if (item.source === 'scenario' && item.localProduct) {
    resolvedProductCache.set(item.id, item.localProduct);
    return item.localProduct;
  }

  // Option 2: Pre-parsed food catalog item
  if (item.source === 'catalog' && item.catalogItem) {
    const record = catalogItemToProductRecord(item.catalogItem);
    resolvedProductCache.set(item.id, record);
    return record;
  }

  // Option 3: USDA FoodData Central record
  if (item.source === 'usda_fdc') {
    if (item.rawUsdaItem) {
      const record = usdaItemToProductRecord(item.rawUsdaItem);
      resolvedProductCache.set(item.id, record);
      return record;
    }

    const fdcId = Number(item.rawId);
    if (!isNaN(fdcId)) {
      const fetched = await fetchUsdaFoodById(fdcId);
      if (fetched) {
        const record = usdaItemToProductRecord(fetched);
        resolvedProductCache.set(item.id, record);
        return record;
      }
    }
  }

  // Option 4: Open Food Facts record or direct barcode
  if (item.source === 'open_food_facts' || item.source === 'direct_barcode') {
    const barcode = item.rawId;
    const fetched = await fetchProductByBarcode(barcode);
    if (fetched) {
      resolvedProductCache.set(item.id, fetched);
      return fetched;
    }

    // Build fallback record with honest limitations if remote lookup yields 404
    const fallbackRecord: ProductRecord = {
      id: item.rawId,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode || item.rawId,
      imageUrl: item.imageUrl,
      sourceUrl: `https://world.openfoodfacts.org/product/${item.rawId}`,
      sourceType: 'open_food_facts',
      dataCompleteness: 'Moderate',
      ingredientsText: 'Ingredients listed on physical container label.',
      ingredientsList: [],
      declaredAllergens: [],
      precautionaryStatements: [],
      nutritionFacts: item.calories
        ? {
            servingSize: item.servingSize || '1 serving',
            calories: item.calories
          }
        : undefined,
      servingSize: item.servingSize,
      sources: [
        {
          title: `Open Food Facts Record: ${item.name}`,
          publisher: 'Open Food Facts Public Collaborative Database',
          url: `https://world.openfoodfacts.org/product/${item.rawId}`,
          relevantPassage: `Public database record for barcode ${item.rawId}.`,
          retrievalDate: new Date().toISOString().split('T')[0],
          sourceType: 'public_database'
        }
      ],
      limitations: [
        'Detailed ingredient statement was not available in this Open Food Facts record.',
        'Review the physical package label for full ingredient disclosures.'
      ],
      isDemo: false
    };

    resolvedProductCache.set(item.id, fallbackRecord);
    return fallbackRecord;
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
  const scenario = getSampleScenario(cleanId) || SAMPLE_SCENARIOS.find((s) => s.id === cleanId || s.barcode === cleanId);
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
  const numericCandidate = cleanId.replace(/[^\d]/g, '');
  if (numericCandidate.length >= 4) {
    try {
      const barcodeRecord = await fetchProductByBarcode(numericCandidate);
      if (barcodeRecord) {
        resolvedProductCache.set(cleanId, barcodeRecord);
        return barcodeRecord;
      }
    } catch {
      return null;
    }
  }

  return null;
}
