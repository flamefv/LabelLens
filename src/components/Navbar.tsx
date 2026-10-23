/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Search, ArrowLeftRight, UserCheck, HelpCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  savedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, savedCount = 0 }) => {
  const navItems = [
    { id: 'analyze', label: 'Scan Label', shortLabel: 'Scan', icon: Camera, primary: true },
    { id: 'investigate', label: 'Check Ingredient', shortLabel: 'Ingredient', icon: Search },
    { id: 'compare', label: 'Compare Foods', shortLabel: 'Compare', icon: ArrowLeftRight },
    { id: 'profile', label: 'Allergies & Diet', shortLabel: 'My Diet', icon: UserCheck, badge: savedCount > 0 ? savedCount : undefined },
    { id: 'about', label: 'How it Works', shortLabel: 'Help', icon: HelpCircle }
  ];

  return (
    <>
      {/* Top Bar for Desktop and Mobile Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo */}
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-900 text-stone-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs transition-transform group-hover:scale-105">
                L<span className="text-emerald-300">L</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-serif">LabelLens</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-800" /> Free & Honest
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 hidden sm:block">Plain-English Food Facts</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-stone-200/80 text-emerald-950 font-bold shadow-2xs'
                        : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-800' : 'text-stone-500'}`} />
                    {item.label}
                    {item.badge !== undefined && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-stone-50 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Header Quick Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => onNavigate('about')}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  currentTab === 'about' ? 'text-emerald-900 bg-stone-200' : 'text-stone-600'
                }`}
                title="How it Works & Safety"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Native-App-Style Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-stone-200/90 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
      >
        <div className="grid grid-cols-4 h-16 items-center px-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center h-full py-1 transition-all ${
                  isActive ? 'text-emerald-900 font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-emerald-100 text-emerald-950 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                  {item.shortLabel}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1/4 px-1 rounded-full text-[9px] bg-emerald-800 text-white font-bold min-w-4 text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
