import { friendlyAuthError } from '../../shared/authErrors';
import { useState } from 'react';
import { EmailAuthProvider, GoogleAuthProvider, multiFactor, reauthenticateWithCredential, reauthenticateWithPopup, sendEmailVerification, TotpMultiFactorGenerator, type TotpSecret } from 'firebase/auth';
import { auth, firebaseLogout } from '../firebase';
import { withNativeMfa } from '../lib/nativeMfa';
import { authenticatedFetch } from '../lib/adminApi';

export function NativeMfaSetup({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const user = auth.currentUser;
  const enrolled = user ? multiFactor(user).enrolledFactors : [];
  const run = async (operation: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await operation(); }
    catch (error: any) {
      setMessage(friendlyAuthError(error, 'mfa'));
    } finally { setBusy(false); }
  };
  const reauthenticate = async () => {
    if (!user) throw new Error('Connexion requise.');
    if (user.providerData.some(provider => provider.providerId === 'password')) {
      if (!password) throw new Error('Votre mot de passe actuel est requis.');
      await withNativeMfa(auth, () => reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email!, password)));
    } else await withNativeMfa(auth, () => reauthenticateWithPopup(user, new GoogleAuthProvider()));
    setPassword('');
  };
  const syncAndSignOut = async () => {
    const response = await authenticatedFetch('/api/account/mfa/sync', { method: 'POST' });
    if (!response.ok) throw new Error('Le facteur Firebase a été modifié, mais la sécurisation des sessions n’a pas abouti. Réessayez « Finaliser » avant de fermer.');
    await firebaseLogout(); onClose();
  };
  return <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="setup-mfa-title">
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 max-w-lg w-full">
      <h2 id="setup-mfa-title" className="font-bold text-xl">Application d’authentification</h2>
      <p>Utilisez Google Authenticator, Microsoft Authenticator ou une application TOTP. Conservez un autre moyen de récupération auprès de votre administrateur.</p>
      {user?.providerData.some(provider => provider.providerId === 'password') && <input aria-label="Mot de passe actuel" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="border rounded-lg p-3 w-full text-slate-900" />}
      {!secret && !enrolled.length && <button disabled={busy} onClick={() => run(async () => {
        await reauthenticate();
        await user!.reload();
        if (!user!.emailVerified) { await sendEmailVerification(user!); throw new Error('Un email de vérification vous a été envoyé. Vérifiez votre adresse, puis réessayez.'); }
        setSecret(await TotpMultiFactorGenerator.generateSecret(await multiFactor(user!).getSession()));
      })} className="bg-emerald-700 text-white rounded-lg p-3">Préparer le second facteur</button>}
      {secret && <>
        <p>Ajoutez un compte avec cette clé dans votre application :</p>
        <code className="block break-all select-all bg-slate-100 text-slate-900 p-3">{secret.secretKey}</code>
        <p>Compte : {user?.email}. Type : TOTP, {secret.codeLength} chiffres, période {secret.codeIntervalSeconds} secondes, algorithme {secret.hashingAlgorithm}.</p>
        <input aria-label="Code de validation TOTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} className="border rounded-lg p-3 w-full text-slate-900" />
        <button disabled={busy || !/^\d{6}$/.test(code)} onClick={() => run(async () => {
          await multiFactor(user!).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code), 'Application d’authentification');
          setSecret(null); setCode(''); await syncAndSignOut();
        })}>Activer et reconnecter</button>
      </>}
      {enrolled.length > 0 && <>
        <p>Second facteur enregistré dans Firebase. La finalisation ferme les anciennes sessions.</p>
        <button disabled={busy} onClick={() => run(async () => { await reauthenticate(); await syncAndSignOut(); })}>Finaliser et reconnecter</button>
        <button disabled={busy} onClick={() => run(async () => {
          await reauthenticate();
          const response = await authenticatedFetch('/api/account/mfa/disable', { method: 'POST' });
          if (!response.ok) throw new Error('La désactivation a été refusée. Vérifiez votre second facteur et réessayez.');
          await firebaseLogout(); onClose();
        })}>Désactiver après vérification</button>
      </>}
      {message && <p role="alert" className="text-red-600">{message}</p>}
      <button disabled={busy} onClick={onClose}>Fermer</button>
    </div>
  </div>;
}
