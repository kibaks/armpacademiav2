# Plan d’amélioration — ARMP Academia v2

Base : audit du 10 octobre 2026, commit `eea6a541617ef3411790232da8565b522852e799`. Voir [RAPPORT.md](RAPPORT.md) pour les preuves et limites. Ce plan ne contient pas de corrections déjà déployées.

## Objectifs et ordre de travail

1. Rendre les accès et preuves pédagogiques fiables : identité, MFA, autorisations, examens et certificats.
2. Terminer réellement les parcours inscription/CGPMP/formation, avec fichiers et emails durables.
3. Faire fonctionner les mêmes fonctions sur Node et Vercel, et distinguer une indisponibilité d’une réussite.
4. Afficher des données mesurées, isoler les comptes et fiabiliser le studio.
5. Réduire le couplage et maîtriser performances, volumes et exploitation.

Ne pas commencer par une refonte visuelle : les corrections de confiance et de parcours déterminent les états que l’interface doit afficher.

## Lot 0 — Établir la référence et contenir les risques (1–2 jours)

**Couvre : F01–F06 et préparation F21–F22.**

- Préproduction dans un projet Firebase/base distincts ; deux apprenants, deux formateurs, un DFAT et un superadmin de test. Relever les configurations réellement utilisées, les règles déployées et les capacités Node/Vercel.
- Rétablir une installation reproductible sous Node 22 avec le lock : `npm ci`, puis lint/test/build/check:api. Documenter chaque échec réel avant d’ajuster les dépendances. Ajouter ws directement si l’import est conservé.
- Vérifier/révoquer la clé de stockage historique chez le fournisseur, puis renouveler la clé serveur ; vérifier que les anciennes clés et anciens bundles ne permettent plus d’accès.
- Ajouter validation et gestion globale des erreurs aux routes IA, limiter les tailles et quotas/concurrence. Authentifier les usages privés et réserver les opérations de génération aux rôles concernés. Un quota d’aperçu anonyme doit être une décision explicite de produit.
- Pendant la correction, rendre clairement indisponibles les garanties de second facteur et de certificat que le système ne peut pas prouver. Si les données de production existent, les sauvegarder avant de resserrer les règles.

**Sortie :** build de référence connu ; requêtes mal typées refusées proprement ; quota effectif ; clé historique révoquée ou statut documenté comme bloquant ; aucun usage présenté comme protégé par MFA sans preuve.

## Lot 1 — Identité, preuves et permissions (5–8 jours)

**Couvre : F01–F02, F06, F13–F14, F18 ; bases F25–F26.**

### Identité

- Utiliser un seul service de configuration Firebase avec projet et base explicites. Supprimer l’ambiguïté entre firebaseConfig JSON et VITE_FIREBASE_* ; valider les paramètres au démarrage.
- Choisir et intégrer le facteur Firebase MFA compatible avec le projet et les fournisseurs. Contrôler la preuve du facteur pour les accès qui l’exigent, y compris Firestore direct. Vérifier les besoins Identity Platform, d’enrôlement et de récupération avant de choisir le facteur.
- Aucune session applicative finale sur la seule notification onAuthStateChanged si une étape MFA/onboarding reste à terminer. Enrôlement et désactivation exigent une réauthentification.
- Retirer les mots de passe générés des caches/documents. Les comptes reçoivent un lien d’activation ou de définition de mot de passe.

### Données pédagogiques

Schéma cible proposé, à adapter aux collections déjà présentes :

| Donnée | Qui écrit | Source de vérité |
| --- | --- | --- |
| Profil personnel | Propriétaire, champs autorisés seulement | users/{uid}, validations de forme |
| Rôle/suspension/facteur requis | Service d’identité/admin | Auth/claims et politique serveur |
| Questions/corrigés versionnés | Administration/formateur autorisé | Banque privée ; présentation apprenant sans corrigés |
| Tentative | Serveur depuis UID + réponses | testId, version, réponses, score, seuil, date |
| Niveau validé | Serveur depuis tentative réussie | résultat canonique et référence à tentative |
| Certificat | Serveur depuis critères réussis | ID stable, UID, cours/version, tentative, date, état |
| Lecture/progression | Événements bornés et validés | événements de cours ; aucune équivalence automatique à certification |
| Statistiques | Agrégation serveur | événements/résultats, période et institution réelles |

- Préserver la bonne correction transactionnelle /level-tests/attempt et l’étendre au positionnement et aux quiz de cours.
- Refuser les tentatives vides, conserver 0 %, ignorer isCorrect/score/passed client, borner les essais et enregistrer une version du test.
- Règles Firebase par liste blanche à la création/mise à jour ; résultats pédagogiques interdits aux écritures utilisateur. Aucun admin automatique fondé sur email ou rôle local.
- Vérifier l’assignation formateur/cours/apprenants, immutabilité des propriétaires, confidentialité des brouillons et corrigés.
- Caches et état React isolés par UID, purge sur logout/changement de compte ; pas de réutilisation de validations locales d’un autre compte.
- Toute opération fichier vérifie propriétaire/assignation. Pour les grands médias, prévoir transfert direct autorisé temporairement plutôt que faire passer 100 Mo dans une fonction Vercel inadaptée.

**Sortie :** suite Firebase/HTTP prouvant que certificats et niveaux ne peuvent pas être forgés, MFA exigée pour les accès sensibles et isolation A/B. Résultat 0/5 exactement égal à 0.

## Lot 2 — Inscription et workflow CGPMP complets (5–8 jours)

**Couvre : F07–F12 et F22.**

1. Créer un état d’onboarding unique : identité Firebase, profil incomplet, formulaire finalisé. Le listener global ne crée pas le rôle final en parallèle du formulaire.
2. Inscription email réelle si Google échoue : création Firebase, vérification d’adresse adaptée, finalisation du profil public. Retirer les faux UID GOOGLE-USR/USR-GOOGLE.
3. Soumission CGPMP authentifiée, ID UUID/Firestore ; pièce téléversée en privé avant l’écriture du dossier, fileId durable et hash SHA-256 calculé sur le contenu. Pas de dossier complet avec seulement un nom de fichier/spécimen.
4. Validation par un endpoint admin : lire le dossier enregistré, contrôler son état, créer/récupérer les comptes Firebase et enregistrer les vrais UID. L’acteur et les destinataires viennent des données validées, pas d’un nom d’admin libre fourni par le client.
5. Opération idempotente multi-services avec états intermédiaires, compensations et tâche de réconciliation ; Auth et Firestore ne partagent pas une transaction globale.
6. Outbox email : en attente → accepté fournisseur → livré/échoué selon événements disponibles. Liens d’activation à usage limité, reprise avec prévention des doubles envois.
7. Messages UI fondés sur la réussite durable. Une erreur d’email n’est ni un compte activé ni une validation locale de substitution.
8. Migration des demandes/comptes simulés : rapprocher emails et vrais UID, retirer credentials historiques, classer les dossiers incomplets et demander la pièce manquante. Ne pas attribuer de résultats pédagogiques à partir de simulations.

**Sortie :** demande avec pièce de 1 Mo, décision admin, email, activation puis login de tous les membres, relus depuis un second navigateur. Répéter une décision ne crée aucun doublon. Pannes aux étapes fichiers/Firestore/email visibles et récupérables.

## Lot 3 — Parité des serveurs et vérité des écrans (5–8 jours)

**Couvre : F10, F15–F17, F19–F20, F23 et F27.**

- Extraire un appFactory/router commun pour tutor/voix/génération/CGPMP ; Node et Vercel ne gardent que leurs adaptations d’entrée, fichiers temporaires et tâches asynchrones.
- Suite de contrats identique sur les deux entrées. Déclarer les capacités réellement supportées ; une commande indisponible est grisée avec explication, jamais exécutée en simulation silencieuse.
- Fonction TTS persistante via settings Firestore au lieu d’un fichier local, si cette fonction fait partie du produit ; quota partagé et limites de cache. Le préchauffage Vercel doit utiliser un mécanisme d’arrière-plan supporté, pas seulement une promesse après la réponse.
- Tutor : Arena fonctionne indépendamment de Gemini, provider réel dans les réponses ; notes vocales et choix de tutrice traités de manière cohérente. Médias image/PDF : transmettre et extraire réellement le contenu si l’analyse est proposée, sinon indiquer la limitation.
- Rapports/observatoire : supprimer valeurs de démonstration en production, calculs par hash et multiplicateurs arbitraires. Dataset de démonstration séparé et étiqueté. Les taux restent non disponibles lorsqu’il manque des mesures.
- Endpoint de suivi formateur limité à ses élèves/cours. Éviter une ouverture générale de users pour réparer le dashboard.
- Studio : média durable avant publication, états capture/brouillon/upload/échec/publié, bonne durée mesurée, reprise et nettoyage des ressources.
- Quiz final : ne pas terminer toutes les leçons après un échec ; séparer progression et réussite.
- Hors ligne : implémenter un vrai téléchargement avec manifeste de contenu et capacité de relance hors réseau, ou renommer immédiatement la fonction en favori. L’accès IA reste dépendant du réseau.
- Séparer dist/client et dist/server ; aucun bundle/sourcemap serveur dans le répertoire servi au public.

**Sortie :** matrice de capacités identique ou différences clairement affichées ; dashboard d’une base vide = zéro/non mesuré ; publication relue depuis un autre appareil ; panne IA/voix et réseau traitée sans faux succès.

## Lot 4 — Exploitation, qualité et optimisation (3–6 jours pour le premier lot, puis continu)

**Couvre : F21, F24–F26 et suivi de tous les correctifs.**

- CI sous Node 22 : installation propre, TypeScript, tests, build, check d’entrypoint ; tests Firebase et navigateurs. Évaluer séparément les vulnérabilités npm sur le lock installé, sans extrapoler le bilan historique.
- Journal des opérations métier (comptes, claims, validations, tentatives, certificats, fichiers) avec actor UID, ressource, requestId, résultat et date UTC ; ne jamais journaliser de credentials.
- Suivi erreurs 5xx/401/403/429, échecs emails/uploads, divergence Auth/Firestore, coût IA/TTS et alertes. Health distingue disponibilité API, identité, base et fournisseurs.
- Pagination par curseur des comptes/tentatives/audit, réconciliation des opérations partielles, politiques de conservation et retrait des médias orphelins.
- Split des grandes vues en composants/hooks métier, lazy loading studio/tuteur/profil, strict TypeScript par étapes et lint hooks. Optimiser les assets seulement après mesure.
- Mesurer avant/après sur réseau/mobile représentatifs : bundle initial, LCP/INP, mémoire studio, latence voix, cold start. Fixer les budgets à partir de la référence, pas de chiffres inventés.
- Mettre à jour les guides de mise en service : projets Firebase, base nommée, règles/index, claims, variables serveur/client, migration et reprise. Contrôle humain du contenu juridique versionné.

**Sortie :** pipeline obligatoire, métriques réelles disponibles, listes complètes par pagination, procédure de reprise exercée, budgets de performance mesurés.

## Matrice minimale de validation

| Parcours | Cas de réussite | Cas de refus/panne |
| --- | --- | --- |
| Inscription email/Google | UID réel, onboarding terminé | Google indisponible, interruption/réouverture du formulaire |
| Session/MFA | Login avec facteur et refresh | Premier facteur seul, facteur faux/expiré, désactivation non réauthentifiée |
| Accès admin | Superadmin gère, DFAT consulte | Apprenant/formateur interdits ; compte protégé ; jeton révoqué |
| Règles Firestore | Profil personnel permis | Forgery de rôle/niveau/certificat/facteur et lecture d’un dossier tiers |
| Évaluation | 0 %, succès au seuil, tentative versionnée | Liste vide, isCorrect falsifié, doubles soumissions, test modifié |
| CGPMP | Pièce + validation + comptes + activation | Pièce manquante, collision forcée, panne Auth/Firestore/email |
| Médias | Image 3 Mo et média privé durable | Surdimensionné, signature invalide, propriétaire différent, fournisseur en erreur |
| Formateur | Suivi des élèves assignés | Cours/contenus privés d’un autre formateur |
| Analytics | Totaux du jeu connu, base vide | IA indisponible : aucune donnée fabriquée |
| Changement de compte | A → déconnexion → B | B n’hérite pas des notes/dossiers/validations de A |
| Node/Vercel | Même contrat pour chaque fonction proposée | Fonction absente affichée indisponible, pas de fallback mensonger |
| Offline/studio | Réouverture et lecture attendues | Échec d’upload, fermeture pendant capture, coupure réseau |

Tests exécutés sur préproduction et objets de test. Le contrôle de révocation historique se fait côté fournisseur ; il n’exige pas de reproduire ou publier la valeur exposée.

## Ordre et estimation globale

- **Premières 48 heures :** référence exécutable, clé historique, validation des entrées, quotas, décision de confinement des fonctions non fiables.
- **Puis :** identité/résultats/règles → inscription/CGPMP → serveurs/données/UX → optimisation et exploitation.
- **Ordre de grandeur : 5–8 semaines pour les lots principaux** avec un développeur expérimenté et accès aux services, plus validation métier/QA. Les durées par constat dans le CSV ne s’additionnent pas : plusieurs points sont résolus par le même service commun. Le calendrier doit être réestimé après compilation et essais réels ; la MFA, le stockage externe, la migration et les fournisseurs sont les principales inconnues.
- Réserver un lot de mesures/optimisations supplémentaires si le mobile, le studio ou la synthèse vocale dépassent les budgets définis.

## Définition de « prêt »

Une action de l’interface correspond à une écriture ou un service effectif, vérifié sur les deux runtimes ; les rôles, facteurs et preuves pédagogiques sont imposés côté serveur/règles ; les chiffres sont issus d’événements réels ; les scénarios de panne ne produisent pas de fausse réussite. Tous les P0 sont clôturés avec preuve, et les P1 du périmètre lancé sont corrigés avant de qualifier le parcours de complet.

