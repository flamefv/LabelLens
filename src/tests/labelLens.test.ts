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

test('searchUnified retrieves and normalizes results from multiple sources simultaneously without database toggling', async () => {
  const { searchUnified } = await import('../services/unifiedSearch.ts');

  // Search for a common food term present in both packaged goods and USDA reference data
  const res = await searchUnified('oat', 'All', 20);

  assert.ok(res.results.length > 0, 'Expected search results for "oat"');
  assert.ok(res.totalResults > 0, 'Expected positive totalResults count');

  // Verify multiple sources are represented
  const sources = new Set(res.results.map((r) => r.source));
  assert.ok(sources.has('catalog') || sources.has('open_food_facts'), 'Should include packaged food records');
  assert.ok(sources.has('usda_fdc'), 'Should include USDA FoodData Central analytical records');

  // Verify that each result clearly preserves its source label and source identifier
  const usdaItem = res.results.find((r) => r.source === 'usda_fdc');
  assert.ok(usdaItem, 'Must find USDA item');
  assert.equal(usdaItem?.sourceLabel, 'USDA FoodData Central');
  assert.ok(usdaItem?.sourceIdentifier.startsWith('FDC ID:'), 'USDA item must identify FDC ID');

  const packagedItem = res.results.find((r) => r.source === 'open_food_facts' || r.source === 'catalog');
  assert.ok(packagedItem, 'Must find packaged food item');
  assert.ok(packagedItem?.sourceIdentifier.startsWith('UPC:'), 'Packaged item must identify UPC');
});

test('searchUnified preserves source separation and never merges different database records', async () => {
  const { searchUnified } = await import('../services/unifiedSearch.ts');

  const res = await searchUnified('cheerios', 'All', 20);
  const cheeriosItems = res.results.filter((r) => r.name.toLowerCase().includes('cheerio'));

  // Should have distinct records: USDA analytical standard and commercial branded products
  const usdaCheerios = cheeriosItems.find((r) => r.source === 'usda_fdc');
  const packagedCheerios = cheeriosItems.find((r) => r.source === 'catalog' || r.source === 'open_food_facts');

  assert.ok(usdaCheerios, 'Must contain USDA analytical Cheerios standard');
  assert.ok(packagedCheerios, 'Must contain packaged commercial Cheerios');

  // Ensure they remain separate objects with different IDs and different sources
  assert.notEqual(usdaCheerios?.id, packagedCheerios?.id);
  assert.notEqual(usdaCheerios?.source, packagedCheerios?.source);
  assert.notEqual(usdaCheerios?.sourceIdentifier, packagedCheerios?.sourceIdentifier);
});

test('searchUnified handles empty queries, whitespace, and queries with no matches gracefully', async () => {
  const { searchUnified } = await import('../services/unifiedSearch.ts');

  // 1. Empty query
  const emptyRes = await searchUnified('', 'All');
  assert.equal(emptyRes.results.length, 0);
  assert.equal(emptyRes.totalResults, 0);

  // 2. Whitespace only
  const spaceRes = await searchUnified('   ', 'All');
  assert.equal(spaceRes.results.length, 0);

  // 3. Single character query
  const singleRes = await searchUnified('x', 'All');
  assert.equal(singleRes.results.length, 0);

  // 4. Nonsense query that yields no matches
  const nonsenseRes = await searchUnified('xyzqkj789nonexistentfood123', 'All');
  assert.equal(nonsenseRes.results.length, 0);
  assert.equal(nonsenseRes.totalResults, 0);
  assert.equal(typeof nonsenseRes.partialFailures, 'object');
});

test('fetchUnifiedProductById resolves USDA FDC IDs, barcodes, catalog items, and demo scenarios correctly', async () => {
  const { fetchUnifiedProductById } = await import('../services/unifiedSearch.ts');

  // 1. USDA ID resolution
  const usdaRecord = await fetchUnifiedProductById('usda-171689');
  assert.ok(usdaRecord, 'Must resolve USDA record for FDC 171689 (Cheerios)');
  assert.equal(usdaRecord?.sourceType, 'usda_fdc');
  assert.ok(usdaRecord?.sources.some((s) => s.url.includes('fdc.nal.usda.gov')));
  assert.ok(usdaRecord?.nutritionFacts?.calories);

  // 2. Demo scenario ID resolution
  const scenarioRecord = await fetchUnifiedProductById('demo-oat-milk');
  assert.ok(scenarioRecord, 'Must resolve demo-oat-milk scenario');
  assert.equal(scenarioRecord?.name, 'Barista Edition Oat Milk');

  // 3. Catalog ID resolution
  const catalogRecord = await fetchUnifiedProductById('cat-cereal-honey-nut-cheerios');
  assert.ok(catalogRecord, 'Must resolve catalog item');
  assert.equal(catalogRecord?.barcode, '016000275287');

  // 4. Barcode resolution
  const barcodeRecord = await fetchUnifiedProductById('016000275287');
  assert.ok(barcodeRecord, 'Must resolve product by UPC barcode');
  assert.equal(barcodeRecord?.barcode, '016000275287');
});

test('resolveUnifiedProductRecord creates complete ProductRecord without fabricating missing values', async () => {
  const { searchUnified, resolveUnifiedProductRecord } = await import('../services/unifiedSearch.ts');

  const searchRes = await searchUnified('oat', 'All', 10);
  assert.ok(searchRes.results.length > 0);

  const firstResult = searchRes.results[0];
  const fullRecord = await resolveUnifiedProductRecord(firstResult);

  assert.ok(fullRecord, 'Must resolve to a valid ProductRecord');
  assert.ok(fullRecord?.name, 'Product must have name');
  assert.ok(fullRecord?.sourceType, 'Product must have sourceType');
  assert.ok(Array.isArray(fullRecord?.sources), 'Product must have sources array');
  assert.ok(Array.isArray(fullRecord?.limitations), 'Product must have limitations array');
});

test('normalizeOffSearchResult accurately reflects real data availability indicators and never infers ingredients from categories or serving size', async () => {
  const { normalizeOffSearchResult } = await import('../services/unifiedSearch.ts');

  // Case 1: Item has categories and serving size, but NO ingredients text
  const itemWithoutIngredients = {
    code: '1234567890',
    name: 'Test Cereal',
    categories: 'Breakfast cereals, Cereals and potatoes',
    servingSize: '30 g',
    calories: 120,
    sourceType: 'open_food_facts' as const
  };

  const normalized1 = normalizeOffSearchResult(itemWithoutIngredients);
  // Must NOT infer ingredients just because categories or servingSize exist
  assert.notEqual(normalized1.availableData.hasIngredients, true, 'Must not mark ingredients available based on categories or servingSize');
  assert.equal(normalized1.availableData.hasIngredients, 'unverified', 'Must represent unverified ingredients status honestly');
  assert.equal(normalized1.availableData.hasNutrition, true, 'Nutrition is available because calories are provided');
  assert.equal(normalized1.availableData.hasAllergens, 'unverified', 'Must not assume allergens without declaration');
  assert.equal(normalized1.availableData.hasImage, false, 'No image URL provided');

  // Case 2: Item with explicit ingredients and declared allergens
  const itemWithFullData = {
    code: '9876543210',
    name: 'Organic Granola',
    ingredientsText: 'Rolled oats, maple syrup, almonds, pumpkin seeds.',
    allergensTags: ['en:almonds'],
    calories: 210,
    imageUrl: 'https://images.openfoodfacts.org/images/products/987/front.jpg',
    sourceType: 'open_food_facts' as const
  };

  const normalized2 = normalizeOffSearchResult(itemWithFullData);
  assert.equal(normalized2.availableData.hasIngredients, true, 'Ingredients must be marked available');
  assert.equal(normalized2.availableData.hasNutrition, true, 'Nutrition must be marked available');
  assert.equal(normalized2.availableData.hasAllergens, true, 'Allergens must be marked available');
  assert.equal(normalized2.availableData.hasImage, true, 'Image must be marked available');
  assert.ok(normalized2.ingredientPreview?.includes('Rolled oats'), 'Must generate ingredient preview');

  // Case 3: Item with empty ingredients string
  const itemWithEmptyIngredients = {
    code: '5555555555',
    name: 'Mystery Product',
    ingredientsText: '   ',
    sourceType: 'open_food_facts' as const
  };
  const normalized3 = normalizeOffSearchResult(itemWithEmptyIngredients);
  assert.equal(normalized3.availableData.hasIngredients, false, 'Empty ingredients string must be marked false, not true');
});

test('searchUnified with barcode handles formatted input, queries directly without USDA text search, and returns no placeholders for missing barcodes', async () => {
  const { searchUnified } = await import('../services/unifiedSearch.ts');

  // 1. Formatted barcode query (with dashes)
  const formattedBarcode = '0-16000-27528-7'; // Honey Nut Cheerios in local catalog
  const res = await searchUnified(formattedBarcode, 'All');

  assert.equal(res.isBarcodeMatch, true, 'Must recognize numeric barcode with dashes');
  assert.equal(res.sourceCounts.usdaFoodData, 0, 'USDA must NOT be queried with numeric barcode as food name');
  assert.ok(res.results.length > 0, 'Must find matching record');
  const found = res.results[0];
  assert.equal(found.barcode, '016000275287', 'Normalized barcode must match clean digits');
  assert.notEqual(found.source, 'direct_barcode', 'Must return actual record, not generic placeholder');

  // 2. Barcode that does not exist in any database
  const nonExistentBarcode = '99999999999999';
  const missingRes = await searchUnified(nonExistentBarcode, 'All');

  assert.equal(missingRes.isBarcodeMatch, true);
  assert.equal(missingRes.totalResults, 0, 'Must return 0 totalResults for missing barcode');
  assert.equal(missingRes.results.length, 0, 'Must not return synthetic placeholder as though it were confirmed');
  assert.equal(missingRes.sourceCounts.usdaFoodData, 0, 'Must not query USDA for missing barcode');
});

test('searchUnified computes honest result counts without summing unretrieved remote server totals', async () => {
  const { searchUnified } = await import('../services/unifiedSearch.ts');

  const res = await searchUnified('oat', 'All', 20);

  // totalResults must equal the count of distinct results currently loaded and displayed
  assert.equal(res.totalResults, res.results.length, 'totalResults must equal number of loaded results');
  assert.equal(res.displayedCount, res.results.length, 'displayedCount must equal results.length');

  // Remote reported total should be tracked separately without inflating totalResults
  if (res.sourceCounts.openFoodFactsReportedTotal !== undefined) {
    assert.ok(
      res.sourceCounts.openFoodFactsReportedTotal >= res.sourceCounts.openFoodFacts,
      'Reported remote total must be tracked separately'
    );
  }
});

test('resolveUnifiedProductRecord updates availability indicators and preview when full record is resolved', async () => {
  const { normalizeOffSearchResult, resolveUnifiedProductRecord } = await import('../services/unifiedSearch.ts');

  // Start with an unverified search result item
  const initialItem = normalizeOffSearchResult({
    code: '016000275287',
    name: 'Honey Nut Cheerios',
    sourceType: 'open_food_facts' as const
  });

  assert.equal(initialItem.availableData.hasIngredients, 'unverified');

  const resolved = await resolveUnifiedProductRecord(initialItem);
  assert.ok(resolved, 'Must resolve Honey Nut Cheerios');

  // Verify that initialItem has had its availability indicators updated
  assert.equal(initialItem.availableData.hasIngredients, true, 'Must update hasIngredients to true upon resolving');
  assert.equal(initialItem.availableData.hasNutrition, true, 'Must update hasNutrition to true upon resolving');
  assert.ok(initialItem.ingredientPreview?.length, 'Must populate ingredientPreview upon resolving');
});




