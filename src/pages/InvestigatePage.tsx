/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CuratedIngredientRecord, EvidenceSource } from '../types/index.ts';
import {
  findCuratedIngredient,
  getAllCuratedIngredients
} from '../services/curatedEvidence.ts';
import { searchUsdaFoodData, UsdaFoodItem } from '../services/usdaFoodData.ts';
import { StatusBadge } from '../components/EvidenceBadge.tsx';
import { EvidenceSourceModal } from '../components/EvidenceSourceModal.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import {
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Building2,
  AlertCircle
} from 'lucide-react';

interface InvestigatePageProps {
  initialQuery?: string;
  onNavigateToAnalyze?: () => void;
}

export const InvestigatePage: React.FC<InvestigatePageProps> = ({ initialQuery = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedIngredient, setSelectedIngredient] = useState<CuratedIngredientRecord | null>(null);
  const [activeSourceModal, setActiveSourceModal] = useState<EvidenceSource | null>(null);
  const [showSources, setShowSources] = useState(false);

  // USDA live fallback state
  const [usdaResults, setUsdaResults] = useState<UsdaFoodItem[]>([]);
  const [isSearchingUsda, setIsSearchingUsda] = useState(false);

  const curatedList = getAllCuratedIngredients();

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
      handleSearch(initialQuery);
    } else {
      setSelectedIngredient(curatedList[0]);
    }
  }, [initialQuery]);

  const handleSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const found = findCuratedIngredient(trimmed);
    if (found) {
      setSelectedIngredient(found);
      setUsdaResults([]);
    } else {
      setSelectedIngredient(null);
      setIsSearchingUsda(true);
      try {
        const foods = await searchUsdaFoodData(trimmed);
        setUsdaResults(foods);
      } catch {
        setUsdaResults([]);
      } finally {
        setIsSearchingUsda(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
          Everyday Food Additive Guide
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Check an Unfamiliar Ingredient
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          Find out what weird chemical names actually mean, why brands put them in your food, and what the science says.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-4 sm:p-5">
        <label htmlFor="ingredient-search" className="block text-xs font-bold text-stone-700 mb-1.5">
          Type Any Ingredient or Additive
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="ingredient-search"
              type="text"
              placeholder="e.g. Maltodextrin, Carrageenan, Red 40, MSG, Aspartame..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-800"
            />
          </div>
          <button
            onClick={() => handleSearch(searchTerm)}
            className="px-5 py-3 rounded-xl bg-emerald-900 text-stone-100 font-bold text-xs hover:bg-emerald-950 transition-colors shrink-0"
          >
            Check Facts
          </button>
        </div>

        {/* Quick Suggestions Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
          <span className="text-stone-400 font-medium">Popular checks:</span>
          {curatedList.map((item) => (
            <button
              key={item.slug}
              onClick={() => {
                setSearchTerm(item.name);
                setSelectedIngredient(item);
                setUsdaResults([]);
              }}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                selectedIngredient?.slug === item.slug
                  ? 'bg-emerald-900 text-stone-100 border-emerald-950 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Ingredient Report */}
      {selectedIngredient ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden space-y-6">
          {/* Header */}
          <div className="p-5 sm:p-7 bg-stone-50/80 border-b border-stone-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-stone-200/90 text-stone-800">
                {selectedIngredient.category}
              </span>
              <StatusBadge status={selectedIngredient.evidenceStatus} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              {selectedIngredient.name}
            </h2>

            {selectedIngredient.synonyms.length > 0 && (
              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="font-semibold text-stone-700">Other names on labels:</span>
                {selectedIngredient.synonyms.map((syn, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-white border border-stone-200 font-mono text-[11px]">
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-7 pt-0 space-y-6 text-sm">
            {/* Plain English Explanation */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-800" />
                What is it and why is it used?
              </h3>
              <p className="text-stone-800 leading-relaxed bg-stone-50/90 p-4 rounded-2xl border border-stone-200/90 text-xs sm:text-sm">
                {selectedIngredient.plainEnglish}
              </p>
            </div>

            {/* Facts vs Myths Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* What We Know for Sure */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  What We Know for Sure (Proven)
                </div>
                <ul className="space-y-1.5 text-xs text-stone-800 pt-1">
                  {selectedIngredient.whatEvidenceEstablishes.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-700 font-bold mt-0.5">&bull;</span>
                      <span className="leading-relaxed">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Myths & What is Not Proven */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-950 font-bold text-xs uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-700" />
                  Common Myths (Not Proven)
                </div>
                <ul className="space-y-1.5 text-xs text-stone-800 pt-1">
                  {selectedIngredient.whatEvidenceDoesNotEstablish.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-700 font-bold mt-0.5">&bull;</span>
                      <span className="leading-relaxed">{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* How it must be labeled */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
              <span className="font-bold text-stone-800 block">How it must be listed on packages by law:</span>
              <p className="text-stone-600 leading-relaxed">{selectedIngredient.labelingContext}</p>
            </div>

            {/* Helpful Advice */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 block">Helpful Advice for Shoppers:</strong>
                <p className="mt-0.5 leading-relaxed text-amber-900">{selectedIngredient.suggestedNextStep}</p>
              </div>
            </div>

            {/* Common Foods */}
            <div className="text-xs text-stone-500">
              <span className="font-bold text-stone-700">Commonly Found In:</span>{' '}
              {selectedIngredient.commonIn.join(' &bull; ')}
            </div>

            {/* Expandable Citations */}
            <div className="pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowSources(!showSources)}
                className="w-full flex items-center justify-between py-2 text-left text-xs text-stone-600 hover:text-stone-900 font-semibold"
              >
                <span>Show Official FDA & Scientific Citations ({selectedIngredient.sources.length})</span>
                {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSources && (
                <div className="divide-y divide-stone-100 pt-2 text-xs">
                  {selectedIngredient.sources.map((src, i) => (
                    <div key={i} className="py-2.5 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-stone-900 block">{src.title}</span>
                        <p className="text-stone-500 italic text-[11px]">&ldquo;{src.relevantPassage}&rdquo;</p>
                      </div>
                      <button
                        onClick={() => setActiveSourceModal(src)}
                        className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold shrink-0 text-[11px] flex items-center gap-1"
                      >
                        Inspect <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isSearchingUsda ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
          <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-stone-500">Searching government food records...</p>
        </div>
      ) : usdaResults.length > 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3 text-xs">
          <span className="font-bold text-stone-900 text-sm">Official Records Found for &ldquo;{searchTerm}&rdquo;</span>
          <div className="divide-y divide-stone-100">
            {usdaResults.map((food) => (
              <div key={food.fdcId} className="py-3 space-y-1">
                <span className="font-bold text-stone-800 block text-xs">{food.description}</span>
                {food.brandOwner && <span className="text-stone-500 block">Brand: {food.brandOwner}</span>}
                <a
                  href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline pt-0.5"
                >
                  View Nutrients on fdc.nal.usda.gov <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 space-y-2">
          <HelpCircle className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="font-bold text-stone-800">No entry found for &ldquo;{searchTerm}&rdquo;</p>
          <p className="max-w-xs mx-auto">We don&apos;t make up facts when an ingredient isn&apos;t in our database. Try tapping one of the common additives above.</p>
        </div>
      )}

      {/* Safety Notice */}
      <DisclaimerBanner compact />

      {/* Source Modal */}
      <EvidenceSourceModal
        source={activeSourceModal}
        onClose={() => setActiveSourceModal(null)}
      />
    </div>
  );
};
