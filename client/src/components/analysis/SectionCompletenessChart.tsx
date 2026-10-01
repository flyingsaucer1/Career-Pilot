import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { SectionCompleteness } from '../../types/analysis.types';

interface SectionCompletenessChartProps {
  sectionCompleteness: SectionCompleteness;
}

const SECTION_LABELS: Record<keyof SectionCompleteness, string> = {
  summary: 'Professional Summary',
  education: 'Education',
  experience: 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  achievements: 'Achievements',
};

export const SectionCompletenessChart: React.FC<SectionCompletenessChartProps> = ({
  sectionCompleteness,
}) => {
  const sections = Object.entries(sectionCompleteness) as [keyof SectionCompleteness, boolean][];
  const presentCount = sections.filter(([, v]) => v).length;
  const totalCount = sections.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {presentCount}/{totalCount} sections found
        </span>
        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
          {Math.round((presentCount / totalCount) * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-brand-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(presentCount / totalCount) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sections.map(([key, present], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 py-1.5"
          >
            {present ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            ) : (
              <XCircle size={16} className="text-red-400 shrink-0" />
            )}
            <span
              className={`text-sm ${
                present
                  ? 'text-surface-700 dark:text-surface-300'
                  : 'text-surface-400 dark:text-surface-500 line-through'
              }`}
            >
              {SECTION_LABELS[key]}
            </span>
            {!present && (
              <span className="ml-auto">
                <Lightbulb size={12} className="text-amber-400" />
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
