import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface SkillsComparisonProps {
  matchingSkills: string[];
  missingSkills: string[];
}

export const SkillsComparison: React.FC<SkillsComparisonProps> = ({
  matchingSkills,
  missingSkills,
}) => {
  const total = matchingSkills.length + missingSkills.length;
  const pct = total > 0 ? Math.round((matchingSkills.length / total) * 100) : 0;

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">Skills Match</h3>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{pct}% matched</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-stone-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Matched skills */}
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" />
            Matched ({matchingSkills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matchingSkills.length === 0 ? (
              <p className="text-xs text-stone-400">None matched</p>
            ) : (
              matchingSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing skills */}
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <XCircle size={11} className="text-red-500" />
            Missing ({missingSkills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.length === 0 ? (
              <p className="text-xs text-stone-400">All skills matched!</p>
            ) : (
              missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
