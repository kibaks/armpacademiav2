import { friendlyAuthError } from '../../shared/authErrors';
import { useEffect, useState } from 'react';
import { registerMfaPresenter, type MfaPrompt } from '../lib/nativeMfa';

export function MfaChallengeDialog() {
  const [prompt, setPrompt] = useState<MfaPrompt | null>(null);
  const [code, setCode] = useState('');
  const [factor, setFactor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => registerMfaPresenter(next => { setPrompt(next); setCode(''); setFactor(0); setError(''); setBusy(false); }), []);
  if (!prompt) return null;
  return <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="mfa-title">
    <form className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 max-w-md w-full" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try { await prompt.submit(factor, code); }
      catch (error) { setError(friendlyAuthError(error, 'mfa')); }
      finally { setBusy(false); }
    }}>
      <h2 id="mfa-title" className="text-xl font-bold">Vérification en deux étapes</h2>
      <p>Entrez le code de votre application d’authentification.</p>
      {prompt.factorNames.length > 1 && <select aria-label="Second facteur" value={factor} onChange={event => setFactor(Number(event.target.value))}>{prompt.factorNames.map((name, index) => <option key={index} value={index}>{name}</option>)}</select>}
      <input aria-label="Code à six chiffres" autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} className="border rounded-lg p-3 w-full text-slate-900" />
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button disabled={busy} className="bg-emerald-700 text-white rounded-lg p-3 w-full">{busy ? 'Vérification…' : 'Vérifier'}</button>
      <button type="button" disabled={busy} onClick={prompt.cancel}>Annuler</button>
    </form>
  </div>;
}
