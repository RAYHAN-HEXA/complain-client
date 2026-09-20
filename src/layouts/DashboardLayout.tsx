import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../services/endpoints';
import { Spinner } from '../components/ui';
import type { Role } from '../types';

const NAV: Record<Role, { to: string; label: string }[]> = {
  citizen: [
    { to: '/dashboard', label: 'Overview' },
    { to: '/dashboard/complaints', label: 'My Complaints' },
    { to: '/dashboard/complaints/new', label: 'New Complaint' },
    { to: '/dashboard/notifications', label: 'Notifications' },
    { to: '/dashboard/verification', label: 'Verification' },
    { to: '/dashboard/profile', label: 'Profile' },
  ],
  investigator: [
    { to: '/investigator/dashboard', label: 'Overview' },
    { to: '/investigator/complaints', label: 'Assigned Cases' },
    { to: '/investigator/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/complaints', label: 'Complaints' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/investigators', label: 'Investigators' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/audit-logs', label: 'Audit Logs' },
  ],
};

export function DashboardLayout() {
  const { user, logout, phase } = useAuth();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ['unread'],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (phase === 'LOADING') return <Spinner label="Loading…" />;
  if (!user) return null;

  const homeByRole: Record<Role, string> = {
    citizen: '/dashboard',
    investigator: '/investigator/dashboard',
    admin: '/admin/dashboard',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to={homeByRole[user.role]} className="flex items-center gap-2 font-bold text-slate-900">
            <span className="rounded-lg bg-blue-600 px-2 py-1 text-sm text-white">Civic</span>
            Complaint Portal
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-600">{user.name} · <span className="capitalize">{user.role}</span></span>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Dashboard">
          {NAV[user.role].map((item) => {
            const badge =
              item.label === 'Notifications' && unread && unread.unread > 0 ? unread.unread : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
                {badge && (
                  <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-xs text-white">{badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
