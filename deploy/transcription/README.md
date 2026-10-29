# Vocaux de la tutrice

`app.py` utilise Faster Whisper Small multilingue sur CPU, en int8. Les questions vocales sont transcrites en français puis passent dans le même circuit pédagogique et les mêmes contrôles de rôle que les questions écrites. Le vocabulaire de démarrage inclut des noms et lieux du Congo ; il améliore le contexte sans garantir chaque transcription.

Installer avec `deploy/vast/install-transcription.sh`. Le service Supervisor `academia-transcription` écoute uniquement sur `127.0.0.1:8062`. La passerelle expose `/stt/` ; ses API exigent `STT_API_KEY`. Configurer côté serveur Vercel `STT_API_URL=https://PASSERELLE/stt/transcribe` et la même clé privée. Ne jamais utiliser un préfixe VITE pour cette clé.

Les enregistrements acceptés sont limités à 6 Mo et 90 secondes. Le micro du portail s'arrête et envoie au bout de 45 secondes ; l'utilisateur peut envoyer ou annuler plus tôt, ou joindre un fichier audio. Les WebM sans durée dans leurs métadonnées sont mesurés après un décodage borné. Les enregistrements incompréhensibles sont refusés sans inventer de question.

Après transcription réussie, les vocaux sont conservés dans `/workspace/academia/private/voice-recordings` avec un identifiant aléatoire et leur propriétaire. Leur lecture passe par l'API authentifiée du portail, avec vérification du propriétaire et prise en charge des plages d'octets. Les enregistrements ne sont pas publiés directement. Les fichiers temporaires sont supprimés, et aucun contenu vocal n'est écrit dans les journaux. La conversation conserve la référence privée et la transcription, pas le base64 de chaque nouvel enregistrement. Les anciens enregistrements restent inchangés.

Inclure les fichiers privés dans les sauvegardes du serveur. Un serveur supprimé ne se récupère pas depuis Git. Les fichiers modèle et les clés restent hors du dépôt.

Tests : dans ce dossier, avec `httpx` installé, exécuter `python -m unittest test_api`.
