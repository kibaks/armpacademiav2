interface Props { page: number; pages: number; count: number; onChange: (page: number) => void }
export function AdminPagination({ page, pages, count, onChange }: Props) {
  return <nav aria-label="Pagination des résultats" className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
    <p role="status">{count} résultat{count !== 1 ? 's' : ''} · Page {page} sur {pages}</p>
    <div className="flex gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="min-h-11 rounded-xl border border-slate-200 px-4 font-bold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">Précédent</button>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="min-h-11 rounded-xl border border-slate-200 px-4 font-bold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">Suivant</button>
    </div>
  </nav>;
}
