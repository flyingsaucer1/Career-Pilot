import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SkillsDistributionChartProps {
  technicalCount: number;
  softCount: number;
  missingCount: number;
}

const COLORS = ['#6366f1', '#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-surface-700 dark:text-surface-300 mb-1">{label}</p>
        <p style={{ color: payload[0].fill }} className="font-bold">
          {payload[0].value} skill{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export const SkillsDistributionChart: React.FC<SkillsDistributionChartProps> = ({
  technicalCount,
  softCount,
  missingCount,
}) => {
  const data = [
    { name: 'Technical', count: technicalCount },
    { name: 'Soft', count: softCount },
    { name: 'Missing', count: missingCount },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={36} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          className="text-surface-500 dark:text-surface-400"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          className="text-surface-400"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationBegin={200} animationDuration={700}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
