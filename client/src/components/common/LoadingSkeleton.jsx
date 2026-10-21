import React from 'react';

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          <div className="h-3 bg-slate-100 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="h-5 bg-slate-200 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex justify-between gap-4 py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 rounded w-1/5"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse space-y-3"
        >
          <div className="h-5 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="h-8 bg-slate-200 rounded-lg w-full mt-4"></div>
        </div>
      ))}
    </div>
  );
};

export default { CardSkeleton, TableSkeleton, GridSkeleton };
