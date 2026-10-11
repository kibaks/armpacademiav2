# Corrections applicatives — 11 octobre 2026

Base : `39165d26c404f2a1b916b4f5f8c303585efdf575`. Branche : `fix/security-and-workflows`.

Ce lot corrige du code, contrairement au précédent commit qui ajoutait uniquement l’audit. Il ne clôture pas tout l’audit et ne constitue pas une validation de la sécurité en production. La MFA native et la sécurité du stockage privé restent des priorités ouvertes.

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
- **30 tests applicatifs** : `npm test` (Firebase et relais email simulés pour les tests HTTP ; aucun email réel envoyé).
- **3 tests de règles** avec le véritable émulateur Firestore et Java 21 : `npm run test:rules`. Vérification des résultats non falsifiables et des permissions de formateur.
- `npm run build`, génération de la banque canonique depuis le catalogue et `npm run check:api` : démarrage du bundle ESM et accès non authentifiés refusés.
- Chromium : ouverture de la page publique et contrôle des erreurs JavaScript. Ce contrôle ne remplace pas les parcours authentifiés avec les services réels.

Le bundle principal reste volumineux (environ 2,35 Mo non compressés). L’avertissement de découpage Vite reste ouvert.

## Points encore ouverts

| Audit | État et suite nécessaire |
|---|---|
| F01 | Ancien OTP et faux QR supprimés/désactivés. **MFA Firebase native non implémentée** : prévoir l’enrôlement, la résolution du challenge avant connexion et une politique côté serveur/règles. Aucun indicateur de profil n’est présenté comme preuve d’enrôlement. |
| F02 | Résultats persistés protégés et correction serveur. Les questions publiées sont des supports pédagogiques ; un examen à enjeu nécessite une banque privée, un contrôle des prérequis et une politique de tentatives. La validation de leçons reste à déplacer côté serveur. |
| F03–F04 | Accès, quotas et contrôle d’entrée ajoutés ; budgets fournisseurs et protection contre la création massive de comptes restent à paramétrer. |
| F05 | **Révocation de la clé historique non vérifiée**. Action nécessaire chez le fournisseur ; suppression dans Git seule insuffisante. |
| F06 | **Relais sécurisé générique, propriété des fichiers et accès privé audio/vidéo non résolus**. Le client utilise encore le service externe pour ces opérations. Ne pas considérer les fichiers privés comme sécurisés sur la seule base du libellé `private`. |
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
5. Traiter F01, F05 et F06 avant de déclarer l’application sécurisée. Les services externes n’étaient pas configurés dans cet environnement ; leur disponibilité, leurs permissions et le déploiement des règles n’ont pas été confirmés.

Aucun déploiement de production ni fusion dans `main` n’est effectué par ce lot.
