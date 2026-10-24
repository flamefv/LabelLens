/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CuratedIngredientRecord, EvidenceSource } from '../types/index.ts';
import {
  findCuratedIngredient,
  getAllCuratedIngredients
} from '../services/curatedEvidence.ts';
import {
  searchUsdaFoodData,
  UsdaFoodItem,
  usdaItemToNutrition,
  USDA_STANDARD_BENCHMARKS
} from '../services/usdaFoodData.ts';
import {
  FDA_MAJOR_9_ALLERGENS,
  FdaMajorAllergenInfo
} from '../services/fdaAllergyGuidance.ts';
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
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  Info
} from 'lucide-react';

interface InvestigatePageProps {
  initialQuery?: string;
  onNavigateToAnalyze?: () => void;
}

export const InvestigatePage: React.FC<InvestigatePageProps> = ({ initialQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'curated' | 'fda_guidance' | 'usda_fdc'>('curated');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedIngredient, setSelectedIngredient] = useState<CuratedIngredientRecord | null>(null);
  const [activeSourceModal, setActiveSourceModal] = useState<EvidenceSource | null>(null);
  const [showSources, setShowSources] = useState(false);

  // FDA Guidance tab state
  const [selectedAllergenKey, setSelectedAllergenKey] = useState<string>('sesame');

  // USDA live fallback state
  const [usdaResults, setUsdaResults] = useState<UsdaFoodItem[]>([]);
  const [isSearchingUsda, setIsSearchingUsda] = useState(false);

  // Auto-suggest state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const curatedList = getAllCuratedIngredients();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute live auto-suggest matches as user types
  const autoSuggestions = React.useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return [];
    return curatedList
      .filter((item) => {
        const matchesName = item.name.toLowerCase().includes(trimmed);
        const matchesSynonym = item.synonyms.some((s) => s.toLowerCase().includes(trimmed));
        const matchesCategory = item.category.toLowerCase().includes(trimmed);
        return matchesName || matchesSynonym || matchesCategory;
      })
      .slice(0, 8);
  }, [searchTerm, curatedList]);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
      handleSearch(initialQuery);
    } else {
      setSelectedIngredient(curatedList[0]);
    }
  }, [initialQuery]);

  const handleSelectIngredient = (item: CuratedIngredientRecord) => {
    setSelectedIngredient(item);
    setSearchTerm(item.name);
    setUsdaResults([]);
    setIsDropdownOpen(false);
    setActiveTab('curated');
  };

  const handleSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setIsDropdownOpen(false);

    // Check if term matches an FDA major allergen name
    const allergenEntry = Object.entries(FDA_MAJOR_9_ALLERGENS).find(
      ([k, v]) => v.name.toLowerCase().includes(trimmed.toLowerCase()) || k.includes(trimmed.toLowerCase())
    );
    if (allergenEntry && activeTab === 'fda_guidance') {
      setSelectedAllergenKey(allergenEntry[0]);
      return;
    }

    const found = findCuratedIngredient(trimmed);
    if (found) {
      setSelectedIngredient(found);
      setUsdaResults([]);
      setActiveTab('curated');
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || autoSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(searchTerm);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < autoSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : autoSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < autoSuggestions.length) {
        handleSelectIngredient(autoSuggestions[highlightedIndex]);
      } else {
        handleSearch(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const selectedAllergen = FDA_MAJOR_9_ALLERGENS[selectedAllergenKey] || FDA_MAJOR_9_ALLERGENS.sesame;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
          Official Ingredient & Regulatory Investigator
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Ingredient & Food Standards Explorer
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          Grounded in U.S. FDA regulations (21 CFR), FDA Food Allergy Guidance (FALCPA & FASTER Act), and USDA FoodData Central.
        </p>
      </div>

      {/* Explorer Mode Selector */}
      <div className="flex border-b border-stone-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('curated')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'curated'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-700" />
          Curated Additives & Ingredients ({curatedList.length})
        </button>

        <button
          onClick={() => setActiveTab('fda_guidance')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'fda_guidance'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-700" />
          FDA Food Allergy Guidance (Major 9)
        </button>

        <button
          onClick={() => setActiveTab('usda_fdc')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'usda_fdc'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-700" />
          USDA FoodData Central
        </button>
      </div>

      {/* TAB 1: CURATED INGREDIENTS */}
      {activeTab === 'curated' && (
        <>
          {/* Search Box with Real Auto-Suggest */}
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-autocomplete="list"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) setIsDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type ingredient (e.g. Maltodextrin, Carrageenan, Red 40, Sesame)..."
                className="w-full pl-10 pr-24 py-3 bg-white border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsDropdownOpen(false);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSearch(searchTerm)}
                  className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && autoSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100">
                <div className="px-3 py-1.5 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex justify-between">
                  <span>Suggested Ingredients</span>
                  <span>{autoSuggestions.length} matches</span>
                </div>
                {autoSuggestions.map((item, index) => {
                  const isHighlighted = highlightedIndex === index;
                  return (
                    <div
                      key={item.slug}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSelectIngredient(item)}
                      className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isHighlighted ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">{item.name}</span>
                        <span className="text-[11px] text-stone-500 line-clamp-1">{item.category}</span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        FDA 21 CFR
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Browse Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Common Additives:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {curatedList.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => handleSelectIngredient(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    selectedIngredient?.slug === item.slug
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-2xs font-semibold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Curated Ingredient View */}
          {selectedIngredient ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="space-y-2 border-b border-stone-200 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {selectedIngredient.category}
                  </span>
                  <StatusBadge status={selectedIngredient.evidenceStatus} />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                  {selectedIngredient.name}
                </h2>

                {selectedIngredient.synonyms.length > 0 && (
                  <p className="text-xs text-stone-500">
                    Also appears on labels as:{' '}
                    <span className="font-semibold text-stone-700">
                      {selectedIngredient.synonyms.join(', ')}
                    </span>
                  </p>
                )}
              </div>

              {/* Plain English Explanation */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Plain English Explanation
                </span>
                <p className="text-stone-800 text-sm sm:text-base leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  {selectedIngredient.plainEnglish}
                </p>
              </div>

              {/* What Evidence Establishes vs What It Does Not */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                    What Authoritative Evidence Confirms
                  </div>
                  <ul className="space-y-1.5 text-stone-700 leading-relaxed list-disc list-inside">
                    {selectedIngredient.whatEvidenceEstablishes.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950 text-sm">
                    <XCircle className="w-4 h-4 text-rose-800 shrink-0" />
                    What Evidence Does NOT Prove
                  </div>
                  <ul className="space-y-1.5 text-stone-700 leading-relaxed list-disc list-inside">
                    {selectedIngredient.whatEvidenceDoesNotEstablish.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Official Citations Accordion */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full p-4 bg-stone-50 hover:bg-stone-100 flex items-center justify-between text-xs font-bold text-stone-900 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-800" />
                    Official Government Regulations ({selectedIngredient.sources.length})
                  </span>
                  {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSources && (
                  <div className="p-4 divide-y divide-stone-100 text-xs space-y-3">
                    {selectedIngredient.sources.map((src, i) => (
                      <div key={i} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900 block">{src.title}</span>
                          <p className="text-stone-600 italic">&ldquo;{src.relevantPassage}&rdquo;</p>
                          <span className="text-[10px] text-stone-400 block">{src.publisher}</span>
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
          ) : isSearchingUsda ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
              <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Searching government food records...</p>
            </div>
          ) : usdaResults.length > 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4 text-xs">
              <span className="font-bold text-stone-900 text-sm">
                USDA FoodData Central Records Found for &ldquo;{searchTerm}&rdquo;
              </span>
              <div className="divide-y divide-stone-100">
                {usdaResults.map((food) => {
                  const nut = usdaItemToNutrition(food);
                  return (
                    <div key={food.fdcId} className="py-3.5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-bold text-stone-900 text-sm">{food.description}</span>
                          <span className="text-[11px] text-stone-500 block">
                            FDC ID: {food.fdcId} &bull; {food.dataType} {food.brandOwner ? `&bull; Brand: ${food.brandOwner}` : ''}
                          </span>
                        </div>
                        <a
                          href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/nutrients`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-900 font-bold inline-flex items-center gap-1 hover:underline text-xs"
                        >
                          fdc.nal.usda.gov <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Nutrient Pills */}
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {nut.calories !== undefined && (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                            Calories: {nut.calories} kcal
                          </span>
                        )}
                        {nut.protein !== undefined && (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                            Protein: {nut.protein}g
                          </span>
                        )}
                        {nut.totalFat !== undefined && (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                            Fat: {nut.totalFat}g
                          </span>
                        )}
                        {nut.totalCarbohydrates !== undefined && (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                            Carbs: {nut.totalCarbohydrates}g
                          </span>
                        )}
                        {nut.sodium !== undefined && (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">
                            Sodium: {nut.sodium}mg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 space-y-2">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-bold text-stone-800">No entry found for &ldquo;{searchTerm}&rdquo;</p>
              <p className="max-w-xs mx-auto">
                Try searching one of the common additives above or inspect FDA Food Allergy Guidance.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: FDA FOOD ALLERGY GUIDANCE EXPLORER */}
      {activeTab === 'fda_guidance' && (
        <div className="space-y-5">
          {/* Statutory Banner */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-rose-800" />
              U.S. FDA Statutory Framework: Major 9 Food Allergens
            </div>
            <p className="text-rose-900 leading-relaxed text-[11px]">
              Governed by the Food Allergen Labeling and Consumer Protection Act (FALCPA of 2004, 21 U.S.C. § 343(w)) and the FASTER Act of 2021 (Public Law 117-11), which added sesame as the 9th major food allergen effective January 1, 2023.
            </p>
          </div>

          {/* Allergen Selection Pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Select Major Allergen:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(FDA_MAJOR_9_ALLERGENS).map(([key, info]) => {
                const isSelected = selectedAllergenKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAllergenKey(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-rose-900 text-white border-rose-950 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {info.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed FDA Allergen Guidance Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-5 text-xs">
            <div className="border-b border-stone-200 pb-4 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-900">
                  {selectedAllergen.statute}
                </span>
                <span className="text-stone-500 text-[11px]">
                  Effective Date: <strong>{selectedAllergen.effectiveDate}</strong>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-stone-900 font-serif">
                {selectedAllergen.name}
              </h2>
              <p className="text-stone-600 leading-relaxed text-[13px]">
                {selectedAllergen.description}
              </p>
            </div>

            {/* Mandatory FDA Labeling Rules */}
            <div className="space-y-2">
              <span className="font-bold text-stone-800 text-xs uppercase tracking-wider block">
                FDA Mandatory Labeling Rules:
              </span>
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 leading-relaxed text-stone-700">
                {selectedAllergen.fdaGuidanceSummary}
              </div>
            </div>

            {/* Species Specificity Mandate (Tree nuts, Fish, Shellfish) */}
            {selectedAllergen.requiresSpeciesSpecificity && selectedAllergen.speciesExamples && (
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5 text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Info className="w-4 h-4 text-amber-800 shrink-0" />
                  Specific Species Name Required by Federal Law (21 U.S.C. § 343(w)(1)(A))
                </div>
                <p className="text-[11px] text-amber-900">
                  General collective terms are NOT permitted. The manufacturer must name the exact species:
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedAllergen.speciesExamples.map((sp, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white border border-amber-200 font-bold text-[10px] text-amber-950">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Terms and Technical Derivatives */}
            <div className="space-y-2">
              <span className="font-bold text-stone-800 text-xs uppercase tracking-wider block">
                Common Technical Derivatives & Hidden Terms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAllergen.hiddenTerms.map((term, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 font-mono text-[11px]"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Statutory Exemptions */}
            {selectedAllergen.exemptions.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-stone-800 text-xs uppercase tracking-wider block">
                  Statutory Exemptions & Special Rules:
                </span>
                <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                  {selectedAllergen.exemptions.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Official FDA Link */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Source: U.S. Food & Drug Administration (FDA)</span>
              <a
                href={selectedAllergen.citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-900 font-bold inline-flex items-center gap-1 hover:underline"
              >
                Read Official FDA Guidance <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USDA FOODDATA CENTRAL BENCHMARK EXPLORER */}
      {activeTab === 'usda_fdc' && (
        <div className="space-y-5">
          {/* USDA ARS Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Scale className="w-4 h-4 text-blue-800" />
              USDA FoodData Central (Agricultural Research Service)
            </div>
            <p className="text-blue-900 leading-relaxed text-[11px]">
              Official analytical food composition baseline datasets maintained by the U.S. Department of Agriculture. Foundation Foods and SR Legacy provide chemical laboratory analyses of standard commodities.
            </p>
          </div>

          {/* Standard Commodity Baselines */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Official USDA Standard Reference Profiles:
            </span>

            <div className="space-y-3">
              {Object.entries(USDA_STANDARD_BENCHMARKS).map(([key, item]) => {
                const nut = usdaItemToNutrition(item);
                return (
                  <div
                    key={key}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-stone-900 text-sm">{item.description}</span>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span>FDC ID: <strong>{item.fdcId}</strong></span>
                          <span>&bull;</span>
                          <span>Type: <strong>{item.dataType}</strong></span>
                          <span>&bull;</span>
                          <span>Standard Serving: {item.servingSize} {item.servingSizeUnit}</span>
                        </div>
                      </div>

                      <a
                        href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${item.fdcId}/nutrients`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-900 font-bold inline-flex items-center gap-1 hover:underline text-xs shrink-0 self-start sm:self-auto"
                      >
                        View on fdc.nal.usda.gov <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Nutrients grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="p-2 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block text-[10px]">Calories</span>
                        <strong className="text-stone-900">{nut.calories} kcal</strong>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block text-[10px]">Protein</span>
                        <strong className="text-stone-900">{nut.protein}g</strong>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block text-[10px]">Total Fat</span>
                        <strong className="text-stone-900">{nut.totalFat}g</strong>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block text-[10px]">Carbohydrates</span>
                        <strong className="text-stone-900">{nut.totalCarbohydrates}g</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
