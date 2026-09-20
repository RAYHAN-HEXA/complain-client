import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui';
import type { Role } from '../types';

/**
 * UX-level route guard. Real authorization is enforced server-side
 * (C++ RBAC filters) — bypassing this only yields 403s from the API.
 */
export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user, phase } = useAuth();
  const location = useLocation();

  // never redirect before auth state resolves (PRD §5)
  if (phase === 'LOADING') return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allow.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access denied</h1>
        <p className="mt-2 text-slate-600">
          Your role ({user.role}) cannot access this page.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
