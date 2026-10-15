# Réponses vidéo de la tutrice — Sync.so

La génération automatique est désactivée par défaut. Le lecteur MP4 remplace
le portrait animé de la tutrice dans le studio et les questions de cours.
Au repos, il propose un extrait de démonstration Sync-3 clairement identifié,
avec sa propre voix enregistrée. La lecture audio d’une autre réponse met cet
extrait en pause et affiche une photo fixe : aucune bouche simulée ne prétend
suivre une voix différente. Henri conserve son rendu actuel.

La génération par réponse utilise la narration du serveur
(Piper en priorité, puis Cartesia et ElevenLabs disponibles) comme piste audio
d’une génération Sync.so. Le lecteur joue uniquement le MP4 final, avec son son.
Les appels audio et Henri conservent leur lecture vocale actuelle.

## Configuration serveur

- `SYNC_API_KEY` : clé secrète créée dans Sync Studio → Settings → API Keys.
- `SYNC_TUTOR_VIDEO_URL` : URL HTTPS publique d’un plan continu propre de la
  tutrice. Le fichier doit être disponible pour les serveurs Sync sans session.
  Le plan fourni est `/assets/tutrice-sync-source-v1.mp4` sur le domaine de
  l’application, avec sa provenance dans le fichier JSON voisin. Il est recréé
  depuis les portraits originaux par `tools/create_sync_master.py` (OpenCV,
  NumPy et FFmpeg), sans sortie des modèles labiaux du prototype académique.
- `SYNC_TUTOR_IMAGE_URL` : portrait HTTPS original pour le mode `sync-3` ;
  `/assets/tutrice-portrait-v1.jpg` est fourni. Cette image est prioritaire
  lorsque le modèle sélectionné est `sync-3`.
- `SYNC_VIDEO_MODEL` : `sync-3` (défaut), `lipsync-2-pro` ou `lipsync-2`.
- `SYNC_VIDEO_DAILY_LIMIT` : nombre maximal de nouvelles demandes par utilisateur
  et jour UTC (6 par défaut). Les tentatives échouées comptent aussi.
- `TUTOR_VIDEO_ENABLED` : conserver `false` pendant la préparation ; passer à
  `true` seulement une fois la clé, la source, le forfait et le rendu validés.

Ces variables n’ont aucun préfixe `VITE_`. Ne jamais inclure la clé dans Git,
les journaux ou la configuration publique. Redéployer après modification des
variables Vercel. Le compte de service Firestore utilisé par le backend doit
pouvoir gérer les collections `tutorVideoJobs` et `tutorVideoQuotas` ; les
clients n’ont besoin d’aucun droit sur ces collections.

Le fichier académique `tutrice-plan-coherent.mp4` utilise les poids Wav2Lip
réservés au prototype hors production. Il n’est pas distribué par cette
intégration. Recréer le plan depuis les portraits d’origine ou utiliser une
vidéo source dont les droits permettent l’exploitation prévue.

## Comportement

Dans le tuteur, la lecture d’une réponse féminine prépare sa vidéo lorsque le
service est activé. Dans les questions du cours, le lecteur apparaît sous le
bandeau du tuteur. La fermeture de l’interface, un changement de profil ou le
démarrage d’une autre lecture annule l’attente et empêche une ancienne vidéo de
remplacer la réponse courante. Annuler l’attente n’annule pas une génération
déjà acceptée chez Sync et ne garantit aucun remboursement.

Le bouton « Écouter sans vidéo » reprend le texte avec le service vocal.
Les réponses de plus de 1 800 caractères sont refusées explicitement pour la
vidéo, sans troncature silencieuse. Le texte et l’audio restent utilisables.
Le MP4 comporte des contrôles pour démarrer manuellement si le navigateur bloque
la lecture automatique avec son.

En entrée vidéo, les mouvements de tête et les gestes proviennent de la source.
Le mode `loop` les prolonge pour couvrir l’audio entier. En entrée portrait,
Sync-3 produit la séquence parlée ; ses mouvements ne sont pas garantis comme
gestes sémantiques. Il ne s’agit pas d’un avatar 3D articulé.
Le forfait d’essai observé le 15 octobre 2026 comprend trois vidéos par période ;
ne pas activer la lecture automatique pour tous les utilisateurs avec ce seul
quota. Vérifier les durées et modèles autorisés dans le forfait actif.

## Essais du 15 octobre 2026

Le premier essai `lipsync-2-pro`, avec le plan source bouche fermée, a produit
un MP4 de 7,92 secondes dont la bouche reste presque immobile : ce rendu est
rejeté et ne constitue pas une validation de ce plan pour ce modèle.
Le deuxième essai, avec le portrait original et `sync-3`, a produit un MP4
parlé de 7,88 secondes. Son exemplaire encodé en 540 × 720 avec audio AAC est
`/assets/tutrice-reponse-sync-v1.mp4`. Il explique la comparaison des offres.
Les filigranes du forfait d’essai sont conservés. Les URL privées des travaux
et la clé API ne sont pas publiées dans le dépôt.

Les demandes identiques d’un utilisateur réutilisent le même travail Firestore.
Une transaction réserve le quota avant la synthèse ; l’identifiant déterministe
est aussi envoyé comme `Idempotency-Key` à Sync. Les soumissions incertaines ne
sont jamais relancées automatiquement. En cas d’échec persistant, l’administrateur
doit vérifier le tableau Sync avant de supprimer le travail concerné et permettre
un nouvel essai, afin d’éviter une facturation en double.

Les URL de sortie sont conservées dans les travaux. Si une URL expire chez le
fournisseur, le lecteur propose l’audio ; l’administrateur doit récupérer une
nouvelle URL ou supprimer le cache après vérification de la génération. Prévoir
une politique de conservation des travaux et quotas selon l’usage réel.

## Validation avant activation

1. Vérifier que la source HTTPS se télécharge et affiche le bon portrait sans
   doublure, zoom ni coupure ; elle doit contenir un seul visage visible.
2. Avec un compte de test connecté et le service activé dans un environnement
   d’essai, demander une réponse courte sur le cours, puis lancer sa lecture.
3. Contrôler la voix, les lèvres, les dents, les clignements et la fin du plan.
   Le même rendu que le prototype n’est pas garanti par le changement de moteur.
4. Relire la même réponse : aucune nouvelle génération ne doit apparaître dans
   Sync. Vérifier également le quota et l’accès refusé depuis un autre compte.
5. En cas de résultat insuffisant, remettre `TUTOR_VIDEO_ENABLED=false` et
   redéployer ; les lectures vocales habituelles restent disponibles.

Contrats API :
https://sync.so/docs/api-reference/api/generate-api/create-with-files
https://sync.so/docs/api-reference/api/generate-api/get
