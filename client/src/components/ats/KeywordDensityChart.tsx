import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ATSKeywordDensity } from '../../types/ats.types';

interface KeywordDensityChartProps {
  keywordDensity: ATSKeywordDensity[];
}

const compactLabel = (value: string): string =>
  value.length > 18 ? `${value.slice(0, 16)}…` : value;

export const KeywordDensityChart: React.FC<KeywordDensityChartProps> = ({ keywordDensity }) => {
  const [expanded, setExpanded] = useState(false);
  if (!keywordDensity?.length) return null;

  const ranked = [...keywordDensity].sort((left, right) => {
    const gapDifference = Math.max(right.recommended - right.count, 0) -
      Math.max(left.recommended - left.count, 0);
    return gapDifference || left.keyword.localeCompare(right.keyword);
  });
  const data = expanded ? ranked : ranked.slice(0, 6);
  const chartHeight = expanded ? Math.max(300, data.length * 34) : 220;

  return (
    <Card padding="md" className="h-fit">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
            Keyword density
          </h3>
          {!expanded && ranked.length > 6 && (
            <p className="mt-1 text-[10px] text-stone-400">Top 6 keyword gaps</p>
          )}
        </div>
        {ranked.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-[11px] font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-white/[0.08] dark:text-stone-300 dark:hover:bg-white/[0.05]"
            aria-expanded={expanded}
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {expanded ? 'Compact' : `Expand (${ranked.length})`}
          </button>
        )}
      </div>

      <div className={expanded ? 'max-h-[520px] overflow-y-auto pr-1 [scrollbar-gutter:stable]' : ''}>
        <div style={{ height: chartHeight, minWidth: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
              barCategoryGap="25%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120,113,108,0.18)" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="keyword"
                width={116}
                tickFormatter={compactLabel}
                tick={{ fontSize: 10, fill: '#57534e' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                formatter={(value, name) => [Number(value ?? 0), name]}
                labelFormatter={(label) => String(label)}
                cursor={{ fill: 'rgba(124,58,237,0.05)' }}
                contentStyle={{
                  background: '#1c1b18',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#fafaf9',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, paddingBottom: 8 }}
              />
              <Bar dataKey="count" name="Found" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={8} />
              <Bar dataKey="recommended" name="Recommended" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
