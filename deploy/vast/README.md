# Moteurs Aïda sur Vast, portail sur Vercel

Le portail et Firebase restent sur Vercel. Le serveur GPU exécute Piper (voix françaises Siwis et Tom), MuseTalk 1.5 (animation labiale du portrait existant) et Ollama avec Qwen2.5 7B (dialogue). Veo nécessite une API distante et ne constitue pas un modèle téléchargeable.

## Installation native

Prévoir une RTX 3090 de 24 Go, au moins 32 Go de disque, SSH administrateur et `uv`, FFmpeg, Git, Supervisor et Caddy. Lire `/etc/vast-agents-guide.md` pour l'image concernée. Ne pas installer de pilote NVIDIA : les roues PyTorch embarquent CUDA 11.8.

Cloner ce dépôt dans `/workspace/academia/app`, puis exécuter `install-engines.sh` et `install-dialogue.sh`. Les environnements Python sont isolés ; les poids restent hors du dépôt. Le premier script crée les clés privées dans `/workspace/academia/private/engines.env` (0600). Ne jamais versionner ce fichier.

`install-dialogue.sh` préchauffe le modèle de dialogue. Exécuter ensuite `start-video.sh` : il génère automatiquement le WAV de préchauffage avec Piper, puis démarre MuseTalk. Le portrait vidéo provient de `public/assets/tutrice-professionnelle-v3.mp4`. Attendre que `/health` authentifié annonce `ready: true`. Après un redémarrage complet, le chargement initial du modèle peut nécessiter un nouvel essai.

`configure-gateway.sh` est spécifique à l'image Vast utilisée : vérifier préalablement que le port conteneur 10200 est disponible et alloué. Le script conserve les autres services et ajoute un proxy vers Piper et MuseTalk. Il exempte seulement ce port de l'authentification de la passerelle Vast : les API gardent leurs propres clés Bearer et les vidéos leurs tickets HMAC temporaires. Les moteurs écoutent uniquement sur localhost.

Le tunnel rapide Cloudflare fournit HTTPS pour les appels Vercel, mais son adresse peut changer après redémarrage. Pour une exploitation durable, remplacer ce tunnel par une adresse stable et mettre à jour Vercel. Ne pas désactiver l'authentification des moteurs.

## Configuration Vercel, côté serveur uniquement

- `PIPER_TTS_URL` : `https://PASSERELLE/piper/synthesize`
- `PIPER_TTS_API_KEY` : valeur `TTS_API_KEY` privée du serveur
- `MUSETALK_API_URL` : `https://PASSERELLE/musetalk`
- `MUSETALK_API_KEY` : clé homonyme privée du serveur
- `QWEN_API_URL` : `https://PASSERELLE/musetalk/chat`
- `QWEN_API_KEY` : même clé privée que MuseTalk
- `TUTOR_VIDEO_ENABLED` : `true`

Conserver les paramètres Firebase, JWT, SMTP et les autres secrets du portail. Redéployer Vercel après modification des variables. Ne jamais préfixer les clés moteur par `VITE_`.

## Vérification et exploitation

Vérifier les deux voix françaises, une réponse `/chat`, un rendu vidéo réel H.264/AAC, le refus 401 sans clé, le refus 403 des tickets invalides et la lecture HTTP Range 206. Vérifier ensuite le parcours de la tutrice avec un compte connecté au portail.

Services : `academia-piper`, `academia-dialogue`, `academia-video`, `academia-gateway`, `academia-tunnel`. Journaux dans `/workspace/academia/logs`, vérification via `supervisorctl status`. Le modèle de dialogue 7B préserve de la mémoire GPU pour MuseTalk ; une seule génération vidéo est exécutée à la fois. La reconnaissance vocale n'est pas installée par ces scripts.

Les travaux de rendu sont temporaires, nettoyés à la soumission après 24 h. Sauvegarder la configuration privée hors de l'instance avant sa destruction ; Git contient les sources, pas les clés, modèles ou données. Les licences des voix sont documentées dans `deploy/piper/licences` et les licences des modèles restent applicables.
