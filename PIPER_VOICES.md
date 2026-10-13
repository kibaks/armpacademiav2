# Voix Piper de la plateforme

Piper est prioritaire quand `PIPER_TTS_URL` et `PIPER_TTS_API_KEY` sont présentes côté serveur.
Les variables ne doivent pas porter un préfixe `VITE_` ni être incorporées au navigateur.

- Profil Henri : voix française Tom, réglée sur le serveur avec un débit plus posé et un timbre grave.
- Profils féminins : voix française Siwis.
- La sélection explicite du mode vocal de l’appareil reste disponible.
- Le service reçoit uniquement le texte et le genre vocal, via HTTPS et une clé Bearer.
- Le port Docker reste limité à localhost ; Nginx publie uniquement POST `/piper/synthesize`.
- Une indisponibilité Piper produit une erreur vocale ; elle ne sélectionne pas silencieusement un autre timbre.
- Les mouvements labiaux restent calculés à partir de l’audio réellement décodé ; Piper ne fournit pas d’horodatage de phonèmes dans cette intégration.

Configurer les deux variables dans l’environnement Production du projet Vercel, puis redéployer.
URL de service : `https://academia.137.184.59.184.nip.io/piper/synthesize`.
Ne jamais enregistrer la valeur de `PIPER_TTS_API_KEY` dans Git.

Vérification : `GET /api/tts/settings` doit annoncer `availability.piper=true` et `defaultVoiceMode=studio`.
`POST /api/ai/tts` avec un texte et `voice=henri` doit renvoyer `provider=piper` et `mimeType=audio/wav`.
