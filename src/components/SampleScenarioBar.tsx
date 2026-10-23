/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { ProductRecord } from '../types/index.ts';
import { FlaskConical, ArrowRight } from 'lucide-react';

interface SampleScenarioBarProps {
  onSelectScenario: (product: ProductRecord) => void;
  selectedId?: string;
}

export const SampleScenarioBar: React.FC<SampleScenarioBarProps> = ({
  onSelectScenario,
  selectedId
}) => {
  return (
    <div className="bg-stone-100/80 border border-stone-200/90 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-bold tracking-wider uppercase text-stone-700">
            Automated Demo Scenarios
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            Demonstration Data
          </span>
        </div>
        <p className="text-xs text-stone-500">
          Try complete, audited label scenarios with real CFR citations without uploading
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const isSelected = selectedId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-900 text-stone-100 border-emerald-950 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/30'
              }`}
            >
              <div>
                <div className={`font-semibold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                  {scenario.name}
                </div>
                <div className={`text-[11px] line-clamp-1 ${isSelected ? 'text-emerald-200' : 'text-stone-500'}`}>
                  {scenario.brand}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-100/50">
                <span className={`text-[10px] ${isSelected ? 'text-emerald-300' : 'text-stone-400'}`}>
                  {scenario.declaredAllergens.length > 0 ? `${scenario.declaredAllergens.join(', ')}` : '0 allergens declared'}
                </span>
                <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
