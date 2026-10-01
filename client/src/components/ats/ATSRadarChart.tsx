import React, { Suspense } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { ATSReport } from '../../types/ats.types';

// The page is lazy-loaded; keep chart children synchronous for Recharts.

interface ATSRadarChartProps {
  report: ATSReport;
}

export const ATSRadarChart: React.FC<ATSRadarChartProps> = ({ report }) => {
  const data = [
    { subject: 'ATS Score', value: report.atsScore },
    { subject: 'Match %', value: report.matchPercentage },
    { subject: 'Keywords', value: report.keywordMatchPercentage },
    {
      subject: 'Requirements',
      value: report.importantRequirements.length > 0
        ? Math.round(
            (report.importantRequirements.filter((r) => r.met).length /
              report.importantRequirements.length) *
              100
          )
        : 0,
    },
    {
      subject: 'Sections',
      value: Math.round(
        (Object.values(report.sectionMatching).filter(Boolean).length /
          Object.values(report.sectionMatching).length) *
          100
      ),
    },
    {
      subject: 'Skills',
      value:
        report.matchingSkills.length + report.missingSkills.length > 0
          ? Math.round(
              (report.matchingSkills.length /
                (report.matchingSkills.length + report.missingSkills.length)) *
                100
            )
          : 0,
    },
  ];

  return (
    <Card padding="md">
      <h3 className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-4">
        Compatibility Radar
      </h3>
      <Suspense fallback={<div className="h-48 skeleton rounded-xl" />}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <PolarGrid stroke="rgba(120,113,108,0.15)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: '#78716c' }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Suspense>
    </Card>
  );
};
