# Analyse et corrections — 9 octobre 2026

Projet React 19 / TypeScript / Vite, Firebase Auth et Firestore. Deux serveurs distincts : `server.ts` pour Node et `api/index.ts` pour Vercel. L’espace administrateur possédait déjà des écrans de comptes, formateurs, apprenants, permissions, tests, performances et modules ; plusieurs actions étaient simulées dans le stockage local.

## Fonctions complétées

- Comptes et formateurs : création Firebase Auth avec UID réel, profil Firestore, rôle signé dans les custom claims et lien de définition du mot de passe. Changement de rôle, suspension/réactivation, révocation des sessions, réinitialisation et suppression effectives. Protection du compte courant et des superadministrateurs existants. DFAT peut consulter ; seul le superadministrateur gère les accès.
- Tests et niveaux : API commune Node/Vercel ; données et tentatives persistées dans Firestore plutôt que dans des fichiers éphémères. Validation des seuils, questions et réponses. Les apprenants reçoivent uniquement les tests actifs, sans corrigés ni résultats des autres candidats. Le serveur calcule le score et fixe l’identité du candidat à partir du jeton.
- Modules personnalisés créés depuis l’administration : ajout, modification des métadonnées, attribution persistante à un formateur et suppression. Le contenu pédagogique existant est conservé lors d’une modification. Les cours officiels intégrés restent protégés dans l’interface. Les messages de publication attendent la sauvegarde effective. Une synchronisation réussie retire aussi les modules supprimés des caches locaux.
- Journal : consultation des 100 dernières actions des API administratives et de configuration. Il ne couvre pas encore les écritures directes du client Firestore.
- État des services : vérification Firestore et indication des mécanismes d’authentification et de persistance.
- Chargement : skeleton HTML avant le JavaScript, préchargement React, skeleton des comptes/tests/journal/services, chargement différé de l’espace administrateur. Statuts accessibles, animation respectant la réduction des mouvements, délai maximal du préchargement et délais des requêtes administratives.

## Failles corrigées dans le code

| Gravité | Constat initial | Correction |
| --- | --- | --- |
| Critique | Connexion locale acceptant un mot de passe quelconque selon sa longueur | Connexion Firebase réelle obligatoire ; suppression des replis CGPMP et annuaire local |
| Critique | Une session et un rôle administrateur pouvaient être simulés via localStorage ou la sélection de profil | Le cache ne constitue plus une authentification ; profil relu et rôle privilégié vérifié via custom claims ; démos désactivées par défaut et en production |
| Critique | API de modification des tests, niveaux et réglages vocaux sans authentification | Jetons Firebase vérifiés, révocation vérifiée et contrôle de rôle côté serveur |
| Élevée | Un propriétaire de profil pouvait modifier son rôle dans Firestore | Rôle, identité et suspension non modifiables directement ; rôles privilégiés non disponibles en inscription libre |
| Élevée | Lecture de tous les profils et dossiers CGPMP, écritures trop permissives | Règles limitées aux propriétaires et administrateurs ; questions, cours et rapports restreints selon leur usage |
| Élevée | Tentatives d’examen contenant score, réussite et identité fournis par le navigateur | Correction transactionnelle côté serveur ; champs forgés ignorés ; l’édition des tests n’écrase plus les tentatives |
| Élevée | Clé de stockage partagée présente dans le code et l’exemple d’environnement | Valeur supprimée des fichiers courants. Rotation externe encore indispensable ; voir ci-dessous |
| Élevée | Dépendance gRPC vulnérable transitivement via Firebase | Override vers une version corrigée ; audit npm sans vulnérabilité au moment des vérifications |
| Moyenne | Code OTP renvoyé même en production lorsque le fournisseur email échouait | Aucun code renvoyé en production ; échec explicite de livraison ; génération cryptographique |
| Fonctionnelle | Serveur compilé en CommonJS malgré l’usage d’import.meta.url | Compilation et lancement en ESM ; démarrage de production vérifié |

## Risques restant à traiter

1. **Clé de stockage compromise** : la valeur historique reste dans Git et peut avoir été intégrée à des bundles déjà publiés. Révoquer/renouveler cette clé chez le fournisseur. Les images passent désormais par une API serveur authentifiée ; une clé optionnelle `ACADEMIA_API_KEY` reste côté serveur. Les autres médias utilisent encore le parcours direct historique. Le serveur de stockage doit également protéger ses accès directs et ne pas exposer de secrets dans sa documentation publique.
2. **MFA** : le code email historique constitue une étape d’interface, pas une seconde preuve exigée par les API. Passer à Firebase MFA avec vérification des facteurs côté serveur. Le mécanisme OTP local reste en mémoire et n’est pas commun aux instances Vercel.
3. **CGPMP et email** : le workflow historique génère et conserve encore des coordonnées localement ; sa validation ne provisionne pas à elle seule de vrais comptes Firebase. L’envoi simulé ne garantit pas la livraison. La connexion locale a été supprimée : les anciens comptes simulés doivent être provisionnés par la gestion des comptes, et les emails doivent transmettre des liens Firebase plutôt que des mots de passe.
4. **IA et quotas** : certaines API IA et vocales restent publiques et sans quotas distribués. Ajouter des limites par utilisateur/IP, des plafonds et une supervision des coûts.
5. **Progression et certification** : les profils stockent encore des indicateurs pédagogiques modifiables par leur propriétaire et le diagnostic IA utilise des réponses fournies par le client. Les tentatives des tests administratifs sont désormais fiables ; toutes les certifications et progressions ne le sont pas encore. Elles doivent être calculées et attribuées côté serveur.
6. **Paramétrage vocal Vercel** : l’ancien endpoint annonçait une sauvegarde sans persistance. Il retourne maintenant une indisponibilité explicite (501). L’édition vocale reste disponible dans le serveur Node ; une unification complète du moteur vocal est un chantier distinct.
7. **Données de démonstration** : plusieurs écrans historiques affichent encore des données initiales ou des caches, notamment l’observatoire et les dossiers CGPMP. Ils ne sont pas une preuve de données de production.
8. **Performance** : le bundle principal reste volumineux malgré la séparation de l’espace admin. Poursuivre la séparation du studio vidéo/tuteur et l’optimisation des images.
9. **Volumes** : la liste administrative est limitée à 500 profils avec avertissement ; le journal à 100 actions et les résultats à 500 tentatives. Ajouter une pagination serveur pour des volumes supérieurs.

## Activation et validation

1. Configurer `FIREBASE_SERVICE_ACCOUNT_JSON` uniquement côté serveur (Vercel et/ou Node), avec un compte de service du projet indiqué dans `firebase-applet-config.json`. Ne pas committer la valeur et ne pas la préfixer avec `VITE_`. Les API administratives refusent l’accès lorsque la vérification des jetons ne peut pas fonctionner.
2. Créer ou choisir un vrai compte Firebase pour le premier administrateur. Avec les identifiants serveur configurés, exécuter `npx tsx scripts/bootstrap-admin.ts <UID>` puis reconnecter ce compte. Ce script attribue un accès critique : contrôler soigneusement l’UID avant exécution. Il n’a pas été exécuté sur la production.
3. Sauvegarder les données existantes. Déployer `firestore.rules` dans la **base nommée** indiquée par `firestoreDatabaseId`, avec les API et l’interface dans une même fenêtre de mise en service. Les anciennes permissions par email ou documents `admins` sont remplacées par les claims. Attribuer explicitement les claims aux administrateurs/formateurs existants.
4. Migrer les anciens `level-tests.json` et paramètres vers `settings/levelTests` et `settings/levels`, ou les recréer depuis l’administration. Les anciennes tentatives peuvent être importées dans `levelTestAttempts` après contrôle de fiabilité. Elles ne sont pas migrées automatiquement.
5. Installer avec `npm ci --legacy-peer-deps`, puis exécuter `npm run lint`, `npm test`, `npm run build`. En Node : `NODE_ENV=production npm start`. Vercel utilise son serveur dédié `api/index.ts` et les mêmes routers administratifs.
6. En préproduction, vérifier avec de vrais comptes superadmin, DFAT, formateur et apprenant : création/login/reset, suspension, changement de rôle, refus des accès non autorisés, écriture et lecture des cours, examen, rechargement et règles Firestore. Tester également les demandes CGPMP depuis un compte autorisé.

Les tests automatisés utilisent des services Firebase simulés : ils valident les contrats HTTP, les droits, les comptes protégés et le calcul des scores. Ils ne valident pas les identifiants cloud, la livraison des emails, le déploiement des règles ou le rendu dans un navigateur. Aucun navigateur n’était disponible dans cette session. Le déploiement en production et la rotation de secrets n’ont pas été effectués.

Référence de conception : [vérification des jetons Firebase](https://firebase.google.com/docs/auth/admin/verify-id-tokens) et [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims).
