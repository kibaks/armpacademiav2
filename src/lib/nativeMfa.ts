import { getMultiFactorResolver, TotpMultiFactorGenerator, type Auth, type MultiFactorError, type UserCredential } from 'firebase/auth';

export type MfaPrompt = { factorNames: string[]; submit: (index: number, code: string) => Promise<void>; cancel: () => void };
let presenter: ((prompt: MfaPrompt | null) => void) | undefined;
let cancelPending: (() => void) | undefined;
export function registerMfaPresenter(handler: (prompt: MfaPrompt | null) => void) {
  presenter = handler;
  return () => { cancelPending?.(); presenter = undefined; };
}
export async function withNativeMfa(auth: Auth, operation: () => Promise<UserCredential>): Promise<UserCredential> {
  try { return await operation(); }
  catch (error: any) {
    if (error?.code !== 'auth/multi-factor-auth-required') throw error;
    const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
    const factors = resolver.hints.filter(hint => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!presenter || !factors.length) throw new Error('Ce compte nécessite un second facteur non pris en charge. Contactez l’administrateur.');
    cancelPending?.();
    return new Promise((resolve, reject) => {
      const finish = () => { cancelPending = undefined; presenter?.(null); };
      const cancel = () => { finish(); reject(new Error('Vérification du second facteur annulée.')); };
      cancelPending = cancel;
      presenter!({
        factorNames: factors.map(factor => factor.displayName || 'Application d’authentification'),
        cancel,
        submit: async (index, code) => {
          if (!/^\d{6}$/.test(code) || !factors[index]) throw new Error('Saisissez les six chiffres de votre application.');
          const credential = await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(factors[index].uid, code));
          finish(); resolve(credential);
        },
      });
    });
  }
}
