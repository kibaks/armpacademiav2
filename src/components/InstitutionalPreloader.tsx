import React from 'react';
import { ArmpLogo } from './ArmpLogo';
import { SkeletonLoader } from './SkeletonLoader';
export function InstitutionalPreloader({ isLoading, statusText = 'Chargement de la plateforme…' }: { isLoading: boolean; statusText?: string }) {
 if (!isLoading) return null;
 return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"><div className="flex items-center gap-4 p-6 border-b border-slate-200 dark:border-slate-800"><ArmpLogo size="lg" /><div><p className="font-bold">ACADEMIA ITECH</p><p className="text-sm text-slate-500">{statusText}</p></div></div><div className="max-w-7xl mx-auto"><SkeletonLoader label={statusText} rows={7} /></div></div>;
}
