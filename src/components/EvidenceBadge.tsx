/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EvidenceProvenance, EvidenceStatus, PreferenceMatchLevel } from '../types/index.ts';
import { ShieldCheck, Database, Camera, AlertCircle, HelpCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: EvidenceProvenance;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, className = '' }) => {
  switch (provenance) {
    case 'Read from package':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 ${className}`}>
          <Camera className="w-3.5 h-3.5 text-stone-600" />
          From Package Photo
        </span>
      );
    case 'Database record':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
          <Database className="w-3.5 h-3.5 text-blue-600" />
          Product Database (Open Food Facts)
        </span>
      );
    case 'Official guidance':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Official FDA Rule
        </span>
      );
    case 'Calculated / Normalized':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Calculated for Fair Comparison
        </span>
      );
    case 'Not verified':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 ${className}`}>
          <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
          Unverified
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: EvidenceStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'Authoritative Regulatory Consensus':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          FDA Approved (Generally Recognized as Safe)
        </span>
      );
    case 'Active Regulatory Scrutiny':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          Under Active Scientific Debate
        </span>
      );
    case 'Under Review':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
          Currently Under FDA Review
        </span>
      );
    case 'Inconclusive / Mixed Clinical Data':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-300 ${className}`}>
          <HelpCircle className="w-3.5 h-3.5 text-stone-600" />
          Mixed or Limited Evidence
        </span>
      );
  }
};

interface PreferenceBadgeProps {
  level: PreferenceMatchLevel;
  className?: string;
}

export const PreferenceBadge: React.FC<PreferenceBadgeProps> = ({ level, className = '' }) => {
  switch (level) {
    case 'CONFIRMED_MATCH':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Found in Food (Avoid)
        </span>
      );
    case 'POSSIBLE_MATCH':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Check Label (Shared Kitchen Risk)
        </span>
      );
    case 'INSUFFICIENT_INFO':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300 ${className}`}>
          <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
          Not Mentioned on Package
        </span>
      );
    case 'NO_MATCH_FOUND':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Not Found in Ingredients
        </span>
      );
  }
};
