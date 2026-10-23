/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NutritionFacts, EvidenceSource } from '../types/index.ts';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface UsdaFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
}

export interface UsdaSearchResult {
  foods: UsdaFoodItem[];
  totalHits: number;
}

/**
 * Searches USDA FoodData Central for official food composition records.
 */
export async function searchUsdaFoodData(query: string, apiKey?: string): Promise<UsdaFoodItem[]> {
  if (!query || query.trim().length < 2) return [];

  const key = apiKey || 'DEMO_KEY';
  const url = `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query.trim())}&pageSize=5&api_key=${key}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        console.warn('USDA FDC API rate limit reached (DEMO_KEY).');
        return [];
      }
      return [];
    }

    const data = (await res.json()) as UsdaSearchResult;
    return data.foods || [];
  } catch {
    return [];
  }
}

/**
 * Extracts normalized NutritionFacts from a USDA FoodItem.
 */
export function usdaItemToNutrition(food: UsdaFoodItem): NutritionFacts {
  const getNutrient = (names: string[]): number | undefined => {
    const found = food.foodNutrients.find((n) =>
      names.some((name) => n.nutrientName.toLowerCase().includes(name.toLowerCase()))
    );
    return found ? Math.round(found.value * 10) / 10 : undefined;
  };

  const calories = getNutrient(['Energy']);
  const totalFat = getNutrient(['Total lipid (fat)']);
  const saturatedFat = getNutrient(['Fatty acids, total saturated']);
  const transFat = getNutrient(['Fatty acids, total trans']);
  const cholesterol = getNutrient(['Cholesterol']);
  const sodium = getNutrient(['Sodium, Na']);
  const totalCarbs = getNutrient(['Carbohydrate, by difference']);
  const fiber = getNutrient(['Fiber, total dietary']);
  const sugars = getNutrient(['Sugars, total including NLEA', 'Total Sugars']);
  const addedSugars = getNutrient(['Sugars, added']);
  const protein = getNutrient(['Protein']);
  const calcium = getNutrient(['Calcium, Ca']);
  const iron = getNutrient(['Iron, Fe']);
  const potassium = getNutrient(['Potassium, K']);

  const servingDesc = food.servingSize ? `${food.servingSize} ${food.servingSizeUnit || 'g'}` : '100 g';

  return {
    servingSize: servingDesc,
    servingSizeGrams: food.servingSizeUnit?.toLowerCase() === 'g' ? food.servingSize : 100,
    calories,
    totalFat,
    saturatedFat,
    transFat,
    cholesterol,
    sodium,
    totalCarbohydrates: totalCarbs,
    dietaryFiber: fiber,
    totalSugars: sugars,
    addedSugars,
    protein,
    calcium,
    iron,
    potassium
  };
}

/**
 * Generates an EvidenceSource for USDA FoodData Central.
 */
export function getUsdaEvidenceSource(food: UsdaFoodItem): EvidenceSource {
  return {
    title: `USDA FoodData Central Record: ${food.description} (FDC ID: ${food.fdcId})`,
    publisher: 'U.S. Department of Agriculture (USDA) Agricultural Research Service',
    url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`,
    relevantPassage: `Official nutrient values from USDA FoodData Central (${food.dataType}). Database entry maintained by Agricultural Research Service.`,
    retrievalDate: new Date().toISOString().split('T')[0],
    sourceType: 'government_regulation'
  };
}
