# Reconnexion automatique après rotation du tunnel

Le superviseur `academia-gateway-discovery` détecte la dernière adresse dans le journal du tunnel de l’instance 60042833. Il l’annonce à l’API publique de l’application avec une signature HMAC, une date limitée à cinq minutes et la clé MuseTalk déjà partagée avec l’application. Aucune clé Vercel, GitHub ou Firebase n’est ajoutée au serveur.

L’API vérifie la signature, refuse les destinations autres que les tunnels HTTPS Cloudflare, vérifie le moteur national authentifié, puis enregistre l’adresse dans `privateEngineConfig/active` par transaction. Cette collection n’est pas accessible aux clients avec les règles Firestore existantes. Les anciennes annonces sont rejetées.

Les instances de l’API relisent cette configuration au plus toutes les 30 secondes et actualisent les cinq URL de passerelle ; les clés restent inchangées. Le lecteur vidéo crée ses nouvelles signatures sur l’adresse courante, y compris dans les fonctions déjà chaudes. Les URL de domaine permanent configurées manuellement restent prioritaires. Si le registre est indisponible, la configuration du déploiement reste utilisable.

Installer le script et le wrapper aux emplacements indiqués dans `start.sh`, puis charger `supervisor.conf`. L’annonce est réessayée toutes les 15 secondes tant qu’elle échoue. Le service ne redémarre pas les moteurs ; le contrôle ci-dessous peut rétablir le tunnel. Une lecture déjà ouverte sur un ancien tunnel peut devoir être relancée après un redémarrage du serveur.

Le contrôle de santé vérifie désormais la passerelle publique toutes les 45 secondes.
Après trois échecs, si la passerelle interne répond encore, le service relance
uniquement `academia-tunnel` (au maximum une fois toutes les trois minutes).
Il conserve l’adresse courante dans un fichier local et retrouve les adresses dans
les journaux après rotation. L’enregistrement est renouvelé toutes les dix minutes.
Les modèles GPU et les autres services ne sont pas redémarrés par ce contrôle.
