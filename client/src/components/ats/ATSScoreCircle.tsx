import React from 'react';
import { cn } from '../../utils/cn';

interface ATSScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const getScoreColor = (score: number) => {
  if (score >= 85) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent' };
  if (score >= 70) return { stroke: '#3b82f6', text: 'text-blue-600 dark:text-blue-400', label: 'Good' };
  if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', label: 'Moderate' };
  if (score >= 30) return { stroke: '#ef4444', text: 'text-red-500 dark:text-red-400', label: 'Poor' };
  return { stroke: '#6b7280', text: 'text-stone-500', label: 'Very Poor' };
};

const sizeMap = {
  sm: { dim: 100, stroke: 8, r: 40, fontSize: 'text-xl', labelSize: 'text-[10px]' },
  md: { dim: 140, stroke: 10, r: 55, fontSize: 'text-3xl', labelSize: 'text-xs' },
  lg: { dim: 180, stroke: 12, r: 72, fontSize: 'text-5xl', labelSize: 'text-sm' },
};

export const ATSScoreCircle: React.FC<ATSScoreCircleProps> = ({ score, size = 'lg' }) => {
  const { dim, stroke, r, fontSize, labelSize } = sizeMap[size];
  const { stroke: strokeColor, text, label } = getScoreColor(score);
  const cx = dim / 2;
  const cy = dim / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-stone-200 dark:text-white/[0.07]"
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold leading-none', fontSize, text)}>{score}</span>
          <span className={cn('font-medium text-stone-400 mt-0.5', labelSize)}>/100</span>
        </div>
      </div>
      <span className={cn('text-xs font-bold uppercase tracking-widest', text)}>{label}</span>
    </div>
  );
};
