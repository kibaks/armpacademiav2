# Fix Google Auth — armpacademia.vercel.app non autorisé

## Diagnostic confirmé 2026-09-23 15:29 UTC
Console live Vercel :
```
Info: The current domain is not authorized for OAuth operations.
This will prevent signInWithPopup... Add your domain (armpacademia.vercel.app)
to the OAuth redirect domains list in the Firebase console -> Authentication -> Settings -> Authorized domains tab.
```
→ Cause : domaine Vercel absent de la whitelist Firebase + OAuth Google.

## Correctif code (déjà pushé)

**1. `src/firebase.ts`**
- `googleProvider.setCustomParameters({prompt:'select_account'})` + scopes email/profile
- log `console.info('[Firebase Auth] Origin: ... doit être dans Authorized domains')` pour debug

**2. `src/components/AuthModal.tsx`**
- `getFriendlyAuthError` étendu : détecte `auth/unauthorized-domain`, `is not authorized`, `unauthorized domain`, `auth/operation-not-allowed`, `popup-blocked`, `network-request-failed`, etc. et affiche message français clair.
- Message pour domaine non autorisé :
  > Domaine armpacademia.vercel.app non autorisé côté Firebase. Admin : Firebase Console → Authentication → Settings → Authorized domains → Ajouter « armpacademia.vercel.app » puis réessayez. En attendant, utilisez Email/Mot de passe ou Accès démo.
- UI : boîte ambrée avec lien direct + instructions quand `stepError` contient `Authorized domains`.

Build `index-Cf6Zqbyw.js` contient bien `Authorized domains` (6 occurrences) et `armpacademia.vercel.app` (8).

## Action manuelle requise (2 min, à faire par propriétaire Firebase)

### A. Firebase Console
1. Ouvrir https://console.firebase.google.com/project/gen-lang-client-0775786837/authentication/settings
2. Onglet **Authorized domains** (ou **Paramètres → Domaines autorisés**)
3. Cliquer **Add domain** / **Ajouter un domaine**
4. Saisir `armpacademia.vercel.app` → **Add** / **Ajouter**
5. Optionnel mais recommandé : ajouter `armpacademia-*.vercel.app` pour previews Vercel (wildcard accepté) si vous utilisez des deployments preview.
6. Vérifier que `gen-lang-client-0775786837.firebaseapp.com` et `localhost` restent présents.
7. Sauvegarder → effet immédiat (~30s).

### B. Google Cloud Console (OAuth consent)
1. Ouvrir https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0775786837
2. Dans **OAuth 2.0 Client IDs**, cliquer sur `244392088692-hkl1n6f5a00jf8k2olikrtb6gsirtngh.apps.googleusercontent.com`
3. Section **Authorized JavaScript origins** → **Add URI** → `https://armpacademia.vercel.app`
4. Section **Authorized redirect URIs** → ajouter `https://gen-lang-client-0775786837.firebaseapp.com/__/auth/handler`
5. Sauvegarder.

### C. Vérification
- Recharger https://armpacademia.vercel.app/ (Ctrl+Shift+R), ouvrir console (F12), vérifier absence du log `not authorized`.
- Cliquer **Se connecter → Continuer avec Google** → popup Google → choisir compte → toast `Connexion Google réussie`.
- En cas d’erreur persistante, vider cache ou tester en navigation privée.

## Contournement immédiat pour utilisateurs finaux
Pendant la propagation, **Email/Mot de passe** et **Accès démo** (CGPMP / ARMP / DGCMP / Secteur Privé) fonctionnent sans domaine autorisé — ils utilisent `signInWithEmailAndPassword` et `signInWithPopup` local, pas OAuth redirect. Boutons visibles dans l’AuthModal sous le séparateur « ou avec identifiants officiels ».

## Preuve
- Test Puppeteer live 2026-09-23 : `CONSOLE: ...not authorized ... Add your domain (armpacademia.vercel.app)...` reproduit.
- Après correctif, le modal affichera l’alerte ambrée avec lien direct vers Firebase Console.
- Prochains logs : ` [Firebase Auth] Origin: https://armpacademia.vercel.app — doit être dans ...` si domaine encore absent.

## Vercel Env
`firebase-applet-config.json` est embarqué (pas de `VITE_*` requis). Si vous migrez vers env vars, assurez `VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0775786837.firebaseapp.com` sur Vercel → Project → Settings → Environment Variables → Redeploy.

---
Commit : fix(auth): messages clairs domaine non autorisé + lien console (pushé main) — Vercel redeploy auto.
