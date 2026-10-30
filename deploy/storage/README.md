# Stockage des fichiers Academia sur Vast

Le portail Vercel authentifie l’utilisateur et délivre un ticket de transfert de cinq minutes, lié au propriétaire, au nom, à la taille et à la visibilité du fichier. Le navigateur envoie le contenu directement au serveur Vast, sans traverser la limite de corps des fonctions Vercel. Images : 3 Mo ; documents, audio et vidéo : 100 Mo.

`app.py` écoute uniquement sur `127.0.0.1:8063`, sous Supervisor (`academia-storage`). La passerelle existante expose `/files-api/` par HTTPS et le service conserve sa propre authentification. Les médias publics ont une URL directe ; les fichiers privés passent par la session de l’application avant redirection vers une URL signée de cinq minutes. Les consultations et suppressions privées sont limitées au propriétaire et aux administrateurs. Aucun secret n’est envoyé dans le bundle client. Les tickets d’upload sont à usage unique.

## Installation

Après l’installation des moteurs et de la transcription (environnement `stt-venv` avec FastAPI et Uvicorn), copier ce répertoire dans `/workspace/academia/app/deploy/storage`, puis exécuter :

```sh
ACADEMIA_STORAGE_URL=https://VOTRE-PASSERELLE bash deploy/storage/install.sh
```

Le script crée `/workspace/academia/private/storage.env` (0600), ajoute seulement la route de stockage à la passerelle et redémarre `academia-gateway`. Les services de gestion Vast et les moteurs ne sont pas arrêtés. Configurer les mêmes valeurs `ACADEMIA_STORAGE_URL` (avec le suffixe `/files-api`) et `ACADEMIA_STORAGE_KEY` dans Vercel, côté serveur, puis redéployer. Ne jamais publier le fichier privé. Un changement d’adresse du tunnel impose de mettre à jour les deux configurations et Vercel.

Les données et métadonnées SQLite sont dans `/workspace/academia/storage`, hors Git. Le quota logique est de 5 Go et une réserve de disque de 512 Mo est conservée. Les suppressions déplacent les fichiers et métadonnées dans `storage/trash` pour récupération manuelle. La corbeille occupe toujours de l’espace. Sauvegarder le répertoire complet et le fichier privé avant toute destruction/recréation de l’instance.

## Vérification et retour arrière

```sh
/workspace/academia/stt-venv/bin/python deploy/storage/test_api.py
curl -fsS http://127.0.0.1:8063/health
supervisorctl status academia-storage
```

Tester aussi depuis Vercel : connexion, ticket, transfert HTTPS, aperçu public, téléchargement privé, refus d’un autre utilisateur, suppression récupérable. Les tests utilisent un répertoire temporaire. Les uploads applicatifs existants sur l’ancien serveur ne sont pas migrés par cette installation.

En cas d’échec, conserver les données ; restaurer la configuration de passerelle sauvegardée dans `private/Gateway-before-storage.Caddyfile`, redémarrer uniquement `academia-gateway` et restaurer la version Vercel précédente. Le stockage antérieur était indisponible : un retour de code ne rétablit pas l’ancien serveur.
