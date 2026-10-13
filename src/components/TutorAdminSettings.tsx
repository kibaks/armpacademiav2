import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw, Volume2, Save } from 'lucide-react';
import { authenticatedFetch } from '../lib/adminApi';
import { AishaAvatar } from './AishaAvatar';
import { speechService, type VoicePersona } from '../utils/speechService';
import { normalizeTutorPresentation, type TutorPresentation } from '../../shared/tutorPresentation';
import type { AvatarEmotion } from '../workers/avatarExpressionWorker';
interface VoiceConfiguration { availability?: Record<string, boolean>; defaultVoiceMode?: string }
interface QuotaState { reason?: string | null; retryAt?: number | null; remainingCredits?: number | null; remainingCharacters?: number | null; remainingTokens?: number | null }
const providers = [{ id: 'cartesia', name: 'Cartesia', description: 'Voix françaises avec horodatage des phonèmes' }, { id: 'elevenlabs', name: 'ElevenLabs', description: 'Secours vocal si configuré' }, { id: 'gemini', name: 'Gemini', description: 'Dernier secours vocal si configuré' }];
const control = 'min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800';
export function TutorAdminSettings() {
  const [settings, setSettings] = useState<TutorPresentation | null>(null);
  const [config, setConfig] = useState<VoiceConfiguration | null>(null);
  const [quota, setQuota] = useState<Record<string, QuotaState> | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [voice, setVoice] = useState<VoicePersona>('vivienne');
  const [emotion, setEmotion] = useState<AvatarEmotion>('smiling');
  const previousVoiceMode = useRef<'studio' | 'device' | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      authenticatedFetch('/api/admin/tutor-presentation', { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error('Impossible de charger les réglages du tuteur.'); return r.json(); }),
      fetch('/api/tts/settings', { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error('Impossible de charger les services vocaux.'); return r.json(); }),
      authenticatedFetch('/api/tts/quota', { signal: controller.signal }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([presentation, voices, budgets]) => { if (active) { setSettings(normalizeTutorPresentation(presentation)); setConfig(voices); setQuota(budgets); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [revision]);
  useEffect(() => speechService.subscribe(state => {
    if (state.currentId?.startsWith('admin-preview-')) { setPlaying(state.isPlaying); if (state.error) setError(state.error); } else if (!state.isPlaying) setPlaying(false);
    if (!state.isPlaying && previousVoiceMode.current) { const mode = previousVoiceMode.current; previousVoiceMode.current = null; speechService.setVoiceMode(mode); }
  }), []);
  useEffect(() => () => { if (speechService.getState().currentId?.startsWith('admin-preview-')) speechService.stop(); if (previousVoiceMode.current) { const mode = previousVoiceMode.current; previousVoiceMode.current = null; speechService.setVoiceMode(mode); } }, []);
  const save = async () => {
    if (!settings || saving) return;
    setSaving(true); setNotice(''); setError('');
    try {
      const response = await authenticatedFetch('/api/admin/tutor-presentation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enregistrement impossible.');
      setSettings(normalizeTutorPresentation(data.settings)); setNotice('Réglages enregistrés. Ils seront chargés à la prochaine ouverture du tuteur, dans un délai maximal d’une minute.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Superadministration</p><h3 className="mt-1 text-xl font-bold">Tuteurs et voix</h3><p className="mt-2 text-sm text-slate-500">Présentation commune, aperçu des animations et état des fournisseurs.</p></div><button type="button" disabled={loading || saving} onClick={() => setRevision(n => n + 1)} aria-label="Actualiser les réglages du tuteur" className={control}><RefreshCw size={17} /></button></div>
    {loading ? <p role="status" className="py-6 text-sm text-slate-500">Chargement des réglages…</p> : error && !settings ? <div role="alert">{error}<button type="button" onClick={() => setRevision(n => n + 1)} className="ml-3 underline">Réessayer</button></div> : settings && <>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <h4 className="font-semibold">Présentation et animations</h4>
          <label className="flex flex-col gap-2 text-sm">Gestuelle de la tête et des épaules<select value={settings.motion} disabled={saving} onChange={e => setSettings({ ...settings, motion: e.target.value as TutorPresentation['motion'] })} className={control}><option value="subtle">Discrète — recommandée</option><option value="expressive">Expressive</option><option value="off">Sans mouvement de posture</option></select></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={saving} checked={settings.facialExpressions} onChange={e => setSettings({ ...settings, facialExpressions: e.target.checked })} className="h-4 w-4 accent-blue-700" />Expressions faciales adaptées à la réponse</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={saving} checked={settings.handGestures} onChange={e => setSettings({ ...settings, handGestures: e.target.checked })} className="h-4 w-4 accent-blue-700" />Gestes de mains pendant les explications</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={saving} checked={settings.autoSpeak} onChange={e => setSettings({ ...settings, autoSpeak: e.target.checked })} className="h-4 w-4 accent-blue-700" />Lecture vocale activée par défaut</label>
          <p className="text-xs leading-relaxed text-slate-500">La synchronisation des lèvres reste active. La préférence de réduction des animations de l’appareil est respectée. Les mains et les manches appartiennent à des postures photographiques complètes. La bouche suit les phonèmes de la voix. Les transitions entre poses ne constituent pas une captation vidéo ni une articulation complète des doigts.</p>
          <button type="button" disabled={saving} onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer la présentation'}</button>
          {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        </div>
        <div className="space-y-3"><div className="h-72 overflow-hidden rounded-2xl"><AishaAvatar variant="studio" tutorPersona={voice} emotion={settings.facialExpressions ? emotion : 'neutral'} motionMode={settings.motion} facialExpressions={settings.facialExpressions} handGestures={settings.handGestures} /></div><label className="flex flex-col gap-1 text-xs">Profil d’essai<select className={control} value={voice} onChange={e => { if (playing) speechService.stop(); setVoice(e.target.value as VoicePersona); }}><option value="henri">Henri — Gérard</option><option value="vivienne">Aïsha — Inès</option></select></label><label className="flex flex-col gap-1 text-xs">Expression d’essai<select className={control} value={emotion} onChange={e => setEmotion(e.target.value as AvatarEmotion)}><option value="smiling">Accueil</option><option value="pedagogical">Explication</option><option value="curious">Réflexion</option><option value="empathetic">Écoute</option><option value="solemn">Rigueur</option></select></label><button type="button" onClick={() => { if (playing) speechService.stop(); else { const original = speechService.getVoiceMode(); speechService.setVoiceMode('studio'); void speechService.play('Bonjour. Prenons le temps de comprendre votre question et avançons ensemble, étape par étape.', `admin-preview-${Date.now()}`, { voice }); previousVoiceMode.current = original; } }} className="inline-flex min-h-11 items-center gap-2 text-sm text-blue-700 dark:text-blue-300"><Volume2 size={16} />{playing ? 'Arrêter l’essai' : 'Tester la voix et les lèvres'}</button></div>
      </div>
      <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">Services vocaux et diagnostics<ChevronDown size={16} /></summary><div className="mt-4 space-y-3">{providers.map(provider => {
        const status = quota?.[provider.id];
        return <div key={provider.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><div><p className="text-sm font-semibold">{provider.name}</p><p className="mt-1 text-xs text-slate-500">{provider.description}</p><p className="mt-2 text-xs text-slate-500">{status?.retryAt && status.retryAt > Date.now() ? `Nouvel essai après ${new Date(status.retryAt).toLocaleTimeString('fr-FR')} (${status.reason === 'quota' ? 'quota atteint' : 'service temporairement indisponible'})` : 'Crédits restants : ' + (status?.remainingCharacters != null ? `${status.remainingCharacters} caractères` : 'non communiqués')}</p></div><span className={`rounded-full px-3 py-1 text-xs ${config?.availability?.[provider.id] ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{config?.availability?.[provider.id] ? 'Configuré' : 'Non configuré'}</span></div>;
      })}<p className="text-xs text-slate-500">Ordre de secours : Cartesia → ElevenLabs → Gemini. Les clés et identifiants vocaux se configurent dans les variables serveur de Vercel. Les diagnostics de quota reflètent cette instance du serveur ; ils ne représentent pas un solde global garanti.</p></div></details>
    </>}
  </section>;
}
