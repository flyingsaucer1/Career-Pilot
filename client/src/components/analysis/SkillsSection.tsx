import React from 'react';
import { Badge } from '../ui/Badge';

interface SkillsSectionProps {
  technicalSkills: string[];
  softSkills: string[];
  missingSkills: string[];
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  technicalSkills,
  softSkills,
  missingSkills,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Technical Skills */}
      <div className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-800/30 border border-surface-200/70 dark:border-surface-700/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
            Technical Skills
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
            {technicalSkills.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {technicalSkills.length > 0 ? (
            technicalSkills.map((skill) => (
              <Badge key={skill} variant="primary" size="sm" className="font-medium">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-surface-400 italic py-1">None detected</p>
          )}
        </div>
      </div>

      {/* Soft Skills */}
      <div className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-800/30 border border-surface-200/70 dark:border-surface-700/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
            Soft & Interpersonal Skills
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
            {softSkills.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {softSkills.length > 0 ? (
            softSkills.map((skill) => (
              <Badge key={skill} variant="success" size="sm" className="font-medium">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-surface-400 italic py-1">None detected</p>
          )}
        </div>
      </div>

      {/* Missing / Recommended Skills */}
      <div className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-800/30 border border-surface-200/70 dark:border-surface-700/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
            Recommended Additions
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
            {missingSkills.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {missingSkills.length > 0 ? (
            missingSkills.map((skill) => (
              <Badge key={skill} variant="danger" size="sm" className="font-medium">
                + {skill}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">No skill gaps detected</p>
          )}
        </div>
      </div>
    </div>
  );
};
