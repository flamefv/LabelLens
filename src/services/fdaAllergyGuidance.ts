/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceSource, ProductRecord } from '../types/index.ts';

export interface FdaMajorAllergenInfo {
  id: string;
  name: string;
  statute: string;
  effectiveDate: string;
  citationUrl: string;
  cfrSection?: string;
  description: string;
  requiresSpeciesSpecificity: boolean;
  speciesExamples?: string[];
  commonDerivatives: string[];
  hiddenTerms: string[];
  exemptions: string[];
  fdaGuidanceSummary: string;
}

export const FDA_MAJOR_9_ALLERGENS: Record<string, FdaMajorAllergenInfo> = {
  milk: {
    id: 'milk',
    name: 'Milk',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 CFR § 101.4',
    description: 'Milk from domesticated cows and all derivatives. Milk proteins (casein, whey) trigger IgE-mediated immune reactions.',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['dairy', 'butter', 'cheese', 'cream', 'curds', 'ghee', 'sour cream', 'yogurt'],
    hiddenTerms: ['casein', 'caseinate', 'sodium caseinate', 'calcium caseinate', 'whey', 'whey protein concentrate', 'whey protein isolate', 'lactalbumin', 'lactoglobulin', 'lactose', 'milk solids', 'nonfat milk powder'],
    exemptions: ['Lactose-free milk is still an allergen (contains milk protein)', 'Milk fat / butter fat containing residual proteins must still declare milk'],
    fdaGuidanceSummary: 'Under FALCPA, food labels must declare "milk" in plain English either in parentheses after the ingredient name (e.g., "casein (milk)") or in an adjacent "Contains Milk" statement.'
  },
  eggs: {
    id: 'eggs',
    name: 'Eggs',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 CFR § 101.4',
    description: 'Eggs from domesticated chickens and other avian species. Both egg white (ovalbumin, ovomucoid) and yolk contain allergenic proteins.',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['egg white', 'egg yolk', 'dried egg', 'egg powder', 'meringue', 'mayonnaise'],
    hiddenTerms: ['albumin', 'ovalbumin', 'ovomucin', 'ovomucoid', 'ovovitellin', 'lysozyme', 'globulin', 'livetin', 'vitellin', 'surimi'],
    exemptions: ['Egg substitutes often contain real egg whites; check labels carefully'],
    fdaGuidanceSummary: 'Egg proteins used as binders, clarifying agents (e.g. in wines/broths), or emulsifiers must be declared with the common name "egg".'
  },
  peanuts: {
    id: 'peanuts',
    name: 'Peanuts',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 CFR § 101.4',
    description: 'Legumes growing underground (Arachis hypogaea). One of the most potent triggers of severe anaphylaxis.',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['peanut butter', 'peanut flour', 'peanut paste', 'cold-pressed peanut oil'],
    hiddenTerms: ['arachis oil', 'groundnut', 'beer nuts', 'monkey nuts', 'mandelonas (peanuts flavored to resemble almonds)'],
    exemptions: ['Highly refined peanut oil is statutory exempt under 21 U.S.C. § 321(qq)(2) as hot-solvent extraction and bleaching strips protein'],
    fdaGuidanceSummary: 'Peanuts are botanically distinct from tree nuts (legume vs. drupe/nut). FALCPA requires plain English "peanut" or "peanuts".'
  },
  tree_nuts: {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1)(A))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/food-allergen-labeling-and-consumer-protection-act-2004-falcpa',
    cfrSection: '21 CFR § 101.4',
    description: 'Botanical nuts and drupes growing on trees. FALCPA explicitly requires the specific species/type of tree nut to be named.',
    requiresSpeciesSpecificity: true,
    speciesExamples: ['Almonds', 'Walnuts', 'Cashews', 'Pecans', 'Pistachios', 'Hazelnuts / Filberts', 'Macadamia nuts', 'Brazil nuts', 'Pine nuts (Pinyon/Pinon)', 'Coconut', 'Chestnuts'],
    commonDerivatives: ['almond milk', 'almond flour', 'cashew butter', 'walnut oil', 'marzipan', 'praline', 'gianduja'],
    hiddenTerms: ['nut paste', 'nut meal', 'gianduja', 'marzipan', 'nougat', 'nut extracts', 'shea nut'],
    exemptions: ['Highly refined tree nut oils (solvent extracted, refined, bleached, deodorized) are exempt from major allergen labeling under FALCPA § 203'],
    fdaGuidanceSummary: 'FALCPA requires declaring the specific type of nut (e.g. "Contains Almonds" or "Walnuts"), not just the collective term "Tree Nuts". FDA includes coconut in its regulatory tree nut list.'
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 CFR § 101.4',
    description: 'Species of the genus Triticum. Triggers both IgE-mediated wheat allergy and autoimmune Celiac disease (gluten).',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['wheat flour', 'enriched flour', 'semolina', 'durum', 'farina', 'graham flour', 'wheat bran', 'wheat germ', 'vital wheat gluten'],
    hiddenTerms: ['spelt', 'emmer', 'farro', 'einkorn', 'kamut (khorasan)', 'bulgur', 'couscous', 'seitan', 'wheat starch', 'hydrolyzed wheat protein', 'modified food starch (if wheat-derived)'],
    exemptions: ['Wheat-based glucose syrups or maltodextrins processed to remove protein may be exempt under specific petition; if wheat is used, US law requires declaring "wheat"'],
    fdaGuidanceSummary: 'Any ingredient derived from wheat (including spelt, durum, semolina, and wheat starch) must explicitly state "wheat" in the ingredient list or "Contains Wheat" statement.'
  },
  soybeans: {
    id: 'soybeans',
    name: 'Soybeans',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 CFR § 101.4',
    description: 'Legume Glycine max. Extensively used in modern processed foods for protein, texturizing, and emulsification (lecithin).',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['soy', 'soy milk', 'tofu', 'soy protein isolate', 'soy protein concentrate', 'soy sauce', 'tamari', 'miso', 'tempeh', 'edamame', 'soy flour'],
    hiddenTerms: ['soy lecithin', 'soya', 'vegetable protein (HVP/TVP if soy)', 'hydrolyzed plant protein', 'yuba', 'natto', 'kinako'],
    exemptions: ['Highly refined soybean oil (degummed, neutralized, bleached, and deodorized) is statutory exempt from allergen labeling under 21 U.S.C. § 321(qq)(2)'],
    fdaGuidanceSummary: 'Soy lecithin and soy protein must be identified as "soy" or "soybeans". Highly refined soybean oil is exempt due to absence of allergenic protein.'
  },
  sesame: {
    id: 'sesame',
    name: 'Sesame',
    statute: 'FASTER Act of 2021 (Public Law 117-11)',
    effectiveDate: 'January 1, 2023',
    citationUrl: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
    cfrSection: '21 U.S.C. § 343(w)(1)',
    description: 'Seeds of Sesamum indicum. Designated as the 9th Major Food Allergen in the United States by the FASTER Act.',
    requiresSpeciesSpecificity: false,
    commonDerivatives: ['sesame seeds', 'sesame oil', 'tahini', 'sesame paste', 'sesame flour', 'halva', 'sesame salt (gomasio)'],
    hiddenTerms: ['benne', 'benne seed', 'benniseed', 'sesamum indicum', 'sim sim', 'til', 'gingelly oil'],
    exemptions: ['Sesame oil is NOT exempt from allergen labeling under the FASTER Act, even if refined, because cold-pressed and unrefined oils are common'],
    fdaGuidanceSummary: 'Prior to the FASTER Act (before Jan 1, 2023), sesame could be hidden under "natural flavors" or "spices". Now, sesame must ALWAYS be labeled explicitly by name whenever present.'
  },
  fish: {
    id: 'fish',
    name: 'Fish (Finfish)',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1)(A))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/food-allergen-labeling-and-consumer-protection-act-2004-falcpa',
    cfrSection: '21 CFR § 101.4',
    description: 'Finfish species (both freshwater and marine). Parvalbumins are the primary heat-stable allergenic proteins.',
    requiresSpeciesSpecificity: true,
    speciesExamples: ['Salmon', 'Tuna', 'Cod', 'Pollock', 'Halibut', 'Tilapia', 'Bass', 'Trout', 'Anchovy', 'Sardine', 'Haddock', 'Flounder', 'Mackerel', 'Catfish'],
    commonDerivatives: ['fish oil', 'fish sauce', 'worcestershire sauce (often contains anchovies)', 'caesar dressing', 'fish meal', 'fish gelatin', 'isinglass'],
    hiddenTerms: ['surimi (fish paste)', 'bonito flakes (katsuobushi)', 'anchovy paste', 'omega-3 concentrates (if marine source)'],
    exemptions: ['Highly refined fish oils stripped of protein via authorized petition'],
    fdaGuidanceSummary: 'FALCPA mandates that the specific species of fish be declared (e.g. "Contains Cod" or "Contains Salmon"), not merely the word "Fish".'
  },
  crustacean_shellfish: {
    id: 'crustacean_shellfish',
    name: 'Crustacean Shellfish',
    statute: 'FALCPA (21 U.S.C. § 343(w)(1)(A))',
    effectiveDate: 'January 1, 2006',
    citationUrl: 'https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/food-allergen-labeling-and-consumer-protection-act-2004-falcpa',
    cfrSection: '21 CFR § 101.4',
    description: 'Crustaceans (invertebrates with an exoskeleton). Tropomyosin is the major muscle protein responsible for cross-reactivity.',
    requiresSpeciesSpecificity: true,
    speciesExamples: ['Shrimp / Prawns', 'Crab (Blue, King, Dungeness, Snow)', 'Lobster (American, Spiny)', 'Crawfish / Crayfish', 'Langoustine / Scampi'],
    commonDerivatives: ['shrimp paste', 'crab extract', 'lobster bisque', 'shellfish broth', 'glucosamine (if derived from chitin of shellfish shells)'],
    hiddenTerms: ['chitin', 'chitosan', 'shrimp powder', 'belacan', 'krill', 'bouillabaisse'],
    exemptions: ['Molluscan shellfish (clams, oysters, mussels, scallops, squid, octopus) are NOT covered under FALCPA Major 8/9, though FDA encourages voluntary declaration'],
    fdaGuidanceSummary: 'FALCPA requires declaring the specific species of crustacean (e.g., "Contains Shrimp" or "Contains Crab"). Note: Mollusks (oysters/clams) are not statutory major allergens in the US.'
  }
};

export interface FdaAllergenEvaluationReport {
  hasAllergens: boolean;
  detectedMajorAllergens: Array<{
    allergenKey: string;
    allergenName: string;
    statutoryBasis: string;
    detectionMethod: 'Contains statement' | 'Ingredient list declaration' | 'Derivative match' | 'Advisory statement';
    declaredTerm: string;
    speciesCheckPassed?: boolean;
    speciesNote?: string;
    fdaGuidance: string;
  }>;
  precautionaryAnalysis: {
    hasAdvisory: boolean;
    statements: string[];
    fdaGuidanceStance: string;
    regulatoryNotice: string;
  };
  speciesComplianceWarnings: string[];
  sources: EvidenceSource[];
}

/**
 * Evaluates a product record against official FDA Food Allergy Guidance (FALCPA & FASTER Act).
 */
export function evaluateProductUnderFdaGuidance(product: ProductRecord): FdaAllergenEvaluationReport {
  const declaredLower = product.declaredAllergens.map((a) => a.toLowerCase()).join(' ');
  const precautionaryLower = product.precautionaryStatements.map((p) => p.toLowerCase()).join(' ');
  const ingredientsLower = product.ingredientsText.toLowerCase();
  const textToScan = `${product.name} ${ingredientsLower} ${declaredLower} ${precautionaryLower}`.toLowerCase();

  const detected: FdaAllergenEvaluationReport['detectedMajorAllergens'] = [];
  const speciesWarnings: string[] = [];

  for (const [key, info] of Object.entries(FDA_MAJOR_9_ALLERGENS)) {
    let found = false;
    let detectionMethod: 'Contains statement' | 'Ingredient list declaration' | 'Derivative match' | 'Advisory statement' = 'Ingredient list declaration';
    let matchedTerm = '';

    const allTokens = [
      info.name.toLowerCase(),
      key.replace('_', ' '),
      ...(info.speciesExamples || []).map((s) => s.toLowerCase()),
      ...info.commonDerivatives.map((d) => d.toLowerCase()),
      ...info.hiddenTerms.map((h) => h.toLowerCase())
    ];

    const matchTokenIn = (text: string): string | null => {
      // Disregard plant milk descriptors (e.g. "oat milk", "almond milk") when checking dairy milk allergen
      const sanitized =
        key === 'milk'
          ? text.replace(/\b(?:oat|almond|soy|soya|coconut|rice|hemp|pea|cashew|flax|macadamia)\s+milk\b/gi, '')
          : text;

      for (const token of allTokens) {
        // Match word boundaries for the full token string
        const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(sanitized)) return token;
      }
      return null;
    };

    // 1. Check declared "Contains" statement
    const tokenInDeclared = matchTokenIn(declaredLower);
    if (tokenInDeclared) {
      found = true;
      detectionMethod = 'Contains statement';
      matchedTerm = tokenInDeclared;
    }

    // 2. Check ingredient text for direct matches and derivatives
    if (!found) {
      const tokenInIngredients = matchTokenIn(ingredientsLower);
      if (tokenInIngredients) {
        found = true;
        detectionMethod = info.commonDerivatives.includes(tokenInIngredients) || info.hiddenTerms.includes(tokenInIngredients)
          ? 'Derivative match'
          : 'Ingredient list declaration';
        matchedTerm = tokenInIngredients;
      }
    }

    // 3. Check advisory statements ("May contain...", "Facility...")
    if (!found) {
      const tokenInAdvisory = matchTokenIn(precautionaryLower);
      if (tokenInAdvisory) {
        found = true;
        detectionMethod = 'Advisory statement';
        matchedTerm = tokenInAdvisory;
      }
    }

    if (found) {
      let speciesCheckPassed = true;
      let speciesNote: string | undefined = undefined;

      // Check species specificity for Tree nuts, Fish, and Crustaceans
      if (info.requiresSpeciesSpecificity && info.speciesExamples) {
        const foundSpecificSpecies = info.speciesExamples.some((sp) => {
          const parts = sp.toLowerCase().split(/[\s/]+/);
          return parts.some((p) => p.length > 3 && textToScan.includes(p));
        });

        if (!foundSpecificSpecies && (matchedTerm.includes('tree nut') || matchedTerm.includes('fish') || matchedTerm.includes('shellfish'))) {
          speciesCheckPassed = false;
          speciesNote = `FDA statutory violation warning (21 U.S.C. § 343(w)(1)(A)): Food declares "${matchedTerm}" but does not name the specific species required by federal law.`;
          speciesWarnings.push(`${info.name}: Missing specific species name (e.g., must state almond, cod, shrimp).`);
        } else {
          speciesCheckPassed = true;
          speciesNote = `Species specificity compliant with FALCPA § 203.`;
        }
      }

      detected.push({
        allergenKey: key,
        allergenName: info.name,
        statutoryBasis: info.statute,
        detectionMethod,
        declaredTerm: matchedTerm,
        speciesCheckPassed,
        speciesNote,
        fdaGuidance: info.fdaGuidanceSummary
      });
    }
  }

  // Precautionary Statement Analysis
  const hasAdvisory = product.precautionaryStatements.length > 0;
  const advisoryReport = {
    hasAdvisory,
    statements: product.precautionaryStatements,
    fdaGuidanceStance:
      'FDA Guidance for Industry: Allergen advisory statements (e.g., "May Contain", "Manufactured in a facility...") must be truthful and not misleading. FDA explicitly states that advisory labeling CANNOT substitute for adherence to Current Good Manufacturing Practices (cGMPs, 21 CFR Part 117) to prevent allergen cross-contact.',
    regulatoryNotice: hasAdvisory
      ? 'Product carries voluntary advisory labeling. According to FDA guidance, people with severe food allergies should treat "May contain" warnings as carrying an unquantified risk of allergen presence.'
      : 'No voluntary advisory / precautionary statement detected on package.'
  };

  // Build official EvidenceSource citations
  const sources: EvidenceSource[] = [
    {
      title: 'U.S. FDA: Food Allergen Labeling and Consumer Protection Act (FALCPA of 2004)',
      publisher: 'U.S. Food & Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/food-allergen-labeling-and-consumer-protection-act-2004-falcpa',
      relevantPassage: 'FALCPA mandates plain-language labeling for major food allergens. Requires specific species identification for tree nuts, fish, and crustacean shellfish.',
      sourceType: 'government_regulation',
      retrievalDate: new Date().toISOString().split('T')[0]
    },
    {
      title: 'U.S. FDA: FASTER Act of 2021 (Mandatory Sesame Allergen Labeling)',
      publisher: 'U.S. Food & Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
      relevantPassage: 'Designates sesame as the 9th major food allergen in the United States, effective January 1, 2023. Sesame cannot be hidden under "flavorings" or "spices".',
      sourceType: 'government_regulation',
      retrievalDate: new Date().toISOString().split('T')[0]
    },
    {
      title: 'eCFR Title 21 § 101.4: Food; designation of ingredients',
      publisher: 'Electronic Code of Federal Regulations (eCFR)',
      url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.4',
      relevantPassage: 'Ingredients must be listed by common or usual name in descending order of predominance by weight.',
      sourceType: 'government_regulation',
      retrievalDate: new Date().toISOString().split('T')[0]
    }
  ];

  return {
    hasAllergens: detected.length > 0,
    detectedMajorAllergens: detected,
    precautionaryAnalysis: advisoryReport,
    speciesComplianceWarnings: speciesWarnings,
    sources
  };
}
