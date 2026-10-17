# Accès au parcours Initiation

La période est de cinq jours calendaires (120 heures). Elle débute au premier accès authentifié lorsque l’envoi d’emails est configuré. Le serveur conserve la date limite ; une nouvelle connexion ou un changement de navigateur ne la réinitialise pas.

À l’échéance, les API privées et les accès directs Firestore sont verrouillés. L’utilisateur confirme un code envoyé à l’email de son identité authentifiée. Le code dure dix minutes, ne peut servir qu’une fois et accepte au maximum cinq essais. Les renvois sont espacés d’au moins une minute.

La confirmation ouvre une nouvelle période de cinq jours. Elle conserve les chapitres terminés et n’active pas automatiquement la double authentification permanente. Un test de niveau réussi, enregistré côté serveur, met fin à la restriction d’initiation. Les comptes d’administration et de formation sont exemptés.

## Activation en production

Configurer dans Vercel `RESEND_API_KEY` et `AUTH_EMAIL_FROM`, avec une adresse d’expédition validée chez Resend, puis redéployer. Tant que ces deux paramètres sont absents, aucune nouvelle période limitée ne démarre. Une période déjà commencée reste applicable si le service d’email devient ensuite indisponible.

Les règles Firestore sont déployées séparément avec `firebase deploy --only firestore:rules --project gen-lang-client-0775786837`. La configuration cible explicitement la base nommée de l’application.

Les scénarios de tests utilisent des emails et des codes simulés. La livraison réelle doit être confirmée avec une adresse valide après configuration du service d’email.
