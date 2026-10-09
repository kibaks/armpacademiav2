# Correctif des uploads d’images

Le stockage autorisait le domaine historique `armpacademia.vercel.app`, mais sa réponse OPTIONS au domaine `armpacademiav2.vercel.app` ne contenait pas les en-têtes CORS nécessaires. Le navigateur bloquait donc l’envoi direct. La clé est optionnelle selon la documentation du service ; son absence ne suffit pas à expliquer cette panne.

Les images passent maintenant par `POST /api/storage/images`, sur le domaine de l’application. Le serveur vérifie le jeton Firebase, le format et la signature du fichier, puis envoie un formulaire multipart au stockage. L’identité du propriétaire est dérivée du jeton. Les URL relatives sont converties en URL absolues du stockage. La progression reste sous 100 % jusqu’à confirmation de la réponse. Les délais et erreurs sont affichés.

La sauvegarde d’un profil attend désormais Firestore avant de mettre à jour le cache et d’annoncer le succès. Les propriétés indéfinies sont retirées du document envoyé à Firestore.

## Mise en service

- Déployer les changements du client et de l’API ensemble.
- Configurer `FIREBASE_SERVICE_ACCOUNT_JSON` côté serveur avec le compte de service du projet Firebase ; en Node, les identifiants par défaut sont également acceptés. Ne jamais utiliser de préfixe `VITE_` pour un secret.
- Ajouter le domaine déployé aux domaines autorisés dans Firebase Authentication.
- `ACADEMIA_API_KEY` est facultative pour le service actuel et reste uniquement côté serveur. Révoquer la clé historiquement exposée et sécuriser le service de stockage lui-même.
- Images acceptées : JPG, JPEG, PNG, GIF, WebP, maximum 3 Mio. Cette limite laisse une marge sous la limite de requête de 4,5 Mo des [fonctions Vercel](https://vercel.com/docs/functions/limitations#request-body-size). Les images plus grandes affichent un refus explicite.

## Vérifications

`npm run lint`, `node --import tsx --test tests/*.test.ts` et `npm run build` passent. Les tests d’upload vérifient le refus sans authentification, l’identité serveur, les URL relatives, les formats invalides, la taille et les échecs du fournisseur. Le stockage et Firebase sont simulés ; aucun fichier n’a été envoyé en production pendant ces tests.

Après déploiement, tester avec un vrai compte : photo de profil, couverture et galerie, puis recharger la page pour vérifier la persistance. Les vidéos, audios et documents restent sur le parcours historique et ne sont pas couverts par ce correctif.
