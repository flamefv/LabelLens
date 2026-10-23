/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ProductRecord, LabelExtractionResult } from '../types/index.ts';
import { performBrowserOcr, OcrProgress } from '../services/tesseractOcr.ts';
import { parseLabelText } from '../services/labelParser.ts';
import { fetchProductByBarcode, searchOpenFoodFacts } from '../services/openFoodFacts.ts';
import { SampleScenarioBar } from '../components/SampleScenarioBar.tsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import { ProductSearchInputWithCamera } from '../components/ProductSearchInputWithCamera.tsx';
import {
  Upload,
  Camera,
  Barcode,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface AnalyzePageProps {
  onProductReady: (product: ProductRecord) => void;
  onNavigateToInvestigate?: (term: string) => void;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({ onProductReady }) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'barcode' | 'paste'>('upload');

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ code: string; name: string; brand?: string; imageUrl?: string }>>([]);
  const [isSearchingOff, setIsSearchingOff] = useState(false);

  // Manual Paste state
  const [pasteName, setPasteName] = useState('');
  const [pasteBrand, setPasteBrand] = useState('');
  const [pasteText, setPasteText] = useState('');

  // OCR state
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Review & Correction state
  const [pendingExtraction, setPendingExtraction] = useState<LabelExtractionResult | null>(null);
  const [editedProductName, setEditedProductName] = useState('');
  const [editedIngredientsText, setEditedIngredientsText] = useState('');
  const [editedAllergensText, setEditedAllergensText] = useState('');
  const [editedPrecautionaryText, setEditedPrecautionaryText] = useState('');
  const [editedServingSize, setEditedServingSize] = useState('');

  // General loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Barcode submission
  const handleBarcodeSubmit = async (codeToFetch?: string) => {
    const code = (codeToFetch || barcodeInput).trim();
    if (!code) {
      setErrorMessage('Please type a barcode number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const product = await fetchProductByBarcode(code);
      if (!product) {
        setErrorMessage(
          `No matching product found in the database for barcode "${code}". You can take a photo of the label or type the ingredients manually.`
        );
      } else {
        onProductReady(product);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not reach product database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Search OFF by product name
  const handleSearchOff = async () => {
    if (!barcodeSearchQuery.trim()) return;
    setIsSearchingOff(true);
    setErrorMessage(null);
    try {
      const results = await searchOpenFoodFacts(barcodeSearchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMessage(`No products found matching "${barcodeSearchQuery}". Try scanning the barcode or photo instead.`);
      }
    } catch {
      setErrorMessage('Search request failed. Please check your internet connection.');
    } finally {
      setIsSearchingOff(false);
    }
  };

  // Image Upload handler
  const handleImageFile = async (file: File) => {
    setErrorMessage(null);
    setIsOcrLoading(true);
    setOcrProgress({ status: 'Enhancing photo clarity...', progress: 0.15 });

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);

    try {
      const result = await performBrowserOcr(file, (p) => setOcrProgress(p));
      setPendingExtraction(result);
      setEditedProductName(result.productName || 'Scanned Food Product');
      setEditedIngredientsText(result.extractedIngredients.join(', '));
      setEditedAllergensText(result.declaredAllergens.join(', '));
      setEditedPrecautionaryText(result.precautionaryStatements.join('; '));
      setEditedServingSize(result.servingSize || '');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not read text from this photo. Please try a clearer picture.');
    } finally {
      setIsOcrLoading(false);
      setOcrProgress(null);
    }
  };

  // Manual Paste handler
  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Please paste or type an ingredient list.');
      return;
    }

    setErrorMessage(null);
    const parsed = parseLabelText(pasteText);
    setPendingExtraction(parsed);
    setEditedProductName(pasteName.trim() || parsed.productName || 'Food Item');
    setEditedIngredientsText(parsed.extractedIngredients.length > 0 ? parsed.extractedIngredients.join(', ') : pasteText);
    setEditedAllergensText(parsed.declaredAllergens.join(', '));
    setEditedPrecautionaryText(parsed.precautionaryStatements.join('; '));
    setEditedServingSize(parsed.servingSize || '');
  };

  // Final confirmation after review and correction
  const handleConfirmExtraction = () => {
    if (!pendingExtraction) return;

    const rawIngredientsText = editedIngredientsText.trim();
    const finalParsed = parseLabelText(rawIngredientsText);

    const declaredAllergens = editedAllergensText
      .split(/,|;/)
      .map((s) => s.trim())
      .filter(Boolean);

    const precautionaryStatements = editedPrecautionaryText
      .split(/;|May contain/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const product: ProductRecord = {
      id: `scan-${Date.now()}`,
      name: editedProductName.trim() || 'Scanned Food Product',
      brand: pasteBrand.trim() || pendingExtraction.manufacturer || undefined,
      imageUrl: imagePreviewUrl || undefined,
      sourceType: imagePreviewUrl ? 'package_scan' : 'manual_entry',
      dataCompleteness: rawIngredientsText.length > 20 ? 'Moderate' : 'Partial',
      lastUpdated: new Date().toISOString().split('T')[0],
      ingredientsText: rawIngredientsText,
      ingredientsList: finalParsed.extractedIngredients.map((name, i) => ({
        id: `ing-${i}-${name.slice(0, 10)}`,
        rawName: name,
        normalizedName: name.toLowerCase().trim(),
        provenance: imagePreviewUrl ? 'Read from package' : 'Not verified'
      })),
      declaredAllergens,
      precautionaryStatements,
      servingSize: editedServingSize || undefined,
      nutritionFacts: pendingExtraction.nutritionFacts || undefined,
      sources: [
        {
          title: imagePreviewUrl ? 'Package Label Photo Scan' : 'User-Entered Package Label Text',
          publisher: 'LabelLens In-Browser Reader',
          url: window.location.href,
          relevantPassage: 'Read directly from package photo or typed ingredients list.',
          retrievalDate: new Date().toISOString().split('T')[0],
          sourceType: 'package_label'
        }
      ],
      limitations: [
        'Text was read from a photo or entered manually.',
        'Always double-check spelling against the physical box in your hands.'
      ],
      isDemo: false
    };

    onProductReady(product);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Scan or Look Up Food
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          Take a photo of the ingredient list with your phone, scan a barcode, or paste text.
        </p>
      </div>

      {/* Quick Test Demo Scenarios Bar */}
      <SampleScenarioBar onSelectScenario={onProductReady} />

      {/* Primary Input Container */}
      {!pendingExtraction ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Method Tabs */}
          <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-50/80 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => { setActiveMode('upload'); setErrorMessage(null); }}
              className={`py-3.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-r border-stone-200 ${
                activeMode === 'upload'
                  ? 'bg-white text-emerald-950 border-b-2 border-b-emerald-800'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-800" />
              <span>Camera Photo</span>
            </button>
            <button
              onClick={() => { setActiveMode('barcode'); setErrorMessage(null); }}
              className={`py-3.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-r border-stone-200 ${
                activeMode === 'barcode'
                  ? 'bg-white text-emerald-950 border-b-2 border-b-emerald-800'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Barcode className="w-4 h-4 text-emerald-800" />
              <span>Barcode / Name</span>
            </button>
            <button
              onClick={() => { setActiveMode('paste'); setErrorMessage(null); }}
              className={`py-3.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeMode === 'paste'
                  ? 'bg-white text-emerald-950 border-b-2 border-b-emerald-800'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>Type / Paste</span>
            </button>
          </div>

          <div className="p-5 sm:p-7">
            {/* 1. Camera / Photo Mode */}
            {activeMode === 'upload' && (
              <div className="space-y-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                />

                {isOcrLoading ? (
                  <div className="py-10 text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-emerald-800 animate-spin mx-auto" />
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">{ocrProgress?.status || 'Reading label...'}</h4>
                      <p className="text-xs text-stone-500 mt-1">
                        Scanning directly inside your browser. No private photos sent to outside servers.
                      </p>
                    </div>
                    {ocrProgress && (
                      <div className="max-w-xs mx-auto w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-800 h-full transition-all duration-300"
                          style={{ width: `${Math.round(ocrProgress.progress * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-300 hover:border-emerald-700 rounded-2xl p-6 sm:p-10 text-center transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                      Take a photo of the ingredient list
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
                      For best results, hold your phone steady with good lighting so words are clear and in focus.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-900 text-stone-100 font-bold text-sm hover:bg-emerald-950 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Camera className="w-5 h-5" />
                        Take Photo with Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-100 text-stone-800 border border-stone-300 font-semibold text-sm hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4 text-stone-600" />
                        Upload from Photo Library
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Barcode & Name Search with Camera Mode */}
            {activeMode === 'barcode' && (
              <div className="space-y-6">
                <div>
                  <ProductSearchInputWithCamera
                    idPrefix="analyze-search"
                    label="Search Food by Name or Barcode Number"
                    placeholder="Type food name (e.g. Cheerios, Oat Milk) or barcode (e.g. 044000032029)..."
                    onProductSelected={onProductReady}
                    buttonColorClass="bg-emerald-900 hover:bg-emerald-950 text-white"
                  />
                  <p className="mt-1.5 text-[11px] text-stone-500">
                    💡 You don&apos;t have to type numbers! Search by brand or food name, or tap the Camera button to take a photo.
                  </p>
                </div>

                {/* Popular Barcode Shortcuts */}
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-xs text-stone-500 block mb-2 font-medium">Or tap common groceries to try:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { name: 'Oreo Cookies', code: '044000032029' },
                      { name: 'Nutella', code: '3017620422003' },
                      { name: 'Heinz Ketchup', code: '013000006408' },
                      { name: 'Cheerios', code: '016000275270' }
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => handleBarcodeSubmit(item.code)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-stone-200 transition-colors font-medium flex items-center gap-1.5"
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">({item.code})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Manual Paste Mode */}
            {activeMode === 'paste' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label htmlFor="paste-name-input" className="block font-bold text-stone-700 mb-1">
                    Food Name (Optional)
                  </label>
                  <input
                    id="paste-name-input"
                    type="text"
                    placeholder="e.g. Almond Granola Bar"
                    value={pasteName}
                    onChange={(e) => setPasteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label htmlFor="paste-text-input" className="block font-bold text-stone-700 mb-1">
                    Type or Paste the Ingredients List
                  </label>
                  <textarea
                    id="paste-text-input"
                    rows={5}
                    placeholder="INGREDIENTS: Whole wheat flour, water, cane sugar, yeast, canola oil, salt. CONTAINS: WHEAT. MAY CONTAIN: PEANUTS."
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-stone-300 text-stone-900 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handlePasteSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-900 text-stone-100 font-semibold text-xs hover:bg-emerald-950 transition-colors flex items-center gap-1.5"
                  >
                    Check Ingredients <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Review & Correct Extracted Text */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                Step 2: Confirm What Was Read
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif mt-1">
                Check Text Before Analyzing
              </h2>
            </div>
            <button
              onClick={() => { setPendingExtraction(null); setImagePreviewUrl(null); }}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="review-product-name" className="block font-bold text-stone-700 mb-1">Product Name</label>
              <input
                id="review-product-name"
                type="text"
                value={editedProductName}
                onChange={(e) => setEditedProductName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div>
              <label htmlFor="review-ingredients-text" className="block font-bold text-stone-700 mb-1">
                Ingredients Found (Separate with commas)
              </label>
              <textarea
                id="review-ingredients-text"
                rows={4}
                value={editedIngredientsText}
                onChange={(e) => setEditedIngredientsText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-stone-300 text-stone-900 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="review-declared-allergens" className="block font-bold text-stone-700 mb-1">
                  Allergens Listed on Box (&ldquo;Contains:...&rdquo;)
                </label>
                <input
                  id="review-declared-allergens"
                  type="text"
                  placeholder="e.g. Milk, Soy, Wheat"
                  value={editedAllergensText}
                  onChange={(e) => setEditedAllergensText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label htmlFor="review-precautionary-statements" className="block font-bold text-stone-700 mb-1">
                  Shared Facility Warning (&ldquo;May contain:...&rdquo;)
                </label>
                <input
                  id="review-precautionary-statements"
                  type="text"
                  placeholder="e.g. May contain tree nuts and sesame"
                  value={editedPrecautionaryText}
                  onChange={(e) => setEditedPrecautionaryText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-stone-900 text-xs focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-stone-500">
              You can correct any typos before seeing the report.
            </span>
            <button
              onClick={handleConfirmExtraction}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-900 text-stone-100 font-bold text-xs hover:bg-emerald-950 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              See Food Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <DisclaimerBanner compact />
    </div>
  );
};
