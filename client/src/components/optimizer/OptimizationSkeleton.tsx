import React from 'react';

export const OptimizationSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Summary Card Skeleton */}
    <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/12 skeleton rounded" />
          <div className="h-4 w-5/12 skeleton rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 rounded-xl skeleton" />
        ))}
      </div>
      <div className="p-4 rounded-xl skeleton" />
    </div>

    {/* Experience Changes Skeleton */}
    <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 skeleton rounded" />
        <div className="h-5 w-2/12 skeleton rounded" />
        <div className="w-6 h-6 skeleton rounded-full ml-auto" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-xl skeleton" />
        ))}
      </div>
    </div>

    {/* Project Changes Skeleton */}
    <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 skeleton rounded" />
        <div className="h-5 w-2/12 skeleton rounded" />
        <div className="w-6 h-6 skeleton rounded-full ml-auto" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-xl skeleton" />
        ))}
      </div>
    </div>

    {/* Skills & Bullets Row Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 skeleton rounded" />
          <div className="h-5 w-2/12 skeleton rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-xl skeleton" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 skeleton rounded" />
          <div className="h-5 w-2/12 skeleton rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    </div>

    {/* Keywords Skeleton */}
    <div className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.03] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl skeleton" />
        <div className="h-5 w-3/12 skeleton rounded" />
        <div className="w-6 h-6 skeleton rounded-full ml-auto" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-24 skeleton rounded-lg" />
        ))}
      </div>
    </div>

    {/* Warnings Skeleton */}
    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl skeleton" />
        <div className="h-5 w-2/12 skeleton rounded" />
        <div className="w-6 h-6 skeleton rounded-full ml-auto" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-xl skeleton" />
        ))}
      </div>
    </div>
  </div>
);