import { speechService } from '../utils/speechService';
import React, { useEffect, useRef, useState } from 'react';
import { Save, Volume2 } from 'lucide-react';
import { authenticatedFetch } from '../lib/adminApi';
import { parsePronunciationEntries, PRONUNCIATION_EXAMPLES, type PronunciationEntry } from '../../shared/speechPronunciation';
const format = (entries: PronunciationEntry[]) => entries.map(e => `${e.word} = ${e.pronunciation}`).join('\n');
function parseDraft(value: string) {
  return parsePronunciationEntries(value.split('\n').filter(line => line.trim()).map(line => {
    const split = line.indexOf('=');
    if (split < 1) throw new Error('Utilisez une ligne par nom : nom écrit = prononciation.');
    return { word: line.slice(0, split), pronunciation: line.slice(split + 1) };
  }));
}
export function PronunciationSettings() {
  const [draft, setDraft] = useState('');
  const [sample, setSample] = useState('Bonjour Ester et David. Parlons de Luba, des Bakongo et de Bandundu.');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState<'save' | 'preview' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const media = useRef('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setLoaded(false); setError('');
    void authenticatedFetch('/api/admin/speech-pronunciation', { signal: abort.signal }).then(async r => {
      if (!r.ok) throw new Error('Le dictionnaire ne peut pas être chargé.');
      const data = await r.json();
      if (!abort.signal.aborted) { setDraft(format(parsePronunciationEntries(data.entries))); setLoaded(true); }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => { abort.abort(); request.current?.abort(); if (media.current) URL.revokeObjectURL(media.current); };
  }, [revision]);
  const submit = async (action: 'save' | 'preview') => {
    setError(''); setNotice('');
    let entries: PronunciationEntry[];
    try { entries = parseDraft(draft); } catch (e) { setError(e instanceof Error ? e.message : 'Dictionnaire invalide.'); return; }
    setBusy(action);
    const abort = new AbortController(); request.current = abort;
    try {
      const response = await authenticatedFetch(`/api/admin/speech-pronunciation${action === 'preview' ? '/preview' : ''}`, {
        method: 'POST', signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30000)]), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries, ...(action === 'preview' ? { text: sample } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Opération impossible.');
      if (abort.signal.aborted) return;
      if (action === 'save') { setDraft(format(data.entries)); setNotice('Prononciations enregistrées pour l’audio et la vidéo. Actualisation sous une minute.'); }
      else {
        if (typeof data.audioBase64 !== 'string' || !['audio/mpeg', 'audio/wav'].includes(data.mimeType)) throw new Error('Aperçu audio invalide.');
        const bytes = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
        if (media.current) URL.revokeObjectURL(media.current);
        media.current = URL.createObjectURL(new Blob([bytes], { type: data.mimeType })); setAudioUrl(media.current);
      }
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Opération impossible.'); }
    finally { if (!abort.signal.aborted) setBusy(null); }
  };
  return <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 dark:border-blue-900 dark:bg-blue-950/20" aria-labelledby="pronunciation-title">
    <div><h4 id="pronunciation-title" className="font-semibold">Prononciation des noms propres</h4><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Personnes, provinces, villes et termes du Congo ou d’ailleurs. L’écriture des noms dans les cours et les profils reste inchangée.</p></div>
    {loading ? <p role="status" className="text-sm">Chargement du dictionnaire…</p> : !loaded ? <button type="button" onClick={() => setRevision(n => n + 1)} className="min-h-11 text-sm underline">Réessayer le chargement</button> : <>
      <label className="block text-sm font-medium" htmlFor="pronunciation-dictionary">Vos corrections vocales</label>
      <textarea id="pronunciation-dictionary" aria-describedby="pronunciation-help" value={draft} onChange={e => setDraft(e.target.value)} disabled={!!busy} rows={7} maxLength={42000} placeholder={'Luba = Louba\nBandundu = Bandoundou\nEster = Estère'} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-7 dark:border-slate-700 dark:bg-slate-900" />
      <p id="pronunciation-help" className="text-xs leading-relaxed text-slate-500">Une ligne par nom : nom écrit = ce que la voix doit prononcer. Jusqu’à 200 corrections, prioritaires sur les repères intégrés. Écrivez une approximation lisible en français, sans balises. La prononciation peut varier selon la personne ou la langue.</p>
      <button type="button" disabled={!!busy} className="min-h-11 text-sm font-medium text-blue-700 underline underline-offset-4 dark:text-blue-300" onClick={() => {
        try { const entries = parseDraft(draft); const known = new Set(entries.map(e => e.word.toLocaleLowerCase('fr'))); setDraft(format(parsePronunciationEntries([...entries, ...PRONUNCIATION_EXAMPLES.filter(e => !known.has(e.word.toLocaleLowerCase('fr')))]))); setError(''); }
        catch (e) { setError(e instanceof Error ? e.message : 'Vérifiez les lignes.'); }
      }}>Ajouter les exemples sans remplacer vos corrections</button>
      <label className="block text-sm font-medium" htmlFor="pronunciation-sample">Phrase d’essai</label>
      <input id="pronunciation-sample" value={sample} onChange={e => setSample(e.target.value)} maxLength={300} disabled={!!busy} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!!busy || !sample.trim()} onClick={() => void submit('preview')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-700 disabled:opacity-50 dark:bg-slate-900 dark:text-blue-300"><Volume2 size={16} />{busy === 'preview' ? 'Préparation…' : 'Écouter avant d’enregistrer'}</button>
        <button type="button" disabled={!!busy} onClick={() => void submit('save')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{busy === 'save' ? 'Enregistrement…' : 'Enregistrer les prononciations'}</button>
      </div>
      {audioUrl && <audio src={audioUrl} onPlay={() => speechService.stop()} controls aria-label="Aperçu des prononciations personnalisées" className="w-full" />}
    </>}
    {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
  </section>;
}
