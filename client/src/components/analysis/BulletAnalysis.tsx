import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface BulletAnalysisProps {
  weakBullets: string[];
  strongBullets: string[];
  actionVerbs: string[];
}

export const BulletAnalysis: React.FC<BulletAnalysisProps> = ({
  weakBullets,
  strongBullets,
  actionVerbs,
}) => {
  return (
    <div className="space-y-6">
      {/* Strong Bullets */}
      {strongBullets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
            <TrendingUp size={15} />
            Strong Bullets ({strongBullets.length})
          </h4>
          <div className="space-y-2">
            {strongBullets.map((bullet, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{bullet}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Bullets */}
      {weakBullets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
            <TrendingDown size={15} />
            Weak Bullets ({weakBullets.length}) — needs improvement
          </h4>
          <div className="space-y-2">
            {weakBullets.map((bullet, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{bullet}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Action Verbs */}
      {actionVerbs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-2 mb-3">
            <Zap size={15} />
            Strong Action Verbs Used
          </h4>
          <div className="flex flex-wrap gap-2">
            {actionVerbs.map((verb) => (
              <span
                key={verb}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900"
              >
                {verb}
              </span>
            ))}
          </div>
        </div>
      )}

      {strongBullets.length === 0 && weakBullets.length === 0 && (
        <p className="text-sm text-surface-400 italic text-center py-4">No bullet points found in resume.</p>
      )}
    </div>
  );
};
