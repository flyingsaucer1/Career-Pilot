import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { ResumeOptimization } from '../../types/optimizer.types';

interface KeywordRecommendationsProps {
  optimization: ResumeOptimization;
}

export const KeywordRecommendations: React.FC<KeywordRecommendationsProps> = ({ optimization }) => {
  const keywords = optimization.keywordRecommendations;

  if (!keywords || keywords.length === 0) {
    return (
      <Card padding="md" className="border-stone-200/60 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 py-4">
          <Zap size={14} />
          <p className="text-sm">No keyword recommendations.</p>
        </div>
      </Card>
    );
  }

  // Categorize keywords: those in resume (emphasize) vs missing (consider adding)
  // We'll use a simple heuristic: if the warning mentions "not found" it's missing
  const missingKeywords = keywords.filter((k) =>
    optimization.warnings.some((w) => w.toLowerCase().includes(k.toLowerCase()) && w.toLowerCase().includes('not found'))
  );
  const emphasizeKeywords = keywords.filter(
    (k) => !missingKeywords.some((mk) => mk.toLowerCase() === k.toLowerCase())
  );

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 dark:text-white">Keyword Recommendations</h3>
        <Badge variant="default" className="ml-auto text-[10px]">
          {keywords.length} total
        </Badge>
      </div>

      {emphasizeKeywords.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            Keywords in your resume — emphasize these
          </h4>
          <div className="flex flex-wrap gap-2">
            {emphasizeKeywords.map((keyword, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
            These keywords from the job description already exist in your resume. Ensure they appear prominently in your summary, skills, and experience sections.
          </p>
        </div>
      )}

      {missingKeywords.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/[0.05]">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} />
            Keywords missing from your resume
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
            These keywords appear in the job description but were not found in your resume.
            <strong> Only add them if you genuinely possess these skills. </strong>
            Never fabricate skills or experience.
          </p>
        </div>
      )}

      {emphasizeKeywords.length === 0 && missingKeywords.length === 0 && keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium"
            >
              {keyword}
            </motion.span>
          ))}
        </div>
      )}
    </Card>
  );
};