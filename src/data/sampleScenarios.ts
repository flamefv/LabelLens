/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductRecord } from '../types/index.ts';
import { parseIngredientsText } from '../services/openFoodFacts.ts';

export const SAMPLE_SCENARIOS: ProductRecord[] = [
  {
    id: 'demo-oat-milk',
    name: 'Barista Edition Oat Milk',
    brand: 'OatField Organics [Demo]',
    barcode: '000000000001',
    sourceType: 'demo_scenario',
    dataCompleteness: 'High',
    lastUpdated: '2026-10-15',
    isDemo: true,
    ingredientsText:
      'Oat base (water, oats 10%), low erucic acid rapeseed oil, dipotassium phosphate, calcium carbonate, tricalcium phosphate, sea salt, dicalcium phosphate, riboflavin, vitamin D2, vitamin B12.',
    ingredientsList: parseIngredientsText(
      'Oat base (water, oats 10%), low erucic acid rapeseed oil, dipotassium phosphate, calcium carbonate, tricalcium phosphate, sea salt, dicalcium phosphate, riboflavin, vitamin D2, vitamin B12.',
      'demo_scenario'
    ),
    declaredAllergens: [],
    precautionaryStatements: ['Produced in a facility that also handles almonds, soy, and dairy.'],
    servingSize: '1 cup (240 mL)',
    manufacturer: 'OatField Plant Beverage Labs, Portland, OR',
    nutritionFacts: {
      servingSize: '1 cup (240 mL)',
      servingSizeGrams: 240,
      calories: 140,
      totalFat: 7,
      saturatedFat: 0.5,
      transFat: 0,
      cholesterol: 0,
      sodium: 100,
      totalCarbohydrates: 16,
      dietaryFiber: 2,
      totalSugars: 7,
      addedSugars: 7,
      protein: 3,
      calcium: 350,
      potassium: 390,
      per100g: {
        calories: 58.3,
        totalFat: 2.9,
        saturatedFat: 0.2,
        sodium: 41.7,
        totalCarbohydrates: 6.7,
        dietaryFiber: 0.8,
        totalSugars: 2.9,
        protein: 1.25
      }
    },
    sources: [
      {
        title: 'Package Label Audit (Demonstration Sample)',
        publisher: 'LabelLens Demonstration Test Suite',
        url: 'https://www.fda.gov/food/food-labeling-nutrition',
        relevantPassage: 'Simulated packaged barista oat milk formula reflecting standard commercial barista additives (dipotassium phosphate buffering salt).',
        retrievalDate: '2026-10-15',
        sourceType: 'package_label'
      },
      {
        title: '21 CFR § 184.1634 - Potassium phosphate',
        publisher: 'U.S. FDA & Electronic Code of Federal Regulations',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1634',
        relevantPassage: 'Potassium phosphate is affirmed as GRAS direct human food ingredient used as a buffering agent in dairy and plant emulsions.',
        retrievalDate: '2026-10-15',
        sourceType: 'government_regulation'
      }
    ],
    limitations: [
      'This record is an explicitly labeled demonstration scenario provided for testing and UI evaluation.',
      'Enzymatic oat hydrolysis yields maltose sugars; these are reported as Added Sugars under FDA 2016 labeling guidance.'
    ]
  },
  {
    id: 'demo-plant-burger',
    name: 'Savory Plant-Based Burger Patty',
    brand: 'Verdant Harvest [Demo]',
    barcode: '000000000002',
    sourceType: 'demo_scenario',
    dataCompleteness: 'High',
    lastUpdated: '2026-10-12',
    isDemo: true,
    ingredientsText:
      'Water, soy protein concentrate, expeller-pressed canola oil, refined coconut oil, natural flavors, methylcellulose, soy leghemoglobin, salt, cultured dextrose, yeast extract, zinc gluconate, niacin (vitamin B3), thiamine hydrochloride (vitamin B1).',
    ingredientsList: parseIngredientsText(
      'Water, soy protein concentrate, expeller-pressed canola oil, refined coconut oil, natural flavors, methylcellulose, soy leghemoglobin, salt, cultured dextrose, yeast extract, zinc gluconate, niacin, thiamine.',
      'demo_scenario'
    ),
    declaredAllergens: ['Soy'],
    precautionaryStatements: [],
    servingSize: '1 patty (113 g)',
    manufacturer: 'Verdant Foods Inc, Boulder, CO',
    nutritionFacts: {
      servingSize: '1 patty (113 g)',
      servingSizeGrams: 113,
      calories: 230,
      totalFat: 14,
      saturatedFat: 6,
      transFat: 0,
      cholesterol: 0,
      sodium: 370,
      totalCarbohydrates: 9,
      dietaryFiber: 5,
      totalSugars: 1,
      addedSugars: 0,
      protein: 19,
      calcium: 170,
      iron: 4.2,
      potassium: 610,
      per100g: {
        calories: 203.5,
        totalFat: 12.4,
        saturatedFat: 5.3,
        sodium: 327.4,
        totalCarbohydrates: 8.0,
        dietaryFiber: 4.4,
        totalSugars: 0.9,
        protein: 16.8
      }
    },
    sources: [
      {
        title: 'FDA GRAS Notice Inventory: Soy Leghemoglobin (GRN 000737)',
        publisher: 'U.S. Food and Drug Administration',
        url: 'https://www.fda.gov/food/generally-recognized-safe-gras/gras-notice-inventory',
        relevantPassage: 'FDA review of soy leghemoglobin preparation as a color additive and flavor precursor in plant-based ground meat analogs.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    limitations: [
      'Demonstration scenario representing engineered plant-based proteins.',
      'Contains natural flavors without itemized botanical provenance.'
    ]
  },
  {
    id: 'demo-sesame-granola',
    name: 'Ancient Grain & Honey Sesame Snack Bar',
    brand: 'TrailPeak Provisions [Demo]',
    barcode: '000000000003',
    sourceType: 'demo_scenario',
    dataCompleteness: 'High',
    lastUpdated: '2026-10-18',
    isDemo: true,
    ingredientsText:
      'Whole grain rolled oats, wild clover honey, roasted sesame seeds, toasted almonds, expeller pressed sunflower oil, brown rice crisps, sea salt, mixed tocopherols (vitamin E for freshness).',
    ingredientsList: parseIngredientsText(
      'Whole grain rolled oats, wild clover honey, roasted sesame seeds, toasted almonds, expeller pressed sunflower oil, brown rice crisps, sea salt, mixed tocopherols.',
      'demo_scenario'
    ),
    declaredAllergens: ['Sesame', 'Tree Nuts (Almonds)'],
    precautionaryStatements: ['May contain traces of peanuts and milk.'],
    servingSize: '1 bar (45 g)',
    manufacturer: 'TrailPeak Foods, Burlington, VT',
    nutritionFacts: {
      servingSize: '1 bar (45 g)',
      servingSizeGrams: 45,
      calories: 190,
      totalFat: 9,
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 0,
      sodium: 85,
      totalCarbohydrates: 23,
      dietaryFiber: 3,
      totalSugars: 11,
      addedSugars: 9,
      protein: 5,
      calcium: 60,
      iron: 1.5,
      per100g: {
        calories: 422.2,
        totalFat: 20.0,
        saturatedFat: 2.2,
        sodium: 188.9,
        totalCarbohydrates: 51.1,
        dietaryFiber: 6.7,
        totalSugars: 24.4,
        protein: 11.1
      }
    },
    sources: [
      {
        title: 'FASTER Act Food Allergen Guidance (Sesame Declaration)',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
        relevantPassage: 'Mandatory declaration of sesame as 9th major allergen effective Jan 1, 2023 under public law 117-11.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    limitations: [
      'Demonstration scenario highlighting sesame allergen declaration and honey non-vegan classification.'
    ]
  },
  {
    id: 'demo-diet-soda',
    name: 'Sparkling Citrus Zero Calorie Beverage',
    brand: 'BriskWave Botanicals [Demo]',
    barcode: '000000000004',
    sourceType: 'demo_scenario',
    dataCompleteness: 'High',
    lastUpdated: '2026-10-10',
    isDemo: true,
    ingredientsText:
      'Carbonated water, citric acid, concentrated grapefruit juice, potassium citrate, aspartame, potassium benzoate (preserves freshness), acesulfame potassium, natural flavors, calcium disodium EDTA (to protect flavor), yellow 5.',
    ingredientsList: parseIngredientsText(
      'Carbonated water, citric acid, concentrated grapefruit juice, potassium citrate, aspartame, potassium benzoate, acesulfame potassium, natural flavors, calcium disodium EDTA, yellow 5.',
      'demo_scenario'
    ),
    declaredAllergens: [],
    precautionaryStatements: ['PHENYLKETONURICS: CONTAINS PHENYLALANINE'],
    servingSize: '1 can (355 mL)',
    manufacturer: 'BriskWave Beverage Bottlers, Atlanta, GA',
    nutritionFacts: {
      servingSize: '1 can (355 mL)',
      servingSizeGrams: 355,
      calories: 0,
      totalFat: 0,
      sodium: 35,
      totalCarbohydrates: 0,
      dietaryFiber: 0,
      totalSugars: 0,
      addedSugars: 0,
      protein: 0,
      per100g: {
        calories: 0,
        totalFat: 0,
        sodium: 9.8,
        totalCarbohydrates: 0,
        totalSugars: 0,
        protein: 0
      }
    },
    sources: [
      {
        title: '21 CFR § 172.804 - Aspartame',
        publisher: 'U.S. FDA & Electronic Code of Federal Regulations',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-I/section-172.804',
        relevantPassage: 'Mandatory label warning for phenylketonuria: PHENYLKETONURICS: CONTAINS PHENYLALANINE.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      },
      {
        title: '21 CFR § 74.705 - FD&C Yellow No. 5',
        publisher: 'U.S. FDA & Electronic Code of Federal Regulations',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-74/subpart-A/section-74.705',
        relevantPassage: 'Certified food dye Yellow No. 5 requires individual specific declaration on labels to protect tartrazine-sensitive individuals.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    limitations: [
      'Demonstration scenario demonstrating PKU cautionary warnings and certified food dyes.'
    ]
  },
  {
    id: 'demo-artisan-sourdough',
    name: 'San Francisco Style Artisan Sourdough Loaf',
    brand: 'Golden Gate Hearth [Demo]',
    barcode: '000000000005',
    sourceType: 'demo_scenario',
    dataCompleteness: 'High',
    lastUpdated: '2026-10-20',
    isDemo: true,
    ingredientsText: 'Organic unbleached wheat flour, filtered water, organic whole rye flour, sea salt.',
    ingredientsList: parseIngredientsText(
      'Organic unbleached wheat flour, filtered water, organic whole rye flour, sea salt.',
      'demo_scenario'
    ),
    declaredAllergens: ['Wheat'],
    precautionaryStatements: [],
    servingSize: '1 slice (50 g)',
    manufacturer: 'Golden Gate Hearth Bakeries, San Francisco, CA',
    nutritionFacts: {
      servingSize: '1 slice (50 g)',
      servingSizeGrams: 50,
      calories: 120,
      totalFat: 0.5,
      saturatedFat: 0,
      transFat: 0,
      sodium: 230,
      totalCarbohydrates: 25,
      dietaryFiber: 2,
      totalSugars: 0,
      addedSugars: 0,
      protein: 4,
      iron: 1.2,
      per100g: {
        calories: 240,
        totalFat: 1.0,
        saturatedFat: 0,
        sodium: 460,
        totalCarbohydrates: 50,
        dietaryFiber: 4.0,
        totalSugars: 0,
        protein: 8.0
      }
    },
    sources: [
      {
        title: '21 CFR § 136.180 - Whole wheat bread and sourdough standards',
        publisher: 'U.S. FDA & Electronic Code of Federal Regulations',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-136/subpart-B/section-136.180',
        relevantPassage: 'Standards of identity for bakery products and customary yeast and lactobacilli sourdough cultures.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    limitations: [
      'Demonstration scenario of a 4-ingredient traditional fermented grain food with wheat gluten declaration.'
    ]
  }
];

export function getSampleScenario(id: string): ProductRecord | undefined {
  return SAMPLE_SCENARIOS.find((s) => s.id === id);
}
