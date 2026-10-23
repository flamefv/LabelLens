/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDietaryPreferences, useSavedProducts } from '../hooks/useStorage.ts';
import { ProductRecord } from '../types/index.ts';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import {
  UserCheck,
  ShieldCheck,
  Plus,
  Trash2,
  RotateCcw,
  Bookmark,
  ArrowRight,
  Check
} from 'lucide-react';

interface ProfilePageProps {
  onSelectProduct: (product: ProductRecord) => void;
  onNavigateToAnalyze: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onSelectProduct, onNavigateToAnalyze }) => {
  const {
    rules,
    toggleRule,
    addCustomRule,
    removeCustomRule,
    resetToDefaults,
    clearAllPreferences
  } = useDietaryPreferences();

  const { savedProducts, removeProduct, clearAllSaved } = useSavedProducts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');

  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customKeywords.trim()) return;

    const keywords = customKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    addCustomRule(customName.trim(), customDesc.trim() || 'Custom avoidance', keywords);
    setCustomName('');
    setCustomDesc('');
    setCustomKeywords('');
    setShowAddForm(false);
  };

  const majorAllergenRules = rules.filter((r) => r.type === 'major_allergen');
  const lifestyleRules = rules.filter((r) => r.type === 'dietary_lifestyle');
  const customRules = rules.filter((r) => r.type === 'custom_avoidance');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <UserCheck className="w-3.5 h-3.5 text-emerald-800" />
          Private to Your Phone &bull; Stored Locally
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          My Allergies & Diet Preferences
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          Turn on alerts for ingredients you avoid. LabelLens will flag them whenever you scan or look up any food.
        </p>
      </div>

      {/* Top 9 Allergens */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3">
        <div className="pb-2 border-b border-stone-200">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            Top 9 Major Allergens
          </h2>
          <p className="text-xs text-stone-500">
            Federal law requires food makers to explicitly declare these 9 allergens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {majorAllergenRules.map((rule) => (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-2 ${
                rule.enabled
                  ? 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-2xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div>
                <span className={`font-bold text-xs ${rule.enabled ? 'text-rose-900' : 'text-stone-800'}`}>
                  {rule.name}
                </span>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                  {rule.description}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                  rule.enabled
                    ? 'bg-rose-700 border-rose-800 text-white'
                    : 'bg-white border-stone-300 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyles & Diets */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
            Diets & Specific Additives
          </h2>
          <p className="text-xs text-stone-500">
            Flags animal ingredients, gluten, synthetic dyes, or palm oil.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {lifestyleRules.map((rule) => (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                rule.enabled
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div>
                <span className={`font-bold text-xs ${rule.enabled ? 'text-emerald-950' : 'text-stone-800'}`}>
                  {rule.name}
                </span>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                  {rule.description}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                  rule.enabled
                    ? 'bg-emerald-800 border-emerald-900 text-white'
                    : 'bg-white border-stone-300 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Avoided Ingredients */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
              Personal Avoidance List
            </h2>
            <p className="text-xs text-stone-500">
              Add your own custom ingredient warnings (e.g. Corn syrup, Aspartame).
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-emerald-900 text-stone-100 text-xs font-semibold hover:bg-emerald-950 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreateCustomRule} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
            <h4 className="font-bold text-stone-900">Add an Ingredient to Avoid</h4>
            <div>
              <label htmlFor="custom-rule-name" className="block font-bold text-stone-700 mb-1">Name of Alert</label>
              <input
                id="custom-rule-name"
                type="text"
                placeholder="e.g. No High Fructose Corn Syrup"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="custom-rule-keywords" className="block font-bold text-stone-700 mb-1">
                Words to Flag (separate with commas)
              </label>
              <input
                id="custom-rule-keywords"
                type="text"
                placeholder="e.g. high fructose corn syrup, hfcs, corn syrup"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-900 text-white rounded-xl font-semibold hover:bg-emerald-950"
              >
                Save Alert
              </button>
            </div>
          </form>
        )}

        {customRules.length > 0 && (
          <div className="space-y-2">
            {customRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-stone-900">{rule.name}</span>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Keywords: {rule.keywords.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      rule.enabled ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {rule.enabled ? 'Active' : 'Off'}
                  </button>
                  <button
                    onClick={() => removeCustomRule(rule.id)}
                    className="p-1 text-stone-400 hover:text-rose-600"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <button
            onClick={resetToDefaults}
            className="text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </button>
          <button
            onClick={clearAllPreferences}
            className="text-stone-500 hover:text-rose-700 font-medium"
          >
            Turn Off All Alerts
          </button>
        </div>
      </div>

      {/* Saved Foods */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-800" />
              Saved Foods ({savedProducts.length})
            </h2>
            <p className="text-xs text-stone-500">
              Quickly re-open past scans or compare them anytime.
            </p>
          </div>
          {savedProducts.length > 0 && (
            <button
              onClick={clearAllSaved}
              className="text-xs font-semibold text-stone-500 hover:text-rose-700"
            >
              Clear All
            </button>
          )}
        </div>

        {savedProducts.length === 0 ? (
          <div className="p-6 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 space-y-1.5">
            <p>You haven&apos;t saved any foods yet.</p>
            <button
              onClick={onNavigateToAnalyze}
              className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
            >
              Scan your first food label &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedProducts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-white flex flex-col justify-between transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">{p.name}</span>
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="text-stone-400 hover:text-rose-600 p-0.5"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500">{p.brand || 'Unbranded'}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-900">
                  <button
                    onClick={() => onSelectProduct(p)}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    View Report <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <DisclaimerBanner />
    </div>
  );
};
