import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  connectAuthEmulator,
} from 'firebase/auth';
import { firebaseConfig, devAuthMode } from '../config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (devAuthMode) return null; // dev mode: bypass Firebase entirely
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase config missing — set VITE_FIREBASE_* env vars.');
    return null;
  }
  if (!app) {
    // initialize exactly once
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    if (import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  }
  return auth;
}

/** Map Firebase auth error codes to friendly messages (PRD §4 error handling). */
export function firebaseErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account exists with this email.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
    'auth/network-request-failed': 'Network error — check your connection.',
    'auth/invalid-verification-code': 'That OTP code is incorrect.',
    'auth/code-expired': 'That OTP code has expired — request a new one.',
    'auth/invalid-phone-number': 'That phone number looks invalid. Use full international format, e.g. +8801XXXXXXXXX.',
    'auth/missing-verification-code': 'Enter the OTP code sent to your phone.',
    'auth/quota-exceeded': 'SMS quota exceeded — try again later.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console.',
    'auth/admin-restricted-operation': 'Registration is restricted for this account.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed — please retry.',
    'auth/popup-closed-by-user': 'Google sign-in window was closed before finishing — please try again.',
    'auth/cancelled-popup-request': 'Only one Google sign-in window can be open at a time.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window — allow popups and retry.',
    'auth/unauthorized-domain': 'This site is not authorized for Google sign-in yet. Please contact the administrator.',
    'auth/operation-not-supported-in-this-environment': 'Google sign-in is not supported in this browser context.',
  };
  return map[code] ?? 'Authentication failed. Please try again.';
}
