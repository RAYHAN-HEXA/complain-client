import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { devAuthMode } from '../config';

type Tab = 'password' | 'phone';

export function LoginPage() {
  const { login, loginWithGoogle, sendOtp, verifyOtp, otpSent, devLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const [tab, setTab] = useState<Tab>('password');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // phone form
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const { phase, user } = useAuth();

  // Role-aware landing page (PRD §60): admins/investigators go to their own
  // dashboards, citizens to /dashboard.
  const homeForRole =
    user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'investigator' ? '/investigator/dashboard'
    : '/dashboard';

  const dest =
    location.state?.from?.pathname?.startsWith('/admin') && user?.role === 'admin' ? location.state.from.pathname
    : location.state?.from?.pathname?.startsWith('/investigator') && user?.role === 'investigator' ? location.state.from.pathname
    : homeForRole;

  // Already authenticated (or session restored mid-page)? Leave /login —
  // prevents getting stranded here when auth state resolves after mount.
  useEffect(() => {
    if (phase === 'AUTHENTICATED') navigate(dest, { replace: true });
  }, [phase, dest, navigate]);

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      // role lands via the phase effect above once onAuthStateChanged populates
      // the user — avoids a flash of the wrong-role dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const onSendOtp = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await sendOtp(phone, 'recaptcha-container');
      setNotice(`OTP sent to ${phone}. Enter the 6-digit code.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    try {
      await loginWithGoogle();
      // role lands via the phase effect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleBusy(false);
    }
  };

  const onVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(code);
      // role lands via the phase effect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  };

  const devQuick = async (uid: string, name: string, to: string) => {
    setBusy(true);
    setError(null);
    try {
      await devLogin(uid, name);
      navigate(to, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Access your citizen, investigator or admin dashboard.</p>

      {/* Google Sign-In — available on every tab */}
      <div className="mt-6">
        <button
          onClick={onGoogle}
          disabled={googleBusy || busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleBusy ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3-2.32z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.96l3 2.32C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
          )}
          {googleBusy ? 'Connecting to Google…' : 'Sign in with Google'}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase text-slate-400">or continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {(['password', 'phone'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(null); setNotice(null); }}
            className={`rounded-lg py-2 text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t === 'password' ? 'Email & Password' : 'Phone OTP'}
          </button>
        ))}
      </div>

      {tab === 'password' && (
        <form onSubmit={onSubmitPassword} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com" autoComplete="email" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••" autoComplete="current-password" />
          </label>
          <button type="submit" disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-slate-500">
            No account? <Link to="/register" className="font-medium text-blue-600 hover:underline">Register</Link>
          </p>
        </form>
      )}

      {tab === 'phone' && (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
          {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">{notice}</div>}

          {!otpSent ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Phone number (international format)
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="+8801XXXXXXXXX" autoComplete="tel" />
              </label>
              <button onClick={onSendOtp} disabled={busy || phone.trim().length < 8}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Sending…' : 'Send OTP'}
              </button>
            </>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                6-digit OTP code
                <input inputMode="numeric" pattern="[0-9]*" required value={code} onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none"
                  placeholder="••••••" maxLength={6} />
              </label>
              <button type="submit" disabled={busy || code.length < 6}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button type="button" onClick={() => { window.location.reload(); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700">
                Use a different number
              </button>
            </form>
          )}
          {/* reCAPTCHA container required by Firebase phone auth */}
          <div id="recaptcha-container" />
        </div>
      )}

      {devAuthMode && (
        <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-800">Dev mode (X-Dev-UID against local API)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => devQuick('test-citizen-1', 'Citizen One', '/dashboard')}
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100">Login as Citizen</button>
            <button disabled={busy} onClick={() => devQuick('test-investigator-1', 'Investigator', '/investigator/dashboard')}
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100">Login as Investigator</button>
            <button disabled={busy} onClick={() => devQuick('test-admin-1', 'Admin', '/admin/dashboard')}
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100">Login as Admin</button>
          </div>
        </div>
      )}
    </div>
  );
}
