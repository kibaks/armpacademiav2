export type AuthErrorContext = 'password' | 'google' | 'reset' | 'mfa';

/** Never expose SDK messages or credentials in the authentication UI. */
export function friendlyAuthError(error: unknown, context: AuthErrorContext = 'password'): string {
  const value = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : {};
  const raw = typeof value.message === 'string' ? value.message : typeof error === 'string' ? error : '';
  const code = typeof value.code === 'string' ? value.code : raw.match(/auth\/[a-z-]+/i)?.[0]?.toLowerCase();
  const localMessages = [
    'Connexion requise.',
    'Votre mot de passe actuel est requis.',
    'Un email de vérification vous a été envoyé. Vérifiez votre adresse, puis réessayez.',
    'Le facteur Firebase a été modifié, mais la sécurisation des sessions n’a pas abouti. Réessayez « Finaliser » avant de fermer.',
    'La désactivation a été refusée. Vérifiez votre second facteur et réessayez.',
    'Ce compte nécessite un second facteur non pris en charge. Contactez l’administrateur.',
    'Vérification du second facteur annulée.',
    'Saisissez les six chiffres de votre application.',
    'Ce rôle nécessite une création par le superadministrateur.',
    'Inscription à compléter avant de charger le profil.',
    'La demande et sa pièce dépassent la capacité de stockage. Réduisez la taille du document.',
  ];
  if (!code && localMessages.includes(raw)) return raw;
  if (raw.startsWith('CGPMP_PENDING_ARMP:') || raw.startsWith('CGPMP_REJECTED_ARMP:')) return raw.substring(raw.indexOf(':') + 1);
  if (code === 'auth/operation-not-allowed' || code === 'auth/password-login-disabled') {
    if (context === 'google') return 'La connexion Google n’est pas activée pour cette application. Contactez l’administrateur pour activer Google dans Firebase Authentication.';
    if (context === 'mfa') return 'La double authentification n’est pas disponible pour cette application. Contactez l’administrateur pour vérifier l’activation TOTP dans Firebase Authentication.';
    return 'La connexion par email et mot de passe n’est pas activée pour cette application. Contactez l’administrateur pour activer ce mode dans Firebase Authentication. Réessayer ou changer votre mot de passe ne résoudra pas ce problème.';
  }
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Saisissez une adresse email valide.',
    'auth/missing-password': 'Saisissez votre mot de passe.',
    'auth/invalid-credential': 'L’adresse email ou le mot de passe est incorrect. Vérifiez vos identifiants ou utilisez « Mot de passe oublié ».',
    'auth/wrong-password': 'L’adresse email ou le mot de passe est incorrect. Vérifiez vos identifiants ou utilisez « Mot de passe oublié ».',
    'auth/user-not-found': 'L’adresse email ou le mot de passe est incorrect. Vérifiez vos identifiants ou utilisez « Mot de passe oublié ».',
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée. Connectez-vous ou utilisez « Mot de passe oublié ».',
    'auth/weak-password': 'Ce mot de passe est trop faible. Choisissez au moins 12 caractères et respectez les exigences de sécurité.',
    'auth/password-does-not-meet-requirements': 'Ce mot de passe ne respecte pas les exigences de sécurité. Choisissez un mot de passe plus robuste.',
    'auth/user-disabled': 'Ce compte est désactivé. Contactez l’administrateur.',
    'auth/too-many-requests': 'Trop de tentatives ont été effectuées. Patientez quelques minutes avant de réessayer.',
    'auth/quota-exceeded': 'Le service d’authentification a atteint sa limite temporaire. Réessayez plus tard ou contactez l’administrateur.',
    'auth/network-request-failed': 'La connexion au service d’authentification a échoué. Vérifiez votre connexion internet et réessayez.',
    'auth/unauthorized-domain': 'La connexion Google n’est pas autorisée sur ce domaine. Contactez l’administrateur pour ajouter le domaine de l’application dans Firebase Authentication.',
    'auth/popup-blocked': 'Votre navigateur bloque la fenêtre Google. Autorisez les fenêtres contextuelles pour ce site, puis réessayez.',
    'auth/popup-closed-by-user': 'La fenêtre Google a été fermée avant la fin de la connexion. Réessayez et terminez la connexion dans cette fenêtre.',
    'auth/cancelled-popup-request': 'Une autre connexion Google est déjà en cours. Terminez-la avant de réessayer.',
    'auth/account-exists-with-different-credential': 'Cette adresse utilise déjà une autre méthode de connexion. Connectez-vous avec la méthode utilisée lors de l’inscription.',
    'auth/requires-recent-login': 'Cette opération nécessite une connexion récente. Reconnectez-vous, puis réessayez.',
    'auth/user-token-expired': 'Votre session a expiré. Reconnectez-vous pour continuer.',
    'auth/invalid-user-token': 'Votre session n’est plus valide. Reconnectez-vous pour continuer.',
    'auth/invalid-verification-code': 'Le code de vérification est incorrect. Saisissez le code actuel de votre application d’authentification.',
    'auth/code-expired': 'Le code de vérification a expiré. Recommencez la vérification avec un nouveau code.',
    'auth/invalid-multi-factor-session': 'La vérification a expiré. Recommencez la connexion.',
    'auth/multi-factor-auth-required': 'Un second facteur est requis. Terminez la vérification avec votre application d’authentification.',
    'auth/unverified-email': 'Vérifiez votre adresse email avant d’activer la double authentification.',
    'auth/second-factor-already-in-use': 'Ce second facteur est déjà enregistré sur votre compte.',
    'auth/maximum-second-factor-count-exceeded': 'Le nombre maximal de seconds facteurs est atteint. Contactez l’administrateur.',
    'auth/invalid-api-key': 'Le service d’authentification est mal configuré. Contactez l’administrateur.',
    'auth/app-not-authorized': 'Cette application n’est pas autorisée à utiliser le service d’authentification. Contactez l’administrateur.',
    'auth/web-storage-unsupported': 'Votre navigateur bloque le stockage nécessaire à la connexion. Autorisez les données de ce site ou utilisez un autre navigateur.',
  };
  if (code && messages[code]) return messages[code];
  return 'L’authentification n’a pas pu aboutir. Réessayez. Si le problème persiste, contactez l’administrateur.';
}
