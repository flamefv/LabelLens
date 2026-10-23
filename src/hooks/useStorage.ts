/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DietaryRule, ProductRecord } from '../types/index.ts';
import { DEFAULT_DIETARY_RULES } from '../services/dietaryEngine.ts';

const PREFERENCES_KEY = 'labellens_dietary_rules_v1';
const SAVED_PRODUCTS_KEY = 'labellens_saved_products_v1';

export function useDietaryPreferences() {
  const [rules, setRules] = useState<DietaryRule[]>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_DIETARY_RULES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(rules));
    } catch (e) {
      console.warn('Failed to save dietary preferences to localStorage', e);
    }
  }, [rules]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const addCustomRule = (name: string, description: string, keywords: string[]) => {
    const newRule: DietaryRule = {
      id: `custom-${Date.now()}`,
      name,
      type: 'custom_avoidance',
      description,
      keywords,
      enabled: true
    };
    setRules((prev) => [newRule, ...prev]);
  };

  const removeCustomRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const resetToDefaults = () => {
    setRules(DEFAULT_DIETARY_RULES);
  };

  const clearAllPreferences = () => {
    setRules(DEFAULT_DIETARY_RULES.map((r) => ({ ...r, enabled: false })));
  };

  return {
    rules,
    toggleRule,
    addCustomRule,
    removeCustomRule,
    resetToDefaults,
    clearAllPreferences
  };
}

export function useSavedProducts() {
  const [savedProducts, setSavedProducts] = useState<ProductRecord[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_PRODUCTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_PRODUCTS_KEY, JSON.stringify(savedProducts));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }, [savedProducts]);

  const saveProduct = (product: ProductRecord) => {
    setSavedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...prev];
    });
  };

  const removeProduct = (id: string) => {
    setSavedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const isSaved = (id: string) => savedProducts.some((p) => p.id === id);

  const clearAllSaved = () => {
    setSavedProducts([]);
    try {
      localStorage.removeItem(SAVED_PRODUCTS_KEY);
    } catch {}
  };

  return {
    savedProducts,
    saveProduct,
    removeProduct,
    isSaved,
    clearAllSaved
  };
}
