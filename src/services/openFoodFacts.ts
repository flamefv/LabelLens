/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductRecord, IngredientItem, NutritionFacts, EvidenceSource } from '../types/index.ts';
import { findCuratedIngredient, normalizeIngredientName } from './curatedEvidence.ts';

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

/**
 * Fetches a product from Open Food Facts by barcode.
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductRecord | null> {
  const cleanBarcode = barcode.replace(/[^\d]/g, '').trim();
  if (!cleanBarcode || cleanBarcode.length < 4) {
    throw new Error('Please enter a valid numeric barcode (minimum 4 digits).');
  }

  const url = `${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LabelLens - Open Food Intelligence - Web'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Open Food Facts API error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as OffProductResponse;

    if (data.status !== 1 || !data.product) {
      return null;
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
        url: p.url || `https://world.openfoodfacts.org/product/${cleanBarcode}`,
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
      sourceUrl: p.url || `https://world.openfoodfacts.org/product/${cleanBarcode}`,
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Open Food Facts database request timed out. Please check your connection or retry.');
    }
    throw err;
  }
}

/**
 * Searches Open Food Facts by product name.
 */
export async function searchOpenFoodFacts(query: string): Promise<Array<{ code: string; name: string; brand?: string; imageUrl?: string }>> {
  if (!query || query.trim().length < 2) return [];

  const url = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=8`;

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

    if (!res.ok) return [];

    const data = (await res.json()) as OffSearchResponse;
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p) => p.code && (p.product_name || p.product_name_en))
      .map((p) => ({
        code: p.code,
        name: p.product_name || p.product_name_en || 'Unknown Product',
        brand: p.brands,
        imageUrl: p.image_url
      }));
  } catch {
    return [];
  }
}
