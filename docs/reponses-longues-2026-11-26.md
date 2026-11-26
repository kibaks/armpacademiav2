# Réponses longues — optimisation du 26 novembre 2026

Le texte de la réponse est affiché avant la préparation des médias. Le moteur vidéo Hugging Face ne renvoie un MP4 lisible qu’après son rendu complet ; envoyer toute une longue réponse dans un job retardait le début de la lecture.

Les narrations longues sont maintenant découpées en séquences, de préférence aux limites de phrases, sans suppression de mots, nombres, accents, conditions ou exceptions. La première vidéo est rendue séparément ; une seule séquence suivante est préparée pendant sa lecture. L’image et le son restent ceux du même MP4. Le choix de langue, de tutrice et le contexte sont conservés. Le lecteur enchaîne les séquences et affiche leur numéro. L’avancement de l’explication est ramené à la narration globale (pondération par nombre de mots).

L’annulation ferme les requêtes et libère les médias préchargés. Un job déjà accepté par le serveur peut néanmoins terminer son rendu. La préparation n’anticipe jamais plus d’une séquence, et une séquence échouée peut être réessayée sans sauter le contenu. Les réponses courtes gardent un seul MP4 ; les flux MSE incomplets ne sont pas mis en cache. Les films illustrés explicitement demandés dans les cours restent dans leur circuit séparé.

Pour le texte, le prompt ne répète plus le contenu complet du cours dans le profil et la leçon active. L’historique est borné à 600 caractères par message au lieu de 1000 ; les extraits juridiques fournis et la question actuelle restent inchangés. Aucun streaming de jetons du LLM n’est prétendu : le fournisseur installé retourne encore une réponse JSON complète. Le premier réveil du GPU reste une source de délai.

Validation : tests de conservation du contenu, préparation d’une seule séquence suivante, réutilisation du job préparé, reprise après échec sans saut ; tests du protocole Qwen, de l’isolation des médias, des caches et des sources ; TypeScript, build et démarrage API. Aucun changement de matériel, de veille ou de fournisseur.
