/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ExternalLink, HeartHandshake } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-amber-900">Allergy Reminder:</strong> LabelLens helps you read ingredient lists, but <strong className="font-bold underline">no app can guarantee a food is 100% safe</strong>. Factories sometimes change ingredients or share equipment. If you have a serious allergy, always verify directly with the brand.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 sm:p-6 text-sm text-stone-700 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-amber-100/80 text-amber-900 rounded-xl shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-800" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-stone-900 text-base font-serif">A Quick Note on Food Allergies & Safety</h4>
          <p className="leading-relaxed text-stone-600 text-xs sm:text-sm">
            LabelLens reads real food labels using camera photo scanning and public product databases. We never make up facts, but labels can have real-world limitations:
          </p>
          <ul className="list-disc list-inside text-xs text-stone-600 space-y-1 pt-0.5">
            <li><strong>Shared equipment warnings are voluntary:</strong> A package that doesn&apos;t say &ldquo;May contain peanuts&rdquo; isn&apos;t legally guaranteed to come from a peanut-free factory.</li>
            <li><strong>Recipes change:</strong> Food brands reformulate recipes frequently. A package in your hands might be newer or older than an online database record.</li>
            <li><strong>When in doubt, check with the maker:</strong> For life-threatening allergies or celiac disease, call the brand&apos;s customer service or consult your allergist.</li>
          </ul>
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-800">
            <a
              href="https://www.fda.gov/food/food-labeling-nutrition/food-allergies"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              Official FDA Food Allergy Guide <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
