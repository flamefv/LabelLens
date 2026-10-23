/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProductRecord, EvidenceSource } from '../types/index.ts';
import { useDietaryPreferences, useSavedProducts } from '../hooks/useStorage.ts';
import { evaluateAllDietaryRules } from '../services/dietaryEngine.ts';
import { ProvenanceBadge, PreferenceBadge } from '../components/EvidenceBadge.tsx';
import { EvidenceSourceModal } from '../components/EvidenceSourceModal.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
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
  Info
} from 'lucide-react';

interface ProductReportPageProps {
  product: ProductRecord;
  onNavigate: (tab: string, param?: string) => void;
  onStartCompare: (product: ProductRecord) => void;
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

  const evaluations = evaluateAllDietaryRules(rules, product);
  const bookmarked = isSaved(product.id);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeProduct(product.id);
    } else {
      saveProduct(product);
    }
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
            <span>Source: Public Product Database</span>
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              View Original Entry <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Allergy & Diet Check */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              Allergy & Diet Check
            </h2>
            <p className="text-xs text-stone-500">
              Matched against your active food profile and allergies.
            </p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Edit Rules &rarr;
          </button>
        </div>

        {evaluations.length === 0 ? (
          <p className="text-xs text-stone-500 py-2">
            No diet rules active. Tap &ldquo;Edit Rules&rdquo; to customize what you avoid.
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
            Tap any highlighted ingredient to see what it does and why it is used.
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

        {/* Declared Allergens & Facility Warnings */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">Allergens Declared by Maker:</span>
            {product.declaredAllergens.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {product.declaredAllergens.map((allergen, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-300 font-bold text-xs"
                  >
                    Contains: {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-stone-500 italic">None stated on package.</p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="font-bold text-amber-950 block">Shared Facility Warnings:</span>
            {product.precautionaryStatements.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-amber-900 font-medium">
                {product.precautionaryStatements.map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ul>
            ) : (
              <p className="text-amber-800 italic">None listed on package.</p>
            )}
          </div>
        </div>
      </div>

      {/* Nutrition at a Glance */}
      {product.nutritionFacts ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">Nutrition Facts</h2>
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
          <li>If you have a life-threatening food allergy, always confirm the lot number directly with the brand.</li>
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
              Official Food Regulations & Data Sources ({product.sources.length})
            </h3>
            <p className="text-[11px] text-stone-500">
              Tap to see exact government rules and citations linked to this report.
            </p>
          </div>
          {showSourcesAccordion ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {showSourcesAccordion && (
          <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 divide-y divide-stone-100 text-xs">
            {product.sources.map((source, index) => (
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
