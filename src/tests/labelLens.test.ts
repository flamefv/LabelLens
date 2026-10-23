/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLabelText } from '../services/labelParser.ts';
import { parseIngredientsText } from '../services/openFoodFacts.ts';
import { findCuratedIngredient, normalizeIngredientName } from '../services/curatedEvidence.ts';
import { evaluateDietaryRule, DEFAULT_DIETARY_RULES } from '../services/dietaryEngine.ts';
import { compareProducts } from '../services/comparisonEngine.ts';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { ProductRecord } from '../types/index.ts';

test('normalizeIngredientName handles casing, punctuation, and extra whitespace', () => {
  assert.equal(normalizeIngredientName('  Soy Lecithin (E322)!  '), 'soy lecithin e322');
  assert.equal(normalizeIngredientName('Maltodextrin*'), 'maltodextrin');
  assert.equal(normalizeIngredientName('RED #40'), 'red 40');
});

test('parseIngredientsText separates comma-delimited tokens while respecting nested parentheses', () => {
  const raw = 'Enriched flour (wheat flour, niacin, reduced iron, thiamine mononitrate), sugar, palm oil, salt.';
  const items = parseIngredientsText(raw, 'package_scan');
  assert.equal(items.length, 4);
  assert.equal(items[0].rawName, 'Enriched flour (wheat flour, niacin, reduced iron, thiamine mononitrate)');
  assert.equal(items[1].rawName, 'sugar');
  assert.equal(items[2].rawName, 'palm oil');
  assert.equal(items[3].rawName, 'salt');
});

test('findCuratedIngredient matches exact names, synonyms, and variations', () => {
  const maltodextrin = findCuratedIngredient('maltodextrin');
  assert.ok(maltodextrin);
  assert.equal(maltodextrin?.name, 'Maltodextrin');
  assert.equal(maltodextrin?.evidenceStatus, 'Authoritative Regulatory Consensus');
  assert.ok(maltodextrin?.sources.length && maltodextrin.sources[0].url.includes('ecfr.gov'));

  // Match synonym: E407 for Carrageenan
  const carrageenan = findCuratedIngredient('E407');
  assert.ok(carrageenan);
  assert.equal(carrageenan?.name, 'Carrageenan');

  // Match unknown returns null without fabricating facts
  const unknown = findCuratedIngredient('SuperMiracleExtract999');
  assert.equal(unknown, null);
});

test('parseLabelText extracts declared allergens, precautionary statements, and flags legibility issues', () => {
  const mockLabel = `
    Crispy Almond Biscotti
    INGREDIENTS: Wheat flour, sugar, almonds, eggs, butter, sea salt.
    CONTAINS: WHEAT, ALMONDS, EGGS, MILK.
    MAY CONTAIN: PEANUTS, SOY.
    SERVING SIZE: 1 piece (30g)
    CALORIES: 140
  `;

  const parsed = parseLabelText(mockLabel);
  assert.equal(parsed.productName, 'Crispy Almond Biscotti');
  assert.ok(parsed.declaredAllergens.includes('WHEAT'));
  assert.ok(parsed.declaredAllergens.includes('ALMONDS'));
  assert.ok(parsed.declaredAllergens.includes('EGGS'));
  assert.ok(parsed.declaredAllergens.includes('MILK'));
  assert.ok(parsed.precautionaryStatements.length > 0);
  assert.equal(parsed.servingSize, '1 piece (30g)');
  assert.equal(parsed.nutritionFacts?.calories, 140);
});

test('parseLabelText transparently marks empty or garbled OCR text as uncertain', () => {
  const emptyParsed = parseLabelText('');
  assert.ok(emptyParsed.uncertainFields.includes('Product Name'));
  assert.ok(emptyParsed.uncertainFields.includes('Ingredients'));
  assert.ok(emptyParsed.legibilityIssues.length > 0);
});

test('evaluateDietaryRule correctly assigns CONFIRMED_MATCH, POSSIBLE_MATCH, and NO_MATCH_FOUND', () => {
  const milkRule = DEFAULT_DIETARY_RULES.find((r) => r.id === 'allergen-milk')!;
  const sesameRule = DEFAULT_DIETARY_RULES.find((r) => r.id === 'allergen-sesame')!;
  const veganRule = DEFAULT_DIETARY_RULES.find((r) => r.id === 'diet-vegan')!;

  const sesameGranola = SAMPLE_SCENARIOS.find((s) => s.id === 'demo-sesame-granola')!;

  // 1. Confirmed Match for Sesame
  const sesameEval = evaluateDietaryRule(sesameRule, sesameGranola);
  assert.equal(sesameEval.matchLevel, 'CONFIRMED_MATCH');
  assert.ok(sesameEval.triggerPhrases.some((t) => t.toLowerCase().includes('sesame')));

  // 2. Possible Match for Milk (Precautionary statement on granola: "May contain traces of peanuts and milk")
  const milkEval = evaluateDietaryRule(milkRule, sesameGranola);
  assert.equal(milkEval.matchLevel, 'POSSIBLE_MATCH');
  assert.ok(milkEval.triggerPhrases.some((t) => t.toLowerCase().includes('milk')));

  // 3. Oat Milk (demo-oat-milk) should NOT match sesame
  const oatMilk = SAMPLE_SCENARIOS.find((s) => s.id === 'demo-oat-milk')!;
  const oatSesameEval = evaluateDietaryRule(sesameRule, oatMilk);
  assert.equal(oatSesameEval.matchLevel, 'NO_MATCH_FOUND');
});

test('evaluateDietaryRule handles incomplete or missing ingredient records with INSUFFICIENT_INFO', () => {
  const milkRule = DEFAULT_DIETARY_RULES.find((r) => r.id === 'allergen-milk')!;
  const emptyProduct: ProductRecord = {
    id: 'empty-1',
    name: 'Blank Record Product',
    sourceType: 'manual_entry',
    dataCompleteness: 'Minimal',
    ingredientsText: '',
    ingredientsList: [],
    declaredAllergens: [],
    precautionaryStatements: [],
    sources: [],
    limitations: []
  };

  const evalResult = evaluateDietaryRule(milkRule, emptyProduct);
  assert.equal(evalResult.matchLevel, 'INSUFFICIENT_INFO');
});

test('compareProducts calculates exact ingredient diff and highlights serving-size variance', () => {
  const oatMilk = SAMPLE_SCENARIOS[0]; // Barista Oat Milk (240 mL serving)
  const sourdough = SAMPLE_SCENARIOS[4]; // Sourdough Loaf (50 g slice)

  const comparison = compareProducts(oatMilk, sourdough, DEFAULT_DIETARY_RULES);

  assert.ok(comparison.uniqueToProductA.length > 0);
  assert.ok(comparison.uniqueToProductB.length > 0);
  assert.ok(comparison.missingDataNotes.some((n) => n.toLowerCase().includes('serving sizes differ')));
});

test('every curated ingredient source URL is a valid https URL', () => {
  const curated = SAMPLE_SCENARIOS.flatMap((s) => s.sources);
  for (const src of curated) {
    assert.ok(src.url.startsWith('https://'), `Source URL ${src.url} must start with https://`);
    assert.ok(src.title.length > 3, 'Source must have title');
    assert.ok(src.relevantPassage.length > 5, 'Source must have relevant statutory passage');
  }
});
