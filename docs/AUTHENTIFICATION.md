# Authentification : Firebase comme identité unique

## Choix retenu

Google et email/mot de passe passent par **Firebase Authentication**. Après connexion, Firebase émet un **ID token JWT**, utilisé comme `Authorization: Bearer <token>` pour les API. Un JWT supplémentaire émis par le serveur n’est pas nécessaire : il ajouterait une seconde session, un second mécanisme de révocation et une synchronisation des comptes.

Les JWT ID Firebase expirent normalement après une heure. Le SDK Firebase renouvelle le jeton avec `getIdToken()` quand nécessaire. L’application ne crée pas de copie du JWT dans ses propres caches ; la persistance de l’identité est gérée par le SDK Firebase.

## Synchronisation et permissions

- L’UID Firebase est l’identifiant des profils `users/{uid}` et des résultats serveur `learningRecords/{uid}` dans la base Firestore nommée du projet.
- L’application écoute `onIdTokenChanged` pour recharger profil et rôles lors du renouvellement du JWT. Elle conserve les vues lors d’un renouvellement sur le même compte, mais efface les données privées lors d’un changement de compte.
- Une synchronisation précédente, ou terminée après déconnexion, ne peut pas remplacer le profil ni les dossiers du compte courant. Les requêtes sont aussi annulées si le compte change pendant la récupération du JWT.
- Le client envoie le JWT uniquement vers les API `/api/` de sa propre origine, sans suivre de redirection. Un en-tête Authorization fourni par un appelant est remplacé par le jeton Firebase courant.
- Firebase Admin vérifie le JWT avec `verifyIdToken(token, true)` : signature/émetteur/projet, expiration et révocation. L’UID et les rôles proviennent du jeton vérifié, pas d’un champ envoyé par le navigateur. Les rôles privilégiés sont des custom claims définis par l’administrateur.
- Les résultats/attestations sont écrits côté serveur. Le client ne synchronise que les champs de profil autorisés par les règles.
- Le second facteur TOTP natif s’applique aux comptes email/mot de passe et Google qui l’ont activé. Le booléen du profil ne peut pas activer la MFA : seuls les facteurs Firebase et la politique serveur font autorité.

## Mise en service

Activer les fournisseurs **Email/Password** et **Google** dans Firebase Authentication, ajouter les domaines de l’application aux domaines autorisés, configurer l’identité Firebase Admin côté serveur et déployer les règles sur la base nommée. L’activation TOTP, le bucket privé et leurs essais réels restent décrits dans `CORRECTIONS_2026-10-11.md`.

Tests locaux du lot JWT : en-tête Firebase imposé, absence de fuite vers une origine externe, annulation pendant un changement de compte, rejet des anciennes synchronisations et refus d’un JWT non signé avec rôle administrateur par le véritable vérificateur Firebase Admin. Ces tests ne remplacent pas une connexion avec des comptes du projet cloud.
