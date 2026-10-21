# Codes OTP par Gmail

Configurer les variables serveur Vercel pour l’environnement Production :

- `GMAIL_SMTP_USER` : `landrykibakweto123@gmail.com`
- `GMAIL_APP_PASSWORD` : mot de passe d’application généré dans le compte Google après activation de la validation en deux étapes. Ne pas utiliser le mot de passe habituel du compte.

Redéployer après toute modification de ces variables. Ne jamais préfixer ces variables avec `VITE_`, ni les enregistrer dans Git.

Le serveur utilise smtp.gmail.com, port 465, avec TLS. L’expéditeur correspond au compte Gmail configuré. Si les deux variables Gmail ne sont pas présentes, le fournisseur Resend déjà configuré reste disponible.

Les codes expirent après dix minutes, sont utilisables une seule fois, limités à cinq tentatives et ne peuvent être renvoyés qu’après une minute. Un échec d’envoi invalide le code. Les codes et secrets ne sont pas journalisés.

L’ajout de Gmail ne déclenche pas le blocage automatique des comptes après cinq jours d’initiation. Cette option reste indépendante et désactivée par défaut.

Vérification réelle : activer la double authentification depuis son propre compte, demander un code, vérifier sa réception (y compris les indésirables), puis saisir les six chiffres. Ne pas activer la double authentification si la réception échoue.
