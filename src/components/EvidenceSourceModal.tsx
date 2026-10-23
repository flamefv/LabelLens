/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EvidenceSource } from '../types/index.ts';
import { X, ExternalLink, BookOpen, Calendar, ShieldCheck, Building2 } from 'lucide-react';

interface EvidenceSourceModalProps {
  source: EvidenceSource | null;
  onClose: () => void;
}

export const EvidenceSourceModal: React.FC<EvidenceSourceModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Verified Source Citation
        </div>

        <h3 className="text-xl font-bold text-stone-900 font-serif leading-snug mb-3">
          {source.title}
        </h3>

        <div className="space-y-4 text-sm text-stone-600">
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-medium text-stone-700">{source.publisher}</span>
            </div>
            {source.retrievalDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Retrieved: {source.retrievalDate}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-stone-400" />
              <span className="capitalize">{source.sourceType.replace('_', ' ')}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Relevant Text & Statutory Passage:
            </div>
            <blockquote className="p-4 bg-stone-50 border-l-3 border-emerald-800 rounded-r-lg text-xs sm:text-sm text-stone-800 italic leading-relaxed">
              &ldquo;{source.relevantPassage}&rdquo;
            </blockquote>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed">
            LabelLens cites actual official CFR codices, FDA guidance documents, and verified open food databases.
            You can verify this citation directly at the publisher&apos;s authoritative portal.
          </p>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-900 text-stone-100 hover:bg-emerald-950 rounded-lg shadow-2xs transition-colors"
            >
              Open Direct Source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
