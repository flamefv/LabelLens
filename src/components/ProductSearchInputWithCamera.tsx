/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ProductRecord } from '../types/index.ts';
import { fetchProductByBarcode, searchOpenFoodFacts } from '../services/openFoodFacts.ts';
import { performBrowserOcr, OcrProgress } from '../services/tesseractOcr.ts';
import { extractionToProductRecord } from '../services/labelParser.ts';
import {
  Search,
  Camera,
  Loader2,
  AlertTriangle,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

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
  placeholder = 'Type food name (e.g. Oat Milk) or barcode...',
  onProductSelected,
  idPrefix = 'food-input',
  buttonColorClass = 'bg-emerald-900 hover:bg-emerald-950 text-white',
  compact = false
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{
    code: string;
    name: string;
    brand?: string;
    imageUrl?: string;
  }>>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle Search or Barcode Submit
  const handleSearchOrBarcode = async (overrideQuery?: string) => {
    const rawTerm = (overrideQuery ?? query).trim();
    if (!rawTerm) {
      setErrorMessage('Please type a food name or barcode number.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const isNumericBarcode = /^\d{4,16}$/.test(rawTerm.replace(/[-\s]/g, ''));

    if (isNumericBarcode) {
      const cleanBarcode = rawTerm.replace(/[-\s]/g, '');
      try {
        const product = await fetchProductByBarcode(cleanBarcode);
        if (product) {
          setSearchResults([]);
          onProductSelected(product);
        } else {
          setErrorMessage(`No product found for barcode "${cleanBarcode}". Try searching by food name.`);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lookup failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Search by product name / brand in Open Food Facts
      try {
        const results = await searchOpenFoodFacts(rawTerm);
        setSearchResults(results);
        if (results.length === 0) {
          setErrorMessage(`No products found matching "${rawTerm}". Try another name or take a photo.`);
        }
      } catch {
        setErrorMessage('Search request failed. Please check network connectivity.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Select a result from the search dropdown
  const handleSelectSearchResult = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const product = await fetchProductByBarcode(code);
      if (product) {
        setSearchResults([]);
        setQuery(product.name);
        onProductSelected(product);
      } else {
        setErrorMessage(`Could not load details for barcode "${code}".`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Camera photo capture
  const handleCameraCapture = async (file: File) => {
    setErrorMessage(null);
    setIsCameraScanning(true);
    setOcrProgress({ status: 'Enhancing photo clarity...', progress: 0.15 });

    const previewUrl = URL.createObjectURL(file);

    try {
      const result = await performBrowserOcr(file, (p) => setOcrProgress(p));
      const scannedProduct = extractionToProductRecord(result, previewUrl);
      onProductSelected(scannedProduct);
      setQuery(scannedProduct.name);
      setSearchResults([]);
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

  return (
    <div className="space-y-2 relative">
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

      <div className="flex gap-1.5 sm:gap-2">
        {/* Search or Barcode Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={`${idPrefix}-search-input`}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchOrBarcode();
              }
            }}
            className={`w-full pl-9 pr-8 rounded-xl border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 transition-all ${
              compact ? 'py-2 text-xs' : 'py-2.5 text-sm'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Camera Button Right Next to the Input */}
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

        {/* Find / Search Button */}
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

      {/* Camera Scanning Progress Indicator */}
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

      {/* Live Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="border border-stone-200 bg-white rounded-xl shadow-lg divide-y divide-stone-100 max-h-60 overflow-y-auto z-30">
          <div className="p-2 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Matching Foods (Tap to select)</span>
            <button
              onClick={() => setSearchResults([])}
              className="text-stone-400 hover:text-stone-700"
            >
              Close
            </button>
          </div>
          {searchResults.map((item) => (
            <div
              key={item.code}
              onClick={() => handleSelectSearchResult(item.code)}
              className="p-2.5 hover:bg-emerald-50/70 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-8 h-8 rounded-md object-cover border border-stone-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-stone-100 text-stone-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    FOOD
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-stone-900 block truncate">{item.name}</span>
                  <div className="text-[11px] text-stone-500 truncate">
                    {item.brand && <span>{item.brand} &bull; </span>}
                    <span className="font-mono text-[10px]">UPC: {item.code}</span>
                  </div>
                </div>
              </div>

              <span className="text-emerald-800 font-bold flex items-center gap-1 shrink-0 text-xs">
                Select <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
