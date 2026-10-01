import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import type { ResumeOptimization } from '../../types/optimizer.types';

interface OptimizationSummaryProps {
  optimization: ResumeOptimization;
}

export const OptimizationSummary: React.FC<OptimizationSummaryProps> = ({ optimization }) => {
  const stats = [
    { label: 'Experience Changes', value: optimization.experienceChanges.length, icon: <Sparkles size={14} />, color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Project Changes', value: optimization.projectChanges.length, icon: <Zap size={14} />, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Skill Changes', value: optimization.skillChanges.length, icon: <TrendingUp size={14} />, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Bullet Improvements', value: optimization.bulletPointChanges.length, icon: <Bot size={14} />, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Keywords', value: optimization.keywordRecommendations.length, icon: <AlertTriangle size={14} />, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <Card padding="lg" className="space-y-6 border-l-4 border-violet-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">Optimization Summary</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {optimization.summary}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="p-3 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05] text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={cn('text-lg', stat.color)}>{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</div>
            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Optimized Summary Preview */}
      <div className="p-4 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05]">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={14} className="text-violet-500" />
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Optimized Professional Summary
          </span>
        </div>
        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic">
          "{optimization.optimizedSummary}"
        </p>
      </div>

      {/* Overall Changes */}
      {optimization.overallChanges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Key Improvements
          </h4>
          <ul className="space-y-1.5">
            {optimization.overallChanges.map((change, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300"
              >
                <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                </span>
                {change}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {optimization.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            <AlertTriangle size={12} />
            Important Notes
          </h4>
          <ul className="space-y-1">
            {optimization.warnings.map((warning, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"
              >
                <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                {warning}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};