import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, AlertCircle, Info, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Suggestion } from '../../types/analysis.types';
import { cn } from '../../utils/cn';

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
}

const priorityConfig = {
  high: {
    label: 'High Priority',
    icon: <AlertTriangle size={14} />,
    cardClass: 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20',
    badgeClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    iconClass: 'text-red-500',
  },
  medium: {
    label: 'Medium Priority',
    icon: <AlertCircle size={14} />,
    cardClass: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    iconClass: 'text-amber-500',
  },
  low: {
    label: 'Low Priority',
    icon: <Info size={14} />,
    cardClass: 'border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/20',
    badgeClass: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    iconClass: 'text-sky-500',
  },
};

const SuggestionGroup: React.FC<{
  priority: 'high' | 'medium' | 'low';
  items: Suggestion[];
}> = ({ priority, items }) => {
  const [open, setOpen] = useState(priority === 'high');
  const config = priorityConfig[priority];

  if (items.length === 0) return null;

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={config.iconClass}>{config.icon}</span>
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
            {config.label}
          </span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.badgeClass)}>
            {items.length}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-surface-400"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 pt-2">
              {items.map((suggestion, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn('rounded-lg p-3 border', config.cardClass)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                        {suggestion.category}
                      </span>
                      <p className="text-sm text-surface-800 dark:text-surface-200 mt-0.5 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ suggestions }) => {
  const [copied, setCopied] = useState(false);

  const high = suggestions.filter((s) => s.priority === 'high');
  const medium = suggestions.filter((s) => s.priority === 'medium');
  const low = suggestions.filter((s) => s.priority === 'low');

  const handleCopy = async () => {
    const text = suggestions
      .map((s) => `[${s.priority.toUpperCase()}] ${s.category}: ${s.description}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Suggestions copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-surface-400 italic text-center py-6">
        No suggestions generated.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy all suggestions'}
        </button>
      </div>
      <SuggestionGroup priority="high" items={high} />
      <SuggestionGroup priority="medium" items={medium} />
      <SuggestionGroup priority="low" items={low} />
    </div>
  );
};
