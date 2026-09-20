import { Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TrackPage } from './pages/TrackPage';
import { CategoriesPage } from './pages/CategoriesPage';

import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { MyComplaintsPage } from './pages/citizen/MyComplaintsPage';
import { NewComplaintPage } from './pages/citizen/NewComplaintPage';
import { ComplaintDetailPage } from './pages/citizen/ComplaintDetailPage';
import { NotificationsPage } from './pages/citizen/NotificationsPage';
import { VerificationPage } from './pages/citizen/VerificationPage';
import { ProfilePage } from './pages/citizen/ProfilePage';

import { InvestigatorDashboard } from './pages/investigator/InvestigatorDashboard';
import { InvestigatorCasesPage } from './pages/investigator/InvestigatorCasesPage';
import { InvestigatorCasePage } from './pages/investigator/InvestigatorCasePage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminComplaintDetailPage } from './pages/admin/AdminComplaintDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminInvestigatorsPage } from './pages/admin/AdminInvestigatorsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
  },
});

function NotFound() {
  return (
    <div className="mx-auto max-w-md p-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">Page not found.</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* citizen */}
          <Route element={<ProtectedRoute allow={['citizen']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/dashboard/complaints" element={<MyComplaintsPage />} />
              <Route path="/dashboard/complaints/new" element={<NewComplaintPage />} />
              <Route path="/dashboard/complaints/:publicId" element={<ComplaintDetailPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/verification" element={<VerificationPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* investigator */}
          <Route element={<ProtectedRoute allow={['investigator']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/investigator/dashboard" element={<InvestigatorDashboard />} />
              <Route path="/investigator/complaints" element={<InvestigatorCasesPage />} />
              <Route path="/investigator/complaints/:publicId" element={<InvestigatorCasePage />} />
              <Route path="/investigator/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* admin */}
          <Route element={<ProtectedRoute allow={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
              <Route path="/admin/complaints/:publicId" element={<AdminComplaintDetailPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/investigators" element={<AdminInvestigatorsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Route>

          <Route path="/complaint/:publicId" element={<Navigate to="/track" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
