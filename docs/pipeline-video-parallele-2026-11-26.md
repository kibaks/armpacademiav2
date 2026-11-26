# Pipeline vidéo parallèle — 26 novembre 2026

Référence avant modification sur le Space T4 existant : voix 2,080 s ; soumission 1,254 s ; vidéo de 7,94 s préparée en 16,568 s (mesure par polling, réseau compris). Une question concurrente a reçu le statut interne 429 « GPU busy » en 0,898 s. Ce résultat unique n’est pas un engagement de délai.

Changements du moteur :
- Passerelle limitée à quatre requêtes indépendantes et serveur interne multithread, au lieu du verrou HTTP global.
- Un seul rendu vidéo à la fois ; calcul GPU découpé en petits lots, avec accès prioritaire mais borné pour le chat. Jamais deux inférences GPU lourdes simultanées. Les réservations mémoire vidéo inutilisées sont libérées avant l’inférence du LLM séparé.
- Calcul du lot GPU suivant pendant l’assemblage CPU et l’encodage du précédent. Deux lots au maximum en mémoire ; deux tâches d’assemblage CPU ; encodage limité à deux threads. Erreurs et blocages de l’encodeur interrompent le pipeline avant de rejoindre ses threads.
- Composition du seul rectangle du visage, en BGR, avec alpha entier identique à Pillow : suppression des conversions/copies RGB/Pillow de toute l’image à chaque trame. Cache de 64 masques maximum ; repli sur le compositeur original pour une géométrie inhabituelle.
- Métriques de préparation audio, calcul GPU et assemblage/encodage attachées aux jobs terminés. Résolution 480p, 20 images/s, voix, portrait et contenu conservés.

Validation locale : 16 tests Python, dont égalité pixel à pixel sur masques gris et RGB, immutabilité de l’avatar, ordre des images, chevauchement effectif decode/encode, reprise d’erreur, libération d’un encodeur bloqué, absence de calculs GPU simultanés et de famine du rendu vidéo. Le gain réel doit être mesuré après déploiement sur le GPU ; les tests locaux ne le prouvent pas.

Déploiement : ajouter uniquement une couche de code à l’image HF existante, en conservant les dépendances et poids déjà construits. Aucun changement de matériel, tarif, veille ou droits d’accès. Le chargement initial des modèles au réveil n’est pas éliminé.
