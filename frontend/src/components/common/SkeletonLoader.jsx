import React from 'react';

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 animate-pulse flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <div className="h-5 w-16 bg-slate-800 rounded-md"></div>
            <div className="h-5 w-12 bg-slate-800 rounded-md"></div>
          </div>
          <div className="h-6 w-3/4 bg-slate-800 rounded-md"></div>
          <div className="h-4 w-full bg-slate-800/60 rounded-md"></div>
          <div className="h-4 w-1/2 bg-slate-800/60 rounded-md"></div>
          <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center">
            <div className="h-6 w-20 bg-slate-800 rounded-md"></div>
            <div className="h-7 w-7 rounded-full bg-slate-800"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableRowSkeleton = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full bg-slate-900/60 border border-slate-800/60 rounded-xl animate-pulse flex items-center px-4 justify-between"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="h-4 w-12 bg-slate-800 rounded"></div>
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
          </div>
          <div className="h-5 w-20 bg-slate-800 rounded-md"></div>
          <div className="h-5 w-16 bg-slate-800 rounded-md"></div>
          <div className="h-6 w-6 rounded-full bg-slate-800"></div>
        </div>
      ))}
    </div>
  );
};

export default { CardSkeleton, TableRowSkeleton };
