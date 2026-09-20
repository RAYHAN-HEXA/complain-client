import { getFirebaseAuth } from './firebase';

/**
 * Central token provider for the API interceptor.
 * - Firebase mode: returns a *fresh* ID token on every call (Firebase caches
 *   internally and refreshes near expiry, so no stale 1-hour tokens are sent).
 * - Dev mode: returns the static dev UID (sent as X-Dev-UID).
 */
let devToken: string | null = null;
let devMode = false;

export function setDevToken(uid: string | null) {
  devToken = uid;
}

export function setDevMode(v: boolean) {
  devMode = v;
}

export function isDevMode() {
  return devMode;
}

export async function currentToken(): Promise<string | null> {
  if (devMode) return devToken;
  const auth = getFirebaseAuth();
  const fbUser = auth?.currentUser;
  if (!fbUser) return null;
  try {
    // true = force refresh only when the token is expired/near expiry
    return await fbUser.getIdToken();
  } catch {
    return null;
  }
}
