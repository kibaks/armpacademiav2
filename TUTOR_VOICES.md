# Voix et avatars des tuteurs

Le choix du profil est commun au chat, aux appels audio, à la visio et aux cours. Il est mémorisé sur l’appareil. Henri utilise un portrait masculin animé ; les profils féminins utilisent le portrait existant.

Les profils vocaux sont définis dans `shared/tutorVoices.ts`. Henri utilise HenriNeural puis RemyMultilingualNeural. Les quatre profils féminins ont des voix adultes distinctes. Les débits sont posés et la hauteur est légèrement abaissée. Le caractère réellement rocailleux dépend de la voix du fournisseur ; ces réglages ne garantissent pas une texture de voix spécifique.

ElevenLabs est utilisé seulement si une clé et un identifiant vocal adaptés sont configurés. Variables serveur : `ELEVENLABS_API_KEY`, `ELEVENLABS_MALE_VOICE_ID`, `ELEVENLABS_FEMALE_VOICE_ID`, ou `ELEVENLABS_VOICE_ID_HENRI` (et variantes par profil). Le générique `ELEVENLABS_VOICE_ID` sert uniquement aux profils féminins existants. Ne jamais publier ces valeurs dans le code ou dans une variable VITE.

Le service Edge reste disponible sans nouvelle configuration. Chaque essai est limité dans le temps. Une panne ne déclenche pas une voix d’un autre genre. Le client affiche un message et conserve la réponse écrite. Le secours navigateur demeure soumis au réglage existant.

Validation : TypeScript, build et tests `tests/tutorVoices.test.ts`. Les portraits ont été vérifiés ensemble dans le navigateur. Les essais sonores locaux et sur la production précédente ont dépassé le délai ; une écoute réelle reste nécessaire lorsque le fournisseur répond ou qu’ElevenLabs est configuré.

## Mode gratuit sans clé

Lorsqu’un fournisseur studio est configuré, le mode studio est le choix initial. Les anciennes préférences de voix appareil sont ignorées après la migration v2. Il utilise uniquement la synthèse vocale du navigateur, sans envoyer le texte au serveur TTS. Le choix « Voix studio » active le serveur et reste mémorisé sur l’appareil. Le bouton « Écouter un exemple » permet de comparer les profils. Les voix françaises adaptées doivent être installées sur l’appareil ; aucun autre genre n’est substitué automatiquement.

Pour la voix studio, configurer `GEMINI_API_KEY` sur Vercel (serveur uniquement), puis redéployer. `GEMINI_TTS_MODEL` est optionnel et vaut `gemini-3.8-flash-tts` par défaut. Les instructions de tonalité restent séparées du texte parlé. Sans fournisseur disponible, la réponse demeure lisible et une erreur explique l’indisponibilité. Ne jamais saisir de clé dans le chat ou dans une variable VITE.

## Disponibilité des crédits et secours

La chaîne studio utilise ElevenLabs puis Gemini. Si les deux sont indisponibles, la réponse écrite reste accessible et une erreur est affichée. Le mode studio ne bascule jamais automatiquement sur la voix de l’appareil ; ce mode doit être choisi explicitement. Aucun fournisseur payant n’est relancé en boucle après un refus de quota.

ElevenLabs : le serveur consulte le quota via `/v1/user/subscription`, garde le résultat une minute et réserve les caractères avant les appels concurrents. Si la clé n’a pas la permission `user_read`, le solde est explicitement inconnu ; la synthèse autorisée peut continuer jusqu’à un refus du fournisseur. Le compteur du fournisseur fait autorité entre les instances Vercel. Cette clé permet déjà les voix et la synthèse, mais la lecture du quota a été refusée pendant la vérification.

Gemini : les réponses 429 et `RESOURCE_EXHAUSTED` suspendent les tentatives pendant le délai `Retry-After` lorsqu’il est fourni. Les tokens d’usage observés sont comptés par instance ; ils ne sont pas présentés comme un solde global restant. Les états sont réservés aux administrateurs via `/api/tts/quota`.

Le préchargement est limité à la phrase suivante. Les résultats vocaux déjà générés restent en cache. Les voix studio masculine et féminine ont été générées réellement avec les deux fournisseurs pendant la validation.

Références : https://elevenlabs.io/docs/api-reference/user/subscription/get et https://ai.google.dev/gemini-api/docs/generate-content/speech-generation.

## Cartesia

Configurer `CARTESIA_API_KEY` en variable serveur secrète Vercel, puis redéployer. Cartesia Sonic est prioritaire, puis ElevenLabs et Gemini. `CARTESIA_TTS_MODEL` vaut `sonic-3.6`. Les profils utilisent des voix françaises distinctes ; Henri utilise Gérard (grave, posé, accent français de France), Aïsha utilise Inès (diction articulée, narration assurée, accent français de France). Le quota restant est inconnu ; les refus du fournisseur et Retry-After bloquent les relances. Aucun secours automatique par voix appareil.

## Synchronisation et latence

Cartesia est appelé via `/tts/sse`, avec les horodatages réels des mots et phonèmes. Le serveur assemble le PCM en WAV ; le client conserve ces temps et anime les lèvres sur l’horloge de sortie audio. La lecture attend encore le fragment complet ; il ne s’agit pas d’un streaming audio progressif jusqu’au navigateur.

Les pauses entre fragments passent à 80 ms. Le premier fragment et le suivant sont préparés en parallèle pour Cartesia, avec déduplication des requêtes. Le cache audio du navigateur est limité à 24 entrées et les réglages fournisseur sont conservés une minute. Les anciens résultats sans phonèmes sont invalidés. Une génération annulée ne peut plus reprendre après une nouvelle lecture.

Le moteur de portrait WebGL existant utilise désormais ces phonèmes. Son nom de fichier historique `wav2lipVideoRenderer.ts` ne désigne pas le modèle neuronal Wav2Lip. Les avatars hors écran ne sont plus rendus et les avatars au repos sont limités à 15 images par seconde. Higgsfield génère des vidéos par requêtes asynchrones : il n’est pas ajouté au chemin interactif pour éviter une attente supplémentaire. Aucune clé Higgsfield n’est incluse dans le dépôt.

Références : https://docs.cartesia.ai/api-reference/tts/sse et https://open.higgsfield.ai/quick-start.

## Interface et superadministration

Le tuteur présente un seul sélecteur de profil, un portrait en buste, la conversation et la saisie. Les questions guidées se déplient à la demande. Les préférences personnelles (voix, cadence, lecture automatique et affichage du portrait) restent accessibles dans le menu de lecture. Les fournisseurs et diagnostics de quota figurent uniquement dans l’onglet « Tuteurs et voix » de l’espace superadministrateur.

`/api/admin/tutor-presentation` réserve la lecture et l’écriture au rôle `super_admin`. Les réglages de gestuelle, d’expressions, de mains et de lecture initiale sont sauvegardés dans Firestore avec une entrée de journal, dans le même batch. Le lecteur public expose uniquement ces préférences de présentation, jamais les clés. Les autres instances les rechargent au maximum après une minute.

Les scènes studio et visio utilisent désormais des portraits photographiques complets : mains, bras, manches et visage restent dans la même posture. Les planches de la tutrice proviennent des références fournies ; le tuteur masculin dispose d’une planche équivalente générée avec son portrait. Les poses changent aux pauses, avec une durée minimale de maintien. Aucun fondu de deux visages ni aucune main détachée n’est affiché. Les vignettes conservent le moteur WebGL. Les lèvres des grands portraits suivent les phonèmes Cartesia et sélectionnent les articulations photographiques correspondantes. La préférence `prefers-reduced-motion` conserve les lèvres et désactive la gestuelle.

Assets de production : `tutor_female_postures.webp`, `tutor_female_articulation.webp`, `tutor_male_postures_articulation.webp`. Les originaux PNG sont conservés dans le workspace. L’ensemble des trois WebP représente environ 512 ko au lieu de 7 Mo pour les PNG.

## Correction des postures à partir des références

`src/utils/tutorReferenceRenderer.ts` affiche une seule posture anatomique complète à la fois. La paume ouverte, les mains posées, la réflexion et l’encouragement sont choisis selon l’état du tuteur et l’émotion. La réflexion avec une main au menton est réservée aux périodes sans parole ; la reprise vocale revient à la posture d’explication. Les articulations fermée, entrouverte, étirée, ouverte, arrondie et consonantique sont calibrées séparément pour les deux visages. Les limites des cellules excluent les marges blanches des références. Il s’agit de changements de poses photographiques et de composition des lèvres, pas d’une vidéo neuronale ni d’un squelette de mains et de doigts.

Assets : `tutor_female_postures.webp`, `tutor_female_articulation.webp` (planches originales fournies), et `tutor_male_postures_articulation.webp` (outil image_gen intégré, identité masculine et tenue conservées à partir du portrait existant). La planche masculine comprend six postures complètes et six articulations. La couche `tutor_teaching_hands.png` et son moteur de superposition sont retirés du rendu.
