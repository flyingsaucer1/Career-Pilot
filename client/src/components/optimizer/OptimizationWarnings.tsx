import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ResumeOptimization } from '../../types/optimizer.types';

interface OptimizationWarningsProps {
  optimization: ResumeOptimization;
}

export const OptimizationWarnings: React.FC<OptimizationWarningsProps> = ({ optimization }) => {
  const warnings = optimization.warnings;

  if (!warnings || warnings.length === 0) {
    return (
      <Card padding="md" className="border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 py-4">
          <CheckCircle2 size={16} />
          <p className="text-sm font-medium">No warnings. The optimization looks safe to apply.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4 border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Important Warnings</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          {warnings.length}
        </span>
      </div>

      <ul className="space-y-3">
        {warnings.map((warning, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-amber-200/60 dark:border-amber-900/40"
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle size={12} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{warning}</p>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="p-3 rounded-xl bg-amber-100/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong className="font-semibold">Review each warning carefully.</strong> The AI optimizer preserves all factual information from your original resume
            and only improves wording, structure, and keyword alignment. Never accept changes that add skills, experiences, or achievements you don't actually have.
          </p>
        </div>
      </div>
    </Card>
  );
};