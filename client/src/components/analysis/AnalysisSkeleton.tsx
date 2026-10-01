import React from 'react';
import { Card } from '../ui/Card';

export const AnalysisSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Score and Overview Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="flex flex-col items-center justify-center py-8">
          <div className="w-32 h-32 rounded-full bg-surface-200 dark:bg-surface-700 mb-4" />
          <div className="h-6 w-24 bg-surface-200 dark:bg-surface-700 rounded mb-2" />
          <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded" />
        </Card>

        <Card padding="lg" className="md:col-span-2">
          <div className="h-6 w-48 bg-surface-200 dark:bg-surface-700 rounded mb-6" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-4 w-5/6 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-4 w-4/5 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-4 w-full bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
        </Card>
      </div>

      {/* Skills Analysis Skeleton */}
      <Card padding="lg">
        <div className="h-6 w-40 bg-surface-200 dark:bg-surface-700 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-3">
              <div className="h-5 w-32 bg-surface-200 dark:bg-surface-700 rounded" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((badge) => (
                  <div key={badge} className="h-7 w-16 bg-surface-200 dark:bg-surface-700 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bullet Points & Suggestions Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="h-6 w-48 bg-surface-200 dark:bg-surface-700 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-16 w-full bg-surface-200 dark:bg-surface-700 rounded-lg" />
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div className="h-6 w-48 bg-surface-200 dark:bg-surface-700 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-16 w-full bg-surface-200 dark:bg-surface-700 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
