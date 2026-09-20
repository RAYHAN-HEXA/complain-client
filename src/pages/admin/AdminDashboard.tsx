import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboard } from '../../services/endpoints';
import { Spinner, StatCard } from '../../components/ui';
import { STATUS_LABELS, type ComplaintStatus } from '../../types';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#4b5563'];

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, refetchInterval: 60000 });
  if (isLoading || !data) return <Spinner label="Loading dashboard…" />;

  const statusData = Object.entries(data.complaintsByStatus).map(([k, v]) => ({
    status: STATUS_LABELS[k as ComplaintStatus] ?? k, count: v,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total users" value={data.totalUsers} tone="slate" />
        <StatCard label="Verified citizens" value={data.verifiedCitizens} tone="green" />
        <StatCard label="Pending verification" value={data.pendingVerification} tone="amber" />
        <StatCard label="Total complaints" value={data.totalComplaints} tone="blue" />
        <StatCard label="Pending complaints" value={data.pendingComplaints} tone="amber" />
        <StatCard label="Active investigations" value={data.activeInvestigations} tone="indigo" />
        <StatCard label="Resolved" value={data.resolvedComplaints} tone="green" />
        <StatCard label="Rejected" value={data.rejectedComplaints} tone="red" />
      </div>
      <p className="text-sm font-medium text-slate-600">Resolution rate: {data.resolutionRate}%</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Complaints by category</h2>
          {data.complaintsByCategory.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.complaintsByCategory} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Complaints by status</h2>
          {statusData.some((s) => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" outerRadius={90} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Complaints by district</h2>
          {data.complaintsByDistrict.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.complaintsByDistrict}>
                <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Monthly trend</h2>
          {data.monthlyTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthlyTrend.map((m) => ({ ...m, label: `${m.year}-${String(m.month).padStart(2, '0')}` }))}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
