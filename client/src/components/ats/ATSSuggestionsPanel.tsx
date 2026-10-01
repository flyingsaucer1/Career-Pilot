import React from 'react';
import { Lightbulb, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ATSImprovementSuggestion } from '../../types/ats.types';
import { cn } from '../../utils/cn';

interface ATSSuggestionsPanelProps {
  suggestions: ATSImprovementSuggestion[];
  strengths: string[];
  weaknesses: string[];
}

const priorityConfig = {
  high: {
    icon: <ArrowUp size={12} />,
    label: 'High',
    badge: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-900/40',
    bar: 'bg-red-500',
  },
  medium: {
    icon: <Minus size={12} />,
    label: 'Medium',
    badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40',
    bar: 'bg-amber-500',
  },
  low: {
    icon: <ArrowDown size={12} />,
    label: 'Low',
    badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40',
    bar: 'bg-blue-500',
  },
};

export const ATSSuggestionsPanel: React.FC<ATSSuggestionsPanelProps> = ({
  suggestions,
  strengths,
  weaknesses,
}) => (
  <div className="space-y-4">
    {/* Improvement suggestions */}
    {suggestions.length > 0 && (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={15} className="text-violet-500" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Improvement Suggestions
          </h3>
        </div>
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const cfg = priorityConfig[s.priority];
            return (
              <div key={i} className="flex gap-3 py-3 border-b border-stone-100 dark:border-white/[0.04] last:border-0">
                {/* Priority bar */}
                <div className={cn('w-1 rounded-full shrink-0 self-stretch', cfg.bar)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                        cfg.badge
                      )}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">{s.category}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {s.suggestion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    )}

    {/* Strengths & Weaknesses */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Strengths */}
      {strengths.length > 0 && (
        <Card padding="md">
          <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
            ✓ Resume Strengths
          </h3>
          <ul className="space-y-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <Card padding="md">
          <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
            ✗ Resume Weaknesses
          </h3>
          <ul className="space-y-1.5">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  </div>
);
