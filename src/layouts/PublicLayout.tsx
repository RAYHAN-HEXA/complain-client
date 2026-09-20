import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PublicLayout() {
  const { user } = useAuth();
  const dash =
    user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'investigator' ? '/investigator/dashboard'
    : '/dashboard';
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="rounded-lg bg-blue-600 px-2 py-1 text-sm text-white">Civic</span>
            Complaint Portal
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link to="/categories" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">Categories</Link>
            <Link to="/track" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">Track</Link>
            {user ? (
              <Link to={dash} className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">Login</Link>
                <Link to="/register" className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white py-4 text-center text-xs text-slate-400">
        Civic Complaint &amp; Verification Platform — secure, transparent, anonymous tracking.
      </footer>
    </div>
  );
}
