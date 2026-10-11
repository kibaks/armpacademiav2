# Corrections applicatives — 11 octobre 2026

Base : `39165d26c404f2a1b916b4f5f8c303585efdf575`. Branche : `fix/security-and-workflows`.

Ce lot corrige du code, contrairement au précédent commit qui ajoutait uniquement l’audit. Il ne clôture pas tout l’audit et ne constitue pas une validation de la sécurité en production. La MFA native et le nouveau stockage privé sont désormais implémentés dans le code ; leur configuration cloud, leur mise en service et la migration des anciens fichiers restent à vérifier.

## Changements

- Restauration du formulaire de connexion réellement tronqué dans AuthModal : le dépôt ne compilait plus.
- Une même application Express pour Node et Vercel. Les erreurs des routes asynchrones sont interceptées ; les erreurs JSON sont explicites. Les fichiers serveur et leurs source maps sont hors du répertoire public `dist/client`.
- Authentification Firebase pour les API IA/voix/vidéo, permissions pour rapports et génération pédagogique, quotas Firestore par compte : 30 requêtes/minute, 1 000/jour et 5 démarrages vidéo/jour. Une panne du quota ne libère pas l’accès. Limite JSON : 4 Mo ; contrôle des types et longueurs du tuteur.
- Positionnement corrigé avec un questionnaire serveur : les clés de correction et les champs `isCorrect`/`score` du navigateur ne décident plus du résultat. Zéro reste zéro. Les tentatives portent l’identité vérifiée.
- Quiz de cours corrigés sur leur banque canonique. Tentatives versionnées, attestations avec identifiant stable et émission transactionnelle sans duplication lors d’une nouvelle réussite. Les tests de niveau administratifs enregistrent leur révision et les niveaux réussis côté serveur.
- Les résultats, niveaux et attestations sont séparés des préférences dans `learningRecords`. Les règles interdisent leur écriture par le client. Les anciennes valeurs déclarées par le client ne sont pas reprises comme résultats fiables. La progression de lecture reste déclarative ; un échec au quiz ne termine plus toutes les leçons.
- Inscription sans Google avec création Firebase réelle, mot de passe de 12 caractères minimum et UID authentifié. Le listener ne crée plus de profil incomplet avant la fin du formulaire Google.
- CGPMP : identifiant UUID, empreinte SHA-256 du fichier, pièce conservée au lieu d’être silencieusement supprimée. Une demande dépassant 900 000 octets est refusée explicitement. Le cache est mis à jour après sauvegarde distante réussie.
- Validation CGPMP depuis la demande persistée : comptes Firebase manquants créés, profils existants conservés, liens personnels de définition du mot de passe, aucune génération ni cache de mots de passe temporaires. Destinataires et validateur fournis par le navigateur ignorés. Envoi contrôlé et reprise idempotente ; le statut de validation n’est enregistré qu’après acceptation des messages par le relais. Une acceptation du relais ne prouve pas une remise dans la boîte email. Les membres ne sont plus annoncés comme activés avant leur première connexion.
- Caches séparés par UID, anciens caches sans UID supprimés, cache du compte effacé à la déconnexion ; fermeture des vues privées et réinitialisation des dossiers lors du changement de session.
- Retrait des majorations statistiques, historiques inventés, progressions calculées sur le nom et homologations locales simulées. Les vues utilisent les enregistrements disponibles, sans inventer un historique absent. Le suivi institutionnel et formateur complet reste à construire.
- Studio : publication après upload durable et sauvegarde Firestore ; une prise échouée reste téléchargeable localement. Durée via référence courante, suppression de la vidéo de démonstration créée après un échec, nettoyage des flux caméra à la fermeture.
- L’action de sauvegarde de cours est présentée comme un favori ; elle ne promet plus un téléchargement hors ligne.
- Arena essayé avant le repli sans Gemini, provenance du fournisseur explicite. Paramètres TTS persistés dans Firestore, lus par chaque instance. Lecture de vidéo interne avec le jeton Firebase, sans le placer dans une URL.
- Permissions formateur limitées aux questions de ses cours et à ses vidéos. Configuration Firebase unifiée sur le fichier JSON et sa base nommée ; dépendance `ws` explicite ; workflow CI Node 22, tests et émulateur.

## Vérifications

- Node **22**, TypeScript : `npm run lint`.
- **42 tests applicatifs** : `npm test` (Firebase et relais email simulés pour les tests HTTP ; aucun email réel envoyé).
- **5 tests de règles** avec les véritables émulateurs Firestore et Storage et Java 21 : `npm run test:rules`. Vérification des résultats non falsifiables, des permissions de formateur, des anciens jetons sans MFA et du refus des accès directs au bucket.
- `npm run build`, génération de la banque canonique depuis le catalogue et `npm run check:api` : démarrage du bundle ESM et accès non authentifiés refusés.
- Chromium : ouverture de la page publique et contrôle des erreurs JavaScript. Ce contrôle ne remplace pas les parcours authentifiés avec les services réels.

Le bundle principal reste volumineux (environ 2,35 Mo non compressés). L’avertissement de découpage Vite reste ouvert.

## Points encore ouverts

| Audit | État et suite nécessaire |
|---|---|
| F01 | **MFA TOTP Firebase implémentée** : enrôlement après réauthentification et email vérifié, résolution du défi avant connexion email/Google, désactivation après preuve du second facteur, politique serveur/Firestore et révocation des sessions lors de la finalisation. Activation Identity Platform/TOTP et essai avec de vrais comptes encore nécessaires. Les facteurs SMS existants ne sont pas pris en charge par le nouveau dialogue TOTP. |
| F02 | Résultats persistés protégés et correction serveur. Les questions publiées sont des supports pédagogiques ; un examen à enjeu nécessite une banque privée, un contrôle des prérequis et une politique de tentatives. La validation de leçons reste à déplacer côté serveur. |
| F03–F04 | Accès, quotas et contrôle d’entrée ajoutés ; budgets fournisseurs et protection contre la création massive de comptes restent à paramétrer. |
| F05 | **Révocation de la clé historique non vérifiée**. Action nécessaire chez le fournisseur ; suppression dans Git seule insuffisante. |
| F06 | **Nouveaux fichiers privés via Firebase Storage et API propriétaire** : aucun jeton public de téléchargement, registre serveur, cookie HttpOnly révocable pour les lecteurs, refus des anciens jetons sans MFA, suppression propriétaire et pagination. Documents toujours privés ; médias publiés explicitement publics. Relais limité à 3 Mo. Bucket/IAM/règles réels, migration des anciens fichiers externes et upload de grands médias restent ouverts. |
| F07–F09 | Parcours CGPMP corrigé et testé avec services simulés. Taille des pièces limitée à la capacité Firestore ; grand fichier privé à traiter avec F06. Anciens dossiers dont la pièce a disparu : nouvelle soumission nécessaire. |
| F10–F13 | Application serveur commune, paramètres TTS persistants, inscription réelle et positionnement serveur. Vérification Firebase, email et IA de production encore nécessaire. |
| F14 | Caches et vues privées isolés ; pas de migration des anciens résultats/cache comme données fiables. |
| F15–F16 | Simulations supprimées. Affectations formateur, statistiques nationales exhaustives, historique daté et filtrage temporel restent à développer. Le tableau indique cette limitation. |
| F17–F18 | Repli Arena corrigé et droits formateur restreints ; parcours réels à valider sur la configuration de production. |
| F19 | Publication différée et erreurs explicites. Dépend encore de la sécurisation du stockage (F06). |
| F20 | Promesse hors ligne retirée ; véritable cache des contenus et lecteur hors ligne non implémentés. |
| F21–F23 | CI, tests applicatifs/règles, configuration commune, `ws` explicite et serveur hors dossier public. Parcours navigateur authentifiés de production non exécutés. |
| F24–F25 | Découpage du client, pagination exhaustive et atomicité de toutes les mutations administratives encore ouverts. |
| F26 | Révision enregistrée. Refus des soumissions devenues obsolètes et politique détaillée de reprise encore ouverts. |
| F27 | Échec au quiz : seules les leçons réellement marquées restent terminées. |

## Mise en service

1. Fournir `FIREBASE_SERVICE_ACCOUNT_JSON` côté serveur (ou une identité Firebase Admin valide), avec accès à la base **nommée** indiquée dans `firebase-applet-config.json`. Aucune clé privée ne doit être préfixée `VITE_`.
2. Configurer `RESEND_API_KEY` et un expéditeur/domaine vérifié (`RESEND_FROM`). Les demandes CGPMP ne sont pas déclarées validées si le service refuse l’envoi. Une reprise peut trouver des comptes déjà créés : elle les réutilise.
3. Publier les règles du fichier `firebase.json` sur cette base nommée, puis le nouveau code lors d’une mise à jour coordonnée. L’ancien client ne peut plus écrire ses résultats après durcissement des règles : rechargement nécessaire. Ne pas réimporter ses attestations comme résultats vérifiés.
4. Tester deux comptes distincts, une inscription email et Google, des quiz à 0 et 100, une demande CGPMP avec pièce, une panne puis une reprise du relais, et les droits d’un formateur. Vérifier aussi les erreurs de configuration et les limites de fichier.
5. Finaliser la configuration et la validation cloud de F01/F06, migrer les anciens fichiers privés et révoquer la clé historique F05 avant de déclarer l’application sécurisée. Les services externes n’étaient pas configurés dans cet environnement ; leur disponibilité, leurs permissions et le déploiement des règles n’ont pas été confirmés.

Aucun déploiement de production ni fusion dans `main` n’est effectué par ce lot.


## Deuxième lot : MFA et stockage privé

- Dialogue TOTP réel partagé par connexion email, Google et réauthentification. La clé d’enrôlement est affichée uniquement à l’utilisateur et n’est enregistrée ni dans les caches ni dans le profil.
- Le serveur vérifie les facteurs inscrits dans Firebase Auth et sa politique `accountSecurity`, pas le booléen fourni par le navigateur. La politique reste protégée par les règles. Un compte protégé ne peut pas effacer cette politique avec un ancien jeton de connexion simple.
- La finalisation de l’enrôlement ferme les sessions et impose une nouvelle connexion. La désactivation est effectuée côté serveur après réauthentification avec le second facteur. Une erreur de finalisation reste visible ; elle ne devient pas une réussite fictive.
- `privateFiles` contient la propriété et les noms d’objets côté serveur. Le navigateur ne peut pas écrire ce registre. Les objets sont chargés sans jeton Firebase de téléchargement, sous `academia/{uid}/{uuid}`. Les réponses ne donnent pas leur chemin de bucket.
- Les fichiers privés sont lisibles uniquement par leur propriétaire connecté. Le cookie de lecture dure une heure, est HttpOnly et SameSite Strict, devient Secure en production, est remplacé lors des changements de session et effacé à la déconnexion. Les sessions Firebase révoquées sont refusées.
- Les publications vidéo/audio et le studio utilisent explicitement des médias publics. Les documents ne peuvent pas être publiés par cet endpoint. Leur confidentialité n’est pas déduite d’un libellé fourni par un stockage externe.
- Les signatures des formats sont contrôlées, les mutations coûteuses sont limitées par le quota persistant et les réponses de lecture sont sans cache, avec `nosniff`. Un échec d’enregistrement de métadonnées nettoie l’objet ; une suppression échouée conserve le registre.
- Limite effective **3 Mo** pour le relais Vercel. Les indications de 100 Mo ont été retirées des vues concernées. Les enregistrements longs ont encore besoin d’un upload direct temporaire signé. Les statistiques exhaustives de stockage sont annoncées comme indisponibles.
- Suppression des faux posts de certification et de la note vocale synthétique créée quand le microphone échoue. Une note vocale dont l’import échoue est téléchargée localement et reste non publiée. La publication d’un post attend Firestore et conserve le brouillon en cas d’erreur.

### Configuration nécessaire et limites de vérification

1. Firebase Authentication doit disposer d’Identity Platform et de TOTP. `npm run configure:mfa` vérifie la configuration sans la modifier ; `npm run configure:mfa -- --apply` active TOTP en conservant les autres fournisseurs. Ces commandes nécessitent une identité Admin autorisée. Aucun secret n’est fourni par le dépôt.
2. Le compte serveur doit accéder au bucket `gen-lang-client-0775786837.firebasestorage.app` et à la base Firestore nommée. Vérifier que ce bucket existe et que ses objets ne sont pas rendus publics par une politique IAM. Les règles Storage ne peuvent pas supprimer une autorisation IAM publique du bucket.
3. Vérifier les règles existantes et les éventuels autres utilisateurs de ce bucket avant de publier `storage.rules`, puis déployer les règles Firestore/Storage avec le code. Les nouvelles règles Storage refusent tous les accès clients directs ; le serveur Admin reste autorisé par IAM.
4. Tester un enrôlement réel, une connexion TOTP email/Google, un mauvais code, une désactivation, un ancien jeton et deux comptes distincts sur une pièce privée. Les tests HTTP de ce lot simulent Firebase Admin/bucket ; ils ne prouvent pas la configuration du projet cloud.
5. Exporter/migrer les anciens fichiers privés du service Academia et révoquer sa clé exposée chez le fournisseur. Les anciennes URL ne sont pas transformées ni sécurisées automatiquement. Les pièces CGPMP existantes restent dans Firestore avec leur limite actuelle.
6. Accès au projet Vercel refusé pour l’équipe `doc-check-dev` (**403**). Aucun jeton Vercel local disponible. GitHub Actions était bloqué par la facturation du compte au premier lot. La compilation et les vérifications locales sont exécutées ; aucune validation authentifiée de production ni déploiement de production n’est revendiquée.
