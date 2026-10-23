/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LabelExtractionResult, NutritionFacts } from '../types/index.ts';
import { parseIngredientsText } from './openFoodFacts.ts';

/**
 * Parses raw text extracted from package OCR or manual paste into structured fields.
 * Follows strict evidence rules: does not invent invisible fields.
 */
export function parseLabelText(rawText: string, ocrConfidence?: number): LabelExtractionResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      productName: null,
      rawText: '',
      extractedIngredients: [],
      declaredAllergens: [],
      precautionaryStatements: [],
      nutritionFacts: null,
      servingSize: null,
      manufacturer: null,
      legibilityIssues: ['No text detected in input.'],
      uncertainFields: ['Product Name', 'Ingredients', 'Allergens', 'Nutrition Facts'],
      ocrConfidence: 0
    };
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const legibilityIssues: string[] = [];
  const uncertainFields: string[] = [];

  if (ocrConfidence !== undefined && ocrConfidence < 65) {
    legibilityIssues.push(`Low OCR optical legibility confidence score (${Math.round(ocrConfidence)}%). Some words may contain typographical noise.`);
  }

  // 1. Isolate Allergen "CONTAINS" statement
  const declaredAllergens: string[] = [];
  const containsMatch = trimmed.match(/(?:CONTAINS|ALLERGEN\s*INFO(?:RMATION)?)\s*[:\-]\s*([^\n\.;]+)/i);
  if (containsMatch && containsMatch[1]) {
    const rawAllergenStr = containsMatch[1];
    const items = rawAllergenStr.split(/,|and|\//i).map((s) => s.trim()).filter((s) => s.length > 1);
    for (const item of items) {
      declaredAllergens.push(item.replace(/[\.\*]$/, '').trim());
    }
  }

  // 2. Isolate Precautionary "MAY CONTAIN" or "MANUFACTURED IN" statements
  const precautionaryStatements: string[] = [];
  const mayContainMatch = trimmed.match(/(?:MAY\s*CONTAIN|PRODUCED\s*IN\s*A\s*FACILITY|MADE\s*ON\s*SHARED\s*EQUIPMENT)[^\n\.]+/gi);
  if (mayContainMatch) {
    for (const statement of mayContainMatch) {
      precautionaryStatements.push(statement.trim().replace(/[\.\*]$/, ''));
    }
  }

  // 3. Isolate Ingredients Block
  let ingredientsText = '';
  const ingHeaderMatch = trimmed.match(/(?:INGREDIENTS|COMPOSITION|CONTENTS)\s*[:\-]?\s*([\s\S]+?)(?=(?:\n\s*(?:CONTAINS|MAY\s*CONTAIN|DISTRIBUTED|MANUFACTURED|NUTRITION\s*FACTS)|$))/i);

  if (ingHeaderMatch && ingHeaderMatch[1]) {
    ingredientsText = ingHeaderMatch[1].trim();
  } else {
    // If no explicit header, search for the longest comma-dense line
    const commaLines = lines.filter((line) => line.includes(',') && line.length > 20);
    if (commaLines.length > 0) {
      ingredientsText = commaLines.join(' ');
    } else {
      ingredientsText = trimmed;
    }
  }

  // Strip out "Contains:..." block if it got captured inside ingredients
  ingredientsText = ingredientsText
    .replace(/(?:CONTAINS|ALLERGEN\s*INFO)\s*[:\-][^\n\.;]+/i, '')
    .replace(/(?:MAY\s*CONTAIN|PRODUCED\s*IN\s*A\s*FACILITY)[^\n\.]+/i, '')
    .trim();

  const parsedIngredients = parseIngredientsText(ingredientsText, 'package_scan');
  const extractedIngredients = parsedIngredients.map((ing) => ing.rawName);

  if (extractedIngredients.length === 0) {
    legibilityIssues.push('Could not confidently separate distinct ingredients from the text.');
    uncertainFields.push('Ingredients');
  }

  // 4. Candidate Product Name (usually early non-ingredient header)
  let productName: string | null = null;
  for (const line of lines) {
    if (
      !line.toLowerCase().startsWith('ingredient') &&
      !line.toLowerCase().startsWith('nutrition') &&
      !line.toLowerCase().startsWith('contains') &&
      line.length > 2 &&
      line.length < 60
    ) {
      productName = line.replace(/^[#\*\-]\s*/, '').trim();
      break;
    }
  }

  if (!productName) {
    uncertainFields.push('Product Name');
  }

  // 5. Serving Size & Nutrition Facts if visible on package
  let servingSize: string | null = null;
  const servingMatch = trimmed.match(/serving\s*size\s*[:\-]?\s*([^\n\.;]+)/i);
  if (servingMatch && servingMatch[1]) {
    servingSize = servingMatch[1].trim();
  }

  const caloriesMatch = trimmed.match(/(?:calories|energy)\s*[:\-]?\s*(\d+)/i);
  const fatMatch = trimmed.match(/(?:total\s*fat|fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const sodiumMatch = trimmed.match(/sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg/i);
  const carbsMatch = trimmed.match(/(?:total\s*carbohydrate|total\s*carbs|carbohydrate)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const sugarsMatch = trimmed.match(/(?:total\s*sugars|sugars)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  const proteinMatch = trimmed.match(/protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);

  let nutritionFacts: NutritionFacts | null = null;
  if (caloriesMatch || fatMatch || sodiumMatch || carbsMatch || proteinMatch) {
    nutritionFacts = {
      servingSize: servingSize || undefined,
      calories: caloriesMatch ? parseInt(caloriesMatch[1], 10) : undefined,
      totalFat: fatMatch ? parseFloat(fatMatch[1]) : undefined,
      sodium: sodiumMatch ? parseFloat(sodiumMatch[1]) : undefined,
      totalCarbohydrates: carbsMatch ? parseFloat(carbsMatch[1]) : undefined,
      totalSugars: sugarsMatch ? parseFloat(sugarsMatch[1]) : undefined,
      protein: proteinMatch ? parseFloat(proteinMatch[1]) : undefined
    };
  } else {
    uncertainFields.push('Nutrition Facts');
  }

  // 6. Manufacturer statement
  let manufacturer: string | null = null;
  const mfgMatch = trimmed.match(/(?:distributed\s*by|manufactured\s*by|packed\s*for)\s*[:\-]?\s*([^\n\.;]+)/i);
  if (mfgMatch && mfgMatch[1]) {
    manufacturer = mfgMatch[1].trim();
  }

  return {
    productName,
    rawText,
    extractedIngredients,
    declaredAllergens,
    precautionaryStatements,
    nutritionFacts,
    servingSize,
    manufacturer,
    legibilityIssues,
    uncertainFields,
    ocrConfidence
  };
}

/**
 * Converts a LabelExtractionResult into a structured ProductRecord.
 */
export function extractionToProductRecord(
  extraction: LabelExtractionResult,
  imageUrl?: string,
  fallbackName?: string
): import('../types/index.ts').ProductRecord {
  const name = extraction.productName || fallbackName || 'Scanned Food Product';
  const rawIngredientsText = extraction.extractedIngredients.join(', ');
  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    brand: extraction.manufacturer || undefined,
    imageUrl,
    sourceType: imageUrl ? 'package_scan' : 'manual_entry',
    dataCompleteness: extraction.extractedIngredients.length > 2 ? 'Moderate' : 'Partial',
    lastUpdated: new Date().toISOString().split('T')[0],
    ingredientsText: rawIngredientsText,
    ingredientsList: extraction.extractedIngredients.map((ing, i) => ({
      id: `ing-${i}-${ing.slice(0, 10)}`,
      rawName: ing,
      normalizedName: ing.toLowerCase().trim(),
      provenance: imageUrl ? 'Read from package' : 'Not verified'
    })),
    declaredAllergens: extraction.declaredAllergens,
    precautionaryStatements: extraction.precautionaryStatements,
    servingSize: extraction.servingSize || undefined,
    nutritionFacts: extraction.nutritionFacts || undefined,
    sources: [
      {
        title: imageUrl ? 'Package Label Photo Scan' : 'User-Entered Package Label Text',
        publisher: 'LabelLens In-Browser Reader',
        url: typeof window !== 'undefined' ? window.location.href : '',
        relevantPassage: 'Read directly from package photo or typed ingredients list.',
        retrievalDate: new Date().toISOString().split('T')[0],
        sourceType: 'package_label'
      }
    ],
    limitations: [
      'Text was read from a photo or entered manually.',
      'Always double-check spelling against the physical box in your hands.'
    ],
    isDemo: false
  };
}

