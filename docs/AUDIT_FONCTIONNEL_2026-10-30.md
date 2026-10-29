# Audit fonctionnel d’ARMP Academia — 30 octobre 2026

## Périmètre et méthode

Lecture des composants React, des routes Express locales et Vercel, des données initiales, des accès Firestore et des règles. Recherche des alertes simulant une action, boutons sans action, vidéos d’exemple, compteurs constants, valeurs aléatoires, caches partagés et sauvegardes ignorées. Vérification des parcours d’initiation, catalogue, lecteur, profil/forum, formateur/studio, guichet et administration. Les contrôles automatisés couvrent les frontières d’autorisation, les calculs, les écritures et les formats de documents. Les contrôles de production utilisent des comptes de démonstration ; leurs limites sont consignées dans le rapport de livraison.

Les contenus de cours et les illustrations sont des ressources éditoriales : leur caractère statique n’est pas un défaut fonctionnel. Les comptes explicitement identifiés « Démonstration » restent des comptes de test. Aucun effacement de l’historique existant n’a été effectué. Cet audit ne constitue pas une validation juridique de l’ensemble du contenu éditorial.

## Plan priorisé et réalisation

| Priorité | Constat vérifié | Correction | État du code |
|---|---|---|---|
| P0 | Statistiques institutionnelles additionnées à des constantes ; multiplicateurs artificiels par trimestre | API d’agrégation des profils/demandes enregistrés, filtres réels, zéro sans données, périodes calendaires | Implémenté |
| P0 | Rapport de performance avec taux de 87 %, gain de 18 % et baisse des rejets de 32 % inventés en repli | Synthèse déterministe calculée côté serveur et sauvegardée avant confirmation ; anciennes synthèses simulées exclues de la liste courante | Implémenté |
| P0 | Lecture assimilée à une certification ; score de 90 % par défaut et référence aléatoire côté navigateur | Correction des réponses et émission idempotente côté serveur, journal des tentatives, référence stable, document canonique privé | Implémenté |
| P0 | Temps d’étude et score augmentés par le bouton « +1h30 » ; ajouts fixes à chaque lecture | Minuteur d’activité du lecteur visible ; durée par cours et jour ; bouton ouvre une séance sans augmenter le score | Implémenté |
| P0 | Profils de démonstration mélangés au suivi réel et progression calculée à partir du nom/identifiant | API de profils ; périmètre par rôle et module ; progression, score et dernière lecture réellement enregistrés | Implémenté |
| P0 | Écriture directe des certificats, résultats et durées depuis le navigateur | Champs réservés au serveur dans le client et les règles Firestore ; certificats canoniques dans une collection serveur uniquement | Implémenté |
| P1 | Téléchargement des ressources et certificat réduit à une alerte | Véritables PDF : support complet issu du cours et attestation du propriétaire après évaluation réussie | Implémenté |
| P1 | Téléchargement hors ligne limité à un drapeau dans le profil | Téléchargement effectif du support PDF ; indication exacte de ce qui reste consultable sans connexion | Implémenté |
| P1 | Génération PPT simulée par une alerte | Génération par le Qwen local et création d’un véritable fichier PowerPoint ; contrôle du rôle ; erreur explicite si le moteur ne produit pas la structure | Implémenté |
| P1 | Générateur de modules non présent dans l’API Vercel et repli local préfabriqué | Route partagée, Qwen local, validation de la structure ; brouillon à relire ; aucun contenu de substitution présenté comme une génération réussie | Implémenté |
| P1 | Recommandations toujours orientées sur les mêmes modules | Recommandations fondées sur le rôle vérifié, les cours disponibles et les résultats enregistrés | Implémenté |
| P1 | Observations et certifications manuelles du formateur dans le seul localStorage | Observations sauvegardées côté serveur après contrôle du périmètre ; revue d’une attestation existante sans inventer de réussite ni de score | Implémenté |
| P1 | Studio initialisé avec des films publicitaires ; enregistrement échoué remplacé par un film d’exemple | Bibliothèque réelle, capture obligatoire, aucun faux fichier ; avertissement explicite si l’enregistrement n’est conservé que dans la session | Implémenté |
| P1 | Note vocale composée de sinusoïdes au lieu d’une voix | Véritable synthèse vocale Piper via l’API authentifiée ; aucun faux son en repli | Implémenté |
| P1 | Publications et Q/R fictives attribuées à l’utilisateur courant ; cache social global entre comptes | Chargement des publications et Q/R enregistrées ; suppression des données de départ inventées et du cache partagé comme source d’affichage | Implémenté |
| P1 | Réactions/commentaires des autres auteurs refusés par Firestore et échec masqué | Transactions serveur : réaction idempotente par UID, commentaire attribué à l’identité authentifiée, sauvegarde confirmée | Implémenté |
| P1 | Demandes et décisions CGPMP annoncées avant sauvegarde, date fixe et identifiants à collision | Identifiants UUID, dates ISO, attente de sauvegarde, décision transactionnelle uniquement sur une demande en attente ; aucun message « notification envoyée » sans envoi | Implémenté |
| P1 | Ancienne API vidéo renvoyant toujours un MP4 fixe avec l’étiquette Veo | Retrait des routes de démonstration (410 explicite) ; le lecteur de la tutrice continue d’utiliser le moteur réel existant | Implémenté |
| P2 | Histogramme annuel limité à six colonnes ; hauteur minimale positive même à zéro | Largeur calculée selon le nombre de mois et hauteur nulle à zéro ; suppression des hausses affichées sans mesure | Implémenté |
| P2 | Fausses notes du catalogue/formateur et nombres d’inscrits éditoriaux présentés comme mesures | Affichage recentré sur les chapitres ; suppression des notes sans système d’avis ; effectifs de suivi calculés sur les inscriptions/activités | Implémenté |
| P2 | Sélecteur « hors-ligne » purement visuel | État réel du réseau ; documents téléchargés explicitement distincts des services en ligne | Implémenté |
| P2 | Promesses de PWA complète, 2 500 alumni, QR vérifiable et homologation sans mécanisme correspondant | Textes d’accueil et attestations ajustés aux fonctions disponibles ; aucune homologation administrative ni signature officielle inventée | Implémenté |
| P2 | Bibliothèque promettant des textes intégraux alors que seuls des extraits sont indexés | Export PDF des extraits, explicitement étiquetés comme pédagogiques ; pas de faux DAO ni de document officiel fabriqué | Implémenté |

## Ordre de livraison et effort indicatif

Les estimations ci-dessous décrivent la taille relative des lots pour leur maintenance, pas un relevé des heures réellement passées.

| Lot | Impact attendu | Effort indicatif | Dépendance |
|---|---|---|---|
| 1. Fiabilité des données, évaluations et périmètres | Éviter les réussites, temps et effectifs inventés | Moyen à élevé (1 à 3 jours de développement classique) | Prioritaire avant les exports et rapports |
| 2. Documents, studio et génération de supports | Remplacer les actions simulées par des fichiers réellement utilisables | Moyen (1 à 2 jours) | Services locaux et stockage existants |
| 3. Sauvegardes du forum, du suivi et du guichet | Éviter les pertes et confirmations trompeuses | Moyen (1 à 2 jours) | Contrôles du lot 1 |
| 4. Libellés, graphes et suppression des promesses non fournies | Rendre le fonctionnement compréhensible et vérifiable | Faible (une demi-journée à une journée) | Lots 1 à 3 |
| 5. Notifications externes, PWA et homologation officielle | Étendre les capacités au-delà du périmètre actuellement configuré | À chiffrer après choix des canaux et règles institutionnelles | Configuration fournisseur et décisions métier |

## Fonctions déjà reliées à des services

- Authentification, récupération de compte, sessions et double authentification : API et contrôles serveur existants conservés.
- Administration des utilisateurs, niveaux et tests : API existante ; nouvelle agrégation réelle ; absence d’avis utilisateurs affichée comme telle.
- Progression d’initiation, validation de niveau et parcours guidé : conservés.
- Tutrice, vocaux directs, transcription, dictionnaire de prononciation, TTS et vidéo MuseTalk : services existants conservés ; synthèse des notes vocales reliée à ce TTS.
- Images de profil, galerie et fichiers : stockage existant conservé ; les échecs de sauvegarde ne doivent plus créer de faux succès sur les parcours corrigés.
- Cours officiels : catalogue partagé entre navigateur et serveur pour éviter deux versions différentes des évaluations.

## Intégrations restant à configurer / évolutions distinctes

| Élément | État exact | Prochaine étape nécessaire |
|---|---|---|
| Notifications automatiques WhatsApp/SMS/web push | Le profil conserve les préférences, mais aucun distributeur de notifications n’est configuré dans ce portail | Paramétrer un fournisseur et ses expéditeurs/modèles, définir les événements et obtenir le consentement avant envoi. Aucun message externe de test n’est envoyé par cet audit. |
| PWA intégralement hors ligne | Non fournie : documents PDF téléchargeables ; quiz, IA, authentification et vidéos nécessitent le réseau | Concevoir séparément service worker, cache par compte, synchronisation et politique d’expiration |
| Certification administrative officielle et QR public | Attestation pédagogique après réussite uniquement, référence privée stable | Définir le visa et les signataires habilités, la révocation et les données publiables avant un service public de vérification |
| Contenu juridique et documents officiels intégraux | Ressources éditoriales et extraits conservés | Faire valider le corpus et joindre les documents officiels exacts ; ne pas présenter un extrait comme texte intégral |
| Téléversement vidéo/audio volumineux | Dépend du stockage existant et du réseau ; échec désormais signalé | Mesurer quotas et reprise d’upload, puis ajouter stockage multipart si nécessaire |
| Historique antérieur sans dates ISO ou durées datées | Conservé ; pas de ventilation trimestrielle inventée | Migration contrôlée si les dates d’origine sont connues ; aucune reconstruction fictive |

## Exploitation et retour arrière

Le déploiement ne nécessite pas de migration destructive. Les nouvelles collections `courseAttempts`, `courseCertificates` et `trainerObservations` sont réservées au serveur par défaut. Le rôle est issu de la session authentifiée, jamais du corps de la requête. Les nouvelles règles doivent être livrées avec le client qui exclut les champs calculés de ses sauvegardes. Retour arrière : redéployer la version Vercel précédente et les règles précédentes ensemble si un parcours essentiel régresse. Les enregistrements canoniques restent conservés.

Les durées d’étude sont des mesures d’activité du lecteur, pas une preuve de présence physique. Le score pédagogique ne mesure pas la conformité juridique des marchés d’une institution.
