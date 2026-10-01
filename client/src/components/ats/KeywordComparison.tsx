import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface KeywordComparisonProps {
  matchingKeywords: string[];
  missingKeywords: string[];
}

export const KeywordComparison: React.FC<KeywordComparisonProps> = ({
  matchingKeywords,
  missingKeywords,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Matching */}
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
        <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
          Matching Keywords
          <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">({matchingKeywords.length})</span>
        </h3>
      </div>
      {matchingKeywords.length === 0 ? (
        <p className="text-xs text-stone-400">No matching keywords found.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {matchingKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </Card>

    {/* Missing */}
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <XCircle size={15} className="text-red-500 shrink-0" />
        <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">
          Missing Keywords
          <span className="ml-1.5 text-red-500">({missingKeywords.length})</span>
        </h3>
      </div>
      {missingKeywords.length === 0 ? (
        <p className="text-xs text-stone-400">No missing keywords — great match!</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {missingKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </Card>
  </div>
);
