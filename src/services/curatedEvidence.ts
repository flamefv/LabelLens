/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CuratedIngredientRecord } from '../types/index.ts';

/**
 * Curated, verified repository of food ingredients and additives.
 * Explained in clear, everyday language with direct official links to U.S. FDA regulations.
 */
export const CURATED_INGREDIENTS: CuratedIngredientRecord[] = [
  {
    name: 'Maltodextrin',
    slug: 'maltodextrin',
    synonyms: ['corn maltodextrin', 'tapioca maltodextrin', 'rice maltodextrin', 'wheat maltodextrin'],
    category: 'Starch-Based Food Thickener & Powder Binder',
    plainEnglish:
      'A neutral-tasting powder made by breaking down starches (usually corn). Food makers use it to thicken dressings, make sauces feel smoother, or help powdered seasonings stick and dissolve easily without making the food overly sweet.',
    whatEvidenceEstablishes: [
      'Approved and confirmed safe for general food use by the U.S. FDA (21 CFR 184.1444).',
      'Digests rapidly in the stomach and small intestine, causing blood sugar to rise quickly like regular carbohydrates.',
      'In the United States, commercial maltodextrin is almost always made from corn starch unless the package specifically says tapioca or wheat.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Evidence does NOT show that normal amounts eaten in food damage the stomach lining or harm gut health in healthy people.',
      'Does not contain gluten when derived from corn or tapioca starches.'
    ],
    labelingContext:
      'Must be listed simply as "maltodextrin" on the label. If made from wheat in the US, federal allergen law requires the word "wheat" to be stated.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Maltodextrin (21 CFR § 184.1444)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1444',
        relevantPassage:
          'Maltodextrin is affirmed as generally recognized as safe (GRAS) direct human food ingredient.',
        retrievalDate: '2026-10-15',
        sourceType: 'government_regulation'
      },
      {
        title: 'National Institutes of Health (NIH PubChem): Maltodextrin',
        publisher: 'U.S. National Library of Medicine',
        url: 'https://pubchem.ncbi.nlm.nih.gov/compound/62698',
        relevantPassage:
          'Maltodextrin is a carbohydrate powder derived from hydrolyzed starch consisting of glucose units.',
        retrievalDate: '2026-10-01',
        sourceType: 'scientific_reference'
      }
    ],
    suggestedNextStep:
      'If you monitor blood sugar (for diabetes or keto), treat maltodextrin as a fast-acting carb, even if it is not counted on the "Added Sugars" line.',
    commonIn: ['Powdered seasonings', 'Salad dressings', 'Snack chips', 'Protein powders', 'Energy bars']
  },
  {
    name: 'Carrageenan',
    slug: 'carrageenan',
    synonyms: ['E407', 'irish moss extract', 'red seaweed extract'],
    category: 'Seaweed Extract for Creamy Texture',
    plainEnglish:
      'A natural gel extracted from edible red seaweeds. Food makers use it in plant milks, yogurt, and deli meats to keep liquid smooth, prevent chocolate from settling at the bottom, and create a creamy mouthfeel without extra fat.',
    whatEvidenceEstablishes: [
      'Approved for food use by the U.S. FDA (21 CFR 172.620) and the European Food Safety Authority (EFSA).',
      'Food-grade carrageenan is made from large, intact molecules that pass through the digestive system without breaking down.',
      'A different chemical called degraded carrageenan (poligeenan) causes stomach inflammation in lab tests, but it is strictly banned from human food.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Studies in healthy humans have not proven that normal amounts of food-grade carrageenan cause stomach ulcers, colon disease, or leaky gut.',
      'Most negative headlines came from animal experiments that used massive doses of the banned, degraded type.'
    ],
    labelingContext:
      'Must be clearly identified on the ingredients list as "carrageenan".',
    evidenceStatus: 'Active Regulatory Scrutiny',
    sources: [
      {
        title: 'U.S. FDA Regulation: Carrageenan (21 CFR § 172.620)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-G/section-172.620',
        relevantPassage:
          'The food additive carrageenan may be safely used in food as an emulsifier, stabilizer, or thickener.',
        retrievalDate: '2026-10-10',
        sourceType: 'government_regulation'
      },
      {
        title: 'European Food Safety Authority: Carrageenan Safety Review',
        publisher: 'EFSA Journal',
        url: 'https://www.efsa.europa.eu/en/efsajournal/pub/5238',
        relevantPassage:
          'Food-grade carrageenan specifications set strict limits on low molecular weight fractions to protect digestive safety.',
        retrievalDate: '2026-09-18',
        sourceType: 'scientific_reference'
      }
    ],
    suggestedNextStep:
      'If you have sensitive digestion or Inflammatory Bowel Disease (IBD) and notice stomach discomfort, you can easily find carrageenan-free plant milks on store shelves.',
    commonIn: ['Almond milk', 'Oat milk', 'Cottage cheese', 'Deli turkey', 'Ice cream']
  },
  {
    name: 'Soy Lecithin',
    slug: 'soy-lecithin',
    synonyms: ['lecithin (soy)', 'soya lecithin', 'E322'],
    category: 'Natural Blending Agent (Keeps Oil & Water Mixed)',
    plainEnglish:
      'A natural fat mixture extracted from soybeans. It acts like an anchor that holds oil and water together so they don\'t separate. It gives chocolate a smooth melt and prevents bakery dough from sticking.',
    whatEvidenceEstablishes: [
      'Affirmed as Generally Recognized as Safe by the U.S. FDA (21 CFR 184.1400).',
      'Because it comes from soybeans, it must always be labeled under federal allergy laws.',
      'Contains only tiny trace amounts of soy protein (less than 100 parts per million), making it far less allergenic than whole tofu or soy milk.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Clinical trials show the vast majority of people with soy allergy can eat soy lecithin without allergic reactions, though people with severe anaphylaxis should still be cautious.',
      'Does NOT contain estrogen-like compounds in amounts that affect human hormones.'
    ],
    labelingContext:
      'Federal law requires "Soy" to be declared either in the ingredient list (as "Soy Lecithin") or in a "Contains: Soy" warning.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Lecithin (21 CFR § 184.1400)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1400',
        relevantPassage:
          'Lecithin is affirmed as generally recognized as safe (GRAS) for use in food.',
        retrievalDate: '2026-10-12',
        sourceType: 'government_regulation'
      },
      {
        title: 'U.S. FDA Consumer Guide: Food Allergens',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
        relevantPassage:
          'Soybeans and ingredients containing soy proteins are major food allergens under federal law.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you have a diagnosed soy allergy, check with your allergist. Many people who react to whole soy can safely eat foods with soy lecithin.',
    commonIn: ['Chocolate bars', 'Cookie mixes', 'Cooking spray', 'Wafers', 'Margarine']
  },
  {
    name: 'Xanthan Gum',
    slug: 'xanthan-gum',
    synonyms: ['E415', 'fermented plant gum'],
    category: 'Natural Thickener & Gluten-Free Binder',
    plainEnglish:
      'A natural plant-friendly gum made by fermenting simple sugars with a harmless friendly bacterium. In salad dressings, it keeps herbs suspended. In gluten-free bread, it creates the stretch and chew that normally comes from wheat gluten.',
    whatEvidenceEstablishes: [
      'Approved as safe for food by the U.S. FDA (21 CFR 172.695).',
      'Acts like soluble fiber in your body: your stomach doesn\'t absorb it, so it passes gently through digestion.',
      'Used in very tiny amounts (typically less than a quarter of a teaspoon per whole recipe).'
    ],
    whatEvidenceDoesNotEstablish: [
      'Does not cause toxicity or damage to intestinal walls.',
      'Only massive amounts (like eating 15+ grams at once) cause mild gas, which is true of any dietary fiber.'
    ],
    labelingContext:
      'Must be listed on the label simply as "xanthan gum". Suitable for vegetarian, vegan, and gluten-free diets.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Xanthan Gum (21 CFR § 172.695)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-G/section-172.695',
        relevantPassage:
          'Xanthan gum may be safely used in food as a stabilizer, emulsifier, thickener, and suspending agent.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'Considered one of the safest and most reliable thickeners. Great option for gluten-free baking.',
    commonIn: ['Gluten-free bread', 'Salad dressings', 'Barbecue sauces', 'Syrups', 'Ice cream']
  },
  {
    name: 'Titanium Dioxide',
    slug: 'titanium-dioxide',
    synonyms: ['E171', 'white food color'],
    category: 'Bright White Food Coloring',
    plainEnglish:
      'A mineral powder used to make foods look clean, bright white, or opaque. It\'s used in candies, cake frosting, powdered coffee creamers, and chewing gum so they don\'t look translucent or dull.',
    whatEvidenceEstablishes: [
      'Approved in the US by the FDA (21 CFR 73.575) in amounts up to 1% of the food weight.',
      'In 2022, the European Union banned it in food out of caution regarding whether tiny particles (nanoparticles) could accumulate over decades.',
      'The US FDA reviewed the data in 2023 and found current US eating amounts do not show immediate harm, creating a known difference between US and EU rules.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Has not been proven to directly cause cancer or disease in humans at normal diet levels.',
      'Provides zero vitamins, minerals, or nutritional value—it is strictly for appearance.'
    ],
    labelingContext:
      'Must be listed as "titanium dioxide" or "artificial color" in the ingredient list.',
    evidenceStatus: 'Active Regulatory Scrutiny',
    sources: [
      {
        title: 'U.S. FDA Regulation: Titanium Dioxide (21 CFR § 73.575)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-73/subpart-A/section-73.575',
        relevantPassage:
          'Titanium dioxide may be safely used for coloring foods generally, up to 1 percent by weight.',
        retrievalDate: '2026-10-05',
        sourceType: 'government_regulation'
      },
      {
        title: 'European Food Safety Authority: Titanium Dioxide Review',
        publisher: 'EFSA Journal',
        url: 'https://www.efsa.europa.eu/en/efsajournal/pub/6585',
        relevantPassage:
          'Concerns regarding potential nanoparticle accumulation led European regulators to restrict food usage.',
        retrievalDate: '2026-09-12',
        sourceType: 'scientific_reference'
      }
    ],
    suggestedNextStep:
      'If you prefer to avoid synthetic whitening powders, check ingredient lists for titanium dioxide or choose candies colored with rice starch or calcium.',
    commonIn: ['Chewing gum', 'White frosting', 'Coffee creamers', 'Marshmallows', 'Hard candies']
  },
  {
    name: 'Red 40 (Allura Red)',
    slug: 'red-40',
    synonyms: ['FD&C Red No. 40', 'Allura Red AC', 'E129'],
    category: 'Vivid Red Food Dye',
    plainEnglish:
      'The most popular synthetic red food dye in North America. It provides the bright cherry-red color in fruit snacks, sports drinks, candy, and breakfast cereals.',
    whatEvidenceEstablishes: [
      'Approved and certified by the U.S. FDA (21 CFR 74.340) for food use.',
      'Every commercial batch is tested in FDA labs for purity and heavy metal limits before it can be sold to food manufacturers.',
      'In Europe, foods with Red 40 carry a warning that it "may affect activity and attention in children" based on a British study of food colors and preservatives.',
      'The US FDA evaluated that research and determined that while a small number of children with ADHD may be sensitive to artificial dyes, it does not cause harm to most children.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Scientific evidence has NOT proven that Red 40 causes cancer, DNA damage, or toxic poisoning at standard eating amounts.'
    ],
    labelingContext:
      'Federal law strictly forbids hiding Red 40 under vague names like "artificial color". It must always be named directly: "Red 40" or "FD&C Red No. 40".',
    evidenceStatus: 'Active Regulatory Scrutiny',
    sources: [
      {
        title: 'U.S. FDA Regulation: FD&C Red No. 40 (21 CFR § 74.340)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-74/subpart-A/section-74.340',
        relevantPassage:
          'FD&C Red No. 40 may be safely used for coloring foods generally in amounts consistent with good manufacturing practice.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      },
      {
        title: 'U.S. FDA Consumer Q&A: Food Color Additives',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/food-additives-petitions/color-additives-questions-and-answers-consumers',
        relevantPassage:
          'Certified food colorings must be individually listed on labels by their specific FD&C names.',
        retrievalDate: '2026-10-10',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you notice behavior or focus changes in a child after eating brightly dyed snacks, you can try switching to snacks colored with beet juice or paprika.',
    commonIn: ['Fruit snacks', 'Sports drinks', 'Breakfast cereals', 'Flavored chips', 'Red candies']
  },
  {
    name: 'High Fructose Corn Syrup (HFCS)',
    slug: 'high-fructose-corn-syrup',
    synonyms: ['HFCS', 'corn syrup', 'glucose-fructose syrup', 'isoglucose'],
    category: 'Liquid Corn Sweetener',
    plainEnglish:
      'A liquid sweetener made from corn starch. Part of its natural corn glucose is converted into fructose to make it taste as sweet as regular sugar. It blends smoothly into soft drinks and keeps baked goods soft and moist.',
    whatEvidenceEstablishes: [
      'Approved and affirmed as safe by the U.S. FDA (21 CFR 184.1866).',
      'Nutritionally, it is about 55% fructose and 45% glucose—almost identical to standard table sugar (which is 50% fructose / 50% glucose) and honey.',
      'Eating too much added sugar from any source—whether corn syrup, cane sugar, or honey—increases the risk of weight gain, fatty liver, and diabetes.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Research shows HFCS is NOT uniquely more toxic or more addictive than regular table sugar; both have the same 4 calories per gram and similar impact on the body.',
      'Does not contain high levels of heavy metals in commercial foods.'
    ],
    labelingContext:
      'Must be listed in ingredients as "high fructose corn syrup". All sugars it adds must be counted under "Total Sugars" and "Includes Added Sugars" on the Nutrition panel.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: High Fructose Corn Syrup (21 CFR § 184.1866)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1866',
        relevantPassage:
          'High fructose corn syrup is affirmed as generally recognized as safe for food use.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      },
      {
        title: 'U.S. FDA Consumer Q&A: High Fructose Corn Syrup',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/food-additives-petitions/high-fructose-corn-syrup-questions-and-answers',
        relevantPassage:
          'FDA has seen no evidence of a difference in safety between foods containing HFCS and foods containing similar amounts of table sugar.',
        retrievalDate: '2026-09-29',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'Focus on keeping your overall "Added Sugars" low across the day, rather than stressing over table sugar vs. corn syrup.',
    commonIn: ['Regular sodas', 'Ketchup & BBQ sauce', 'Sweetened sandwich breads', 'Canned peaches', 'Syrups']
  },
  {
    name: 'Monosodium Glutamate (MSG)',
    slug: 'msg',
    synonyms: ['flavor enhancer 621', 'E621', 'sodium glutamate'],
    category: 'Savory Umami Flavor Enhancer',
    plainEnglish:
      'The sodium salt of glutamic acid, a natural amino acid found in parmesan cheese, ripe tomatoes, mushrooms, and breast milk. It triggers the savory "umami" taste buds on your tongue, making broths and meats taste richer.',
    whatEvidenceEstablishes: [
      'Affirmed as Generally Recognized as Safe by the U.S. FDA (21 CFR 182.1).',
      'Your body digests added MSG in the exact same way it digests the natural savory glutamate in an Italian tomato sauce or aged cheddar.',
      'MSG contains only 12% sodium compared to 39% in table salt, meaning it can help lower total sodium in cooking while keeping great flavor.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Extensive double-blind clinical trials have found no proof that MSG causes headaches or flushing in typical meal amounts.',
      'Does not damage brain cells through food consumption; the human blood-brain barrier naturally blocks dietary glutamate.'
    ],
    labelingContext:
      'Must be listed explicitly as "monosodium glutamate". Foods made with ingredients that naturally contain glutamates (like yeast extract) cannot claim "No MSG".',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Consumer Guide: Monosodium Glutamate (MSG)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.fda.gov/food/food-additives-petitions/questions-and-answers-monosodium-glutamate-msg',
        relevantPassage:
          'FDA considers MSG to be generally recognized as safe (GRAS). Double-blind studies have not consistently triggered reactions.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you need to watch your blood pressure, using a pinch of MSG can help cut your total salt use by 25% while maintaining deep savory flavor.',
    commonIn: ['Ramen noodles', 'Flavored potato chips', 'Canned soups', 'Sausages', 'Fried chicken seasoning']
  },
  {
    name: 'Sesame Seed / Sesame Oil',
    slug: 'sesame',
    synonyms: ['tahini', 'sesamum indicum', 'sesame flour', 'sesame paste'],
    category: 'Major Food Allergen (Federal Law)',
    plainEnglish:
      'A flavorful edible seed used whole on breads and crackers, or pressed into aromatic sesame cooking oil and creamy tahini paste for hummus and sauces.',
    whatEvidenceEstablishes: [
      'Officially designated by the U.S. Congress and FDA as the 9th Major Food Allergen under the FASTER Act of 2021 (effective Jan 1, 2023).',
      'Can cause severe, life-threatening allergic reactions (anaphylaxis) even from tiny crumbs or trace contamination in sensitive people.',
      'Unlike refined soy or peanut oil, sesame oil is usually unrefined and retains strong allergen proteins.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Does NOT mean a food made before 2023 was sesame-free if it listed "spices" or "natural flavors"; current products must declare sesame explicitly.'
    ],
    labelingContext:
      'Federal law requires sesame to be explicitly listed on all packages either in the ingredients list or under "Contains: Sesame". It can no longer be hidden under "spices" or "natural flavors".',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA: FASTER Act (Mandatory Sesame Allergen Labeling)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
        relevantPassage:
          'Sesame joined the list of major food allergens on January 1, 2023 under the FASTER Act. It must be explicitly declared on food labels.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you have a sesame allergy, always read both the "Contains:" box and the full ingredient list on burger buns, bagels, and crackers, as some bakeries recently added sesame flour.',
    commonIn: ['Hummus', 'Hamburger buns', 'Bagels', 'Tahini', 'Asian sauces', 'Granola bars']
  },
  {
    name: 'Potassium Sorbate',
    slug: 'potassium-sorbate',
    synonyms: ['E202', 'sorbic acid salt'],
    category: 'Gentle Mold & Freshness Preservative',
    plainEnglish:
      'A food-grade salt that stops mold, yeast, and fungus from spoiling food. It allows yogurts, dried fruits, and cheeses to stay fresh and safe on your shelves without changing their taste.',
    whatEvidenceEstablishes: [
      'Confirmed safe by the U.S. FDA (21 CFR 182.3640).',
      'Breaks down in your body cleanly into water and carbon dioxide, exactly like the natural fats in olive oil or nuts.',
      'Widely used worldwide with a long safety record stretching back over 70 years.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Does not build up in human tissues or organs.',
      'Extremely rare to cause allergic reactions when eaten in foods.'
    ],
    labelingContext:
      'Must be listed with its common name and purpose, such as "potassium sorbate to preserve freshness" or "potassium sorbate as a preservative".',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Potassium Sorbate (21 CFR § 182.3640)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-182/subpart-D/section-182.3640',
        relevantPassage:
          'Potassium sorbate is generally recognized as safe when used in food as a preservative.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'Safe for virtually all dietary lifestyles including vegan, gluten-free, and kosher/halal. No need to avoid unless advised by a doctor.',
    commonIn: ['Cheese', 'Yogurt drinks', 'Dried fruits', 'Apple cider', 'Wine', 'Tortillas']
  },
  {
    name: 'Dipotassium Phosphate',
    slug: 'dipotassium-phosphate',
    synonyms: ['potassium phosphate', 'E340', 'DKP'],
    category: 'Coffee & Plant Milk Acidity Regulator',
    plainEnglish:
      'A food mineral salt. In barista oat milk, almond milk, and coffee creamers, it balances the acidity so your plant milk won\'t curdle or separate into clumps when you pour it into hot, acidic coffee.',
    whatEvidenceEstablishes: [
      'Confirmed Generally Recognized as Safe by the U.S. FDA (21 CFR 184.1634).',
      'Provides small amounts of potassium and phosphorus minerals.',
      'In people with healthy kidneys, dietary food phosphates are processed and filtered without trouble.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Does not cause kidney damage in people with normal renal health.',
      'In individuals with advanced Chronic Kidney Disease (CKD), doctors recommend limiting inorganic phosphate additives.'
    ],
    labelingContext:
      'Must be named as "dipotassium phosphate" on the ingredient list.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Potassium Phosphate (21 CFR § 184.1634)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1634',
        relevantPassage:
          'Potassium phosphate is affirmed as generally recognized as safe as a direct food ingredient.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you have chronic kidney disease on a strict phosphorus restriction, choose non-barista plant milks that don\'t add phosphate salts.',
    commonIn: ['Barista blend oat milk', 'Powdered coffee creamers', 'Evaporated milk', 'Processed cheese']
  },
  {
    name: 'Gellan Gum',
    slug: 'gellan-gum',
    synonyms: ['E418', 'plant-based gelling gum'],
    category: 'Plant Milk Fiber Stabilizer',
    plainEnglish:
      'A natural plant-friendly fiber made by fermenting friendly water plants. It forms a gentle invisible net in oat and almond milks that keeps added calcium and vitamins suspended in the liquid so they don\'t sink to the bottom of the carton.',
    whatEvidenceEstablishes: [
      'Approved for food use by the U.S. FDA (21 CFR 172.665).',
      'Works in very tiny pinches (less than 0.05% of the bottle), adding suspension without making the drink taste thick or gummy.',
      'Extensive testing shows it passes smoothly through digestion without irritating the stomach.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Does not cause gut inflammation, allergies, or digestive upset at food amounts.'
    ],
    labelingContext:
      'Listed on ingredients statements simply as "gellan gum". Suitable for vegan, vegetarian, and gluten-free diets.',
    evidenceStatus: 'Authoritative Regulatory Consensus',
    sources: [
      {
        title: 'U.S. FDA Regulation: Gellan Gum (21 CFR § 172.665)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-G/section-172.665',
        relevantPassage:
          'Gellan gum may be safely used in food as a stabilizer and thickener.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'One of the gentlest and least reactive plant milk stabilizers available today.',
    commonIn: ['Fortified oat milk', 'Almond milk', 'Plant-based yogurts', 'Fruit spreads']
  },
  {
    name: 'Sodium Benzoate',
    slug: 'sodium-benzoate',
    synonyms: ['E211', 'benzoate of soda'],
    category: 'Freshness Preservative for Acidic Foods',
    plainEnglish:
      'A food-grade salt that protects acidic foods and drinks from yeast and bacterial spoiling. It occurs naturally in healthy foods like cranberries, prunes, and cinnamon in significant quantities.',
    whatEvidenceEstablishes: [
      'Approved and affirmed as safe by the U.S. FDA (21 CFR 184.1733) in amounts under 0.1%.',
      'Naturally present in cranberries and apples.',
      'Decades ago, scientists found that combining sodium benzoate with Vitamin C (ascorbic acid) under high heat could produce trace benzene. Bottlers reformulated recipes in the 2000s, and FDA tests confirm store drinks meet drinking water standards.'
    ],
    whatEvidenceDoesNotEstablish: [
      'Modern shelf sodas and juices do not produce dangerous benzene levels under normal pantry storage.'
    ],
    labelingContext:
      'Must be labeled with its purpose, such as "sodium benzoate as a preservative" or "to preserve freshness".',
    evidenceStatus: 'Active Regulatory Scrutiny',
    sources: [
      {
        title: 'U.S. FDA Regulation: Sodium Benzoate (21 CFR § 184.1733)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-184/subpart-B/section-184.1733',
        relevantPassage:
          'Sodium benzoate is affirmed as generally recognized as safe as a chemical preservative with maximum level of 0.1 percent.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      },
      {
        title: 'U.S. FDA Survey: Benzene in Beverages Review',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/chemical-contaminants-food/data-benzene-soft-drinks-and-other-beverages',
        relevantPassage:
          'FDA survey results indicate that benzene levels in beverages do not pose a safety concern for consumers.',
        retrievalDate: '2026-09-15',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'Store fruit drinks and sodas in a cool pantry or fridge away from direct summer sunlight to keep ingredients fresh.',
    commonIn: ['Pickles', 'Acidic soft drinks', 'Fruit juices', 'Salad dressings', 'Jams']
  },
  {
    name: 'Aspartame',
    slug: 'aspartame',
    synonyms: ['NutraSweet', 'Equal', 'E951'],
    category: 'Zero-Calorie Sugar Substitute',
    plainEnglish:
      'An artificial sweetener made from two amino acids (the building blocks of protein). It is 200 times sweeter than sugar, so food makers only need a tiny speck to sweeten an entire can of diet soda without adding calories.',
    whatEvidenceEstablishes: [
      'Approved for food use by the U.S. FDA (21 CFR 172.804) and food authorities in over 90 countries.',
      'The daily safety limit is 50 mg per kilogram of body weight—equal to drinking about 18 to 20 cans of diet soda every single day for an average adult.',
      'People born with a rare genetic condition called PKU (Phenylketonuria) cannot process one of its amino acids (phenylalanine), so all aspartame foods must carry a warning by law.'
    ],
    whatEvidenceDoesNotEstablish: [
      'In 2023, the WHO reviewed aspartame: one committee classified it as "possibly carcinogenic" based on limited lab evidence, while the joint food safety committee (JECFA) and the U.S. FDA both reaffirmed that normal daily consumption remains safe.'
    ],
    labelingContext:
      'Federal law mandates a prominent warning on every package: "PHENYLKETONURICS: CONTAINS PHENYLALANINE".',
    evidenceStatus: 'Active Regulatory Scrutiny',
    sources: [
      {
        title: 'U.S. FDA Regulation: Aspartame (21 CFR § 172.804)',
        publisher: 'U.S. Food & Drug Administration (FDA)',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-172/subpart-I/section-172.804',
        relevantPassage:
          'The label shall bear the statement: PHENYLKETONURICS: CONTAINS PHENYLALANINE.',
        retrievalDate: '2026-10-01',
        sourceType: 'government_regulation'
      },
      {
        title: 'U.S. FDA Consumer Q&A: Aspartame and Sweeteners',
        publisher: 'U.S. FDA',
        url: 'https://www.fda.gov/food/food-additives-petitions/aspartame-and-other-sweeteners-food',
        relevantPassage:
          'FDA scientists reviewed the 2023 IARC findings and found no safety concerns when aspartame is consumed under approved daily limits.',
        retrievalDate: '2026-09-20',
        sourceType: 'government_regulation'
      }
    ],
    suggestedNextStep:
      'If you don\'t have PKU, drinking an occasional diet beverage with aspartame is considered safe. If you prefer natural choices, sparkling water with fresh lemon is a great sugar-free alternative.',
    commonIn: ['Diet sodas', 'Sugar-free gum', 'Gelatin snacks', 'Flavored water', 'Low-calorie yogurts']
  }
];

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findCuratedIngredient(query: string): CuratedIngredientRecord | null {
  const normalized = normalizeIngredientName(query);
  if (!normalized) return null;

  const exact = CURATED_INGREDIENTS.find(
    (item) =>
      normalizeIngredientName(item.name) === normalized ||
      item.slug === normalized ||
      normalizeIngredientName(item.slug) === normalized
  );
  if (exact) return exact;

  const synonymMatch = CURATED_INGREDIENTS.find((item) =>
    item.synonyms.some((syn) => normalizeIngredientName(syn) === normalized)
  );
  if (synonymMatch) return synonymMatch;

  const inclusionMatch = CURATED_INGREDIENTS.find((item) => {
    const normItem = normalizeIngredientName(item.name);
    return (
      (normItem.length > 3 && normalized.includes(normItem)) ||
      (normalized.length > 3 && normItem.includes(normalized)) ||
      item.synonyms.some((syn) => {
        const normSyn = normalizeIngredientName(syn);
        return normSyn.length > 3 && (normalized.includes(normSyn) || normSyn.includes(normalized));
      })
    );
  });

  return inclusionMatch || null;
}

export function getAllCuratedIngredients(): CuratedIngredientRecord[] {
  return CURATED_INGREDIENTS;
}
