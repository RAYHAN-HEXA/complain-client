import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAssignedComplaints } from '../../services/endpoints';
import { Spinner, EmptyState, StatCard, Badge } from '../../components/ui';
import { STATUS_LABELS, PRIORITY_LABELS, type ComplaintStatus } from '../../types';

export function InvestigatorDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['invComplaints', 'all'], queryFn: () => getAssignedComplaints({ limit: 100 }) });
  if (isLoading) return <Spinner label="Loading your cases…" />;
  const cases = data ?? [];
  const count = (s: ComplaintStatus) => cases.filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Investigation overview</h1>
      {!cases.length ? (
        <EmptyState title="No cases assigned yet" hint="New assignments will appear here automatically." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Assigned" value={cases.length} tone="slate" />
            <StatCard label="Pending investigation" value={count('assigned')} tone="amber" />
            <StatCard label="Info required" value={count('additional_info_required')} tone="indigo" />
            <StatCard label="Completed" value={count('resolved')} tone="green" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Case</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Incident</th></tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/investigator/complaints/${c.publicId}`} className="font-medium text-blue-600 hover:underline">{c.title}</Link>
                      <p className="font-mono text-xs text-slate-400">{c.publicId}</p>
                    </td>
                    <td className="px-4 py-3"><Badge value={c.priority} label={PRIORITY_LABELS[c.priority]} /></td>
                    <td className="px-4 py-3">{STATUS_LABELS[c.status]}</td>
                    <td className="px-4 py-3 text-slate-500">{c.incidentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
