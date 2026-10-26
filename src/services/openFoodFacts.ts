/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductRecord, IngredientItem, NutritionFacts, EvidenceSource } from '../types/index.ts';
import { findCuratedIngredient, normalizeIngredientName } from './curatedEvidence.ts';
import { FOOD_CATALOG, catalogItemToProductRecord } from '../data/foodCatalog.ts';

const OFF_BASE_URL = 'https://world.openfoodfacts.org';

interface OffProductResponse {
  status: number;
  status_verbose?: string;
  code?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    ingredients?: Array<{ text?: string; id?: string }>;
    allergens?: string;
    allergens_tags?: string[];
    traces?: string;
    traces_tags?: string[];
    serving_size?: string;
    serving_quantity?: number | string;
    image_url?: string;
    image_front_url?: string;
    nutriments?: Record<string, number | string>;
    link?: string;
    url?: string;
    last_modified_t?: number;
    completeness?: number;
    manufacturing_places?: string;
  };
}

interface OffSearchResponse {
  count?: number;
  products?: Array<{
    code: string;
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    image_url?: string;
  }>;
}

/**
 * Clean and parse ingredients text into structured IngredientItem objects.
 */
export function parseIngredientsText(rawText: string, provenance: ProductRecord['sourceType']): IngredientItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Remove common prefix such as "Ingredients: " or "INGREDIENTS: "
  let cleaned = rawText.replace(/^(ingredients?|composition|contents)\s*[:\-]\s*/i, '').trim();

  // Handle nested parentheses gently (e.g. "enriched flour (wheat flour, niacin, reduced iron)")
  // Split on commas or semicolons that are NOT inside parentheses
  const tokens: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(' || char === '[' || char === '{') parenDepth++;
    else if (char === ')' || char === ']' || char === '}') parenDepth = Math.max(0, parenDepth - 1);

    if ((char === ',' || char === ';' || char === '.') && parenDepth === 0) {
      if (current.trim().length > 0) {
        tokens.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    tokens.push(current.trim());
  }

  return tokens
    .map((token, index) => {
      // Strip trailing period or bullet
      const rawName = token.replace(/^\*+\s*/, '').replace(/\.$/, '').trim();
      const normalized = normalizeIngredientName(rawName);
      if (!normalized) return null;

      const curated = findCuratedIngredient(rawName);

      return {
        id: `ing-${index}-${normalized.slice(0, 16)}`,
        rawName,
        normalizedName: normalized,
        category: curated?.category,
        hasCuratedEntry: !!curated,
        provenance: 'Database record'
      } as IngredientItem;
    })
    .filter((item): item is IngredientItem => item !== null);
}

/**
 * Extracts allergens and traces cleanly from Open Food Facts tag format (e.g. "en:milk" -> "Milk")
 */
function cleanTags(tags?: string[], rawString?: string): string[] {
  const result = new Set<string>();

  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      const clean = tag.replace(/^[a-z]{2}:/, '').replace(/[-_]/g, ' ').trim();
      if (clean) {
        result.add(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    }
  }

  if (rawString && typeof rawString === 'string') {
    const parts = rawString.split(/[,;]/);
    for (const part of parts) {
      const clean = part.replace(/^[a-z]{2}:/, '').trim();
      if (clean) {
        result.add(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    }
  }

  return Array.from(result);
}

/**
 * Formats Open Food Facts nutrition numbers into typed NutritionFacts structure.
 */
function parseNutrition(nutriments?: Record<string, number | string>, servingSize?: string): NutritionFacts | undefined {
  if (!nutriments || Object.keys(nutriments).length === 0) return undefined;

  const num = (val: unknown): number | undefined => {
    if (typeof val === 'number') return isNaN(val) ? undefined : Math.round(val * 10) / 10;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : Math.round(parsed * 10) / 10;
    }
    return undefined;
  };

  const caloriesServing = num(nutriments['energy-kcal_serving']) ?? num(nutriments['energy-kcal']);
  const calories100g = num(nutriments['energy-kcal_100g']);

  const gramsMatch = servingSize?.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
  const servingSizeGrams = gramsMatch ? parseFloat(gramsMatch[1]) : undefined;

  return {
    servingSize: servingSize || undefined,
    servingSizeGrams,
    calories: caloriesServing,
    totalFat: num(nutriments['fat_serving']) ?? num(nutriments['fat']),
    saturatedFat: num(nutriments['saturated-fat_serving']) ?? num(nutriments['saturated-fat']),
    transFat: num(nutriments['trans-fat_serving']) ?? num(nutriments['trans-fat']),
    cholesterol: num(nutriments['cholesterol_serving']) ?? num(nutriments['cholesterol']),
    sodium: num(nutriments['sodium_serving']) ?? num(nutriments['sodium']),
    totalCarbohydrates: num(nutriments['carbohydrates_serving']) ?? num(nutriments['carbohydrates']),
    dietaryFiber: num(nutriments['fiber_serving']) ?? num(nutriments['fiber']),
    totalSugars: num(nutriments['sugars_serving']) ?? num(nutriments['sugars']),
    addedSugars: num(nutriments['added-sugars_serving']) ?? num(nutriments['added-sugars']),
    protein: num(nutriments['proteins_serving']) ?? num(nutriments['proteins']),
    calcium: num(nutriments['calcium_serving']) ?? num(nutriments['calcium']),
    iron: num(nutriments['iron_serving']) ?? num(nutriments['iron']),
    potassium: num(nutriments['potassium_serving']) ?? num(nutriments['potassium']),
    per100g: {
      calories: calories100g,
      totalFat: num(nutriments['fat_100g']),
      saturatedFat: num(nutriments['saturated-fat_100g']),
      sodium: num(nutriments['sodium_100g']),
      totalCarbohydrates: num(nutriments['carbohydrates_100g']),
      dietaryFiber: num(nutriments['fiber_100g']),
      totalSugars: num(nutriments['sugars_100g']),
      protein: num(nutriments['proteins_100g'])
    }
  };
}

const OFF_HOSTS = ['https://world.openfoodfacts.net', 'https://world.openfoodfacts.org'];

export interface OffSearchResultItem {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  categories?: string;
  calories?: number;
  servingSize?: string;
  badge?: string;
  sourceType: 'open_food_facts';
  ingredientsText?: string;
  allergens?: string;
  allergensTags?: string[];
  traces?: string;
  tracesTags?: string[];
  nutriments?: Record<string, number | string>;
}

export interface OffSearchPagedResult {
  products: OffSearchResultItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'All': 'all',
  'Cereals & Breakfast': 'breakfast-cereals',
  'Plant & Dairy Milks': 'plant-milks',
  'Snacks & Cookies': 'cookies',
  'Condiments & Sauces': 'condiments',
  'Dairy & Yogurts': 'yogurts',
  'Plant-Based': 'plant-based-foods',
  'Breads & Bakery': 'breads',
  'Beverages': 'beverages'
};

/**
 * Fetches a product from Open Food Facts by barcode with multi-host fallback.
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductRecord | null> {
  const cleanBarcode = barcode.replace(/[^\d]/g, '').trim();
  if (!cleanBarcode || cleanBarcode.length < 4) {
    throw new Error('Please enter a valid numeric barcode (minimum 4 digits).');
  }

  // Check local curated catalog first for immediate response
  const localItem = FOOD_CATALOG.find((item) => item.code === cleanBarcode);

  for (const host of OFF_HOSTS) {
    const url = `${host}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'LabelLens - Open Food Intelligence - Web'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 404) {
          // If 404 on first host, check next host or local fallback
          continue;
        }
        continue;
      }

      const data = (await res.json()) as OffProductResponse;

      if (data.status !== 1 || !data.product) {
        continue;
      }

      const p = data.product;
      const name = p.product_name || p.product_name_en || 'Packaged Product (Name Unlisted)';
      const ingredientsText = p.ingredients_text || p.ingredients_text_en || '';
      const ingredientsList = parseIngredientsText(ingredientsText, 'open_food_facts');
      const declaredAllergens = cleanTags(p.allergens_tags, p.allergens);
      const precautionaryStatements = cleanTags(p.traces_tags, p.traces);
      const nutritionFacts = parseNutrition(p.nutriments, p.serving_size);

      // Compute data completeness
      let completeness: ProductRecord['dataCompleteness'] = 'Moderate';
      if (ingredientsText && nutritionFacts && declaredAllergens.length > 0) {
        completeness = 'High';
      } else if (!ingredientsText && !nutritionFacts) {
        completeness = 'Minimal';
      } else if (!ingredientsText || !nutritionFacts) {
        completeness = 'Partial';
      }

      const limitations: string[] = [];
      if (!ingredientsText) {
        limitations.push('Ingredient list is unlisted in the Open Food Facts public database record.');
      }
      if (!p.allergens && declaredAllergens.length === 0) {
        limitations.push('No allergen declaration field recorded in database. Absence of allergens cannot be inferred.');
      }
      if (!p.traces && precautionaryStatements.length === 0) {
        limitations.push('Precautionary cross-contact statements were not reported for this database record.');
      }
      if (!nutritionFacts) {
        limitations.push('Nutrition Facts values are missing in the database record.');
      }

      const sources: EvidenceSource[] = [
        {
          title: `Open Food Facts Record: ${name} (Barcode ${cleanBarcode})`,
          publisher: 'Open Food Facts Public Collaborative Database',
          url: p.url || `${host}/product/${cleanBarcode}`,
          relevantPassage: `Database record updated ${p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().split('T')[0] : 'recently'}. Ingredients and nutriments contributed by open community audit.`,
          retrievalDate: new Date().toISOString().split('T')[0],
          sourceType: 'public_database'
        }
      ];

      return {
        id: cleanBarcode,
        name,
        brand: p.brands || undefined,
        barcode: cleanBarcode,
        imageUrl: p.image_front_url || p.image_url || undefined,
        sourceUrl: p.url || `${host}/product/${cleanBarcode}`,
        sourceType: 'open_food_facts',
        dataCompleteness: completeness,
        lastUpdated: p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().split('T')[0] : undefined,
        ingredientsText,
        ingredientsList,
        declaredAllergens,
        precautionaryStatements,
        nutritionFacts,
        servingSize: p.serving_size || undefined,
        manufacturer: p.manufacturing_places || undefined,
        sources,
        limitations,
        isDemo: false
      };
    } catch {
      // Try next host
      continue;
    }
  }

  // If remote hosts failed or returned 404, fallback to local curated item
  if (localItem) {
    return catalogItemToProductRecord(localItem);
  }

  return null;
}

/**
 * Searches Open Food Facts by product name with pagination and multi-host resilience.
 */
export async function searchOpenFoodFactsPaged(
  query: string,
  page = 1,
  pageSize = 50
): Promise<OffSearchPagedResult> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { products: [], totalCount: 0, page: 1, pageSize };
  }

  for (const host of OFF_HOSTS) {
    const url = `${host}/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=${pageSize}&page=${page}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'LabelLens - Open Food Intelligence - Web'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = (await res.json()) as {
        count?: number;
        products?: Array<{
          code: string;
          product_name?: string;
          product_name_en?: string;
          brands?: string;
          categories?: string;
          ingredients_text?: string;
          ingredients_text_en?: string;
          allergens?: string;
          allergens_tags?: string[];
          traces?: string;
          traces_tags?: string[];
          image_front_small_url?: string;
          image_url?: string;
          serving_size?: string;
          nutriments?: Record<string, number | string>;
        }>;
      };

      if (!data.products || !Array.isArray(data.products)) continue;

      const products: OffSearchResultItem[] = data.products
        .filter((p) => p.code && (p.product_name || p.product_name_en))
        .map((p) => {
          const cal =
            typeof p.nutriments?.['energy-kcal_100g'] === 'number'
              ? Math.round(p.nutriments['energy-kcal_100g'])
              : typeof p.nutriments?.['energy-kcal_serving'] === 'number'
              ? Math.round(p.nutriments['energy-kcal_serving'])
              : undefined;

          const ingText = p.ingredients_text || p.ingredients_text_en;

          return {
            code: p.code,
            name: p.product_name || p.product_name_en || 'Unknown Product',
            brand: p.brands,
            imageUrl: p.image_front_small_url || p.image_url,
            categories: p.categories,
            calories: cal,
            servingSize: p.serving_size,
            badge: p.brands ? `Brand: ${p.brands.split(',')[0].trim()}` : 'Open Food Facts',
            sourceType: 'open_food_facts',
            ingredientsText: ingText || undefined,
            allergens: p.allergens,
            allergensTags: p.allergens_tags,
            traces: p.traces,
            tracesTags: p.traces_tags,
            nutriments: p.nutriments
          };
        });

      return {
        products,
        totalCount: data.count || products.length,
        page,
        pageSize
      };
    } catch {
      continue;
    }
  }

  // Fallback to Elasticsearch endpoint (search.openfoodfacts.org)
  try {
    const esUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(trimmed)}&size=${pageSize}&page=${page}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(esUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const hits = data.hits || [];
      const products: OffSearchResultItem[] = hits
        .filter((h: Record<string, unknown>) => (h.code || h._id) && (h.product_name || h.product_name_en))
        .map((h: Record<string, unknown>) => {
          const brands = Array.isArray(h.brands) ? h.brands.join(', ') : (h.brands as string);
          const ingText = (h.ingredients_text as string) || (h.ingredients_text_en as string);
          const allergens = Array.isArray(h.allergens_tags) ? h.allergens_tags.join(', ') : (h.allergens as string);
          return {
            code: String(h.code || h._id),
            name: String(h.product_name || h.product_name_en),
            brand: brands || undefined,
            imageUrl: String(h.image_front_small_url || h.image_url || ''),
            categories: String(h.categories || ''),
            badge: brands ? `Brand: ${brands.split(',')[0].trim()}` : 'Open Food Facts',
            sourceType: 'open_food_facts',
            ingredientsText: ingText || undefined,
            allergens: allergens || undefined
          };
        });

      return {
        products,
        totalCount: data.total || products.length,
        page,
        pageSize
      };
    }
  } catch {
    // Elasticsearch fallback also failed
  }

  return { products: [], totalCount: 0, page, pageSize };
}

/**
 * Searches Open Food Facts by product name, returning an array of items for backwards compatibility.
 */
export async function searchOpenFoodFacts(
  query: string,
  pageSize = 50
): Promise<OffSearchResultItem[]> {
  const result = await searchOpenFoodFactsPaged(query, 1, pageSize);
  const items = result.products;
  // Attach totalCount for callers that read it
  (items as unknown as { totalCount: number }).totalCount = result.totalCount;
  return items;
}

/**
 * Fetches products from an Open Food Facts category live.
 */
export async function fetchCategoryFromOpenFoodFacts(
  categorySlug: string,
  page = 1,
  pageSize = 40
): Promise<OffSearchPagedResult> {
  const cleanSlug = categorySlug.trim().toLowerCase();
  const slug = cleanSlug === 'all' ? 'breakfast-cereals' : cleanSlug;

  for (const host of OFF_HOSTS) {
    const url = `${host}/category/${encodeURIComponent(slug)}.json?page_size=${pageSize}&page=${page}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'LabelLens - Open Food Intelligence - Web'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = (await res.json()) as {
        count?: number;
        products?: Array<{
          code: string;
          product_name?: string;
          product_name_en?: string;
          brands?: string;
          categories?: string;
          ingredients_text?: string;
          ingredients_text_en?: string;
          allergens?: string;
          allergens_tags?: string[];
          traces?: string;
          traces_tags?: string[];
          image_front_small_url?: string;
          image_url?: string;
          serving_size?: string;
          nutriments?: Record<string, number | string>;
        }>;
      };

      if (!data.products || !Array.isArray(data.products)) continue;

      const products: OffSearchResultItem[] = data.products
        .filter((p) => p.code && (p.product_name || p.product_name_en))
        .map((p) => {
          const cal =
            typeof p.nutriments?.['energy-kcal_100g'] === 'number'
              ? Math.round(p.nutriments['energy-kcal_100g'])
              : typeof p.nutriments?.['energy-kcal_serving'] === 'number'
              ? Math.round(p.nutriments['energy-kcal_serving'])
              : undefined;

          const ingText = p.ingredients_text || p.ingredients_text_en;

          return {
            code: p.code,
            name: p.product_name || p.product_name_en || 'Unknown Product',
            brand: p.brands,
            imageUrl: p.image_front_small_url || p.image_url,
            categories: p.categories,
            calories: cal,
            servingSize: p.serving_size,
            badge: p.brands ? p.brands.split(',')[0].trim() : 'Live API Item',
            sourceType: 'open_food_facts',
            ingredientsText: ingText || undefined,
            allergens: p.allergens,
            allergensTags: p.allergens_tags,
            traces: p.traces,
            tracesTags: p.traces_tags,
            nutriments: p.nutriments
          };
        });

      return {
        products,
        totalCount: data.count || products.length,
        page,
        pageSize
      };
    } catch {
      continue;
    }
  }

  return { products: [], totalCount: 0, page, pageSize };
}

