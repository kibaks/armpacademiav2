# Audit technique — ARMP Academia v2

Date : 10 octobre 2026. Dépôt : [kibaks/armpacademiav2](https://github.com/kibaks/armpacademiav2). Branche principale examinée : `main`, commit figé `eea6a541617ef3411790232da8565b522852e799` (dernier commit daté du 9 octobre).

## Conclusion

Le projet dispose d’une base utilisable : identité Firebase, rôles privilégiés par custom claims, gestion administrative effective et correction serveur des tests administratifs. Cependant, **la MFA ne constitue pas une barrière serveur et les certifications ne sont pas encore des preuves fiables**. Le parcours CGPMP annonce des comptes actifs sans les provisionner. La version Vercel ne supporte pas plusieurs fonctions proposées par l’interface. Les tableaux pédagogiques et institutionnels contiennent encore des simulations présentées comme des mesures.

Traiter P0 avant une mise en service institutionnelle s’appuyant sur ces garanties ; traiter P1 avant de considérer les parcours métier fiables. Les points P2 améliorent la robustesse, l’exploitation et la maintenabilité. Ce sont des priorités proposées, pas des modifications déjà appliquées.

## Périmètre et niveau de preuve

- Arborescence complète obtenue depuis GitHub, non tronquée. **100 fichiers texte hors médias** récupérés localement ; leur SHA Git a été vérifié, sans différence avec ce commit. Environ **56 176 lignes** de sources et scripts cartographiées.
- Revue des surfaces backend/Firestore, de l’authentification, des comptes/dossiers CGPMP, examens/certificats, cours/Q&A, studio médias, tuteur/voix, statistiques, build, dépendances et documentation. Les images, audios et vidéos sont inventoriés ; leur contenu et qualité visuelle n’ont pas été audités.
- Relecture de `AUDIT_SUPERADMIN.md` et contrôle de ses constats contre le code courant. Son ancien bilan de tests/audit npm n’est **pas** repris comme validation de cette session.
- Références figées au commit pour chaque constat, sans modification du dépôt distant ni des données de production.
- Vérifications locales réussies : intégrité des 100 blobs ; comparaison des routes ; reproduction du calcul 0/5 → 75 et liste vide → 75 ; TypeError sur expression du tuteur ; inspection des champs protégés ; six assertions de l’export CSV sur la vraie fonction ; calcul des collisions ; dépendance ws transitive. Résultats dans [evidence.json](evidence.json), script [verify.mjs](verify.mjs).
- L’historique confirme une clé de stockage littérale dans le commit `e928bfa57528f72e5d9cdffd25e42ab82671e5b8`. La valeur n’est ni reproduite ni testée contre le fournisseur. Sa révocation est inconnue.
- `npm ci --ignore-scripts --offline` échoue avec ENOTCACHED ; installation normale échoue avec EPERM sur le proxy npm. **Compilation, suite complète des tests, check:api et npm audit n’ont pas pu être exécutés.** Runtime disponible Node 24.19.0 ; le projet demande Node 22.x. Les assertions CSV utilisent le retrait natif des types Node, pas la toolchain du projet.
- Aucun test navigateur, appel d’attaque, envoi d’email ou opération de création/suppression n’a été exécuté sur la production. Règles Firebase réellement déployées, configurations fournisseur, URL de déploiement et MFA cloud non vérifiées. Un constat « code confirmé » n’affirme pas qu’il a été exploité en production.

## Architecture observée

| Couche | Implémentation | Observation |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite, Tailwind ; App + grandes vues modales | Gestion d’état et caches locaux fortement couplés aux parcours métier |
| Identité | Firebase Auth ; custom claims pour privilèges | Bon socle ; OTP email historique uniquement applicatif |
| Données | Firestore, base nommée depuis firebase-applet-config.json | Règles versionnées ; profils portent encore données personnelles et preuves pédagogiques |
| Serveur Node | server.ts, Express 4 | IA, voix, OTP, CGPMP ; API admin/learning/storage partagées |
| Serveur Vercel | api/index.js → dist/api.mjs → backend/vercelApp.ts | Plusieurs API et capacités diffèrent de Node |
| Administration | backend/admin.ts + AdminSpace | Gestion Auth/claims/profils réelle ; opérations multi-services séquentielles |
| Médias | service Academia externe ; backend/storage.ts pour images | Images authentifiées ; autres opérations directes historiques |
| IA/voix | Arena, Gemini, ElevenLabs, Edge TTS, repli Google | Sélection/provenance à corriger ; quotas et tests fournisseur nécessaires |
| Données initiales | src/data/* et DEMO_PROFILES | Des valeurs de démonstration alimentent les écrans de production |
| Qualité | trois fichiers de tests | Pas de workflow Actions ni de tests des règles/parcours dans ce snapshot |

## Protections existantes vérifiées dans le code

1. `authenticate` vérifie les jetons Firebase avec contrôle de révocation ; `requireAdmin` et `superOnly` exigent les claims adéquats. Gestion des accès réservée au superadmin ; lecture DFAT permise.
2. Les changements de rôle, suppression et suspension protègent le compte courant et les superadministrateurs existants.
3. Les règles utilisateurs interdisent la modification directe de role/id/email/disabled. Un rôle local ou une donnée de profil n’est pas une preuve de privilège serveur.
4. Les démos de connexion exigent DEV et VITE_ENABLE_DEMO=true. Il ne faut pas réintroduire ces accès en corrigeant les parcours.
5. Les tests administratifs actifs sont livrés sans answer ; la tentative est corrigée transactionnellement avec l’identité du jeton, sans croire score/passed/profileId du client.
6. Les images ont un relais authentifié, une limite de 3 Mo, des signatures de format et une validation de l’origine de l’URL retournée. L’identité uploaded_by est dérivée du jeton.
7. L’export CSV neutralise les formules de tableur ; six assertions correspondantes sont passées localement.
8. Le paramétrage vocal Vercel retourne 501 au lieu d’une fausse sauvegarde. Le code OTP n’est pas renvoyé en production si l’email échoue ; cela ne rend pas ce mécanisme MFA contraignant.

## Registre des constats

P0 : sécurité/intégrité à contenir en premier. P1 : parcours métier ou fiabilité à corriger dans les premiers lots. P2 : durcissement et qualité. La gravité décrit l’impact ; la priorité inclut l’usage institutionnel et les dépendances.

| ID | Priorité | Gravité | Constat |
| --- | --- | --- | --- |
| F01 | P0 | Élevée | Double authentification non imposée |
| F02 | P0 | Élevée | Niveaux et certifications falsifiables |
| F03 | P0 | Élevée | API IA et voix publiques sans quotas applicatifs |
| F04 | P0 | Élevée | Entrées mal typées non interceptées dans le tuteur |
| F05 | P0 | Élevée | Ancienne clé de stockage publiée dans Git |
| F06 | P0 | Élevée | Vidéos, audio et opérations fichiers hors relais authentifié |
| F07 | P1 | Élevée | Validation CGPMP sans provisionnement Firebase |
| F08 | P1 | Élevée | Réussite affichée après échec de sauvegarde ou d’email |
| F09 | P1 | Élevée | Pièces CGPMP perdues et identifiants sujets à collision |
| F10 | P1 | Élevée | Fonctions appelées par l’interface absentes de Vercel |
| F11 | P1 | Élevée | Inscription sans Google sans création Firebase |
| F12 | P1 | Moyenne | Initialisation automatique concurrente à l’inscription Google |
| F13 | P1 | Élevée | Quiz de positionnement : zéro devient 75 et correction contrôlée par le client |
| F14 | P1 | Élevée | Caches et états non isolés entre comptes |
| F15 | P1 | Élevée (fiabilité métier) | Suivi formateur alimenté par des profils de démonstration |
| F16 | P1 | Élevée (fiabilité métier) | Observatoire et rapports mélangent mesures et simulations |
| F17 | P2 | Moyenne | Arena ignoré sans clé Gemini et provenance IA trompeuse |
| F18 | P1 | Moyenne | Autorisations formateur trop larges sur Q&A et studio |
| F19 | P2 | Moyenne | Vidéos enregistrées publiées avant upload durable |
| F20 | P2 | Moyenne | Téléchargement hors ligne annoncé mais non réalisé |
| F21 | P1 | Moyenne | Vérification automatique insuffisante |
| F22 | P1 | Moyenne | Configuration Firebase et procédure de déploiement divergentes |
| F23 | P2 | Moyenne | Dépendance ws transitive et fichiers serveur dans le répertoire public |
| F24 | P2 | Moyenne | Couplage important et chargement initial lourd |
| F25 | P2 | Moyenne | Mutations administratives partielles et listes tronquées |
| F26 | P2 | Moyenne | Tentatives de tests sans version ni politique de reprise |
| F27 | P2 | Moyenne | Échec au quiz final enregistre toutes les leçons comme terminées |

## Détails et preuves

### F01 — Double authentification non imposée

**P0 · Élevée · Confirmé dans le code**

signInWithEmailAndPassword ouvre une session Firebase avant beginTwoFA. L’abonnement global marque cette session authentifiée sans OTP ; le login Google ne déclenche pas beginTwoFA. verifyIdToken ne vérifie pas de facteur MFA. Le propriétaire peut changer twoFactorEnabled.

**Conséquence.** Une personne disposant du premier facteur peut accéder aux données et API sans valider le second.

**Correction.** Implémenter un facteur Firebase MFA réellement vérifié, contrôler le facteur requis côté serveur et règles, réauthentifier pour enrôlement/désactivation. Le QR affiché est une icône, pas une configuration TOTP.

**Critère de réussite.** Sans second facteur, refus des API sensibles et des lectures protégées, y compris après rafraîchissement et connexion Google. Un vrai enrôlement MFA fonctionne.

**Références :** [src/components/AuthModal.tsx:1452](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1452) · [src/App.tsx:252](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L252) · [backend/admin.ts:20](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L20) · [firestore.rules:111](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L111)

### F02 — Niveaux et certifications falsifiables

**P0 · Élevée · Confirmé dans les règles versionnées**

La règle users protège seulement id/email/role/disabled et accepte les autres champs. placementScore, niveauValidation, certificates, completedCourseIds et compteurs sont écrits par le client. La création accepte aussi des champs supplémentaires.

**Conséquence.** Les données faisant foi pour les certificats et statistiques peuvent être forgées par leur propriétaire, même si les tests administratifs sont corrigés côté serveur.

**Correction.** Séparer profil modifiable et résultats serveur ; liste blanche des champs utilisateur à la création et mise à jour ; délivrer un certificat stable et vérifiable depuis une tentative validée.

**Critère de réussite.** L’émulateur refuse tout niveau/certificat forgé à la création et mise à jour. Seul un succès canonique serveur délivre un certificat.

**Références :** [firestore.rules:107](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L107) · [src/firebase.ts:509](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L509) · [src/App.tsx:546](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L546) · [src/App.tsx:585](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L585)

### F03 — API IA et voix publiques sans quotas applicatifs

**P0 · Élevée · Confirmé dans le code ; quotas externes inconnus**

Les routes tutor, placement-quiz, generate-report, tts et prewarm n’appliquent ni authenticate, ni limite par utilisateur/IP. Les gardes existants couvrent admin/storage et certaines écritures de réglages.

**Conséquence.** Consommation anonyme des fournisseurs payants, concurrence excessive, épuisement des ressources.

**Correction.** Authentifier les usages privés, réserver génération/rapports aux rôles adéquats, quotas distribués par UID/IP, plafonds de coût/concurrence et taille des entrées. Prévoir un quota distinct si un aperçu public est voulu.

**Critère de réussite.** 401/403 adaptés, 429 au-delà du quota sur plusieurs instances ; limites fournisseur et alertes testées.

**Références :** [server.ts:1823](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L1823) · [server.ts:1932](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L1932) · [backend/vercelApp.ts:595](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L595) · [backend/vercelApp.ts:1065](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L1065)

### F04 — Entrées mal typées non interceptées dans le tuteur

**P0 · Élevée · TypeError reproduit sur expression isolée ; effet HTTP à tester**

Un message objet fait échouer .trim() dans server.ts avant le bloc try. Dans Vercel, message.slice ou h.text.toLowerCase peuvent échouer avant le bloc fournisseur. Express 4 n’intercepte pas nativement toutes les promesses rejetées des handlers async.

**Conséquence.** Requêtes en erreur non maîtrisées ; risque d’arrêt du processus Node selon sa gestion des rejets. Aucun crash de production n’a été provoqué.

**Correction.** Schémas de validation, limites de longueur/historique et enveloppe async commune passant toute erreur à un middleware.

**Critère de réussite.** Message objet, historique mal typé et payload excessif renvoient 400/413 ; une requête valide suivante fonctionne toujours.

**Références :** [server.ts:1933](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L1933) · [backend/vercelApp.ts:596](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L596) · [backend/vercelApp.ts:608](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L608)

### F05 — Ancienne clé de stockage publiée dans Git

**P0 · Élevée · Clé historique confirmée ; révocation non vérifiée**

Au commit e928bfa57528f72e5d9cdffd25e42ab82671e5b8, ACADEMIA_API_KEY utilise une valeur littérale de 64 caractères, accessible dans ce dépôt public. La valeur a été retirée du code actuel. Elle n’est pas reproduite dans ce rapport.

**Conséquence.** Toute clé encore acceptée doit être considérée exposée. Retirer une valeur du dernier commit ne la révoque pas.

**Correction.** Vérifier/révoquer la clé historique chez le fournisseur, renouveler côté serveur, retirer les anciens bundles exposés et activer la détection de secrets. Nettoyage d’historique éventuel après rotation.

**Critère de réussite.** L’ancienne clé est refusée ; la nouvelle n’apparaît dans aucun bundle client. Tracer la date de révocation.

**Références :** [src/lib/academiaStorage.ts:14](https://github.com/kibaks/armpacademiav2/blob/e928bfa57528f72e5d9cdffd25e42ab82671e5b8/src/lib/academiaStorage.ts#L14)

### F06 — Vidéos, audio et opérations fichiers hors relais authentifié

**P0 · Élevée · Absence d’identité côté client confirmée ; vulnérabilité du stockage externe à vérifier**

Seules les images passent par /api/storage/images avec jeton Firebase. Les autres uploads et list/get/delete/stats vont directement au fournisseur avec headers vides et uploaded_by fourni par le client. Même le relais image accepte entityId arbitraire sans vérifier son lien à l’utilisateur.

**Conséquence.** Si le fournisseur permet ces appels sans identité fiable, accès ou suppression de fichiers d’autrui possibles. S’il impose une authentification, ces fonctions client échouent. L’autorisation externe n’a pas été testée.

**Correction.** Unifier l’autorisation de toutes les opérations ; transferts volumineux par autorisations temporaires bornées si nécessaire ; propriété dérivée du UID et relations de cours vérifiées. Ne pas rendre publics les documents sensibles.

**Critère de réussite.** Deux comptes de test ne peuvent ni lister/lire/supprimer les fichiers privés de l’autre. Upload et lecture 100 Mo restent fonctionnels sans exposer de clé.

**Références :** [src/lib/academiaStorage.ts:100](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/lib/academiaStorage.ts#L100) · [src/lib/academiaStorage.ts:155](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/lib/academiaStorage.ts#L155) · [src/lib/academiaStorage.ts:279](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/lib/academiaStorage.ts#L279) · [backend/storage.ts:34](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/storage.ts#L34)

### F07 — Validation CGPMP sans provisionnement Firebase

**P1 · Élevée · Confirmé dans le code**

Les chemins CGPMP fabriquent profils USR-CGPMP et mots de passe, mais ne créent aucun utilisateur Firebase Auth. firebaseLoginUser utilise uniquement Firebase. accountActivated est pourtant positionné à true.

**Conséquence.** Les personnes annoncées actives ne peuvent pas se connecter avec les identifiants générés ; leurs mots de passe figurent dans localStorage et les dossiers Firestore.

**Correction.** Validation serveur idempotente : vérifier dossier, créer/récupérer UID Firebase, écrire profils, envoyer liens d’activation à usage limité ; supprimer les mots de passe des documents et migrer les comptes simulés.

**Critère de réussite.** Valider un dossier crée des UID réels ; chaque destinataire active son compte et se connecte. Répéter la validation ne duplique pas les comptes.

**Références :** [src/firebase.ts:709](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L709) · [src/firebase.ts:799](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L799) · [server.ts:3087](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L3087) · [src/firebase.ts:903](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L903)

### F08 — Réussite affichée après échec de sauvegarde ou d’email

**P1 · Élevée · Confirmé dans le code**

La sauvegarde CGPMP absorbe les erreurs Firestore ; la validation bascule vers des emails générés localement. Le serveur email ne vérifie pas r.ok et retourne success. Demandes de formation/rapports annoncent aussi réussite avant sauvegarde ou malgré catch.

**Conséquence.** Dossiers, décisions ou emails annoncés transmis alors qu’ils restent locaux ou ont été refusés.

**Correction.** Statuts distincts brouillon/sauvegardé/envoi en attente/envoyé/échec ; afficher réussite après preuve durable ; outbox et reprise email ; aucune activation de compte sur fallback.

**Critère de réussite.** Panne Firestore ou réponse email 4xx produit une erreur visible, pas une confirmation. Une reprise récupère le dossier et n’envoie pas en double.

**Références :** [src/firebase.ts:667](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L667) · [src/firebase.ts:747](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L747) · [server.ts:3167](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L3167) · [src/App.tsx:796](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L796) · [src/components/AnalyticsDashboard.tsx:307](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AnalyticsDashboard.tsx#L307)

### F09 — Pièces CGPMP perdues et identifiants sujets à collision

**P1 · Élevée · Confirmé dans le code**

Les données du fichier ne sont conservées que sous 150 000 caractères base64 ; aucun upload durable de cette pièce n’est effectué. Un spécimen peut définir seulement un nom de fichier. Le prétendu SHA256 est construit à partir de l’heure. L’ID du dossier ne dispose que de 880 valeurs.

**Conséquence.** L’administrateur peut recevoir une référence sans document. Une collision peut refuser l’écriture ou mélanger les dossiers locaux ; le hash ne prouve pas l’intégrité.

**Correction.** Uploader la pièce privée avant soumission, stocker fileId et vrai SHA-256, vérifier existence/taille/type côté serveur, ID Firestore/UUID et écriture create non écrasante.

**Critère de réussite.** Une pièce de 1 Mo est relue par le valideur, un spécimen seul est refusé ; 10 000 IDs sont uniques et une collision forcée ne remplace pas un dossier.

**Références :** [src/components/AuthModal.tsx:987](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L987) · [src/components/AuthModal.tsx:1007](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1007) · [src/components/AuthModal.tsx:1319](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1319) · [src/components/AuthModal.tsx:1346](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1346) · [src/firebase.ts:676](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L676)

### F10 — Fonctions appelées par l’interface absentes de Vercel

**P1 · Élevée · Absence de routes confirmée ; déploiement non interrogé**

Le serveur Vercel ne déclare pas /api/2fa/send, /verify, /api/cgpmp/send-credentials-email, /api/ai/generate-animated-module, /api/ai/transcribe, /api/ai/flow-video/download ni /stream. Le tutor Vercel ignore audioBase64/persona et refuse les messages vides ; les réglages TTS renvoient 501.

**Conséquence.** 2FA, validation CGPMP, génération de modules et notes vocales ne suivent pas les mêmes parcours selon l’hébergement. Les routes Flow manquantes ne sont pas toutes appelées par le client actuel ; ne pas les confondre avec un bug utilisateur prouvé.

**Correction.** Créer un socle de routes/services commun ; contrat de capacités explicite ; implémenter les fonctions supportées ou les rendre indisponibles clairement dans l’UI. Conserver les adaptations runtime dans un module mince.

**Critère de réussite.** Suite de contrats identique sur Node et entrypoint Vercel ; routes utilisées présentes et réponses conformes ; notes vocales transcrites ou refus explicite.

**Références :** [server.ts:2148](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L2148) · [server.ts:2651](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L2651) · [server.ts:3087](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L3087) · [backend/vercelApp.ts:1046](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L1046) · [src/components/TrainerPortal.tsx:267](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L267)

### F11 — Inscription sans Google sans création Firebase

**P1 · Élevée · Confirmé dans le parcours d’inscription**

La vérification civile peut définir un pseudo-UID GOOGLE-USR et poursuivre. La soumission standard appelle saveGoogleRegisteredProfile, même sans authentification Google ; un pseudo-UID USR-GOOGLE est alors utilisé. syncUserProfileToFirestore exige le UID du compte Firebase connecté. firebaseRegisterUser existe mais n’est pas utilisé par ce parcours.

**Conséquence.** Le parcours proposé après blocage/échec de Google aboutit à une erreur plutôt qu’à un compte utilisable.

**Correction.** Choisir un parcours email/mot de passe réel ou un lien de connexion email ; créer l’identité Firebase avant le profil ; distinguer validation de saisie et preuve d’identité.

**Critère de réussite.** Inscription depuis une fenêtre privée sans Google crée un UID réel, puis login et reset fonctionnent. Aucun pseudo-UID n’est sauvegardé comme compte réel.

**Références :** [src/components/AuthModal.tsx:1138](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1138) · [src/components/AuthModal.tsx:1414](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1414) · [src/firebase.ts:509](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L509) · [src/firebase.ts:953](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L953)

### F12 — Initialisation automatique concurrente à l’inscription Google

**P1 · Moyenne · Course entre chemins confirmée dans le code ; scénario à reproduire en navigateur**

onAuthStateChanged appelle getOrInitUserProfile dès la connexion Google et peut créer un profil avec le rôle currentRole avant la soumission du formulaire. La soumission peut essayer de changer ce rôle, changement interdit par firestore.rules.

**Conséquence.** Inscription reconnue prématurément comme existante ou refus lors du choix d’un autre rôle ; dépend de l’ordre des réponses réseau.

**Correction.** État onboarding séparé, initialisation de profil unique/idempotente, finalisation des rôles publics dans une opération autorisée et contrôlée.

**Critère de réussite.** Nouveau compte Google avec rôle PME/agent fonctionne sous latences différentes ; aucun profil incomplet n’est considéré finalisé.

**Références :** [src/App.tsx:252](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L252) · [src/firebase.ts:366](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L366) · [src/components/AuthModal.tsx:1050](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1050) · [src/firebase.ts:953](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L953)

### F13 — Quiz de positionnement : zéro devient 75 et correction contrôlée par le client

**P1 · Élevée · Calcul reproduit localement**

Math.round((correctCount / answers.length) * 100) || 75 renvoie 75 pour 0/5 et 0/0. correctCount provient de isCorrect envoyé par le client. Les corrigés correctIndex sont livrés avec les questions. Le mode IA ne garantit pas non plus une correction canonique.

**Conséquence.** Niveau pédagogique incorrect et résultats manipulables. Cela ne concerne pas la correction serveur déjà présente pour /level-tests/attempt.

**Correction.** Utiliser le même moteur d’évaluation canonique pour positionnement/cours, aucune confiance dans isCorrect ; refuser un test vide et conserver 0 comme score valide.

**Critère de réussite.** 0/5 donne 0 ; liste vide donne 400 ; isCorrect forgé est ignoré ; clés de réponse absentes de la réponse apprenant.

**Références :** [backend/vercelApp.ts:685](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L685) · [server.ts:2210](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L2210) · [src/components/PlacementQuizModal.tsx:174](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/PlacementQuizModal.tsx#L174)

### F14 — Caches et états non isolés entre comptes

**P1 · Élevée · Confirmé dans le code**

Notes et validations locales sont indexées par cours/leçon sans UID. Les demandes CGPMP et mots de passe utilisent des caches globaux ; le fetch fusionne les demandes locales même si elles ne sont pas autorisées par la requête distante. La déconnexion ne vide ni tous ces caches ni profiles/requests/firestoreProfiles.

**Conséquence.** Sur un navigateur partagé, fuite de dossiers ou notes et reprise de validations appartenant à une autre personne. Il s’agit d’état client, pas d’un contournement démontré des règles distantes.

**Correction.** Caches par UID et version, purge des états sensibles à déconnexion/changement de compte, résultats apprenant relus depuis le serveur, suppression des credentials locaux.

**Critère de réussite.** Compte A puis B : B ne voit aucun dossier/note de A et ne récupère pas ses validations ; test inverse puis rafraîchissement.

**Références :** [src/components/CourseWindow.tsx:141](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/CourseWindow.tsx#L141) · [src/components/CourseWindow.tsx:153](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/CourseWindow.tsx#L153) · [src/components/CourseWindow.tsx:295](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/CourseWindow.tsx#L295) · [src/firebase.ts:575](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L575) · [src/App.tsx:486](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L486)

### F15 — Suivi formateur alimenté par des profils de démonstration

**P1 · Élevée (fiabilité métier) · Confirmé dans le code**

Les formateurs ne peuvent pas lister users. L’App passe profiles, initialisé avec DEMO_PROFILES et le compte courant, au TrainerPortal et au profil ; elle ne passe pas firestoreProfiles au studio. Scores/temps/progressions sont ensuite fabriqués par hash du UID, longueur du nom ou défauts.

**Conséquence.** Le formateur ne dispose pas du suivi réel de ses apprenants et des données fictives sont présentées comme réelles.

**Correction.** Endpoint formateur dédié aux apprenants/cours assignés, données pédagogiques canoniques, suppression des valeurs calculées artificiellement, afficher absence de mesure.

**Critère de réussite.** Un formateur voit uniquement ses apprenants réels ; un nouvel apprenant sans activité affiche zéro/non mesuré, pas un score simulé.

**Références :** [firestore.rules:109](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L109) · [src/firebase.ts:160](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L160) · [src/App.tsx:1248](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L1248) · [src/components/TrainerPortal.tsx:583](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L583) · [src/components/TrainerPortal.tsx:615](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L615)

### F16 — Observatoire et rapports mélangent mesures et simulations

**P1 · Élevée (fiabilité métier) · Confirmé dans le code**

Analytics combine démonstrations et profils, applique des multiplicateurs de période et des taux minimaux artificiels. Le rapport fallback affiche complétion 87 %, conformité 92 et rejets −32 % indépendamment des données. Les nouveaux profils héritent d’heures/streak et des publications de certification prédéfinies.

**Conséquence.** Décisions DFAT basées sur des chiffres non observés ; confusion sur les certifications réelles.

**Correction.** Agréger les événements réels par période/institution, dataset démo séparé et explicitement signalé ; absence de données indiquée ; IA résume uniquement des métriques calculées et sourcées.

**Critère de réussite.** Une base vide produit zéro/non disponible. Un jeu connu donne les totaux exacts ; panne IA ne crée aucune statistique supplémentaire.

**Références :** [src/components/AnalyticsDashboard.tsx:101](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AnalyticsDashboard.tsx#L101) · [src/components/AnalyticsDashboard.tsx:126](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AnalyticsDashboard.tsx#L126) · [backend/vercelApp.ts:736](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L736) · [src/firebase.ts:122](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L122) · [src/components/UserProfileView.tsx:270](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/UserProfileView.tsx#L270)

### F17 — Arena ignoré sans clé Gemini et provenance IA trompeuse

**P2 · Moyenne · Confirmé dans le code**

Le retour fallback sur !ai intervient avant callArenaLLM ; une clé ARENA seule ne suffit donc pas. Une réponse Gemini est étiquetée Claude/Arena. Les citations sont ajoutées sans lien prouvant qu’elles étayent chaque assertion.

**Conséquence.** Configuration Arena seule inutile et utilisateur mal informé sur la source réelle d’une réponse juridique.

**Correction.** Sélection de fournisseur indépendante, provenance issue du chemin réellement exécuté, références documentaires vérifiées et validation humaine du contenu juridique.

**Critère de réussite.** Tests Arena seul/Gemini seul/aucun fournisseur ; provider exact dans la réponse ; documents et articles liés à des versions vérifiées.

**Références :** [backend/vercelApp.ts:615](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L615) · [backend/vercelApp.ts:623](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L623) · [backend/vercelApp.ts:669](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L669) · [server.ts:1988](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L1988) · [server.ts:2000](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L2000)

### F18 — Autorisations formateur trop larges sur Q&A et studio

**P1 · Moyenne · Confirmé dans les règles versionnées**

Tout formateur peut modifier la Q&A de tout cours et créer/modifier/supprimer n’importe quelle vidéo studio. Les vidéos et la banque quiz sont lisibles par toute identité connectée ; pas de distinction brouillon/privé/public dans ces règles.

**Conséquence.** Modification des contenus d’un autre formateur et métadonnées privées accessibles à des apprenants.

**Correction.** Ownership immuable et assignations contrôlées ; règles distinctes pour brouillons, publications et banques de correction ; rôles d’administration explicites.

**Critère de réussite.** Formateur A ne modifie/supprime pas le contenu de B ; apprenant ne lit pas les brouillons ni une banque utilisée comme corrigé confidentiel.

**Références :** [firestore.rules:141](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L141) · [firestore.rules:148](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L148) · [firestore.rules:155](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L155)

### F19 — Vidéos enregistrées publiées avant upload durable

**P2 · Moyenne · Confirmé dans le code**

Une blob URL locale est enregistrée immédiatement en localStorage et Firestore ; l’upload vient ensuite et son erreur est seulement journalisée. Cette URL ne fonctionne pas sur un autre appareil ou après fermeture. Le callback utilise recordSeconds capturé au démarrage.

**Conséquence.** Une vidéo affichée comme sauvegardée peut devenir illisible ; durée enregistrée potentiellement erronée.

**Correction.** Statut brouillon pendant capture/upload, publication après fileId durable, reprise d’upload et stockage de durée mesurée ; nettoyage ObjectURL/streams.

**Critère de réussite.** Panne d’upload produit un brouillon récupérable ; après succès, lecture depuis un autre navigateur et durée correcte.

**Références :** [src/components/TrainerPortal.tsx:810](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L810) · [src/components/TrainerPortal.tsx:829](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L829)

### F20 — Téléchargement hors ligne annoncé mais non réalisé

**P2 · Moyenne · Confirmé dans le code**

Le bouton met seulement à jour offlineDownloads et affiche module sauvegardé. Aucun téléchargement des médias ni cache de navigation/service worker dédié n’est implémenté dans le dépôt. Les cours intégrés au bundle peuvent rester disponibles si la page est déjà chargée.

**Conséquence.** Un nouveau démarrage sans réseau et les médias/IA ne sont pas garantis disponibles malgré la confirmation.

**Correction.** Vrai paquet de cours en IndexedDB/Cache Storage et shell hors ligne avec quota/version ; sinon renommer en favori et supprimer la promesse de téléchargement.

**Critère de réussite.** Depuis un navigateur ayant téléchargé un cours, fermer puis rouvrir hors ligne et lire son contenu prévu ; statut des médias non disponibles explicite.

**Références :** [src/App.tsx:732](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L732)

### F21 — Vérification automatique insuffisante

**P1 · Moyenne · Confirmé dans le dépôt et Actions**

Trois fichiers de tests existent et mockent les services admin/stockage. Aucun workflow .github, test des règles Firebase, test navigateur ou contrat Node/Vercel. GitHub Actions renvoie zéro exécution. lint exécute tsc, sans lint des hooks ; strict n’est pas activé.

**Conséquence.** Régressions de règles, parcours et runtime pouvant passer les contrôles actuels.

**Correction.** CI Node 22 npm ci/lint/test/build/check:api ; émulateurs Firestore/Auth ; parcours navigateur des rôles et changement de compte ; test des contrats communs.

**Critère de réussite.** Une PR violant MFA, règles, scoring ou route Vercel échoue. Compilation et tests réussissent dans un environnement représentatif.

**Références :** [tests/admin.test.ts:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/tests/admin.test.ts#L1) · [tests/storage.test.ts:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/tests/storage.test.ts#L1) · [tests/adminExport.test.ts:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/tests/adminExport.test.ts#L1) · [package.json:10](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/package.json#L10)

### F22 — Configuration Firebase et procédure de déploiement divergentes

**P1 · Moyenne · Confirmé dans le code et documentation**

Le module utilisé src/firebase.ts et le serveur importent firebase-applet-config.json. L’autre module suit VITE_FIREBASE_* et la base par défaut, mais n’est pas importé par les parcours actifs. La documentation propose ces variables et des règles différentes. Aucun firebase.json pour déployer la base nommée automatiquement.

**Conséquence.** Modifier les variables documentées peut ne pas changer le projet/base réellement utilisé ; déploiement de règles sur une mauvaise base possible. Les règles actives ne sont pas connues.

**Correction.** Source de configuration unique validée au démarrage, config séparée selon environnement, déploiement explicite des règles et index sur la bonne base ; documentation cohérente.

**Critère de réussite.** Préproduction pointe un projet/base distinct ; mauvais paramètre bloque le démarrage ; version des règles déployées connue et testée.

**Références :** [src/firebase.ts:28](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/firebase.ts#L28) · [src/lib/firebase.ts:5](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/lib/firebase.ts#L5) · [backend/admin.ts:5](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L5) · [FIREBASE_SETUP.md:22](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/FIREBASE_SETUP.md#L22) · [firestore.rules:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/firestore.rules#L1)

### F23 — Dépendance ws transitive et fichiers serveur dans le répertoire public

**P2 · Moyenne · Confirmé dans les scripts ; exposition HTTP à vérifier après build**

ws est importé mais absent des dependencies directes ; il existe seulement dans le lock via d’autres dépendances. Le build place server.mjs, son .map et api.mjs dans dist, qui est aussi servi publiquement par express.static et déclaré outputDirectory Vercel.

**Conséquence.** Démarrage dépendant de l’arbre transitif ; publication potentielle du code serveur et des sourcemaps. Aucune clé runtime n’a été constatée dans ces artefacts, non compilés ici.

**Correction.** Déclarer ws ou supprimer son import inutile, séparer dist/client et dist/server, adapter includeFiles et garder les sourcemaps serveur hors publication.

**Critère de réussite.** Installation propre reproductible ; /server.mjs, /server.mjs.map et /api.mjs renvoient 404 sur l’URL publique.

**Références :** [backend/vercelApp.ts:6](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/vercelApp.ts#L6) · [package.json:8](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/package.json#L8) · [vercel.json:4](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/vercel.json#L4) · [server.ts:3226](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/server.ts#L3226)

### F24 — Couplage important et chargement initial lourd

**P2 · Moyenne · Confirmé dans l’architecture ; performance non mesurée**

Environ 56 176 lignes de code/script. Gros composants de 2 000–4 200 lignes, deux serveurs IA/voix et multiples caches. Seul AdminSpace est explicitement lazy dans App ; studio/tuteur/profil/cours sont importés au démarrage. Nombreux any, strict désactivé.

**Conséquence.** Corrections coûteuses et risque de divergences ; probable charge initiale élevée à mesurer, pas un chiffre de bundle déduit de la taille des sources.

**Correction.** Modules métier et hooks séparés, services communs, lazy loading des vues lourdes, optimisation assets/voix ; strict progressivement et lint hooks/accessibilité. Mesurer avant/après sur mobile.

**Critère de réussite.** Budget de bundle et mesures LCP/INP mémoire publiés ; aucun double moteur de règles métier et tests des hooks sensibles.

**Références :** [src/App.tsx:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L1) · [src/components/AuthModal.tsx:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/AuthModal.tsx#L1) · [src/components/TrainerPortal.tsx:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/TrainerPortal.tsx#L1) · [src/utils/speechService.ts:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/utils/speechService.ts#L1) · [tsconfig.json:1](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/tsconfig.json#L1)

### F25 — Mutations administratives partielles et listes tronquées

**P2 · Moyenne · Confirmé dans le code**

Claims, Auth, profil et audit sont modifiés séquentiellement. Par exemple un changement de rôle peut réussir avant échec du profil/audit ; une suppression Auth peut précéder une suppression Firestore échouée. Les listes utilisateurs/tentatives sont limitées à 500, audit à 100 sans pagination serveur.

**Conséquence.** État d’accès discordant, réponse d’échec après opération effective, comptes orphelins et historique incomplet à volume.

**Correction.** Opérations idempotentes avec état/compensation et réconciliation Auth/Firestore ; audit durable des succès partiels ; pagination par curseur et nettoyage contrôlé des données liées.

**Critère de réussite.** Panne injectée à chaque étape : état réconcilié et résultat fiable ; second appel sûr ; toutes les pages consultables.

**Références :** [backend/admin.ts:57](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L57) · [backend/admin.ts:83](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L83) · [backend/admin.ts:46](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L46) · [backend/admin.ts:158](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L158)

### F26 — Tentatives de tests sans version ni politique de reprise

**P2 · Moyenne · Confirmé dans le code**

L’évaluation transactionnelle des tests admin est saine, mais une tentative conserve score/correct sans version des questions/test ni réponses. Tentatives actives possibles sans limite ni délai ; le résultat renvoie correct et passed.

**Conséquence.** Difficile d’expliquer un résultat après édition ; multiplication des essais facilitant la recherche des réponses et gonflant le volume.

**Correction.** Version/hash du test, réponses et critères d’évaluation auditables côté serveur ; politique pédagogique d’essais/délai, quota et idéalement clé d’idempotence.

**Critère de réussite.** Ancien résultat vérifiable après édition ; double soumission ne crée pas de doublon si c’est le même essai ; politique d’essais appliquée.

**Références :** [backend/admin.ts:125](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L125) · [backend/admin.ts:145](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/backend/admin.ts#L145) · [src/components/PlacementQuizModal.tsx:151](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/PlacementQuizModal.tsx#L151)

### F27 — Échec au quiz final enregistre toutes les leçons comme terminées

**P2 · Moyenne · Confirmé dans le code**

submitQuiz passe allLessonIndices à onUpdateCourseProgress quel que soit finalScore. Le handler remplace completedLessonsByCourse par cette liste, même lorsque le seuil de 70 % n’est pas atteint. La première leçon est aussi initialisée comme terminée par défaut.

**Conséquence.** Suivi pédagogique incohérent : tout le contenu apparaît terminé après un échec, sans prouver sa lecture ni validation.

**Correction.** Distinguer lecture, progression, validation et certification ; conserver uniquement les événements réels et ne pas modifier la liste de leçons sur échec de quiz.

**Critère de réussite.** Échec 0 % ne termine pas des leçons non étudiées ; reprise d’un quiz préserve exactement les validations précédentes.

**Références :** [src/components/CourseWindow.tsx:536](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/components/CourseWindow.tsx#L536) · [src/App.tsx:656](https://github.com/kibaks/armpacademiav2/blob/eea6a541617ef3411790232da8565b522852e799/src/App.tsx#L656)

## Points à confirmer sur une préproduction représentative

- Projet Firebase et base réellement utilisés, activation des fournisseurs email/Google, domaines autorisés, claims des comptes existants, compte de service serveur et version des règles déployées.
- Révocation de la clé historique, accès direct au fournisseur Academia, authentification des previews/downloads, isolation des fichiers privés, CORS et quota. Utiliser seulement deux comptes et leurs fichiers de test.
- Contrats réels de l’entrée Vercel et callbacks MFA, y compris sessions restaurées et navigateurs partagés.
- Disponibilité des modèles nommés `gemini-3.8-flash`, `gemini-3.1-flash-lite`, du modèle Arena configuré et des fournisseurs TTS dans les comptes du projet. Leur présence dans le code n’établit pas leur disponibilité ; aucun appel fournisseur n’a été exécuté.
- Livraison email et liens d’activation ; callbacks de confirmation et gestion des rebonds.
- Taille du bundle, LCP/INP, démarrage froid, latence voix et limites de durée/mémoire Vercel. Les imports statiques ne constituent pas une mesure de performance.
- Fichiers serveur effectivement exposés après build, politiques de sécurité HTTP, protection de branche et alertes d’exploitation.
- Validation par un juriste des références, seuils et textes pédagogiques ; cet audit technique n’a pas vérifié leur exactitude légale.

## Suite proposée

Le [PLAN_AMELIORATION.md](PLAN_AMELIORATION.md) fournit les lots, dépendances et critères de sortie. Le [BACKLOG.csv](BACKLOG.csv) contient les 27 constats avec propriétaire suggéré, actions et critères d’acceptation. Les estimations sont indicatives en jours de travail, sans additionner les tâches qui partagent une même correction. Les corrections de code, rotation, déploiement et migration ne sont pas exécutés dans cet audit.

