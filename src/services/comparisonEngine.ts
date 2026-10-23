/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductRecord, ComparisonProductDifference, DietaryRule } from '../types/index.ts';
import { normalizeIngredientName } from './curatedEvidence.ts';
import { evaluateDietaryRule } from './dietaryEngine.ts';

/**
 * Normalizes an ingredient list into a clean unique set of string labels.
 */
function getNormalizedSet(product: ProductRecord): { rawMap: Map<string, string>; normalizedList: string[] } {
  const rawMap = new Map<string, string>();
  const normalizedList: string[] = [];

  for (const item of product.ingredientsList) {
    const norm = normalizeIngredientName(item.normalizedName || item.rawName);
    if (norm && !rawMap.has(norm)) {
      rawMap.set(norm, item.rawName);
      normalizedList.push(norm);
    }
  }

  return { rawMap, normalizedList };
}

/**
 * Generates structured, objective side-by-side comparison between two products.
 * Does NOT assign an arbitrary black-box "health score".
 */
export function compareProducts(
  productA: ProductRecord,
  productB: ProductRecord,
  activeRules: DietaryRule[] = []
): ComparisonProductDifference {
  const setA = getNormalizedSet(productA);
  const setB = getNormalizedSet(productB);

  const sharedNormalized = setA.normalizedList.filter((norm) => setB.rawMap.has(norm));
  const uniqueNormalizedA = setA.normalizedList.filter((norm) => !setB.rawMap.has(norm));
  const uniqueNormalizedB = setB.normalizedList.filter((norm) => !setA.rawMap.has(norm));

  const sharedIngredients = sharedNormalized.map((norm) => setA.rawMap.get(norm) || norm);
  const uniqueToProductA = uniqueNormalizedA.map((norm) => setA.rawMap.get(norm) || norm);
  const uniqueToProductB = uniqueNormalizedB.map((norm) => setB.rawMap.get(norm) || norm);

  // Allergen differences
  const allergensA = new Set(productA.declaredAllergens.map((a) => a.toLowerCase()));
  const allergensB = new Set(productB.declaredAllergens.map((a) => a.toLowerCase()));

  const sharedAllergens: string[] = [];
  const allergensOnlyInA: string[] = [];
  const allergensOnlyInB: string[] = [];

  productA.declaredAllergens.forEach((a) => {
    if (allergensB.has(a.toLowerCase())) {
      if (!sharedAllergens.includes(a)) sharedAllergens.push(a);
    } else {
      allergensOnlyInA.push(a);
    }
  });

  productB.declaredAllergens.forEach((b) => {
    if (!allergensA.has(b.toLowerCase())) {
      allergensOnlyInB.push(b);
    }
  });

  // Nutrition Comparison
  const nutA = productA.nutritionFacts;
  const nutB = productB.nutritionFacts;

  const metricsConfig: Array<{ name: string; key: keyof NonNullable<typeof nutA>; unit: string }> = [
    { name: 'Calories', key: 'calories', unit: 'kcal' },
    { name: 'Total Fat', key: 'totalFat', unit: 'g' },
    { name: 'Saturated Fat', key: 'saturatedFat', unit: 'g' },
    { name: 'Sodium', key: 'sodium', unit: 'mg' },
    { name: 'Total Carbohydrates', key: 'totalCarbohydrates', unit: 'g' },
    { name: 'Dietary Fiber', key: 'dietaryFiber', unit: 'g' },
    { name: 'Total Sugars', key: 'totalSugars', unit: 'g' },
    { name: 'Protein', key: 'protein', unit: 'g' }
  ];

  const metrics = metricsConfig.map((m) => {
    const valA = nutA ? (nutA[m.key] as number | undefined) : undefined;
    const valB = nutB ? (nutB[m.key] as number | undefined) : undefined;
    const valA_100g = nutA?.per100g ? (nutA.per100g[m.key as keyof typeof nutA.per100g] as number | undefined) : undefined;
    const valB_100g = nutB?.per100g ? (nutB.per100g[m.key as keyof typeof nutB.per100g] as number | undefined) : undefined;

    const diffServing = valA !== undefined && valB !== undefined ? Math.round((valA - valB) * 10) / 10 : undefined;
    const diff100g = valA_100g !== undefined && valB_100g !== undefined ? Math.round((valA_100g - valB_100g) * 10) / 10 : undefined;

    return {
      name: m.name,
      unit: m.unit,
      valA,
      valB,
      valA_100g,
      valB_100g,
      difference: diffServing,
      difference100g: diff100g
    };
  });

  // Preference evaluation differences
  const preferenceDifferences = activeRules
    .filter((r) => r.enabled)
    .map((rule) => {
      const resA = evaluateDietaryRule(rule, productA);
      const resB = evaluateDietaryRule(rule, productB);
      return {
        ruleName: rule.name,
        productAResult: resA,
        productBResult: resB
      };
    });

  // Missing data notes
  const missingDataNotes: string[] = [];
  if (!productA.nutritionFacts) missingDataNotes.push(`${productA.name} does not have Nutrition Facts recorded.`);
  if (!productB.nutritionFacts) missingDataNotes.push(`${productB.name} does not have Nutrition Facts recorded.`);
  if (!productA.ingredientsText) missingDataNotes.push(`${productA.name} lacks an ingredients statement.`);
  if (!productB.ingredientsText) missingDataNotes.push(`${productB.name} lacks an ingredients statement.`);
  if (productA.servingSize !== productB.servingSize && productA.servingSize && productB.servingSize) {
    missingDataNotes.push(
      `Serving sizes differ: ${productA.name} states "${productA.servingSize}" whereas ${productB.name} states "${productB.servingSize}". Compare 100g metrics for true baseline equivalence.`
    );
  }

  return {
    sharedIngredients,
    uniqueToProductA,
    uniqueToProductB,
    allergenDifferences: {
      productAName: productA.name,
      productBName: productB.name,
      allergensOnlyInA,
      allergensOnlyInB,
      sharedAllergens
    },
    nutritionComparison: {
      servingSizeA: productA.servingSize,
      servingSizeB: productB.servingSize,
      metrics
    },
    preferenceDifferences,
    missingDataNotes
  };
}
