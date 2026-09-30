# Firebase + Google Auth — Setup ARMP Academia

## 1. Créer le projet Firebase
- https://console.firebase.google.com → **Add project** → nom `armp-academia`
- Désactiver Google Analytics (optionnel)

## 2. Web App
- Project Settings → General → **Your apps** → Web (`</>`) → Register `armpacademia`
- Copier la config :
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "armp-academia.firebaseapp.com",
  projectId: "armp-academia",
  storageBucket: "armp-academia.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc",
  measurementId: "G-..."
};
```

## 3. Variables d'environnement
- Local : créer `.env` à partir de `.env.example` et coller les valeurs `VITE_FIREBASE_*`
- Vercel : Project → Settings → Environment Variables → ajouter chaque `VITE_FIREBASE_*` (Production + Preview) puis Redeploy

## 4. Activer Google Sign-In
- Firebase Console → **Authentication** → **Sign-in method** → **Google** → **Enable** → Support email → Save
- **Settings → Authorized domains** → ajouter `armpacademia.vercel.app`, `armpacademia-doc-check-dev.vercel.app`, `localhost`

## 5. Firestore (persistance évolution)
- **Firestore Database** → Create database → **Production mode** → région `eur3` ou `us-central`
- Règles de base (à ajuster) :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
- La collection `users/{uid}` stockera : `level`, `completedModulesCount`, `certificationsCount`, `placementScore`, `name`, `email`

## 6. Vérification
- `npm run dev` → bouton **Continuer avec Google** dans AuthModal (Login / Register)
- Après connexion : bandeau **Niveau d'évolution** + `Firebase persisté • token …` visible sous le Header
- `localStorage['armp-firebase-token']` contient le JWT ; chaque `fetch` envoie `Authorization: Bearer <token>`
- Firestore → `users/{uid}` se met à jour à chaque module validé et placement quiz

> Sans config Firebase, l'app reste en **mode démo local** (évolution en mémoire + localStorage).
