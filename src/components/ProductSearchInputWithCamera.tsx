/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ProductRecord } from '../types/index.ts';
import {
  fetchProductByBarcode,
  searchOpenFoodFactsPaged,
  fetchCategoryFromOpenFoodFacts,
  CATEGORY_SLUG_MAP
} from '../services/openFoodFacts.ts';
import { performBrowserOcr, OcrProgress } from '../services/tesseractOcr.ts';
import { extractionToProductRecord } from '../services/labelParser.ts';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import {
  FOOD_CATALOG,
  CatalogItem,
  catalogItemToProductRecord,
  searchFoodCatalog
} from '../data/foodCatalog.ts';
import {
  searchUsdaFoodData,
  UsdaFoodItem,
  usdaItemToProductRecord,
  usdaItemToNutrition
} from '../services/usdaFoodData.ts';
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
  RefreshCw,
  Scale
} from 'lucide-react';

export interface SuggestionItem {
  id: string;
  name: string;
  brand?: string;
  code: string;
  imageUrl?: string;
  isLocalScenario?: boolean;
  localProduct?: ProductRecord;
  catalogItem?: CatalogItem;
  usdaFoodItem?: UsdaFoodItem;
  category?: string;
  badge?: string;
  calories?: number;
  servingSize?: string;
  sourceType?: 'catalog' | 'scenario' | 'open_food_facts' | 'direct_barcode' | 'usda_fdc';
}

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
  'Peanut Butter'
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
  placeholder = 'Type food name (e.g. Cheerios, Oat Milk) or barcode...',
  onProductSelected,
  idPrefix = 'food-input',
  buttonColorClass = 'bg-emerald-900 hover:bg-emerald-950 text-white',
  compact = false
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-suggest dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [remoteResults, setRemoteResults] = useState<SuggestionItem[]>([]);
  const [remoteTotalCount, setRemoteTotalCount] = useState<number | null>(null);
  const [remoteCurrentPage, setRemoteCurrentPage] = useState(1);

  // Category browse items fetched directly from live API
  const [categoryLiveItems, setCategoryLiveItems] = useState<SuggestionItem[]>([]);
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

  // Fetch live category items from Open Food Facts API when category changes or on initial focus
  useEffect(() => {
    let isCancelled = false;
    const trimmed = query.trim();

    // Only fetch live category products when query is empty or 1 char
    if (trimmed.length < 2 && isDropdownOpen) {
      const slug = CATEGORY_SLUG_MAP[selectedCategory] || 'breakfast-cereals';
      setIsLoadingCategory(true);

      fetchCategoryFromOpenFoodFacts(slug, 1, 40)
        .then((res) => {
          if (isCancelled) return;
          const mapped: SuggestionItem[] = res.products.map((p) => ({
            id: `off-cat-${p.code}`,
            name: p.name,
            brand: p.brand,
            code: p.code,
            imageUrl: p.imageUrl,
            calories: p.calories,
            servingSize: p.servingSize,
            badge: p.brand ? p.brand.split(',')[0].trim() : 'Live Food API',
            sourceType: 'open_food_facts'
          }));
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

  // Compute local catalog suggestions instantly (0ms latency)
  const localCatalogSuggestions = useMemo<SuggestionItem[]>(() => {
    const cleanDigits = query.trim().replace(/[-\s]/g, '');
    const isNumeric = /^\d+$/.test(cleanDigits);

    const items: SuggestionItem[] = [];

    // Direct numeric barcode lookup item
    if (isNumeric && cleanDigits.length >= 3) {
      items.push({
        id: `direct-barcode-${cleanDigits}`,
        name: `Look up Barcode #${cleanDigits}`,
        brand: 'Direct Database Query',
        code: cleanDigits,
        badge: 'Barcode',
        sourceType: 'direct_barcode'
      });
    }

    // Match sample scenarios if query is present
    if (query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      SAMPLE_SCENARIOS.forEach((scenario) => {
        if (
          scenario.name.toLowerCase().includes(qLower) ||
          (scenario.brand && scenario.brand.toLowerCase().includes(qLower))
        ) {
          items.push({
            id: `sample-${scenario.id}`,
            name: scenario.name,
            brand: scenario.brand,
            code: scenario.barcode || scenario.id,
            isLocalScenario: true,
            localProduct: scenario,
            badge: 'Verified Demo',
            calories: scenario.nutritionFacts?.calories,
            servingSize: scenario.servingSize,
            sourceType: 'scenario'
          });
        }
      });
    }

    // Filter rich food catalog by query & active category
    const catalogMatches = searchFoodCatalog(query, selectedCategory);
    catalogMatches.forEach((catItem) => {
      items.push({
        id: `cat-${catItem.id}`,
        name: catItem.name,
        brand: catItem.brand,
        code: catItem.code,
        category: catItem.category,
        badge: catItem.badge,
        calories: catItem.calories,
        servingSize: catItem.servingSize,
        catalogItem: catItem,
        sourceType: 'catalog'
      });
    });

    return items;
  }, [query, selectedCategory]);

  // Debounced live Open Food Facts remote search for expansive global coverage
  useEffect(() => {
    const trimmed = query.trim();
    const isNumeric = /^\d+$/.test(trimmed.replace(/[-\s]/g, ''));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isNumeric && trimmed.length >= 2) {
      setIsSearchingSuggestions(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Fetch in parallel from Open Food Facts API and USDA FoodData Central
          const [paged, usdaFoods] = await Promise.all([
            searchOpenFoodFactsPaged(trimmed, 1, 50).catch(() => ({ products: [], totalCount: 0 })),
            searchUsdaFoodData(trimmed).catch(() => [])
          ]);

          const existingCodes = new Set([
            ...localCatalogSuggestions.map((s) => s.code),
            ...FOOD_CATALOG.map((f) => f.code)
          ]);

          const filteredRemote: SuggestionItem[] = paged.products
            .filter((r) => !existingCodes.has(r.code))
            .map((r) => ({
              id: `off-${r.code}`,
              name: r.name,
              brand: r.brand,
              code: r.code,
              imageUrl: r.imageUrl,
              calories: r.calories,
              servingSize: r.servingSize,
              badge: r.brand ? r.brand.split(',')[0].trim() : 'Open Food Facts',
              sourceType: 'open_food_facts'
            }));

          // Add USDA FoodData Central suggestions
          const usdaSuggestions: SuggestionItem[] = usdaFoods.map((u) => {
            const nut = usdaItemToNutrition(u);
            return {
              id: `usda-${u.fdcId}`,
              name: u.description,
              brand: u.brandOwner || 'USDA Standard Reference',
              code: `FDC-${u.fdcId}`,
              calories: nut.calories,
              servingSize: nut.servingSize,
              badge: 'USDA FoodData Central',
              sourceType: 'usda_fdc',
              usdaFoodItem: u
            };
          });

          setRemoteResults([...usdaSuggestions, ...filteredRemote]);
          setRemoteTotalCount((paged.totalCount || 0) + usdaSuggestions.length);
          setRemoteCurrentPage(1);
        } catch {
          setRemoteResults([]);
          setRemoteTotalCount(null);
        } finally {
          setIsSearchingSuggestions(false);
        }
      }, 250);
    } else {
      setRemoteResults([]);
      setRemoteTotalCount(null);
      setIsSearchingSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, localCatalogSuggestions]);

  // Load more products from Open Food Facts API (Pagination)
  const handleLoadMoreFromApi = async () => {
    const trimmed = query.trim();
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = remoteCurrentPage + 1;

    try {
      if (trimmed.length >= 2) {
        // More search results
        const paged = await searchOpenFoodFactsPaged(trimmed, nextPage, 40);
        const existingCodes = new Set([
          ...localCatalogSuggestions.map((s) => s.code),
          ...remoteResults.map((r) => r.code)
        ]);

        const newItems: SuggestionItem[] = paged.products
          .filter((r) => !existingCodes.has(r.code))
          .map((r) => ({
            id: `off-${r.code}-${nextPage}`,
            name: r.name,
            brand: r.brand,
            code: r.code,
            imageUrl: r.imageUrl,
            calories: r.calories,
            servingSize: r.servingSize,
            badge: r.brand ? r.brand.split(',')[0].trim() : 'Open Food Facts',
            sourceType: 'open_food_facts'
          }));

        setRemoteResults((prev) => [...prev, ...newItems]);
        setRemoteCurrentPage(nextPage);
      } else {
        // More category items
        const slug = CATEGORY_SLUG_MAP[selectedCategory] || 'breakfast-cereals';
        const res = await fetchCategoryFromOpenFoodFacts(slug, nextPage, 40);
        const existingCodes = new Set([
          ...localCatalogSuggestions.map((s) => s.code),
          ...categoryLiveItems.map((r) => r.code)
        ]);

        const newItems: SuggestionItem[] = res.products
          .filter((r) => !existingCodes.has(r.code))
          .map((r) => ({
            id: `off-cat-${r.code}-${nextPage}`,
            name: r.name,
            brand: r.brand,
            code: r.code,
            imageUrl: r.imageUrl,
            calories: r.calories,
            servingSize: r.servingSize,
            badge: r.brand ? r.brand.split(',')[0].trim() : 'Live Food API',
            sourceType: 'open_food_facts'
          }));

        setCategoryLiveItems((prev) => [...prev, ...newItems]);
        setRemoteCurrentPage(nextPage);
      }
    } catch {
      // Ignore load more errors
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Combined suggestions: deduplicated by code
  const allSuggestions = useMemo(() => {
    const map = new Map<string, SuggestionItem>();

    // 1. First add local catalog items
    localCatalogSuggestions.forEach((item) => {
      map.set(item.code, item);
    });

    // 2. If query is active, add remote search results
    if (query.trim().length >= 2) {
      remoteResults.forEach((item) => {
        if (!map.has(item.code)) {
          map.set(item.code, item);
        }
      });
    } else {
      // If query is empty, add live category items
      categoryLiveItems.forEach((item) => {
        if (!map.has(item.code)) {
          map.set(item.code, item);
        }
      });
    }

    return Array.from(map.values());
  }, [localCatalogSuggestions, remoteResults, categoryLiveItems, query]);

  // Handle selecting an item from the auto-suggest list
  const handleSelectSuggestion = async (item: SuggestionItem) => {
    setIsDropdownOpen(false);
    setQuery(item.name);
    setErrorMessage(null);

    // Option 1: Full sample scenario
    if (item.isLocalScenario && item.localProduct) {
      onProductSelected(item.localProduct);
      return;
    }

    // Option 2: Pre-parsed food catalog item
    if (item.catalogItem) {
      const fullRecord = catalogItemToProductRecord(item.catalogItem);
      onProductSelected(fullRecord);
      return;
    }

    // Option 3: USDA FoodData Central record
    if (item.sourceType === 'usda_fdc' && item.usdaFoodItem) {
      const usdaRecord = usdaItemToProductRecord(item.usdaFoodItem);
      onProductSelected(usdaRecord);
      return;
    }

    // Option 4: Remote product from Open Food Facts API
    setIsLoading(true);
    try {
      const product = await fetchProductByBarcode(item.code);
      if (product) {
        onProductSelected(product);
      } else {
        // Construct fallback record from the suggestion so user always gets the product
        const fallbackRecord: ProductRecord = {
          id: item.code,
          name: item.name,
          brand: item.brand,
          barcode: item.code,
          imageUrl: item.imageUrl,
          sourceUrl: `https://world.openfoodfacts.org/product/${item.code}`,
          sourceType: 'open_food_facts',
          dataCompleteness: 'Moderate',
          ingredientsText: 'Ingredients listed on physical container label.',
          ingredientsList: [],
          declaredAllergens: [],
          precautionaryStatements: [],
          nutritionFacts: item.calories
            ? {
                servingSize: item.servingSize || '1 serving',
                calories: item.calories
              }
            : undefined,
          servingSize: item.servingSize,
          sources: [
            {
              title: `Open Food Facts Record: ${item.name}`,
              publisher: 'Open Food Facts Public Database',
              url: `https://world.openfoodfacts.org/product/${item.code}`,
              relevantPassage: `Database match for UPC ${item.code}.`,
              retrievalDate: new Date().toISOString().split('T')[0],
              sourceType: 'public_database'
            }
          ],
          limitations: ['Full ingredient details retrieved from Open Food Facts.'],
          isDemo: false
        };
        onProductSelected(fallbackRecord);
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
      // Direct numeric barcode lookup
      try {
        const product = await fetchProductByBarcode(cleanNum);
        if (product) {
          onProductSelected(product);
        } else {
          setErrorMessage(`No product found for barcode "${cleanNum}". Try searching by food name.`);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lookup failed.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Name search
      const qLower = rawTerm.toLowerCase();

      // Check catalog first
      const catalogMatch = FOOD_CATALOG.find(
        (c) =>
          c.name.toLowerCase().includes(qLower) ||
          c.brand.toLowerCase().includes(qLower) ||
          c.searchKeywords?.some((k) => k.includes(qLower))
      );

      if (catalogMatch) {
        onProductSelected(catalogItemToProductRecord(catalogMatch));
        setIsLoading(false);
        return;
      }

      // Check sample scenarios
      const scenarioMatch = SAMPLE_SCENARIOS.find(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          (s.brand && s.brand.toLowerCase().includes(qLower))
      );

      if (scenarioMatch) {
        onProductSelected(scenarioMatch);
        setIsLoading(false);
        return;
      }

      // Query Open Food Facts remote
      try {
        const paged = await searchOpenFoodFactsPaged(rawTerm, 1, 30);
        if (paged.products.length > 0) {
          const first = paged.products[0];
          const firstProduct = await fetchProductByBarcode(first.code);
          if (firstProduct) {
            onProductSelected(firstProduct);
          } else {
            handleSelectSuggestion({
              id: first.code,
              name: first.name,
              brand: first.brand,
              code: first.code,
              imageUrl: first.imageUrl
            });
          }
        } else {
          setErrorMessage(`No food items found matching "${rawTerm}". Try another name or take a photo with the Camera.`);
        }
      } catch {
        setErrorMessage('Search request failed. Please check network connectivity.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Keyboard navigation for auto-suggest
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchOrBarcode();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < allSuggestions.length) {
        handleSelectSuggestion(allSuggestions[highlightedIndex]);
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
        {/* Search or Barcode Input with Auto-Suggest */}
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

      {/* Auto-Suggest Dropdown with Full Live Open Food Facts API & Local Catalog */}
      {isDropdownOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-stone-100 animate-in fade-in-50 duration-150">
          {/* Header & Status Bar */}
          <div className="p-3 bg-stone-50 border-b border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>Live Open Food Facts Database</span>
                <span className="text-[11px] font-normal text-stone-500">
                  ({allSuggestions.length} items shown
                  {remoteTotalCount && remoteTotalCount > allSuggestions.length
                    ? ` of ${remoteTotalCount.toLocaleString()} in API`
                    : ''}
                  )
                </span>
              </span>

              {(isSearchingSuggestions || isLoadingCategory) && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Querying live API...
                </span>
              )}
            </div>

            {/* Popular Quick-Search Suggestions */}
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

          {/* Suggestions List */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-stone-100">
            {allSuggestions.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 space-y-1.5">
                {isSearchingSuggestions || isLoadingCategory ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 text-emerald-800 animate-spin" />
                    <p className="font-medium text-stone-700">Loading products from Open Food Facts API...</p>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-stone-700">No products found matching &quot;{query}&quot;</p>
                    <p className="text-[11px]">
                      Try typing &quot;Cheerios&quot;, &quot;Oat Milk&quot;, selecting a category pill above, or scanning with the Camera.
                    </p>
                  </>
                )}
              </div>
            ) : (
              allSuggestions.map((item, index) => {
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
                      {/* Product Thumbnail or Type Icon */}
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
                      ) : item.sourceType === 'usda_fdc' ? (
                        <div className="w-10 h-10 rounded-lg bg-blue-100/90 text-blue-900 border border-blue-200 flex flex-col items-center justify-center shrink-0 text-[9px] font-bold tracking-tight">
                          <span>USDA</span>
                          <span className="text-[8px] font-mono text-blue-700">FDC</span>
                        </div>
                      ) : item.sourceType === 'direct_barcode' ? (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-900 flex items-center justify-center shrink-0">
                          <Barcode className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 flex flex-col items-center justify-center shrink-0 text-[9px] font-bold tracking-tight">
                          <span>FOOD</span>
                          <span className="text-[8px] font-mono text-stone-400">ITEM</span>
                        </div>
                      )}

                      {/* Name, Brand, Category, & UPC Details */}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-900 truncate text-[13px]">
                          {renderHighlightedText(item.name, query)}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          {item.brand && (
                            <span className="font-medium text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded-xs">
                              {item.brand}
                            </span>
                          )}
                          {item.calories !== undefined && (
                            <span className="text-stone-600 font-medium">
                              &bull; {item.calories} cal
                            </span>
                          )}
                          {item.servingSize && (
                            <span className="text-stone-400 hidden sm:inline">
                              ({item.servingSize})
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-stone-400 ml-auto sm:ml-0">
                            {item.sourceType === 'usda_fdc' ? item.code : `UPC: ${item.code}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Variety Tag & Select Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border hidden sm:inline-block ${
                            item.sourceType === 'usda_fdc'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : item.badge.includes('Cheerios')
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : item.badge.includes('Brand O’s')
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span className="text-emerald-800 font-bold flex items-center gap-0.5 text-xs bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Button: Load more products from the Open Food Facts API */}
            {allSuggestions.length > 0 &&
              remoteTotalCount &&
              remoteTotalCount > allSuggestions.length && (
                <div className="p-2.5 bg-stone-50 text-center border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleLoadMoreFromApi}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-emerald-900 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isLoadingMore
                        ? 'Fetching more from API...'
                        : `Load 40 more from API (${allSuggestions.length} of ${remoteTotalCount.toLocaleString()} shown)`}
                    </span>
                  </button>
                </div>
              )}
          </div>

          {/* Bottom Footer Helper Bar */}
          <div className="px-3.5 py-2 bg-stone-50/90 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
            <span className="flex items-center gap-1 text-stone-500">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>Full live API enabled: all brands, cereals, milks & snacks loaded directly.</span>
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
