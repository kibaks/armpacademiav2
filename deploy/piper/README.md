# Moteur vocal Academia — Piper
Service indépendant : http://127.0.0.1:8060. Aucun port vocal public.
POST /synthesize : JSON {"text":"Bonjour", "voice":"female"} ; Bearer TTS_API_KEY ; WAV.
Les voix sont chargées une fois. Une synthèse simultanée ; 429 quand occupé. Texte limité à 3000 caractères.
Commandes sur le serveur : cd /opt/academia-tts ; docker compose ps ; docker compose logs --tail=30 ; docker compose stop.
Le secret reste dans /opt/academia-tts/.env (chmod 600), hors Git. Ne pas publier ce fichier.

Sources et licences :
- Piper 1.8.0, GPL-3.0 : https://github.com/OHF-Voice/piper1-gpl
- Siwis : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium ; carte modèle : données CC-BY 4.0, SIWIS / University of Edinburgh.
- Tom : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/tom/medium ; carte modèle : AGPLv3, https://git.bksp.space/Tjiho/French-tts-model-piper
Les cartes modèles et fichiers de licence livrés avec les voix doivent être conservés avec les sources de ce service.
L’intégration publique nécessite un endpoint HTTPS protégé ; ne pas ouvrir le port 8060 directement.

Profil Tom : débit ralenti de 8 % à la synthèse ; hauteur abaissée d’environ 2 demi-tons avec compensation du tempo ; légère présence dans le grave. Le modèle conserve sa prononciation française d’origine.

Stabilité : synthèse par passages de 240 caractères, sans couper les mots ; arènes mémoire ONNX désactivées ; export MP3 pour Vercel. La voix grave reste traitée uniquement côté serveur, sans amplification supplémentaire dans le navigateur.
