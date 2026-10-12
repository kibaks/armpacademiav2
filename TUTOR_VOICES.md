# Voix et avatars des tuteurs

Le choix du profil est commun au chat, aux appels audio, à la visio et aux cours. Il est mémorisé sur l’appareil. Henri utilise un portrait masculin animé ; les profils féminins utilisent le portrait existant.

Les profils vocaux sont définis dans `shared/tutorVoices.ts`. Henri utilise HenriNeural puis RemyMultilingualNeural. Les quatre profils féminins ont des voix adultes distinctes. Les débits sont posés et la hauteur est légèrement abaissée. Le caractère réellement rocailleux dépend de la voix du fournisseur ; ces réglages ne garantissent pas une texture de voix spécifique.

ElevenLabs est utilisé seulement si une clé et un identifiant vocal adaptés sont configurés. Variables serveur : `ELEVENLABS_API_KEY`, `ELEVENLABS_MALE_VOICE_ID`, `ELEVENLABS_FEMALE_VOICE_ID`, ou `ELEVENLABS_VOICE_ID_HENRI` (et variantes par profil). Le générique `ELEVENLABS_VOICE_ID` sert uniquement aux profils féminins existants. Ne jamais publier ces valeurs dans le code ou dans une variable VITE.

Le service Edge reste disponible sans nouvelle configuration. Chaque essai est limité dans le temps. Une panne ne déclenche pas une voix d’un autre genre. Le client affiche un message et conserve la réponse écrite. Le secours navigateur demeure soumis au réglage existant.

Validation : TypeScript, build et tests `tests/tutorVoices.test.ts`. Les portraits ont été vérifiés ensemble dans le navigateur. Les essais sonores locaux et sur la production précédente ont dépassé le délai ; une écoute réelle reste nécessaire lorsque le fournisseur répond ou qu’ElevenLabs est configuré.
