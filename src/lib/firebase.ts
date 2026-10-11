// One configuration and the same named Firestore database throughout the application.
export { app, auth, db, googleProvider } from '../firebase';
export const isFirebaseConfigured = true;
export const isFirebaseReady = () => true;
