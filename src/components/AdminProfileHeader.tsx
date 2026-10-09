import { LayoutDashboard, RefreshCw, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  loading: boolean;
  updatedAt: string | null;
  onRefresh: () => void;
  onDashboard: () => void;
}

export function AdminProfileHeader({ profile, loading, updatedAt, onRefresh, onDashboard }: Props) {
  return <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="relative h-40 sm:h-52 overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900">
      {profile.coverUrl && <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm"><ShieldCheck className="h-4 w-4" /> ARMP ACADEMIA · ADMINISTRATION</div>
      <p className="absolute bottom-5 right-5 text-xs text-white/90">{profile.institution}</p>
    </div>
    <div className="relative px-5 pb-6 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="relative flex flex-wrap items-end gap-4">
          <div className="relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-3xl font-black text-blue-900 shadow-lg dark:border-slate-900">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : profile.name.slice(0, 1)}
          </div>
          <div className="pt-4"><p className="text-xs font-bold text-blue-700 dark:text-blue-300">{profile.name} · {profile.roleTitle}</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{profile.role === 'super_admin' ? 'Espace superadministrateur' : 'Espace administration'}</h1></div>
        </div>
        <div className="flex flex-wrap gap-2 pt-4">
          <button type="button" disabled={loading} onClick={onRefresh} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`} />Actualiser</button>
          <button type="button" onClick={onDashboard} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800"><LayoutDashboard className="h-4 w-4" />Observatoire</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><p>Gérez les accès, organisez les formations et suivez les résultats.</p><p role="status">{loading ? 'Actualisation en cours…' : updatedAt ? `Comptes actualisés à ${new Date(updatedAt).toLocaleTimeString('fr-FR')}` : 'Chargement des données…'}</p></div>
    </div>
  </header>;
}
