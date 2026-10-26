/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProductRecord } from './types/index.ts';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios.ts';
import { fetchProductByBarcode } from './services/openFoodFacts.ts';
import { fetchUnifiedProductById } from './services/unifiedSearch.ts';
import { useSavedProducts } from './hooks/useStorage.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { AnalyzePage } from './pages/AnalyzePage.tsx';
import { ProductReportPage } from './pages/ProductReportPage.tsx';
import { InvestigatePage } from './pages/InvestigatePage.tsx';
import { ComparePage } from './pages/ComparePage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ShieldCheck, Heart, Github, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeProduct, setActiveProduct] = useState<ProductRecord | null>(null);
  const [investigateQuery, setInvestigateQuery] = useState<string>('');
  const [compareProductA, setCompareProductA] = useState<ProductRecord | undefined>(undefined);
  const [compareProductB, setCompareProductB] = useState<ProductRecord | undefined>(undefined);

  const { savedProducts } = useSavedProducts();

  // Synchronize with URL path & query parameters on load and popstate
  useEffect(() => {
    const handleUrlChange = async () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (path.startsWith('/product/')) {
        const id = path.replace('/product/', '').trim();
        if (id) {
          try {
            const fetched = await fetchUnifiedProductById(id);
            if (fetched) {
              setActiveProduct(fetched);
              setCurrentTab('product');
            } else {
              setCurrentTab('analyze');
            }
          } catch {
            setCurrentTab('analyze');
          }
        }
      } else if (path === '/analyze') {
        setCurrentTab('analyze');
      } else if (path === '/investigate') {
        const q = searchParams.get('q') || '';
        setInvestigateQuery(q);
        setCurrentTab('investigate');
      } else if (path === '/compare') {
        setCurrentTab('compare');
      } else if (path === '/profile') {
        setCurrentTab('profile');
      } else if (path === '/about') {
        setCurrentTab('about');
      } else {
        setCurrentTab('home');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateTo = (tab: string, param?: string) => {
    setCurrentTab(tab);
    let newPath = '/';

    if (tab === 'analyze') {
      newPath = '/analyze';
    } else if (tab === 'investigate') {
      newPath = param ? `/investigate?q=${encodeURIComponent(param)}` : '/investigate';
      if (param) setInvestigateQuery(param);
    } else if (tab === 'compare') {
      newPath = '/compare';
    } else if (tab === 'profile') {
      newPath = '/profile';
    } else if (tab === 'about') {
      newPath = '/about';
    } else if (tab === 'product' && activeProduct) {
      newPath = `/product/${activeProduct.id}`;
    }

    try {
      window.history.pushState({}, '', newPath);
    } catch {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: ProductRecord) => {
    setActiveProduct(product);
    setCurrentTab('product');
    try {
      window.history.pushState({}, '', `/product/${product.id}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCompare = (product: ProductRecord, compareWith?: ProductRecord) => {
    setCompareProductA(product);
    // Pre-select second product as requested benchmark or next scenario
    const secondProduct = compareWith || SAMPLE_SCENARIOS.find((s) => s.id !== product.id) || SAMPLE_SCENARIOS[1];
    setCompareProductB(secondProduct);
    navigateTo('compare');
  };

  const handleNavigateToInvestigate = (term: string) => {
    setInvestigateQuery(term);
    navigateTo('investigate', term);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onNavigate={navigateTo}
        savedCount={savedProducts.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-20 md:pb-12">
        {currentTab === 'home' && (
          <LandingPage
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentTab === 'analyze' && (
          <AnalyzePage
            onProductReady={handleSelectProduct}
            onNavigateToInvestigate={handleNavigateToInvestigate}
          />
        )}

        {currentTab === 'product' && activeProduct && (
          <ProductReportPage
            product={activeProduct}
            onNavigate={navigateTo}
            onStartCompare={handleStartCompare}
          />
        )}

        {currentTab === 'investigate' && (
          <InvestigatePage
            initialQuery={investigateQuery}
            onNavigateToAnalyze={() => navigateTo('analyze')}
          />
        )}

        {currentTab === 'compare' && (
          <ComparePage
            initialProductA={compareProductA}
            initialProductB={compareProductB}
            onNavigateToProduct={handleSelectProduct}
            onNavigateToInvestigate={handleNavigateToInvestigate}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            onSelectProduct={handleSelectProduct}
            onNavigateToAnalyze={() => navigateTo('analyze')}
          />
        )}

        {currentTab === 'about' && <AboutPage />}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 mt-12 py-10 pb-24 md:pb-10 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-stone-900 font-serif text-sm">LabelLens</span>
              <span className="text-[11px] text-stone-400">&bull; Evidence-Based Food Intelligence</span>
            </div>
            <p className="text-[11px] text-stone-500 max-w-md">
              Zero-paid-API architecture. Integrates public Open Food Facts records, USDA FoodData Central, and official FDA 21 CFR guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-stone-600">
            <button onClick={() => navigateTo('analyze')} className="hover:text-emerald-900">
              Analyze Label
            </button>
            <button onClick={() => navigateTo('investigate')} className="hover:text-emerald-900">
              Investigate Additive
            </button>
            <button onClick={() => navigateTo('compare')} className="hover:text-emerald-900">
              Compare Products
            </button>
            <button onClick={() => navigateTo('profile')} className="hover:text-emerald-900">
              Dietary Profile
            </button>
            <button onClick={() => navigateTo('about')} className="hover:text-emerald-900">
              Methodology & Safety
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
          <div>
            &copy; {new Date().getFullYear()} LabelLens. No fabricated facts. Non-medical informational utility.
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Evidence Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
