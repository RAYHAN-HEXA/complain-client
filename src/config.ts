// Runtime configuration from env (Vite exposes only VITE_* vars).
// Firebase client config is public by design; server secrets stay in .env on the server.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

// When true the app talks to the C++ backend in dev/emulator mode:
// a X-Dev-UID header replaces the Firebase ID token.
export const devAuthMode =
  import.meta.env.VITE_DEV_AUTH === 'true' || import.meta.env.VITE_DEV_AUTH === true;

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
