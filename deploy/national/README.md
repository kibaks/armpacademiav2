# Moteurs des langues nationales

Service FastAPI privé, uniquement sur `127.0.0.1:8064`, supervisé par `academia-national`. Le proxy existant ajoute `/national/*` vers ce service. Toutes les routes exigent la clé serveur `MUSETALK_API_KEY` déjà utilisée par MuseTalk. Aucune clé ni URL privée n’est intégrée au navigateur.

## Modèles

Dossier : `/workspace/academia/models/national-language-evaluation`.

- `national-translation` : Meta NLLB-200 distilled 600M, traduction entre français et `lin_Latn`, `swh_Latn`, `kon_Latn`, `lua_Latn`.
- `lingala-tts` : UBC-NLP Simba-TTS-lin.
- `swahili-tts` : Meta MMS-TTS-swh.

Les révisions et empreintes des téléchargements figurent dans le manifeste de ce dossier. Les poids ne sont pas conservés dans Git. Les licences déclarées doivent être respectées ; MMS et NLLB sont sous CC-BY-NC-4.0.

## Exécution sur l’instance existante

Le venv `/workspace/academia/national-venv` référence les bibliothèques de `/opt/MuseTalk/.venv/lib/python3.10/site-packages` par un fichier `.pth`, sans modifier l’environnement de MuseTalk. `httpx==0.27.2` est installé uniquement dans le nouveau venv pour les tests. Le wrapper `start.sh` charge les clés depuis `/workspace/academia/private/engines.env`, puis exécute uvicorn sur le port local 8064. La traduction est préchargée sur GPU (`NATIONAL_TRANSLATION_DEVICE=cuda:0`) avec les mêmes poids NLLB et trois faisceaux de recherche. Sans cette variable, le mode CPU reste disponible. Une seule traduction est exécutée à la fois.

Le checkpoint NLLB officiel est chargé avec `weights_only=True`, sans code distant. Les voix utilisent safetensors. Le nom des tenseurs de normalisation g/v est adapté au format de PyTorch 2.0 ; toute incompatibilité de poids fait échouer le chargement.

Ajouter avant le bloc `/musetalk/*` du proxy projet :

```caddy
handle_path /national/* {
 reverse_proxy 127.0.0.1:8064
}
```

Valider la configuration, puis recharger uniquement `academia-gateway`. Sur le Caddy 2.11 de cette instance, le signal USR1 recharge le fichier sans interrompre les services existants. Ne pas ouvrir le port 8064 sur Internet et ne pas désactiver l’authentification du service.

## Contrats

- `GET /capabilities` : langues installées et limites.
- `POST /translate` : `{text, sourceLanguage: "fr", language: "ln"}`. Les deux codes sont explicites ; aucune détection de langue fondée sur l’identité.
- `POST /speech` : `{text, language: "ln" | "sw"}` ; MP3 en base64, fournisseur `national-vits`.
- 401 sans authentification, 429 si occupé, 422 si langue, longueur ou caractères non pris en charge, 503 si le modèle échoue.

Les paragraphes trop longs et les traductions incomplètes sont refusés, sans troncature. Les lettres et tons non présents dans le vocabulaire vocal sont refusés, jamais effacés. Le kikongo et le tshiluba restent disponibles à l’écrit ; aucun repli sur une voix française n’est autorisé pour leur lecture.

## Vérification

Depuis ce dossier sur le serveur : `/workspace/academia/national-venv/bin/python -m unittest -v test_api`.

Le contrôle réel de la passerelle teste Qwen → NLLB pour les quatre langues, la traduction inverse, les deux voix et le refus des caractères lingala non pris en charge. La validation linguistique et l’accent du swahili congolais restent à effectuer par des locuteurs ; les résultats sont présentés comme des traductions automatiques, avec la réponse française d’origine accessible.


## Réduction de latence (16 novembre 2026)

La mesure initiale d’une explication swahili donnait 3,318 s pour Qwen et 25,493 s supplémentaires pour NLLB sur CPU. La traduction passe sur CUDA en précision FP16, sans changer le modèle ni réduire la recherche à trois faisceaux. Jusqu’à quatre paragraphes sont traduits par lot ; les lignes vides et l’ordre des paragraphes restent conservés. Un résultat sans fin de séquence, vide ou incomplet est refusé. La limite de 480 tokens par paragraphe reste inchangée : aucun texte n’est tronqué silencieusement.

Le modèle est préchargé au démarrage pour que la première demande ne supporte pas son chargement. Une configuration CUDA indisponible fait échouer le démarrage explicitement plutôt que revenir silencieusement à un traitement lent. Le wrapper Supervisor doit reprendre le fichier start.sh fourni. Le profil CPU précédent est conservé sur le serveur pour un retour arrière.

Le prompt du tuteur place désormais le profil et les extraits stables avant l’historique et la question, afin de réutiliser le préfixe du contexte Ollama. Le dernier message utilisateur n’est pas répété quand il est identique à la question courante. Le modèle Qwen 2.5 7B, le budget de génération, les contrôles de qualité et les références de cours sont conservés.
