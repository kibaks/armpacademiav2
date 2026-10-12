import { useEffect, useState } from 'react';
import { ArmpLogo } from './ArmpLogo';

export function PasswordActivation({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { window.history.replaceState(null, '', window.location.pathname + window.location.search); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) { setMessage('Les mots de passe doivent être identiques.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/password/confirm', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Réinitialisation indisponible.');
      setPassword(''); setConfirmation(''); setDone(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Serveur indisponible.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#08244D] flex items-center justify-center p-6">
    <section className="bg-white rounded-2xl p-8 w-full max-w-md space-y-6">
      <ArmpLogo size="xl" />
      <h1 className="text-xl font-extrabold text-[#08244D]">Définir votre mot de passe</h1>
      {done ? <><p className="text-emerald-700">Votre mot de passe est enregistré. Connectez-vous avec votre email et ce nouveau mot de passe.</p><button onClick={onComplete} className="bg-blue-900 text-white rounded-xl p-3 w-full font-bold">Retour à la connexion</button></> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">Nouveau mot de passe<input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 border rounded-xl p-3 w-full" /></label>
        <p className="text-xs text-slate-600">12 caractères minimum.</p>
        <label className="block text-sm font-bold">Confirmer le mot de passe<input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 border rounded-xl p-3 w-full" /></label>
        {message && <p role="alert" className="text-red-700 text-sm">{message}</p>}
        <button disabled={busy} className="bg-blue-900 text-white rounded-xl p-3 w-full font-bold disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</button>
        <button type="button" onClick={onComplete} className="text-sm text-blue-900 underline">Retour à la connexion</button>
      </form>}
    </section>
  </main>;
}
