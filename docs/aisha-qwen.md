# Réponses Qwen pour Aïsha

Aïsha utilise le modèle local `academia-tuteur` (Qwen3 14B) via la passerelle HTTPS authentifiée de MuseTalk. Les routes `/api/ai/tutor` restent protégées par la session de l’application. Le navigateur ne reçoit aucune clé GPU.

Quand `MUSETALK_API_URL` et `MUSETALK_API_KEY` sont configurés, le serveur appelle `<MUSETALK_API_URL>/chat`. On peut fournir `QWEN_API_URL` (URL HTTPS complète) et `QWEN_API_KEY` pour une passerelle distincte. `TUTOR_LLM_PROVIDER=legacy` rétablit explicitement les anciens fournisseurs. La disponibilité des réponses ne dépend pas de `TUTOR_VIDEO_ENABLED`.

La passerelle `/opt/MuseTalk/tutor_llm.py` utilise uniquement `http://127.0.0.1:11434/api/chat` et le modèle fixe `academia-tuteur`. Elle est incluse dans `academia_api.py`, protégée par la même authentification que les jobs vidéo. Déployer le module avant le fichier principal, puis redémarrer `academia-musetalk` en l’absence de jobs vidéo actifs.

Le prompt système d’Aïsha est transmis séparément des données : question, six derniers échanges, profil, leçon et extraits pertinents des cours. La réponse conserve les citations des extraits fournis. La réflexion est désactivée pour la lecture vocale ; les réponses incomplètes ou indisponibles sont refusées sans appel automatique à un autre fournisseur.

Limites : contexte 8192 tokens, sortie 700 tokens, un appel de génération à la fois. Le service renvoie 429 s’il est occupé et 503 si le modèle échoue. Le délai d’appel de la passerelle est de 40 secondes et celui de l’adaptateur de 45 secondes. Le premier chargement après redémarrage d’Ollama peut dépasser ce délai : précharger le modèle avant de servir les utilisateurs. Les appels réussis le conservent ensuite en mémoire. La vidéo et la synthèse vocale conservent leurs parcours existants.

Validation : tests de l’adaptateur Node, tests de la passerelle Python (authentification, taille des entrées, séparation système/données, saturation, erreurs), contrôle TypeScript et compilation de l’application.
