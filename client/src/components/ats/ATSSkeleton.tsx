import React from 'react';

export const ATSSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Score hero */}
    <div className="flex gap-6 items-start">
      <div className="w-44 h-44 rounded-full skeleton shrink-0" />
      <div className="flex-1 space-y-3 pt-4">
        <div className="h-5 rounded-xl skeleton w-3/4" />
        <div className="h-3 rounded-xl skeleton w-1/2" />
        <div className="h-3 rounded-xl skeleton w-2/3" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    </div>

    {/* Charts row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-52 rounded-2xl skeleton" />
      <div className="h-52 rounded-2xl skeleton" />
    </div>

    {/* Keywords */}
    <div className="grid grid-cols-2 gap-4">
      <div className="h-40 rounded-2xl skeleton" />
      <div className="h-40 rounded-2xl skeleton" />
    </div>

    {/* Suggestions */}
    <div className="h-56 rounded-2xl skeleton" />
  </div>
);
