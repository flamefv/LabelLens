/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EvidenceProvenance =
  | 'Read from package'
  | 'Database record'
  | 'Official guidance'
  | 'Calculated / Normalized'
  | 'Not verified';

export type EvidenceStatus =
  | 'Authoritative Regulatory Consensus'
  | 'Active Regulatory Scrutiny'
  | 'Under Review'
  | 'Inconclusive / Mixed Clinical Data'
  | 'Unverified / Insufficient Data';

export type PreferenceMatchLevel =
  | 'CONFIRMED_MATCH'
  | 'POSSIBLE_MATCH'
  | 'INSUFFICIENT_INFO'
  | 'NO_MATCH_FOUND';

export interface EvidenceSource {
  title: string;
  publisher: string; // e.g. "U.S. FDA", "USDA FoodData Central", "Open Food Facts", "eCFR Title 21"
  url: string;
  relevantPassage: string;
  retrievalDate?: string;
  sourceType: 'government_regulation' | 'public_database' | 'scientific_reference' | 'package_label';
}

export interface IngredientItem {
  id: string;
  rawName: string;
  normalizedName: string;
  category?: string;
  isAllergen?: boolean;
  allergenType?: string;
  flaggedPreferences?: string[];
  hasCuratedEntry?: boolean;
  provenance: EvidenceProvenance;
}

export interface NutritionFacts {
  servingSize?: string;
  servingSizeGrams?: number;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrates?: number;
  dietaryFiber?: number;
  totalSugars?: number;
  addedSugars?: number;
  protein?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  // Per 100g values for normalized comparison
  per100g?: {
    calories?: number;
    totalFat?: number;
    saturatedFat?: number;
    sodium?: number;
    totalCarbohydrates?: number;
    dietaryFiber?: number;
    totalSugars?: number;
    protein?: number;
  };
}

export interface ProductRecord {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  sourceUrl?: string;
  sourceType: 'open_food_facts' | 'usda_fdc' | 'package_scan' | 'manual_entry' | 'demo_scenario';
  dataCompleteness: 'High' | 'Moderate' | 'Partial' | 'Minimal';
  lastUpdated?: string;
  ingredientsText: string;
  ingredientsList: IngredientItem[];
  declaredAllergens: string[];
  precautionaryStatements: string[];
  nutritionFacts?: NutritionFacts;
  servingSize?: string;
  manufacturer?: string;
  discrepancies?: string[];
  sources: EvidenceSource[];
  limitations: string[];
  isDemo?: boolean;
}

export interface CuratedIngredientRecord {
  name: string;
  slug: string;
  synonyms: string[];
  category: string;
  plainEnglish: string;
  whatEvidenceEstablishes: string[];
  whatEvidenceDoesNotEstablish: string[];
  labelingContext: string;
  evidenceStatus: EvidenceStatus;
  sources: EvidenceSource[];
  suggestedNextStep: string;
  commonIn: string[];
}

export interface DietaryRule {
  id: string;
  name: string;
  type: 'major_allergen' | 'dietary_lifestyle' | 'custom_avoidance';
  description: string;
  keywords: string[];
  enabled: boolean;
}

export interface PreferenceEvaluation {
  ruleId: string;
  ruleName: string;
  matchLevel: PreferenceMatchLevel;
  triggerPhrases: string[];
  explanation: string;
}

export interface ComparisonProductDifference {
  sharedIngredients: string[];
  uniqueToProductA: string[];
  uniqueToProductB: string[];
  allergenDifferences: {
    productAName: string;
    productBName: string;
    allergensOnlyInA: string[];
    allergensOnlyInB: string[];
    sharedAllergens: string[];
  };
  nutritionComparison: {
    servingSizeA?: string;
    servingSizeB?: string;
    metrics: Array<{
      name: string;
      unit: string;
      valA?: number;
      valB?: number;
      valA_100g?: number;
      valB_100g?: number;
      difference?: number;
      difference100g?: number;
    }>;
  };
  preferenceDifferences: Array<{
    ruleName: string;
    productAResult: PreferenceEvaluation;
    productBResult: PreferenceEvaluation;
  }>;
  missingDataNotes: string[];
}

export interface LabelExtractionResult {
  productName: string | null;
  rawText: string;
  extractedIngredients: string[];
  declaredAllergens: string[];
  precautionaryStatements: string[];
  nutritionFacts: NutritionFacts | null;
  servingSize: string | null;
  manufacturer: string | null;
  legibilityIssues: string[];
  uncertainFields: string[];
  ocrConfidence?: number;
}
