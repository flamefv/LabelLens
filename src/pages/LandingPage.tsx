/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProductRecord } from '../types/index.ts';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import { ProvenanceBadge } from '../components/EvidenceBadge.tsx';
import {
  Camera,
  ArrowLeftRight,
  ShieldCheck,
  Search,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onSelectProduct: (product: ProductRecord) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectProduct }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'ingredients' | 'nutrition' | 'evidence'>('ingredients');
  const demoProduct = SAMPLE_SCENARIOS[0]; // Barista Oat Milk

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 md:pb-16">
      {/* Hero Section */}
      <section className="relative pt-4 sm:pt-10 text-center max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-5">
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          Mobile-Ready &bull; 100% Free &bull; No Ad Tracker Jargon
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 font-serif leading-[1.18]">
          Know what you&apos;re eating.
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Scan food labels with your phone camera, look up confusing ingredients in plain English, and check for allergens with zero made-up facts.
        </p>

        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('analyze')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-900 text-stone-50 font-bold text-base shadow-sm hover:bg-emerald-950 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Scan a label photo
          </button>
          <button
            onClick={() => onNavigate('compare')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-stone-800 font-bold text-base border border-stone-300 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 shadow-2xs"
          >
            <ArrowLeftRight className="w-5 h-5 text-stone-600" />
            Compare two foods
          </button>
        </div>

        {/* 4 Simple Trust Pillars */}
        <div className="mt-10 pt-6 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> Real Facts Only
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-snug">No made-up AI guesses. Traced to official FDA laws.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" /> Honest About Unknowns
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-snug">If an ingredient is unclear, we tell you straightforwardly.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600 shrink-0" /> Clear Source Origin
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-snug">Shows whether info came from your photo or a database.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> Safety First
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-snug">We help spot allergens, but never guarantee safety.</p>
          </div>
        </div>
      </section>

      {/* Interactive Sample Label Preview */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-200">
                  Sample Demonstration
                </span>
                <ProvenanceBadge provenance="Read from package" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif mt-1.5">
                {demoProduct.name}
              </h2>
              <p className="text-xs text-stone-500">{demoProduct.brand} &bull; Barcode: {demoProduct.barcode}</p>
            </div>

            {/* Switcher tabs */}
            <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setActivePreviewTab('ingredients')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'ingredients'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ingredients ({demoProduct.ingredientsList.length})
              </button>
              <button
                onClick={() => setActivePreviewTab('nutrition')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'nutrition'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Nutrition
              </button>
              <button
                onClick={() => setActivePreviewTab('evidence')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activePreviewTab === 'evidence'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sources
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {activePreviewTab === 'ingredients' && (
              <div className="space-y-4">
                <div className="text-xs text-stone-500">
                  Ingredients found on this package. Tap highlighted ones to see what they actually do:
                </div>

                <div className="flex flex-wrap gap-2">
                  {demoProduct.ingredientsList.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => onNavigate('investigate', ing.rawName)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        ing.hasCuratedEntry
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 font-semibold'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {ing.rawName}
                      {ing.hasCuratedEntry && (
                        <span className="ml-1 text-[11px] text-emerald-700 font-bold">
                          &bull; Tap to check
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="font-bold text-stone-800 block mb-0.5">Top 9 Allergens Declared:</span>
                    <span className="text-stone-600">None declared on front package label.</span>
                  </div>
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-950 block mb-0.5">Factory / Shared Kitchen Warning:</span>
                    <span className="text-amber-900">{demoProduct.precautionaryStatements[0]}</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'nutrition' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Serving size: <strong className="text-stone-800">{demoProduct.servingSize}</strong></span>
                  <span>Standard per-cup values</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 uppercase font-semibold">Calories</div>
                    <div className="text-xl font-bold text-stone-900 mt-0.5">{demoProduct.nutritionFacts?.calories} kcal</div>
                    <div className="text-[10px] text-stone-400">58 kcal / 100g</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 uppercase font-semibold">Total Fat</div>
                    <div className="text-xl font-bold text-stone-900 mt-0.5">{demoProduct.nutritionFacts?.totalFat} g</div>
                    <div className="text-[10px] text-stone-400">Heart-healthy oils</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 uppercase font-semibold">Sodium</div>
                    <div className="text-xl font-bold text-stone-900 mt-0.5">{demoProduct.nutritionFacts?.sodium} mg</div>
                    <div className="text-[10px] text-stone-400">Low sodium</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 uppercase font-semibold">Added Sugars</div>
                    <div className="text-xl font-bold text-stone-900 mt-0.5">{demoProduct.nutritionFacts?.addedSugars} g</div>
                    <div className="text-[10px] text-stone-400">From oat enzyme process</div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'evidence' && (
              <div className="space-y-3">
                <div className="text-xs text-stone-500 mb-2">
                  Official government and public reference sources linked for this food:
                </div>
                {demoProduct.sources.map((src, i) => (
                  <div key={i} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{src.title}</span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        Read Regulation <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-stone-600 italic">&ldquo;{src.relevantPassage}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-stone-100/70 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-stone-600">
              Want to see the complete analysis with allergy alerts?
            </span>
            <button
              onClick={() => onSelectProduct(demoProduct)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-900 text-stone-100 rounded-xl font-semibold hover:bg-emerald-950 transition-colors flex items-center justify-center gap-1.5"
            >
              Open Complete Food Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3 Simple Everyday Feature Highlights */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            Designed for Busy Shoppers
          </h2>
          <p className="mt-2 text-stone-600 text-xs sm:text-sm">
            No biochemistry degree required. We translate food packaging into plain English.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-900 flex items-center justify-center mb-4">
                <Camera className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2">
                1. Snap a Photo or Scan Barcode
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Take a quick photo of the ingredient list with your phone or scan the barcode. You can review the text on your screen right away.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-stone-100">
              <button onClick={() => onNavigate('analyze')} className="text-xs font-bold text-emerald-900 inline-flex items-center gap-1 hover:underline">
                Try Camera Scanner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-900 flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-blue-800" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2">
                2. Check Unfamiliar Ingredients
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Wondering what &ldquo;potassium sorbate&rdquo; or &ldquo;maltodextrin&rdquo; actually is? We give you honest answers on why brands use it and what is proven.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-stone-100">
              <button onClick={() => onNavigate('investigate')} className="text-xs font-bold text-blue-900 inline-flex items-center gap-1 hover:underline">
                Search Additives <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-5 h-5 text-amber-800" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2">
                3. Compare Two Foods Fairly
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Holding two snack bars at the grocery store? See side-by-side differences in sugar, sodium, and ingredients per 100 grams.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-stone-100">
              <button onClick={() => onNavigate('compare')} className="text-xs font-bold text-amber-900 inline-flex items-center gap-1 hover:underline">
                Compare Foods <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="max-w-4xl mx-auto px-4">
        <DisclaimerBanner />
      </section>
    </div>
  );
};
