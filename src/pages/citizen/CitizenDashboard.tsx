import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyComplaints } from '../../services/endpoints';
import { Spinner, EmptyState, StatCard, Badge } from '../../components/ui';
import { STATUS_LABELS, type ComplaintStatus } from '../../types';

// Human-readable latest update (server provides lastUpdate from the newest
// status-log entry, e.g. "Investigation started")
function latestUpdate(c: { lastUpdate?: string; timeline?: { toStatus: string; reason?: string }[] }): string | null {
  if (c.lastUpdate) return c.lastUpdate;
  const t = c.timeline ?? [];
  const last = t[t.length - 1];
  if (!last) return null;
  if (last.reason && last.reason.length > 3) return last.reason;
  return STATUS_LABELS[last.toStatus as ComplaintStatus] ?? last.toStatus;
}

export function CitizenDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['myComplaints', 'all'], queryFn: () => getMyComplaints({ limit: 100 }) });
  const complaints = data ?? [];
  const count = (s: ComplaintStatus) => complaints.filter((c) => c.status === s).length;

  if (isLoading) return <Spinner label="Loading your dashboard…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My overview</h1>
        <Link to="/dashboard/complaints/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          New Complaint
        </Link>
      </div>
      {!complaints.length ? (
        <EmptyState
          title="You have not submitted any complaints yet."
          hint="Report a civic issue to get started — it takes about two minutes."
          action={<Link to="/dashboard/complaints/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Submit your first complaint</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={complaints.length} tone="slate" />
            <StatCard label="In progress" value={count('investigating') + count('assigned') + count('in_review')} tone="indigo" />
            <StatCard label="Resolved" value={count('resolved')} tone="green" />
            <StatCard label="Rejected" value={count('rejected')} tone="red" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Complaint</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th></tr>
              </thead>
              <tbody>
                {complaints.slice(0, 8).map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/complaints/${c.publicId}`} className="font-medium text-blue-600 hover:underline">{c.title}</Link>
                      <p className="font-mono text-xs text-slate-400">{c.publicId}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.district}</td>
                    <td className="px-4 py-3">
                      <Badge value={c.status} label={STATUS_LABELS[c.status]} />
                      {(() => {
                        const u = latestUpdate(c);
                        return u ? <p className="mt-1 text-xs text-slate-500">{u}</p> : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(Number(c.updatedAt)).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/dashboard/complaints" className="inline-block text-sm font-medium text-blue-600 hover:underline">View all complaints →</Link>
        </>
      )}
    </div>
  );
}
