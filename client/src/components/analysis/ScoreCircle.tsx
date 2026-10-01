import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 80) return { label: 'Strong Resume', color: '#10b981', bgBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
  if (score >= 60) return { label: 'Good Potential', color: '#2563eb', bgBadge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
  if (score >= 40) return { label: 'Needs Improvement', color: '#d97706', bgBadge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
  return { label: 'Major Overhaul Needed', color: '#dc2626', bgBadge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' };
};

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  size = 170,
  strokeWidth = 12,
  animated = true,
}) => {
  const config = getScoreConfig(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-100 dark:text-surface-800"
          />
          {/* Score Circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }}
          />
        </svg>

        {/* Center Score Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-extrabold text-surface-900 dark:text-white tabular-nums tracking-tight"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-[11px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider mt-0.5">
            Out of 100
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border', config.bgBadge)}>
          {config.label}
        </span>
      </div>
    </div>
  );
};
