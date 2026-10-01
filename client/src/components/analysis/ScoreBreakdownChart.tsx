import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ScoreBreakdownChartProps {
  grammarScore: number;
  readabilityScore: number;
  formattingScore: number;
  skillsScore: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900 rounded-lg px-3 py-1.5 shadow-lg text-xs font-medium">
        <p>{payload[0].payload.subject}: <strong className="font-bold">{payload[0].value}/100</strong></p>
      </div>
    );
  }
  return null;
};

export const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({
  grammarScore,
  readabilityScore,
  formattingScore,
  skillsScore,
}) => {
  const data = [
    { subject: 'Grammar', value: grammarScore },
    { subject: 'Readability', value: readabilityScore },
    { subject: 'Formatting', value: formattingScore },
    { subject: 'Skills Match', value: Math.min(skillsScore, 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
        <PolarGrid stroke="currentColor" className="text-surface-200 dark:text-surface-700" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fontWeight: 500, fill: 'currentColor' }}
          className="text-surface-600 dark:text-surface-400"
        />
        <Radar
          name="Sub-Score"
          dataKey="value"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: '#2563eb' }}
          isAnimationActive
          animationDuration={600}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
