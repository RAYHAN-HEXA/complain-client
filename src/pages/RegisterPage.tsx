import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Create your citizen account</h1>
      <p className="mt-1 text-sm text-slate-500">
        After registering you can verify your identity (NID + selfie) to submit complaints.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
        <label className="block text-sm font-medium text-slate-700">
          Full name
          <input required value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Your name" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="At least 6 characters" autoComplete="new-password" />
        </label>
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
