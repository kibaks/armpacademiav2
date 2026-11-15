# Voix nationales locales avec références natives

Les premiers extraits ont été rejetés. À la demande de l’utilisateur, intégrer uniquement les profils révisés : référence native pour le lingala, le tshiluba et le kituba et 32 étapes de génération. La variété kituba et les traductions restent à vérifier sur des phrases nouvelles.

Service `academia-omnivoice`, authentifié, sur `127.0.0.1:8065`. Il est appelé par le worker national existant ; aucun port public supplémentaire.

- Modèle : `k2-fsa/OmniVoice`, paquet `omnivoice==0.2.1`, PyTorch 2.9.1+cu130 dans `/workspace/academia/omnivoice-venv`.
- Poids locaux : `/workspace/academia/models/omnivoice`. SHA256 du modèle principal : `730839316de585f4c8298ec0e1712efc10fb19c6fa4e36eb741cb8d51ebcf6aa`.
- Tshiluba : code natif `lua` (Luba-Lulua dans le catalogue officiel), génération locale.
- Kikongo du Bandundu : profil **expérimental** en kituba de RDC. La référence audio/transcription est issue de `AfriSpeech/african-speech-public_v1`, configuration `kikongo_ya_leta_ktu`, conservée en privé avec sa provenance. OmniVoice ne répertorie pas le kituba parmi ses langues entraînées ; ce profil utilise une référence native en mode sans code de langue. Ce n'est pas un checkpoint kikongo entraîné ni une garantie de prononciation. Faire écouter à des locuteurs avant de considérer ce profil comme validé.

Aucun appel à Gemini ou autre API vocale payante. Les caractères et diacritiques sont conservés. Les poids OmniVoice sont sous CC-BY-NC ; le code est sous Apache-2.0. Vérifier séparément les droits du corpus avant tout entraînement ou redistribution : sa publication ne constitue pas une licence générale d'exploitation commerciale.

`POST /speech` reçoit `{text, language: "ln" | "lua" | "kg"}` et retourne un MP3 en base64 avec `provider: "national-omnivoice"`. Authentification via la clé serveur existante `MUSETALK_API_KEY`. Une inférence à la fois, 429 si occupé. Les réponses invalides échouent ; aucune voix française de remplacement.

Le worker national active ces profils avec `NATIONAL_EXTRA_VOICES=ln,kg,lua` seulement après les essais réels. Il conserve NLLB pour la traduction, dont la variété kituba de RDC n'est pas garantie et reste à vérifier. Les notes vocales restent transcrites en français.

Le wrapper utilise les bibliothèques CUDA 13 déjà présentes et ajoute au seul venv vocal cuDNN 9.13.0.50, NCCL 2.27.7, cuSPARSELt 0.8.0 et NVSHMEM 3.3.24. Il ne modifie pas les environnements MuseTalk/Piper/NLLB ni le pilote. Les références sont chargées en mémoire avec SoundFile et leur conditionnement est mis en cache.
