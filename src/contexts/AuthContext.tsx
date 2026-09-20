import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  updateProfile as fbUpdateProfile,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, firebaseErrorMessage } from '../services/firebase';
import { api } from '../services/api';
import { setDevToken, setDevMode } from '../services/tokenProvider';
import { devAuthMode } from '../config';
import type { User } from '../types';

export type AuthPhase = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  phase: AuthPhase; // explicit LOADING / AUTHENTICATED / UNAUTHENTICATED
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendOtp: (phone: string, recaptchaContainerId: string) => Promise<string>;
  verifyOtp: (code: string) => Promise<void>;
  otpSent: boolean;
  devLogin: (uid: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Sync the Firebase-authenticated identity with an application profile. */
async function syncProfile(
  authHeader: Record<string, string>,
  body?: object,
): Promise<{ created: boolean; user: User }> {
  const res = await api.post<{ data: { created: boolean; user: User } }>(
    '/api/v1/auth/sync',
    body ?? {},
    { headers: authHeader },
  );
  return res.data.data;
}

function authHeaderFor(token: string): Record<string, string> {
  return devAuthMode ? { 'X-Dev-UID': token } : { Authorization: `Bearer ${token}` };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AuthPhase>('LOADING');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ data: User }>('/api/v1/users/me');
      setUser(res.data.data);
    } catch (e) {
      // only a real 401 logs the user out; transient network/token-refresh
      // failures must not destroy an authenticated session
      const status = (e as { status?: number })?.status;
      if (status !== 401) return;
      setUser(null);
      setPhase('UNAUTHENTICATED');
    }
  }, []);

  // Restore session: Firebase onAuthStateChanged decides AUTHENTICATED vs
  // UNAUTHENTICATED. We never redirect before this resolves (PRD §5).
  useEffect(() => {
    let cancelled = false;

    if (devAuthMode) {
      setDevMode(true);
      const savedUid = localStorage.getItem('devUid');
      const savedUser = localStorage.getItem('devUser');
      if (savedUid && savedUser) {
        setDevToken(savedUid);
        try {
          setUser(JSON.parse(savedUser));
          setPhase('AUTHENTICATED');
        } catch {
          setPhase('UNAUTHENTICATED');
        }
      } else {
        setPhase('UNAUTHENTICATED');
      }
      return () => {
        cancelled = true;
      };
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setPhase('UNAUTHENTICATED');
      return () => {
        cancelled = true;
      };
    }

    // complete a Google redirect flow if one is in progress
    getRedirectResult(auth).catch(() => {
      /* no redirect pending, or transient — onAuthStateChanged still runs */
    });

    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (cancelled) return;
      if (!fbUser) {
        setDevToken(null);
        setUser(null);
        setPhase('UNAUTHENTICATED');
        return;
      }
      try {
        const token = await fbUser.getIdToken();
        const header = { Authorization: `Bearer ${token}` };
        // synchronize application user; server never trusts client fields
        const { user: appUser } = await syncProfile(header, {
          name: fbUser.displayName ?? undefined,
          email: fbUser.email ?? undefined,
        });
        setUser(appUser);
        setPhase('AUTHENTICATED');
      } catch {
        // authenticated with Firebase but no app profile / API down
        setUser(null);
        setPhase('UNAUTHENTICATED');
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (devAuthMode) {
        const uid = `dev:${email}`;
        const { user: appUser } = await syncProfile(authHeaderFor(uid), { name: email.split('@')[0] });
        setDevToken(uid);
        localStorage.setItem('devUid', uid);
        localStorage.setItem('devUser', JSON.stringify(appUser));
        setUser(appUser);
        setPhase('AUTHENTICATED');
        return;
      }
      await signInWithEmailAndPassword(auth!, email, password);
      // onAuthStateChanged completes the session (sync + phase)
    } catch (e) {
      const msg = firebaseErrorMessage(
        (e as { code?: string })?.code ?? '',
      );
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (devAuthMode) {
        const uid = `dev:${email}`;
        const { user: appUser } = await syncProfile(authHeaderFor(uid), { name });
        setDevToken(uid);
        localStorage.setItem('devUid', uid);
        localStorage.setItem('devUser', JSON.stringify(appUser));
        setUser(appUser);
        setPhase('AUTHENTICATED');
        return;
      }
      const cred = await createUserWithEmailAndPassword(auth!, email, password);
      await fbUpdateProfile(cred.user, { displayName: name });
      // onAuthStateChanged completes the session
    } catch (e) {
      const msg = firebaseErrorMessage((e as { code?: string })?.code ?? '');
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ---- Google Sign-In (PRD §4: optional provider, same token chain) ----
  // Popup first; falls back to a full-page redirect when popups are blocked
  // (Safari/iOS, some enterprise browsers). A redirect round-trip completes
  // via getRedirectResult() in the restore-session effect below.
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Google sign-in requires Firebase configuration.');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const code = (e as { code?: string })?.code ?? '';
        if (code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          return; // page navigates; getRedirectResult continues after reload
        }
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          throw new Error('Google sign-in was cancelled before completion.');
        }
        throw e;
      }
      // onAuthStateChanged completes the session (sync + phase)
    } catch (e) {
      const msg = firebaseErrorMessage((e as { code?: string })?.code ?? '');
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ---- Phone OTP (PRD §4 Method 1) ----
  const sendOtp = useCallback(async (phone: string, recaptchaContainerId: string) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Phone auth requires Firebase configuration.');
      const { RecaptchaVerifier } = await import('firebase/auth');
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'normal' });
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = confirmation;
      setOtpSent(true);
      return confirmation.verificationId;
    } catch (e) {
      const msg = firebaseErrorMessage((e as { code?: string })?.code ?? '');
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    setError(null);
    try {
      if (!confirmationRef.current) throw new Error('Request an OTP first.');
      await confirmationRef.current.confirm(code);
      // onAuthStateChanged completes the session
      setOtpSent(false);
    } catch (e) {
      const msg = firebaseErrorMessage((e as { code?: string })?.code ?? '');
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const devLogin = useCallback(async (uid: string, name = 'Dev User') => {
    const { user: appUser } = await syncProfile(authHeaderFor(uid), { name });
    setDevToken(uid);
    localStorage.setItem('devUid', uid);
    localStorage.setItem('devUser', JSON.stringify(appUser));
    setUser(appUser);
    setPhase('AUTHENTICATED');
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth && !devAuthMode) {
      await fbSignOut(auth);
    }
    localStorage.removeItem('devUid');
    localStorage.removeItem('devUser');
    setDevToken(null);
    setUser(null);
    setPhase('UNAUTHENTICATED');
  }, []);

  const value = useMemo(
    () => ({
      phase,
      user,
      loading: phase === 'LOADING',
      error,
      login,
      register,
      loginWithGoogle,
      sendOtp,
      verifyOtp,
      otpSent,
      devLogin,
      logout,
      refresh,
    }),
    [phase, user, error, login, register, sendOtp, verifyOtp, otpSent, devLogin, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// keep original helper name referenced by LoginPage dev quick buttons
function useAuthSafe() {
  return useAuth();
}
void useAuthSafe;

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
