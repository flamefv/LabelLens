/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ProductRecord } from '../types/index.ts';
import {
  searchUnified,
  resolveUnifiedProductRecord,
  fetchUnifiedProductById,
  UnifiedSearchResultItem,
  normalizeOffSearchResult,
  normalizeCatalogItem
} from '../services/unifiedSearch.ts';
import {
  fetchCategoryFromOpenFoodFacts,
  CATEGORY_SLUG_MAP
} from '../services/openFoodFacts.ts';
import { performBrowserOcr, OcrProgress } from '../services/tesseractOcr.ts';
import { extractionToProductRecord } from '../services/labelParser.ts';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { FOOD_CATALOG, searchFoodCatalog } from '../data/foodCatalog.ts';
import {
  Search,
  Camera,
  Loader2,
  AlertTriangle,
  ArrowRight,
  X,
  Barcode,
  Sparkles,
  Globe,
  PlusCircle,
  Scale,
  Database,
  Filter
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Cereals & Breakfast',
  'Plant & Dairy Milks',
  'Snacks & Cookies',
  'Condiments & Sauces',
  'Dairy & Yogurts',
  'Plant-Based',
  'Breads & Bakery',
  'Beverages'
] as const;

const POPULAR_QUICK_SEARCHES = [
  'Cheerios',
  'Oat Milk',
  'Oreo',
  'Doritos',
  'Chobani',
  'Almond Milk',
  'Heinz',
  'Quaker Oats',
  'Nutella',
  'Peanut Butter',
  'Salmon',
  'Tofu'
];

interface ProductSearchInputWithCameraProps {
  label?: string;
  placeholder?: string;
  onProductSelected: (product: ProductRecord) => void;
  idPrefix?: string;
  buttonColorClass?: string;
  compact?: boolean;
}

export const ProductSearchInputWithCamera: React.FC<ProductSearchInputWithCameraProps> = ({
  label,
  placeholder = 'Search foods by name or barcode (e.g. Cheerios, Oat Milk, 016000275287)...',
  onProductSelected,
  idPrefix = 'food-input',
  buttonColorClass = 'bg-emerald-900 hover:bg-emerald-950 text-white',
  compact = false
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeSourceFilter, setActiveSourceFilter] = useState<'all' | 'open_food_facts' | 'usda_fdc'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-suggest dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [unifiedResults, setUnifiedResults] = useState<UnifiedSearchResultItem[]>([]);
  const [remoteTotalCount, setRemoteTotalCount] = useState<number | null>(null);
  const [sourceCounts, setSourceCounts] = useState<{ openFoodFacts: number; usdaFoodData: number }>({
    openFoodFacts: 0,
    usdaFoodData: 0
  });
  const [partialFailureNote, setPartialFailureNote] = useState<string | null>(null);

  // Category browse items fetched when query is empty
  const [categoryLiveItems, setCategoryLiveItems] = useState<UnifiedSearchResultItem[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Fetch live category items when query is empty and user opens dropdown
  useEffect(() => {
    let isCancelled = false;
    const trimmed = query.trim();

    if (trimmed.length < 2 && isDropdownOpen) {
      const slug = CATEGORY_SLUG_MAP[selectedCategory] || 'breakfast-cereals';
      setIsLoadingCategory(true);

      fetchCategoryFromOpenFoodFacts(slug, 1, 30)
        .then((res) => {
          if (isCancelled) return;
          const mapped: UnifiedSearchResultItem[] = res.products.map(normalizeOffSearchResult);
          setCategoryLiveItems(mapped);
          setRemoteTotalCount(res.totalCount);
        })
        .catch(() => {
          if (!isCancelled) setCategoryLiveItems([]);
        })
        .finally(() => {
          if (!isCancelled) setIsLoadingCategory(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, query, isDropdownOpen]);

  // Debounced Unified Search querying Open Food Facts and USDA FoodData Central concurrently
  useEffect(() => {
    const trimmed = query.trim();
    const cleanDigits = trimmed.replace(/[-\s]/g, '');
    const isNumeric = /^\d+$/.test(cleanDigits);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length >= 2 || (isNumeric && cleanDigits.length >= 4)) {
      setIsSearchingSuggestions(true);
      setPartialFailureNote(null);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await searchUnified(trimmed, selectedCategory, 40);
          setUnifiedResults(res.results);
          setRemoteTotalCount(res.totalResults);
          setSourceCounts({
            openFoodFacts: res.sourceCounts.openFoodFacts,
            usdaFoodData: res.sourceCounts.usdaFoodData
          });

          if (res.partialFailures.usdaFoodData && res.results.length > 0) {
            setPartialFailureNote('USDA FoodData Central query timed out; showing Open Food Facts and catalog results.');
          } else if (res.partialFailures.openFoodFacts && res.results.length > 0) {
            setPartialFailureNote('Open Food Facts query timed out; showing USDA FoodData Central and benchmark results.');
          } else {
            setPartialFailureNote(null);
          }
        } catch {
          setUnifiedResults([]);
          setRemoteTotalCount(null);
        } finally {
          setIsSearchingSuggestions(false);
        }
      }, 250);
    } else {
      setUnifiedResults([]);
      setRemoteTotalCount(null);
      setPartialFailureNote(null);
      setIsSearchingSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedCategory]);

  // Combined suggestions: filtered by optional source view without forcing selection
  const visibleSuggestions = useMemo(() => {
    let items = query.trim().length >= 2 ? unifiedResults : categoryLiveItems;

    // Fall back to catalog items if category live items haven't loaded yet
    if (query.trim().length < 2 && items.length === 0) {
      items = searchFoodCatalog('', selectedCategory).map(normalizeCatalogItem);
    }

    const cleanDigits = query.trim().replace(/[-\s]/g, '');
    const isNumeric = /^\d{4,16}$/.test(cleanDigits);

    if (activeSourceFilter === 'open_food_facts') {
      return items.filter((item) => item.source === 'open_food_facts' || item.source === 'catalog');
    }
    if (activeSourceFilter === 'usda_fdc') {
      return items.filter((item) => item.source === 'usda_fdc');
    }

    return items;
  }, [query, unifiedResults, categoryLiveItems, selectedCategory, activeSourceFilter]);

  // Handle selecting an item from the auto-suggest list
  const handleSelectSuggestion = async (item: UnifiedSearchResultItem) => {
    setIsDropdownOpen(false);
    setQuery(item.name);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const product = await resolveUnifiedProductRecord(item);
      if (product) {
        onProductSelected(product);
      } else {
        setErrorMessage(`Could not load full record for "${item.name}". Please try another search.`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Submit on Enter or Search button click
  const handleSearchOrBarcode = async (overrideTerm?: string) => {
    const rawTerm = (overrideTerm ?? query).trim();
    if (!rawTerm) {
      setErrorMessage('Please type a food name or barcode number.');
      return;
    }

    setIsDropdownOpen(false);
    setErrorMessage(null);
    setIsLoading(true);

    const cleanNum = rawTerm.replace(/[-\s]/g, '');
    const isNumericBarcode = /^\d{4,16}$/.test(cleanNum);

    if (isNumericBarcode) {
      try {
        const product = await fetchUnifiedProductById(cleanNum);
        if (product) {
          onProductSelected(product);
        } else {
          setErrorMessage(`No product record found for barcode "${cleanNum}" in Open Food Facts or local catalog. Verify the digits or search by food name.`);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lookup failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Text search via unified engine
    try {
      const searchRes = await searchUnified(rawTerm, selectedCategory);
      if (searchRes.results.length > 0) {
        const topResult = searchRes.results[0];
        const product = await resolveUnifiedProductRecord(topResult);
        if (product) {
          onProductSelected(product);
        } else {
          setErrorMessage(`Could not load record for "${topResult.name}".`);
        }
      } else {
        setErrorMessage(
          `No food items found matching "${rawTerm}" across Open Food Facts or USDA FoodData Central. Try another name or take a photo with the Camera.`
        );
      }
    } catch {
      setErrorMessage('Search request failed. Please check network connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation for auto-suggest
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || visibleSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchOrBarcode();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < visibleSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : visibleSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < visibleSuggestions.length) {
        handleSelectSuggestion(visibleSuggestions[highlightedIndex]);
      } else {
        handleSearchOrBarcode();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  // Camera photo capture with browser OCR
  const handleCameraCapture = async (file: File) => {
    setErrorMessage(null);
    setIsCameraScanning(true);
    setIsDropdownOpen(false);
    setOcrProgress({ status: 'Enhancing photo clarity...', progress: 0.15 });

    const previewUrl = URL.createObjectURL(file);

    try {
      const result = await performBrowserOcr(file, (p) => setOcrProgress(p));
      const scannedProduct = extractionToProductRecord(result, previewUrl);
      onProductSelected(scannedProduct);
      setQuery(scannedProduct.name);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not read text from this photo. Please hold steady in good lighting.'
      );
    } finally {
      setIsCameraScanning(false);
      setOcrProgress(null);
    }
  };

  // Highlight matching search tokens in titles
  const renderHighlightedText = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    const cleanTerm = term.trim().toLowerCase();
    const index = text.toLowerCase().indexOf(cleanTerm);
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="font-extrabold text-emerald-950 bg-emerald-100 rounded-xs px-1">
          {text.substring(index, index + cleanTerm.length)}
        </span>
        {text.substring(index + cleanTerm.length)}
      </>
    );
  }, []);

  const cleanQueryDigits = query.trim().replace(/[-\s]/g, '');
  const isQueryBarcode = /^\d{4,16}$/.test(cleanQueryDigits);

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {label && (
        <label
          htmlFor={`${idPrefix}-search-input`}
          className="block text-xs font-bold text-stone-700"
        >
          {label}
        </label>
      )}

      {/* Hidden camera input triggered by the camera button */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleCameraCapture(e.target.files[0])}
      />

      <div className="flex gap-1.5 sm:gap-2 relative">
        {/* Unified Search Input with Auto-Suggest */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            id={`${idPrefix}-search-input`}
            type="text"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMessage) setErrorMessage(null);
              setIsDropdownOpen(true);
            }}
            onClick={() => setIsDropdownOpen(true)}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            className={`w-full pl-9 pr-8 rounded-xl border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 transition-all ${
              compact ? 'py-2 text-xs' : 'py-2.5 text-sm'
            }`}
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('All');
                setActiveSourceFilter('all');
                setHighlightedIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Camera Button Right Next to the Search Input */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isCameraScanning}
          title="Take photo of label or barcode with camera"
          className={`flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold transition-all shrink-0 active:scale-95 shadow-2xs ${
            compact ? 'px-2.5 py-2 text-xs' : 'px-3.5 py-2.5 text-xs'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-800" />
          <span className="hidden sm:inline">Camera</span>
        </button>

        {/* Search / Submit Button */}
        <button
          type="button"
          onClick={() => handleSearchOrBarcode()}
          disabled={isLoading || isCameraScanning}
          className={`flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all shrink-0 shadow-2xs disabled:opacity-50 active:scale-95 ${buttonColorClass} ${
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Camera Scanning Progress Notification */}
      {isCameraScanning && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2.5 animate-pulse">
          <Loader2 className="w-4 h-4 text-emerald-800 animate-spin shrink-0" />
          <div className="flex-1">
            <span className="font-bold">{ocrProgress?.status || 'Scanning photo with camera OCR...'}</span>
            <span className="block text-[11px] text-emerald-800/80">Reading ingredients directly inside your browser.</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Auto-Suggest Dropdown: Unified Search Results */}
      {isDropdownOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-stone-100 animate-in fade-in-50 duration-150">
          {/* Header & Source Indicators Bar */}
          <div className="p-3 bg-stone-50 border-b border-stone-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs gap-1.5">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-800" />
                <span>Unified Food Search</span>
                {visibleSuggestions.length > 0 && query.trim().length >= 2 && (
                  <span className="text-[11px] font-normal text-stone-500">
                    ({visibleSuggestions.length} results shown: {sourceCounts.openFoodFacts} Open Food Facts, {sourceCounts.usdaFoodData} USDA Central)
                  </span>
                )}
              </span>

              {(isSearchingSuggestions || isLoadingCategory) && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching both databases...
                </span>
              )}
            </div>

            {/* Source View Filter with accurate 'results shown' label */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                <Filter className="w-3 h-3" /> View:
              </span>
              <button
                type="button"
                onClick={() => setActiveSourceFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 ${
                  activeSourceFilter === 'all'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'bg-stone-200/80 hover:bg-stone-300 text-stone-700'
                }`}
              >
                All Sources ({visibleSuggestions.length} shown)
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceFilter('open_food_facts')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  activeSourceFilter === 'open_food_facts'
                    ? 'bg-emerald-900 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Open Food Facts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceFilter('usda_fdc')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  activeSourceFilter === 'usda_fdc'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>USDA Central</span>
              </button>
            </div>

            {/* Popular Quick Searches */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              <span className="text-[10px] font-bold text-stone-400 shrink-0 uppercase tracking-wider">Quick:</span>
              {POPULAR_QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    inputRef.current?.focus();
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    query.toLowerCase() === term.toLowerCase()
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-stone-200/70 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin pt-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setHighlightedIndex(-1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partial Failure Warning Banner if applicable */}
          {partialFailureNote && (
            <div className="px-3.5 py-1.5 bg-amber-50 text-[11px] text-amber-900 border-b border-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{partialFailureNote}</span>
            </div>
          )}

          {/* Unified Suggestions List */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-stone-100">
            {visibleSuggestions.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 space-y-1.5">
                {isSearchingSuggestions || isLoadingCategory ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 text-emerald-800 animate-spin" />
                    <p className="font-medium text-stone-700">
                      Querying Open Food Facts & USDA FoodData Central...
                    </p>
                  </div>
                ) : isQueryBarcode ? (
                  <>
                    <p className="font-semibold text-stone-800">No product found for barcode &quot;{cleanQueryDigits}&quot;</p>
                    <p className="text-[11px] text-stone-600 max-w-sm mx-auto">
                      No record was found in Open Food Facts or the catalog for this code. Verify the package digits, search by food name, or take a photo with the Camera.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-stone-700">No products found matching &quot;{query}&quot;</p>
                    <p className="text-[11px]">
                      Try typing &quot;Cheerios&quot;, &quot;Rolled Oats&quot;, &quot;Oat Milk&quot;, or scanning a photo with the Camera.
                    </p>
                  </>
                )}
              </div>
            ) : (
              visibleSuggestions.map((item, index) => {
                const isHighlighted = highlightedIndex === index;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors ${
                      isHighlighted ? 'bg-emerald-50/90 text-emerald-950' : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Product Thumbnail or Source-Specific Icon */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0 bg-stone-50"
                        />
                      ) : item.source === 'usda_fdc' ? (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 flex flex-col items-center justify-center shrink-0 text-[9px] font-bold tracking-tight">
                          <Scale className="w-4 h-4 text-blue-800" />
                          <span className="text-[8px] font-mono text-blue-800">USDA</span>
                        </div>
                      ) : item.source === 'direct_barcode' ? (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                          <Barcode className="w-5 h-5 text-emerald-800" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 flex flex-col items-center justify-center shrink-0 text-[9px] font-bold tracking-tight">
                          <Globe className="w-4 h-4 text-emerald-800" />
                          <span className="text-[8px] font-mono text-stone-500">FOOD</span>
                        </div>
                      )}

                      {/* Name, Brand, Ingredient Snippet, & Source Identifiers */}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-900 truncate text-[13px]">
                          {renderHighlightedText(item.name, query)}
                        </div>

                        {/* Optional Ingredient Preview if available */}
                        {item.ingredientPreview && (
                          <p className="text-[11px] text-stone-500 truncate mt-0.5 italic">
                            {item.ingredientPreview}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          {item.brand && (
                            <span className="font-medium text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded-xs">
                              {item.brand}
                            </span>
                          )}

                          {item.calories !== undefined ? (
                            <span className="text-stone-700 font-medium">
                              &bull; {item.calories} cal
                            </span>
                          ) : item.availableData.hasNutrition === false ? (
                            <span className="text-stone-400 text-[10px]">
                              &bull; Nutrition unlisted
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">
                              &bull; Nutrition unverified
                            </span>
                          )}

                          {item.availableData.hasIngredients === true ? (
                            <span className="text-emerald-800 font-medium text-[10px]">
                              &bull; Ingredients listed
                            </span>
                          ) : item.availableData.hasIngredients === false ? (
                            <span className="text-stone-400 text-[10px]">
                              &bull; No ingredients
                            </span>
                          ) : null}

                          {item.availableData.hasAllergens === true ? (
                            <span className="text-amber-800 font-medium text-[10px]">
                              &bull; Allergens declared
                            </span>
                          ) : null}

                          {item.servingSize && (
                            <span className="text-stone-400 hidden sm:inline">
                              ({item.servingSize})
                            </span>
                          )}

                          <span className="font-mono text-[10px] text-stone-400 ml-auto sm:ml-0">
                            {item.sourceIdentifier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Source Badge & Select Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border hidden sm:inline-flex items-center gap-1 ${item.sourceBadgeClass}`}
                      >
                        {item.source === 'usda_fdc' ? (
                          <>
                            <Scale className="w-3 h-3" /> USDA FDC
                          </>
                        ) : item.source === 'open_food_facts' ? (
                          <>
                            <Globe className="w-3 h-3" /> Open Food Facts
                          </>
                        ) : (
                          item.sourceLabel
                        )}
                      </span>

                      <span className="text-emerald-800 font-bold flex items-center gap-0.5 text-xs bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Footer Helper Bar */}
          <div className="px-3.5 py-2 bg-stone-50/90 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
            <span className="flex items-center gap-1 text-stone-500">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>Unified search across Open Food Facts & USDA FoodData Central without switching databases.</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="text-stone-600 hover:text-stone-900 font-semibold px-2 py-0.5 rounded hover:bg-stone-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
