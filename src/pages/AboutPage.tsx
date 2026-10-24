/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DisclaimerBanner } from '../components/DisclaimerBanner.tsx';
import {
  ShieldCheck,
  BookOpen,
  Database,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Smartphone,
  Lock
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 md:pb-16">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
          Transparency & How it Works
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          About LabelLens
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
          Most food apps give you confusing 1-to-100 &ldquo;health scores&rdquo; or use AI chatbots that can make up convincing answers. LabelLens does something different: we show you what is actually in your food and link directly to real government food rules.
        </p>
      </div>

      {/* Our 5 Golden Rules */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-stone-900 font-serif">
          Our Five Golden Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> 1. Real Facts Only
            </span>
            <p className="text-stone-600 leading-relaxed">
              We never invent nutrition numbers or make up fake safety ratings. Every claim links to real food regulations.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" /> 2. Honest About Unknowns
            </span>
            <p className="text-stone-600 leading-relaxed">
              If an ingredient source is unclear from the box alone (like &ldquo;natural flavors&rdquo;), we tell you straight out instead of guessing.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <Database className="w-4 h-4 text-blue-700 shrink-0" /> 3. Clear Source Origins
            </span>
            <p className="text-stone-600 leading-relaxed">
              We clearly tell you whether a detail was read from your photo or pulled from a public food database.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" /> 4. Safety First
            </span>
            <p className="text-stone-600 leading-relaxed">
              We spot declared allergens, but we never promise a food is 100% allergy-free because factory cross-contact is always a real-world risk.
            </p>
          </div>
        </div>
      </div>

      {/* Where Our Data Comes From */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-stone-900 font-serif">
          Where Our Data Comes From
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                U.S. Food and Drug Administration (FDA) Rules
              </span>
              <a
                href="https://www.ecfr.gov/current/title-21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                Official Regulations <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Used for federal food safety approvals (GRAS), mandatory allergen rules (Milk, Eggs, Fish, Shellfish, Tree nuts, Peanuts, Wheat, Soy, and Sesame), and color additive requirements.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                FDA Food Allergy Guidance (FALCPA & FASTER Act)
              </span>
              <a
                href="https://www.fda.gov/food/food-labeling-nutrition/food-allergies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                fda.gov/food-allergies <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 leading-relaxed text-xs">
              Codified under FALCPA (21 U.S.C. § 343(w)) and the FASTER Act of 2021. Governs mandatory declaration of the Major 9 food allergens (Milk, Eggs, Peanuts, Tree Nuts, Wheat, Soybeans, Sesame, Fish, and Crustaceans). Enforces species-specific naming for tree nuts, fish, and crustaceans, and establishes FDA policy on voluntary precautionary advisory labeling.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                USDA FoodData Central (Agricultural Research Service)
              </span>
              <a
                href="https://fdc.nal.usda.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                fdc.nal.usda.gov <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 leading-relaxed text-xs">
              The flagship food composition database from the U.S. Department of Agriculture. Foundation Foods and SR Legacy provide chemical laboratory analyses of commodities, allowing LabelLens to benchmark commercial packaged foods against analytical ground truth.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                U.S. Electronic Code of Federal Regulations (eCFR Title 21)
              </span>
              <a
                href="https://www.ecfr.gov/current/title-21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                Official Regulations <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 leading-relaxed text-xs">
              Used for federal food safety approvals (GRAS 21 CFR Part 184), ingredient designation rules (21 CFR § 101.4), color additive certification (21 CFR Parts 73 & 74), and cGMP allergen cross-contact controls (21 CFR Part 117).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                Open Food Facts (Public Collaborative Database)
              </span>
              <a
                href="https://world.openfoodfacts.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                openfoodfacts.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 leading-relaxed text-xs">
              A free, open database of packaged foods worldwide contributed by consumers and researchers.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <DisclaimerBanner />
    </div>
  );
};
