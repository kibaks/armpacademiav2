import React from 'react';

export function SkeletonLoader({ label = 'Chargement des données…', rows = 5 }: { label?: string; rows?: number }) {
  return <div role="status" aria-live="polite" aria-busy="true" className="space-y-4 p-6">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
      <div className="h-7 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />)}
    </div>
  </div>;
}
