/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DietaryRule, PreferenceEvaluation, ProductRecord, PreferenceMatchLevel } from '../types/index.ts';
import { normalizeIngredientName } from './curatedEvidence.ts';

export const DEFAULT_DIETARY_RULES: DietaryRule[] = [
  // Major 9 FDA Allergens
  {
    id: 'allergen-milk',
    name: 'Milk & Dairy',
    type: 'major_allergen',
    description: 'Flags declared milk allergen, whey, casein, butter, lactose, and dairy solids.',
    keywords: ['milk', 'dairy', 'whey', 'casein', 'caseinate', 'butter', 'cream', 'lactose', 'cheese', 'ghee'],
    enabled: true
  },
  {
    id: 'allergen-eggs',
    name: 'Eggs',
    type: 'major_allergen',
    description: 'Flags declared egg allergen, egg whites, yolks, albumin, and ovalbumin.',
    keywords: ['egg', 'eggs', 'egg white', 'egg yolk', 'albumin', 'ovalbumin', 'mayonnaise', 'lysozyme'],
    enabled: true
  },
  {
    id: 'allergen-peanuts',
    name: 'Peanuts',
    type: 'major_allergen',
    description: 'Flags declared peanuts, peanut oil (unrefined), and peanut flour.',
    keywords: ['peanut', 'peanuts', 'arachis oil', 'groundnut', 'peanut flour', 'peanut butter'],
    enabled: true
  },
  {
    id: 'allergen-tree-nuts',
    name: 'Tree Nuts',
    type: 'major_allergen',
    description: 'Flags almonds, walnuts, cashews, pecans, pistachios, hazelnuts, macadamias, and coconut.',
    keywords: ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'tree nuts', 'pine nut'],
    enabled: true
  },
  {
    id: 'allergen-wheat',
    name: 'Wheat & Gluten Grain',
    type: 'major_allergen',
    description: 'Flags declared wheat, durum, semolina, spelt, farro, and wheat flour.',
    keywords: ['wheat', 'durum', 'semolina', 'spelt', 'farro', 'wheat flour', 'enriched flour', 'wheat gluten', 'wheat bran'],
    enabled: true
  },
  {
    id: 'allergen-soy',
    name: 'Soybeans',
    type: 'major_allergen',
    description: 'Flags declared soy, soy lecithin, soy protein, edamame, and tofu.',
    keywords: ['soy', 'soya', 'soybean', 'soy lecithin', 'soy protein', 'tofu', 'edamame', 'tamari'],
    enabled: true
  },
  {
    id: 'allergen-sesame',
    name: 'Sesame (FASTER Act)',
    type: 'major_allergen',
    description: 'Flags declared sesame seeds, sesame oil, tahini, and sesame paste.',
    keywords: ['sesame', 'sesame seed', 'sesame oil', 'tahini', 'sesamum indicum', 'sesame flour', 'benne'],
    enabled: true
  },
  {
    id: 'allergen-fish',
    name: 'Fish',
    type: 'major_allergen',
    description: 'Flags finfish, cod, salmon, tuna, anchovies, fish sauce, and gelatin.',
    keywords: ['fish', 'anchovy', 'anchovies', 'tuna', 'salmon', 'cod', 'tilapia', 'halibut', 'isinglass'],
    enabled: false
  },
  {
    id: 'allergen-crustacean',
    name: 'Crustacean Shellfish',
    type: 'major_allergen',
    description: 'Flags shrimp, crab, lobster, prawn, and langoustine.',
    keywords: ['shrimp', 'crab', 'lobster', 'prawn', 'crawfish', 'crustacean', 'shellfish'],
    enabled: false
  },

  // Dietary Lifestyles
  {
    id: 'diet-vegan',
    name: 'Vegan Suitability',
    type: 'dietary_lifestyle',
    description: 'Flags animal meat, dairy, eggs, honey, gelatin, carmine/cochineal, and highlights ambiguous ingredients (natural flavors, mono- and diglycerides).',
    keywords: [
      'meat', 'beef', 'pork', 'chicken', 'poultry', 'gelatin', 'lard', 'tallow',
      'milk', 'cheese', 'butter', 'whey', 'casein', 'egg', 'honey', 'carmine', 'cochineal', 'shellac'
    ],
    enabled: false
  },
  {
    id: 'diet-gluten-free',
    name: 'Strict Gluten-Free',
    type: 'dietary_lifestyle',
    description: 'Flags wheat, barley, rye, malt, brewer’s yeast, and oats lacking explicit gluten-free declaration.',
    keywords: ['wheat', 'barley', 'rye', 'malt', 'malt extract', 'brewers yeast', 'triticale', 'wheat starch'],
    enabled: false
  },
  {
    id: 'diet-no-artificial-colors',
    name: 'No Synthetic Dyes & Pigments',
    type: 'dietary_lifestyle',
    description: 'Flags certified synthetic food colors (Red 40, Yellow 5, Yellow 6, Blue 1) and Titanium Dioxide.',
    keywords: ['red 40', 'yellow 5', 'yellow 6', 'blue 1', 'blue 2', 'green 3', 'titanium dioxide', 'artificial color', 'fd&c'],
    enabled: false
  },
  {
    id: 'diet-palm-oil-free',
    name: 'Palm Oil Free',
    type: 'dietary_lifestyle',
    description: 'Flags palm oil, palm kernel oil, and palm fruit fat.',
    keywords: ['palm oil', 'palm kernel oil', 'palmate', 'palmitate', 'fractionated palm oil', 'palm fat'],
    enabled: false
  }
];

// Ambiguous ingredients that may be animal- or plant-derived
const AMBIGUOUS_VEGAN_INGREDIENTS = [
  'natural flavors',
  'natural flavor',
  'mono- and diglycerides',
  'monoglycerides',
  'glycerin',
  'glycerol',
  'lactic acid',
  'calcium stearate',
  'magnesium stearate',
  'enzymes',
  'enzyme'
];

/**
 * Evaluates a product against a specific dietary rule.
 */
export function evaluateDietaryRule(rule: DietaryRule, product: ProductRecord): PreferenceEvaluation {
  const triggerPhrases: string[] = [];
  const fullText = (
    product.ingredientsText +
    ' ' +
    product.declaredAllergens.join(' ') +
    ' ' +
    product.precautionaryStatements.join(' ')
  ).toLowerCase();

  // If no ingredients text and no allergen info, record cannot be evaluated
  if (!product.ingredientsText && product.declaredAllergens.length === 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matchLevel: 'INSUFFICIENT_INFO',
      triggerPhrases: [],
      explanation: 'Product record contains neither ingredient declarations nor allergen statements. Status cannot be verified from available data.'
    };
  }

  // 1. Check declared allergens first (highest certainty)
  for (const allergen of product.declaredAllergens) {
    const normAllergen = allergen.toLowerCase();
    for (const kw of rule.keywords) {
      if (normAllergen.includes(kw) || kw.includes(normAllergen)) {
        triggerPhrases.push(`Declared Allergen: "${allergen}"`);
      }
    }
  }

  // 2. Check ingredient list
  for (const ing of product.ingredientsList) {
    const normIng = ing.normalizedName;
    for (const kw of rule.keywords) {
      const normKw = normalizeIngredientName(kw);
      if (normIng === normKw || normIng.includes(normKw) || normKw.includes(normIng)) {
        if (!triggerPhrases.includes(`Ingredient: "${ing.rawName}"`)) {
          triggerPhrases.push(`Ingredient: "${ing.rawName}"`);
        }
      }
    }
  }

  // 3. Precautionary statements check
  const precautionaryMatches: string[] = [];
  for (const statement of product.precautionaryStatements) {
    const normStatement = statement.toLowerCase();
    for (const kw of rule.keywords) {
      if (normStatement.includes(kw)) {
        precautionaryMatches.push(`Precautionary Warning: "${statement}"`);
      }
    }
  }

  // 4. Special handling for Vegan ambiguous ingredients
  const ambiguousTriggers: string[] = [];
  if (rule.id === 'diet-vegan') {
    for (const ing of product.ingredientsList) {
      const norm = ing.normalizedName;
      for (const ambig of AMBIGUOUS_VEGAN_INGREDIENTS) {
        if (norm.includes(ambig)) {
          ambiguousTriggers.push(`Ambiguous origin: "${ing.rawName}" (can be plant or animal derived)`);
        }
      }
    }
  }

  // Determine Level
  if (triggerPhrases.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matchLevel: 'CONFIRMED_MATCH',
      triggerPhrases,
      explanation: `Flagged based on explicit declarations: ${triggerPhrases.join('; ')}.`
    };
  }

  if (precautionaryMatches.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matchLevel: 'POSSIBLE_MATCH',
      triggerPhrases: precautionaryMatches,
      explanation: `Facility or shared equipment cross-contact risk declared on package: ${precautionaryMatches.join('; ')}.`
    };
  }

  if (ambiguousTriggers.length > 0) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matchLevel: 'POSSIBLE_MATCH',
      triggerPhrases: ambiguousTriggers,
      explanation: `Contains ingredient(s) whose biological source cannot be confirmed from label text alone: ${ambiguousTriggers.join('; ')}.`
    };
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    matchLevel: 'NO_MATCH_FOUND',
    triggerPhrases: [],
    explanation: 'No matching ingredients or allergen warnings detected in available product data. (Note: Does not guarantee complete absence or medical safety).'
  };
}

/**
 * Evaluates all active dietary rules against a product.
 */
export function evaluateAllDietaryRules(rules: DietaryRule[], product: ProductRecord): PreferenceEvaluation[] {
  const activeRules = rules.filter((r) => r.enabled);
  return activeRules.map((rule) => evaluateDietaryRule(rule, product));
}
