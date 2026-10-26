/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProductRecord } from '../types/index.ts';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { useDietaryPreferences } from '../hooks/useStorage.ts';
import { compareProducts } from '../services/comparisonEngine.ts';
import { ProvenanceBadge, PreferenceBadge } from '../components/EvidenceBadge.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import { ProductSearchInputWithCamera } from '../components/ProductSearchInputWithCamera.tsx';
import {
  USDA_STANDARD_BENCHMARKS,
  usdaItemToProductRecord
} from '../services/usdaFoodData.ts';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Scale
} from 'lucide-react';

interface ComparePageProps {
  initialProductA?: ProductRecord;
  initialProductB?: ProductRecord;
  onNavigateToProduct: (product: ProductRecord) => void;
  onNavigateToInvestigate: (term: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  initialProductA,
  initialProductB,
  onNavigateToProduct,
  onNavigateToInvestigate
}) => {
  const { rules } = useDietaryPreferences();

  const [productA, setProductA] = useState<ProductRecord>(initialProductA || SAMPLE_SCENARIOS[0]); // Oat Milk
  const [productB, setProductB] = useState<ProductRecord>(initialProductB || SAMPLE_SCENARIOS[1]); // Plant Burger
  const [nutritionView, setNutritionView] = useState<'serving' | '100g'>('serving');

  useEffect(() => {
    if (initialProductA) setProductA(initialProductA);
  }, [initialProductA]);

  useEffect(() => {
    if (initialProductB) setProductB(initialProductB);
  }, [initialProductB]);

  const comparison = compareProducts(productA, productB, rules);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-800" />
          Side-by-Side Comparison
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Compare Two Foods
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          See exact differences in ingredients, calories, sugars, and allergens without confusing scores.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product A */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Food A
            </span>
            {productA.sourceType === 'usda_fdc' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-800" /> USDA FoodData Central
              </span>
            ) : productA.sourceType === 'open_food_facts' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                Open Food Facts
              </span>
            ) : (
              <ProvenanceBadge
                provenance={
                  productA.sourceType === 'package_scan'
                    ? 'Read from package'
                    : 'Official guidance'
                }
              />
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 line-clamp-1">{productA.name}</h3>
            <p className="text-xs text-stone-500">{productA.brand || 'Unbranded'}</p>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-2">
            <ProductSearchInputWithCamera
              idPrefix="compare-food-a"
              placeholder="Search Food A by name or barcode..."
              onProductSelected={(prod) => setProductA(prod)}
              buttonColorClass="bg-emerald-900 hover:bg-emerald-950 text-white"
              compact
            />

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 overflow-x-auto pt-0.5">
              <span className="shrink-0 font-medium">Quick samples:</span>
              {SAMPLE_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setProductA(s)}
                  className={`px-2 py-0.5 rounded text-[10px] border shrink-0 ${
                    productA.id === s.id
                      ? 'bg-emerald-900 text-white border-emerald-950 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product B */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
              Food B
            </span>
            {productB.sourceType === 'usda_fdc' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-800" /> USDA FoodData Central
              </span>
            ) : productB.sourceType === 'open_food_facts' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                Open Food Facts
              </span>
            ) : (
              <ProvenanceBadge
                provenance={
                  productB.sourceType === 'package_scan'
                    ? 'Read from package'
                    : 'Official guidance'
                }
              />
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 line-clamp-1">{productB.name}</h3>
            <p className="text-xs text-stone-500">{productB.brand || 'Unbranded'}</p>
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-2">
            <ProductSearchInputWithCamera
              idPrefix="compare-food-b"
              placeholder="Search Food B by name or barcode..."
              onProductSelected={(prod) => setProductB(prod)}
              buttonColorClass="bg-blue-900 hover:bg-blue-950 text-white"
              compact
            />

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 overflow-x-auto pt-0.5">
              <span className="shrink-0 font-medium">Quick:</span>
              {SAMPLE_SCENARIOS.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setProductB(s)}
                  className={`px-2 py-0.5 rounded text-[10px] border shrink-0 ${
                    productB.id === s.id
                      ? 'bg-blue-900 text-white border-blue-950 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              ))}
              <span className="shrink-0 text-stone-300">|</span>
              <button
                onClick={() => setProductB(usdaItemToProductRecord(USDA_STANDARD_BENCHMARKS.oatmeal))}
                className={`px-2 py-0.5 rounded text-[10px] border shrink-0 flex items-center gap-1 ${
                  productB.id === `usda-${USDA_STANDARD_BENCHMARKS.oatmeal.fdcId}`
                    ? 'bg-blue-900 text-white border-blue-950 font-bold'
                    : 'bg-blue-50/70 text-blue-950 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Scale className="w-2.5 h-2.5" /> USDA Oats
              </button>
              <button
                onClick={() => setProductB(usdaItemToProductRecord(USDA_STANDARD_BENCHMARKS.cheerios))}
                className={`px-2 py-0.5 rounded text-[10px] border shrink-0 flex items-center gap-1 ${
                  productB.id === `usda-${USDA_STANDARD_BENCHMARKS.cheerios.fdcId}`
                    ? 'bg-blue-900 text-white border-blue-950 font-bold'
                    : 'bg-blue-50/70 text-blue-950 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Scale className="w-2.5 h-2.5" /> USDA Cheerios
              </button>
              <button
                onClick={() => setProductB(usdaItemToProductRecord(USDA_STANDARD_BENCHMARKS.milk))}
                className={`px-2 py-0.5 rounded text-[10px] border shrink-0 flex items-center gap-1 ${
                  productB.id === `usda-${USDA_STANDARD_BENCHMARKS.milk.fdcId}`
                    ? 'bg-blue-900 text-white border-blue-950 font-bold'
                    : 'bg-blue-50/70 text-blue-950 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Scale className="w-2.5 h-2.5" /> USDA Milk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Serving Size Warning if portions differ */}
      {comparison.missingDataNotes.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Portion Size Reminder
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-900">
            {comparison.missingDataNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredient Differentiation */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-serif">
            Ingredient Breakdown
          </h2>
          <p className="text-xs text-stone-500">
            Ingredients sorted by what is shared vs what is unique to each food.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Only in A */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
            <div className="font-bold text-emerald-950 flex items-center justify-between pb-1.5 border-b border-emerald-200">
              <span className="line-clamp-1">Only in {productA.name}</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 rounded text-[10px] font-bold text-emerald-900">
                {comparison.uniqueToProductA.length}
              </span>
            </div>
            {comparison.uniqueToProductA.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {comparison.uniqueToProductA.map((ing, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToInvestigate(ing)}
                    className="px-2 py-1 rounded-lg bg-white text-stone-800 border border-emerald-200 hover:border-emerald-500 text-[11px] text-left"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 italic">No unique ingredients.</p>
            )}
          </div>

          {/* Shared */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="font-bold text-stone-800 flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span>Shared in Both</span>
              <span className="px-1.5 py-0.2 bg-stone-200 rounded text-[10px] font-bold text-stone-800">
                {comparison.sharedIngredients.length}
              </span>
            </div>
            {comparison.sharedIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {comparison.sharedIngredients.map((ing, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToInvestigate(ing)}
                    className="px-2 py-1 rounded-lg bg-white text-stone-800 border border-stone-200 hover:border-stone-400 text-[11px] text-left"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 italic">No shared ingredients found.</p>
            )}
          </div>

          {/* Only in B */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-2">
            <div className="font-bold text-blue-950 flex items-center justify-between pb-1.5 border-b border-blue-200">
              <span className="line-clamp-1">Only in {productB.name}</span>
              <span className="px-1.5 py-0.2 bg-blue-100 rounded text-[10px] font-bold text-blue-900">
                {comparison.uniqueToProductB.length}
              </span>
            </div>
            {comparison.uniqueToProductB.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {comparison.uniqueToProductB.map((ing, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToInvestigate(ing)}
                    className="px-2 py-1 rounded-lg bg-white text-stone-800 border border-blue-200 hover:border-blue-500 text-[11px] text-left"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 italic">No unique ingredients.</p>
            )}
          </div>
        </div>
      </div>

      {/* Allergens Comparison */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3 text-xs">
        <h2 className="text-lg font-bold text-stone-900 font-serif">
          Allergen Differences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">{productA.name}</span>
            <p className="text-stone-600">
              <strong className="text-stone-800">Declared:</strong>{' '}
              {productA.declaredAllergens.length > 0 ? productA.declaredAllergens.join(', ') : 'None listed'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">{productB.name}</span>
            <p className="text-stone-600">
              <strong className="text-stone-800">Declared:</strong>{' '}
              {productB.declaredAllergens.length > 0 ? productB.declaredAllergens.join(', ') : 'None listed'}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Facts Comparison */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">Nutrition Comparison</h2>
            <p className="text-xs text-stone-500">Compare per portion or standardized per 100g.</p>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setNutritionView('serving')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                nutritionView === 'serving' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Per Stated Serving
            </button>
            <button
              onClick={() => setNutritionView('100g')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                nutritionView === '100g' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Per 100g (Fair Basis)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 text-xs font-bold text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <div>Nutrient</div>
          <div className="text-emerald-950 line-clamp-1">{productA.name}</div>
          <div className="text-blue-950 line-clamp-1">{productB.name}</div>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {comparison.nutritionComparison.metrics.map((m, idx) => {
            const valA = nutritionView === 'serving' ? m.valA : m.valA_100g;
            const valB = nutritionView === 'serving' ? m.valB : m.valB_100g;
            const diff = nutritionView === 'serving' ? m.difference : m.difference100g;

            return (
              <div key={idx} className="grid grid-cols-3 py-2.5 items-center hover:bg-stone-50/50">
                <span className="font-semibold text-stone-800">{m.name}</span>
                <span className="text-stone-900">{valA !== undefined ? `${valA} ${m.unit}` : 'N/A'}</span>
                <div className="text-stone-900 flex items-center justify-between pr-2">
                  <span>{valB !== undefined ? `${valB} ${m.unit}` : 'N/A'}</span>
                  {diff !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      diff > 0 ? 'text-emerald-800 bg-emerald-50' : diff < 0 ? 'text-amber-800 bg-amber-50' : 'text-stone-400'
                    }`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <DisclaimerBanner compact />
    </div>
  );
};
