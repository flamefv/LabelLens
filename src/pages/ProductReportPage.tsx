/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ProductRecord, EvidenceSource, NutritionFacts } from '../types/index.ts';
import { useDietaryPreferences, useSavedProducts } from '../hooks/useStorage.ts';
import { evaluateAllDietaryRules } from '../services/dietaryEngine.ts';
import { ProvenanceBadge, PreferenceBadge } from '../components/EvidenceBadge.tsx';
import { EvidenceSourceModal } from '../components/EvidenceSourceModal.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import {
  evaluateProductUnderFdaGuidance,
  FdaAllergenEvaluationReport,
  FDA_MAJOR_9_ALLERGENS
} from '../services/fdaAllergyGuidance.ts';
import {
  findUsdaStandardBenchmark,
  searchUsdaFoodData,
  usdaItemToProductRecord,
  usdaItemToNutrition,
  compareNutrientsWithUsda,
  UsdaFoodItem,
  UsdaNutrientBenchmarkDiff
} from '../services/usdaFoodData.ts';
import {
  Bookmark,
  BookmarkCheck,
  ArrowLeftRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  FileQuestion,
  Info,
  Scale,
  Sparkles,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface ProductReportPageProps {
  product: ProductRecord;
  onNavigate: (tab: string, param?: string) => void;
  onStartCompare: (product: ProductRecord, compareWith?: ProductRecord) => void;
}

export const ProductReportPage: React.FC<ProductReportPageProps> = ({
  product,
  onNavigate,
  onStartCompare
}) => {
  const { rules } = useDietaryPreferences();
  const { isSaved, saveProduct, removeProduct } = useSavedProducts();
  const [activeSourceModal, setActiveSourceModal] = useState<EvidenceSource | null>(null);
  const [showSourcesAccordion, setShowSourcesAccordion] = useState(false);
  const [showAllUsdaNutrients, setShowAllUsdaNutrients] = useState(false);

  // FDA Guidance evaluation
  const fdaReport = useMemo<FdaAllergenEvaluationReport>(() => {
    return evaluateProductUnderFdaGuidance(product);
  }, [product]);

  // USDA FoodData Central Benchmark state
  const [usdaBenchmarkItem, setUsdaBenchmarkItem] = useState<UsdaFoodItem | null>(() => {
    return findUsdaStandardBenchmark(product.name);
  });
  const [isUsdaLoading, setIsUsdaLoading] = useState(false);

  // Attempt live USDA search if not locally found in standard benchmarks
  useEffect(() => {
    const localMatch = findUsdaStandardBenchmark(product.name);
    if (localMatch) {
      setUsdaBenchmarkItem(localMatch);
      return;
    }

    let isMounted = true;
    setIsUsdaLoading(true);

    const query = product.name
      .replace(/classic|original|organic|gluten-free|style|family size/gi, '')
      .trim();

    searchUsdaFoodData(query)
      .then((results) => {
        if (isMounted) {
          if (results && results.length > 0) {
            setUsdaBenchmarkItem(results[0]);
          } else {
            setUsdaBenchmarkItem(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setUsdaBenchmarkItem(null);
      })
      .finally(() => {
        if (isMounted) setIsUsdaLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product.name]);

  // Compute USDA nutrient comparison
  const usdaNutrition = useMemo<NutritionFacts | null>(() => {
    if (!usdaBenchmarkItem) return null;
    return usdaItemToNutrition(usdaBenchmarkItem);
  }, [usdaBenchmarkItem]);

  const nutrientDifferences = useMemo<UsdaNutrientBenchmarkDiff[]>(() => {
    if (!product.nutritionFacts || !usdaNutrition) return [];
    return compareNutrientsWithUsda(product.nutritionFacts, usdaNutrition);
  }, [product.nutritionFacts, usdaNutrition]);

  // Combined sources including FDA Guidance and USDA record
  const combinedSources = useMemo<EvidenceSource[]>(() => {
    const list: EvidenceSource[] = [...product.sources];

    // Add FDA guidance sources
    fdaReport.sources.forEach((src) => {
      if (!list.some((s) => s.url === src.url)) {
        list.push(src);
      }
    });

    // Add USDA FoodData Central source
    if (usdaBenchmarkItem) {
      const usdaUrl = `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${usdaBenchmarkItem.fdcId}/nutrients`;
      if (!list.some((s) => s.url === usdaUrl)) {
        list.push({
          title: `USDA FoodData Central: ${usdaBenchmarkItem.description} (FDC ID: ${usdaBenchmarkItem.fdcId})`,
          publisher: 'USDA Agricultural Research Service (ARS)',
          url: usdaUrl,
          relevantPassage: `Official analytical food composition baseline dataset (${usdaBenchmarkItem.dataType}).`,
          retrievalDate: new Date().toISOString().split('T')[0],
          sourceType: 'government_regulation'
        });
      }
    }

    return list;
  }, [product.sources, fdaReport.sources, usdaBenchmarkItem]);

  const evaluations = evaluateAllDietaryRules(rules, product);
  const bookmarked = isSaved(product.id);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeProduct(product.id);
    } else {
      saveProduct(product);
    }
  };

  const handleCompareWithUsda = () => {
    if (!usdaBenchmarkItem) return;
    const usdaRecord = usdaItemToProductRecord(usdaBenchmarkItem);
    onStartCompare(product, usdaRecord);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Demonstration Banner if Demo Record */}
      {product.isDemo && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-amber-200/90 text-amber-950 text-[10px]">
              Sample Food
            </span>
            <span>Audited demonstration sample for testing and review.</span>
          </div>
        </div>
      )}

      {/* Main Food Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <ProvenanceBadge
                provenance={
                  product.sourceType === 'package_scan'
                    ? 'Read from package'
                    : product.sourceType === 'usda_fdc'
                    ? 'Official guidance'
                    : product.sourceType === 'open_food_facts'
                    ? 'Database record'
                    : product.sourceType === 'demo_scenario'
                    ? 'Official guidance'
                    : 'Not verified'
                }
              />
              {product.barcode && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
                  UPC: {product.barcode}
                </span>
              )}
              {product.sourceType === 'usda_fdc' && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-semibold flex items-center gap-1">
                  <Scale className="w-3 h-3 text-blue-800" /> USDA FoodData Central
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-tight">
              {product.name}
            </h1>

            {product.brand && (
              <p className="text-xs sm:text-sm font-medium text-stone-600">
                Brand: <strong className="text-stone-900">{product.brand}</strong>
              </p>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              onClick={toggleBookmark}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                bookmarked
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              {bookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-700" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-stone-500" /> Save Item
                </>
              )}
            </button>

            <button
              onClick={() => onStartCompare(product)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 text-stone-600" /> Compare
            </button>
          </div>
        </div>

        {product.sourceUrl && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Data Source: {product.sourceType === 'usda_fdc' ? 'USDA FoodData Central' : 'Public Food Database'}</span>
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              View Government / Database Record <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* FDA FOOD ALLERGY GUIDANCE CARD (FALCPA & FASTER ACT) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                FDA Food Allergy Guidance Analysis
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Evaluated under FALCPA (21 U.S.C. § 343(w)) and the FASTER Act of 2021 (Sesame).
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              FDA Major 9 Audited
            </span>
          </div>
        </div>

        {/* Major 9 Allergen Findings */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Statutory Major Allergen Findings:
          </span>

          {fdaReport.detectedMajorAllergens.length > 0 ? (
            <div className="space-y-2.5">
              {fdaReport.detectedMajorAllergens.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border bg-rose-50/70 border-rose-200 text-rose-950 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-950">{item.allergenName}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-200/90 text-rose-900">
                        {item.statutoryBasis}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-rose-200 font-medium text-rose-900">
                      Detected via: {item.detectionMethod} ({item.declaredTerm})
                    </span>
                  </div>

                  <p className="text-stone-700 leading-relaxed text-[11px]">
                    <strong>FDA Requirement:</strong> {item.fdaGuidance}
                  </p>

                  {/* Species specificity note for tree nuts, fish, shellfish */}
                  {item.speciesNote && (
                    <div
                      className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                        item.speciesCheckPassed
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-100/90 text-amber-950 border border-amber-300'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.speciesNote}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">No Declared Major 9 Food Allergens Detected</span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Neither the ingredient list nor any &ldquo;Contains&rdquo; statement indicates the presence of milk, eggs, peanuts, tree nuts, wheat, soybeans, sesame, fish, or crustacean shellfish under FDA statutory rules.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Precautionary / Advisory Cross-Contact Guidance */}
        <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
          <span className="font-bold text-stone-800 block">
            FDA Precautionary Allergen Labeling (PAL) & Cross-Contact Guidance:
          </span>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-[11px] text-stone-700 leading-relaxed">
            <p>
              <strong>Official FDA Regulatory Position:</strong> {fdaReport.precautionaryAnalysis.fdaGuidanceStance}
            </p>
            {fdaReport.precautionaryAnalysis.hasAdvisory ? (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-950">
                <span className="font-bold block mb-1">Declared Advisory on Package:</span>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  {fdaReport.precautionaryAnalysis.statements.map((stmt, i) => (
                    <li key={i}>{stmt}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-stone-500 italic">
                No advisory cross-contact statements (&ldquo;May contain...&rdquo;) appear on this package.
              </p>
            )}
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500">
          <span>Official Reference: FDA Guidance for Industry (Edition 5) & 21 CFR § 101.4</span>
          <button
            onClick={() =>
              setActiveSourceModal({
                title: 'FDA Food Allergen Labeling Guidance (FALCPA & FASTER Act)',
                publisher: 'U.S. Food & Drug Administration (FDA)',
                url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
                relevantPassage:
                  'Federal law mandates plain English labeling for 9 major allergens. Sesame became the 9th major allergen on Jan 1, 2023 under the FASTER Act. Cross-contact advisory statements cannot substitute for Good Manufacturing Practices.',
                retrievalDate: new Date().toISOString().split('T')[0],
                sourceType: 'government_regulation'
              })
            }
            className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
          >
            View Official FDA Statute <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* USDA FOODDATA CENTRAL ANALYTICAL BENCHMARK */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-800" />
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                USDA FoodData Central Reference Benchmark
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Official analytical food composition baseline from the USDA Agricultural Research Service (ARS).
            </p>
          </div>

          {usdaBenchmarkItem && (
            <button
              onClick={handleCompareWithUsda}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-800" />
              Compare vs USDA Standard
            </button>
          )}
        </div>

        {isUsdaLoading ? (
          <div className="p-6 text-center text-xs text-stone-500 space-y-2">
            <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Querying USDA FoodData Central analytical database...</p>
          </div>
        ) : usdaBenchmarkItem ? (
          <div className="space-y-4 text-xs">
            {/* USDA Record Header */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                  USDA Reference Profile:
                </span>
                <h3 className="font-bold text-sm text-stone-900 mt-0.5">
                  {usdaBenchmarkItem.description}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-stone-600">
                  <span>FDC ID: <strong>{usdaBenchmarkItem.fdcId}</strong></span>
                  <span>&bull;</span>
                  <span>Data Type: <strong>{usdaBenchmarkItem.dataType}</strong></span>
                  <span>&bull;</span>
                  <span>Standard Serving: {usdaBenchmarkItem.servingSize ? `${usdaBenchmarkItem.servingSize} ${usdaBenchmarkItem.servingSizeUnit}` : '100 g'}</span>
                </div>
              </div>

              <a
                href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${usdaBenchmarkItem.fdcId}/nutrients`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-900 font-bold text-xs shrink-0 inline-flex items-center gap-1 hover:bg-blue-50"
              >
                fdc.nal.usda.gov <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Nutrient Comparison Table */}
            {nutrientDifferences.length > 0 ? (
              <div className="space-y-2">
                <span className="font-bold text-stone-800 block">
                  Package Label vs. USDA Standard Analytical Baseline:
                </span>
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  <div className="grid grid-cols-12 bg-stone-50 p-2.5 font-bold text-[11px] text-stone-600">
                    <div className="col-span-4">Nutrient</div>
                    <div className="col-span-3 text-right">Package Label</div>
                    <div className="col-span-3 text-right">USDA Benchmark</div>
                    <div className="col-span-2 text-right">Variance</div>
                  </div>

                  {(showAllUsdaNutrients ? nutrientDifferences : nutrientDifferences.slice(0, 6)).map(
                    (diff, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 p-2.5 items-center text-xs ${
                          diff.isHigherInProduct
                            ? 'bg-amber-50/40'
                            : 'hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="col-span-4 font-medium text-stone-900">
                          {diff.metric}
                        </div>
                        <div className="col-span-3 text-right font-semibold text-stone-800">
                          {diff.productValue !== undefined ? `${diff.productValue} ${diff.unit}` : '—'}
                        </div>
                        <div className="col-span-3 text-right text-stone-600">
                          {diff.usdaBenchmarkValue !== undefined ? `${diff.usdaBenchmarkValue} ${diff.unit}` : '—'}
                        </div>
                        <div className="col-span-2 text-right">
                          {diff.varianceNote ? (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                diff.isHigherInProduct
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                              title={diff.varianceNote}
                            >
                              {diff.isHigherInProduct ? 'Higher' : 'Aligned'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400">—</span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {nutrientDifferences.length > 6 && (
                  <button
                    onClick={() => setShowAllUsdaNutrients(!showAllUsdaNutrients)}
                    className="text-xs font-semibold text-blue-900 hover:underline pt-1 flex items-center gap-1"
                  >
                    {showAllUsdaNutrients
                      ? 'Show Fewer Nutrients'
                      : `View All ${nutrientDifferences.length} Nutrients from USDA Baseline`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-stone-500 italic">
                Nutrition facts not detailed enough on label for numerical benchmark comparison.
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <span className="font-bold text-stone-800 block">USDA FoodData Central Reference:</span>
            <p>
              Direct benchmark not matched automatically. You can look up any commodity baseline in the{' '}
              <button
                onClick={() => onNavigate('investigate', product.name)}
                className="font-bold text-emerald-800 hover:underline"
              >
                Ingredient Investigator
              </button>{' '}
              to inspect government lab values.
            </p>
          </div>
        )}
      </div>

      {/* Allergy & Diet Check (User Personal Profile) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              Personal Food Profile Check
            </h2>
            <p className="text-xs text-stone-500">
              Matched against your active food profile and custom avoidances.
            </p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Edit Profile &rarr;
          </button>
        </div>

        {evaluations.length === 0 ? (
          <p className="text-xs text-stone-500 py-2">
            No diet rules active. Tap &ldquo;Edit Profile&rdquo; to customize what you avoid.
          </p>
        ) : (
          <div className="space-y-2.5">
            {evaluations.map((evalItem) => (
              <div
                key={evalItem.ruleId}
                className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  evalItem.matchLevel === 'CONFIRMED_MATCH'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : evalItem.matchLevel === 'POSSIBLE_MATCH'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : evalItem.matchLevel === 'INSUFFICIENT_INFO'
                    ? 'bg-stone-50 border-stone-200 text-stone-800'
                    : 'bg-emerald-50/50 border-emerald-200 text-stone-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{evalItem.ruleName}</span>
                    <PreferenceBadge level={evalItem.matchLevel} />
                  </div>
                  <p className="text-stone-600 text-xs leading-relaxed">{evalItem.explanation}</p>
                </div>

                {evalItem.triggerPhrases.length > 0 && (
                  <div className="sm:text-right shrink-0">
                    <div className="flex flex-wrap sm:justify-end gap-1 mt-1">
                      {evalItem.triggerPhrases.map((phrase, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 border border-stone-200 text-stone-900"
                        >
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingredients List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-serif">
            Ingredients ({product.ingredientsList.length} items)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Tap any highlighted ingredient to see what it does and inspect FDA regulatory approvals.
          </p>
        </div>

        {product.ingredientsList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.ingredientsList.map((ing) => (
              <button
                key={ing.id}
                onClick={() => onNavigate('investigate', ing.rawName)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center gap-1.5 ${
                  ing.hasCuratedEntry
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 font-semibold shadow-2xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{ing.rawName}</span>
                {ing.hasCuratedEntry && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" title="Tap to check" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500 italic">
            Ingredient list was not listed in this record.
          </div>
        )}
      </div>

      {/* Nutrition at a Glance */}
      {product.nutritionFacts ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">Package Nutrition Facts</h2>
              <p className="text-xs text-stone-500">
                Serving size: <strong className="text-stone-800">{product.servingSize || 'As listed'}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 uppercase text-[10px] font-bold">Calories</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {product.nutritionFacts.calories !== undefined ? `${product.nutritionFacts.calories} kcal` : 'N/A'}
              </div>
              {product.nutritionFacts.per100g?.calories !== undefined && (
                <span className="text-[10px] text-stone-400">{product.nutritionFacts.per100g.calories} / 100g</span>
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 uppercase text-[10px] font-bold">Total Fat</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {product.nutritionFacts.totalFat !== undefined ? `${product.nutritionFacts.totalFat} g` : 'N/A'}
              </div>
              {product.nutritionFacts.per100g?.totalFat !== undefined && (
                <span className="text-[10px] text-stone-400">{product.nutritionFacts.per100g.totalFat} g / 100g</span>
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 uppercase text-[10px] font-bold">Sodium</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {product.nutritionFacts.sodium !== undefined ? `${product.nutritionFacts.sodium} mg` : 'N/A'}
              </div>
              {product.nutritionFacts.per100g?.sodium !== undefined && (
                <span className="text-[10px] text-stone-400">{product.nutritionFacts.per100g.sodium} mg / 100g</span>
              )}
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 uppercase text-[10px] font-bold">Sugars</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {product.nutritionFacts.totalSugars !== undefined ? `${product.nutritionFacts.totalSugars} g` : 'N/A'}
              </div>
              {product.nutritionFacts.addedSugars !== undefined && (
                <span className="text-[10px] text-stone-400">{product.nutritionFacts.addedSugars}g added</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Honest Limitations */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-2 text-xs">
        <h3 className="font-bold text-stone-900 text-sm font-serif flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          Honest Disclosures & What We Cannot Guarantee
        </h3>
        <ul className="list-disc list-inside space-y-1 text-stone-600 pt-1">
          {product.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
          <li>Catch-all terms like &ldquo;natural flavors&rdquo; or &ldquo;spices&rdquo; are protected trade secrets and not broken down on labels.</li>
          <li>If you have a life-threatening food allergy, always confirm the lot number directly with the manufacturer.</li>
        </ul>
      </div>

      {/* Expandable Official Citations Accordion */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowSourcesAccordion(!showSourcesAccordion)}
          className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
        >
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Official Food Regulations & Data Sources ({combinedSources.length})
            </h3>
            <p className="text-[11px] text-stone-500">
              Direct citations to FDA FALCPA, FASTER Act, 21 CFR § 101.4, and USDA FoodData Central.
            </p>
          </div>
          {showSourcesAccordion ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {showSourcesAccordion && (
          <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 divide-y divide-stone-100 text-xs">
            {combinedSources.map((source, index) => (
              <div key={index} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-stone-900 block">{source.title}</span>
                  <p className="text-stone-600 italic">&ldquo;{source.relevantPassage}&rdquo;</p>
                  <span className="text-[10px] text-stone-400 block">Published by: {source.publisher}</span>
                </div>
                <button
                  onClick={() => setActiveSourceModal(source)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200 text-xs font-semibold shrink-0 flex items-center gap-1"
                >
                  Read Citation <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <DisclaimerBanner />

      {/* Source Citation Modal */}
      <EvidenceSourceModal
        source={activeSourceModal}
        onClose={() => setActiveSourceModal(null)}
      />
    </div>
  );
};
