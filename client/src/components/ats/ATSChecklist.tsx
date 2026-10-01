import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ATSRequirement, ATSSectionMatching } from '../../types/ats.types';

interface ATSChecklistProps {
  requirements: ATSRequirement[];
  sectionMatching: ATSSectionMatching;
}

export const ATSChecklist: React.FC<ATSChecklistProps> = ({ requirements, sectionMatching }) => {
  const sections = [
    { key: 'summary', label: 'Professional Summary' },
    { key: 'skills', label: 'Skills Section' },
    { key: 'experience', label: 'Work Experience' },
    { key: 'education', label: 'Education' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Section matching */}
      <Card padding="md">
        <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-3">
          Resume Sections
        </h3>
        <div className="space-y-2">
          {sections.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-white/[0.04] last:border-0">
              <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
              {sectionMatching[key] ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Job requirements */}
      {requirements.length > 0 && (
        <Card padding="md">
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-3">
            Job Requirements
          </h3>
          <div className="space-y-2.5">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {req.met ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-stone-700 dark:text-stone-300 leading-snug">
                    {req.requirement}
                  </p>
                  {req.notes && (
                    <p className="text-[11px] text-stone-400 mt-0.5 flex items-start gap-1">
                      <AlertCircle size={10} className="shrink-0 mt-0.5" />
                      {req.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
