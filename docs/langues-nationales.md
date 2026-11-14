# Langues nationales du tuteur

La langue de la question et celle de la réponse se choisissent séparément dans les préférences d’Aïsha. Le français reste sélectionné par défaut. Les quatre langues nationales proposées sont le lingala (`ln-CD`), le swahili (`sw-CD`), le kikongo (`kg-CD`) et le tshiluba (`lua-CD`).

Une question nationale est traduite en français par NLLB. Qwen 2.5 7B prépare ensuite une réponse française en conservant les règles pédagogiques et les citations existantes. NLLB traduit cette réponse vers la langue choisie. Le message affiche la traduction et permet de consulter la réponse française d’origine. L’historique transmis au tuteur conserve les textes français, afin de ne pas confier le raisonnement dans les langues nationales à Qwen, dont les essais n’étaient pas fiables.

La lecture française conserve son parcours existant. Le lingala et le swahili utilisent le nouveau service VITS. La lecture lingala refuse notamment ɛ, ɔ et les marques tonales, absents du vocabulaire de la voix installée. Le kikongo et le tshiluba restent écrits. Une voix française ne remplace jamais une voix nationale absente. Les caches audio incluent la langue et les réécritures phonétiques françaises ne sont pas appliquées aux langues nationales.

Cette intégration ne traduit pas l’ensemble du site ou des cours. Les notes vocales restent transcrites en français. Les traductions et la variété régionale doivent être validées par des locuteurs ; aucune garantie d’accent natif n’est déduite des tests techniques. NLLB et MMS sont sous licence CC-BY-NC-4.0.

Voir [le service privé](../deploy/national/README.md) pour le déploiement et les contrats. Le serveur Node déduit sa nouvelle adresse `/national` de l’adresse MuseTalk existante, en conservant les clés uniquement côté serveur. Aucune copie des secrets de production vers les environnements de prévisualisation n’est nécessaire.
