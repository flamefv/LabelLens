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

test('searchFoodCatalog returns multiple Cheerios brand varieties for "cheerios"', async () => {
  const { searchFoodCatalog, catalogItemToProductRecord } = await import('../data/foodCatalog.ts');
  const cheeriosMatches = searchFoodCatalog('cheerios');

  // Verify multiple varieties are returned, not just 1
  assert.ok(cheeriosMatches.length >= 7, `Expected at least 7 Cheerios varieties, got ${cheeriosMatches.length}`);

  // Verify specific popular varieties exist
  const names = cheeriosMatches.map((c) => c.name.toLowerCase());
  assert.ok(names.some((n) => n.includes('honey nut')), 'Must include Honey Nut Cheerios');
  assert.ok(names.some((n) => n.includes('toasted whole grain') || n.includes('original')), 'Must include Original Cheerios');
  assert.ok(names.some((n) => n.includes('multi-grain')), 'Must include Multi-Grain Cheerios');
  assert.ok(names.some((n) => n.includes('apple cinnamon')), 'Must include Apple Cinnamon Cheerios');
  assert.ok(names.some((n) => n.includes('purely o’s') || n.includes('purely os')), 'Must include Cascadian Farm Purely Os');

  // Verify conversion to ProductRecord is valid
  const firstRecord = catalogItemToProductRecord(cheeriosMatches[0]);
  assert.equal(firstRecord.dataCompleteness, 'High');
  assert.ok(firstRecord.ingredientsList.length > 0);
  assert.ok(firstRecord.nutritionFacts?.calories);
});

test('searchFoodCatalog supports category filtering and plant milk varieties', async () => {
  const { searchFoodCatalog } = await import('../data/foodCatalog.ts');

  const cereals = searchFoodCatalog('', 'Cereals & Breakfast');
  assert.ok(cereals.length >= 10, 'Expected at least 10 items in Cereals & Breakfast category');

  const milks = searchFoodCatalog('oat', 'Plant & Dairy Milks');
  assert.ok(milks.length >= 3, 'Expected multiple oat milk brand options (Oatly, Planet Oat, Chobani)');
  const brands = milks.map((m) => m.brand.toLowerCase());
  assert.ok(brands.some((b) => b.includes('oatly')), 'Must include Oatly');
  assert.ok(brands.some((b) => b.includes('planet oat')), 'Must include Planet Oat');
});

test('searchOpenFoodFactsPaged retrieves live products directly from Open Food Facts API', async () => {
  const { searchOpenFoodFactsPaged } = await import('../services/openFoodFacts.ts');
  const res = await searchOpenFoodFactsPaged('cheerios', 1, 15);

  assert.ok(res.totalCount > 10, `Expected Open Food Facts to report large totalCount for cheerios, got ${res.totalCount}`);
  assert.ok(res.products.length > 0, 'Expected products to be returned from API');
  const first = res.products[0];
  assert.ok(first.code, 'Product must have barcode code');
  assert.ok(first.name.length > 0, 'Product must have name');
});

test('evaluateProductUnderFdaGuidance accurately detects Major 9 allergens under FALCPA and FASTER Act', async () => {
  const { evaluateProductUnderFdaGuidance } = await import('../services/fdaAllergyGuidance.ts');
  const { SAMPLE_SCENARIOS } = await import('../data/sampleScenarios.ts');

  // Test Sesame detection on sesame granola under FASTER Act
  const granola = SAMPLE_SCENARIOS.find((s) => s.id === 'demo-sesame-granola')!;
  const report = evaluateProductUnderFdaGuidance(granola);

  assert.equal(report.hasAllergens, true);
  const detectedKeys = report.detectedMajorAllergens.map((d) => d.allergenKey);
  assert.ok(detectedKeys.includes('sesame'), 'Must detect Sesame allergen');
  assert.ok(detectedKeys.includes('tree_nuts'), 'Must detect Tree Nuts (Almonds) allergen');
  assert.ok(detectedKeys.includes('peanuts'), 'Must detect precautionary Peanuts advisory');
  assert.ok(detectedKeys.includes('milk'), 'Must detect precautionary Milk advisory');

  const sesameItem = report.detectedMajorAllergens.find((d) => d.allergenKey === 'sesame')!;
  assert.ok(sesameItem.statutoryBasis.includes('FASTER Act'), 'Must cite FASTER Act for sesame');

  // Test Precautionary advisory statement
  assert.equal(report.precautionaryAnalysis.hasAdvisory, true);
  assert.ok(report.precautionaryAnalysis.fdaGuidanceStance.includes('cGMPs'));

  // Oat milk has voluntary facility advisory for almonds, soy, and dairy
  const oatMilk = SAMPLE_SCENARIOS.find((s) => s.id === 'demo-oat-milk')!;
  const oatReport = evaluateProductUnderFdaGuidance(oatMilk);
  assert.equal(oatReport.precautionaryAnalysis.hasAdvisory, true);
  const oatAdvisoryKeys = oatReport.detectedMajorAllergens
    .filter((d) => d.detectionMethod === 'Advisory statement')
    .map((d) => d.allergenKey);
  assert.ok(oatAdvisoryKeys.includes('tree_nuts'), 'Must detect advisory almonds');
  assert.ok(oatAdvisoryKeys.includes('soybeans'), 'Must detect advisory soy');
  assert.ok(oatAdvisoryKeys.includes('milk'), 'Must detect advisory dairy');

  // Diet soda has zero Major 9 allergens (only phenylketonurics warning)
  const dietSoda = SAMPLE_SCENARIOS.find((s) => s.id === 'demo-diet-soda')!;
  const sodaReport = evaluateProductUnderFdaGuidance(dietSoda);
  assert.equal(sodaReport.hasAllergens, false, 'Diet soda must have zero Major 9 allergens');
});

test('USDA FoodData Central standard benchmarks and nutrient comparison resolve properly', async () => {
  const {
    findUsdaStandardBenchmark,
    usdaItemToProductRecord,
    compareNutrientsWithUsda,
    usdaItemToNutrition
  } = await import('../services/usdaFoodData.ts');

  const cheeriosBenchmark = findUsdaStandardBenchmark('Honey Nut Cheerios Cereal');
  assert.ok(cheeriosBenchmark, 'Must find USDA benchmark for Cheerios');
  assert.equal(cheeriosBenchmark?.fdcId, 171689);
  assert.equal(cheeriosBenchmark?.dataType, 'SR Legacy');

  const productRecord = usdaItemToProductRecord(cheeriosBenchmark!);
  assert.equal(productRecord.sourceType, 'usda_fdc');
  assert.ok(productRecord.sources.some((s) => s.url.includes('fdc.nal.usda.gov')));

  const oatBenchmark = findUsdaStandardBenchmark('Rolled Oats');
  assert.ok(oatBenchmark);
  assert.equal(oatBenchmark?.dataType, 'Foundation Food');

  const usdaNut = usdaItemToNutrition(oatBenchmark!);
  assert.ok(usdaNut.calories && usdaNut.calories > 300);
  assert.ok(usdaNut.protein && usdaNut.protein > 10);

  // Compare package nutrition against USDA baseline
  const packageNutrition = {
    calories: 400,
    protein: 10,
    totalFat: 5,
    sodium: 250 // Much higher sodium than base rolled oats
  };

  const diffs = compareNutrientsWithUsda(packageNutrition, usdaNut);
  const sodiumDiff = diffs.find((d) => d.metric === 'Sodium');
  assert.ok(sodiumDiff);
  assert.equal(sodiumDiff?.isHigherInProduct, true);
  assert.ok(sodiumDiff?.varianceNote?.includes('higher than USDA standard benchmark'));
});



