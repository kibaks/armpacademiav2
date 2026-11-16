# Expiration du parcours Initiation

La politique existante concerne les apprenants qui n’ont pas encore validé l’Initiation. Les administrateurs et formateurs restent exemptés. INITIATION_ENFORCE_DEADLINE=true active le contrôle serveur et Firestore dès l’échéance. Gmail ou Resend doit être configuré.

Le superviseur du serveur appelle toutes les minutes la route interne avec un secret dédié INITIATION_SCHEDULER_SECRET, également configuré dans Vercel. Aucun accès Firebase ou SMTP n’est confié au serveur. Installer poll.py/start.sh sous /workspace/academia/initiation-expiry et supervisor.conf dans la configuration Supervisor. La variable est chargée depuis /workspace/academia/private/initiation-scheduler.env (0600).

Chaque appel traite dix profils et conserve un curseur pour la page suivante ; la notification peut donc suivre l’échéance de quelques minutes selon le nombre de comptes. Une transaction et un bail de livraison empêchent les appels simultanés d’envoyer plusieurs notifications pour une même échéance. En cas d’erreur, le prochain passage réessaie. Un arrêt du serveur retarde les emails, sans repousser les échéances.

Le mail personnalisé ouvre la connexion et la réactivation existante par OTP. Le lien seul ne modifie aucun compte. Après validation d’un code livré, valable dix minutes et à usage unique, l’accès repart pour exactement cinq jours. Les mots de passe et la progression sont conservés. Les désactivations administratives Firebase ne sont jamais levées.
