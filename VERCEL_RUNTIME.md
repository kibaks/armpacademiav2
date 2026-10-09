# Démarrage de l’API Vercel

La PR d’administration a été fusionnée dans `main`. Le premier déploiement servait les nouveaux fichiers du client, mais les API renvoyaient `FUNCTION_INVOCATION_FAILED` malgré une construction réussie.

Le diagnostic du point d’entrée a identifié `ERR_REQUIRE_ESM`. La panne est reproductible lorsque le chargement CommonJS vers ESM est désactivé : Firebase Admin 14.5 charge `jwks-rsa`, qui utilise `require('jose')` alors que cette version de jose est ESM.

Firebase Admin est fixé à 13.10.0 pour conserver un parcours compatible. L’override UUID 11.1.1 corrige la vulnérabilité transitive détectée après ce changement. L’audit npm ne signale aucune vulnérabilité au moment des vérifications.

L’API est compilée explicitement depuis `backend/vercelApp.ts` vers `dist/api.mjs`. `api/index.js` la charge et retourne une erreur JSON 503 en cas d’échec d’initialisation, avec journalisation côté serveur. `vercel.json` inclut ce bundle dans la fonction. Node 22 est fixé dans `package.json`. Le serveur Node autonome demeure `server.ts`.

Vérifications : `npm run lint`, `node --import tsx --test tests/*.test.ts`, `npm run build`, puis `npm run check:api`. Cette dernière commande démarre le vrai point d’entrée compilé avec le chargement CommonJS vers ESM désactivé et vérifie que les routes administratives et d’upload refusent les requêtes sans jeton avec 401, au lieu d’échouer au démarrage.

Une réponse 401 sans jeton confirme le démarrage et le contrôle d’accès ; elle ne valide pas les identifiants Firebase du serveur, les custom claims ou les règles Firestore. Ces éléments nécessitent une session réelle et la configuration cloud correspondante.
