import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyComplaints } from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge } from '../../components/ui';
import { STATUS_LABELS } from '../../types';

export function MyComplaintsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myComplaints', status, page],
    queryFn: () => getMyComplaints({ status: status || undefined, page, limit: 10 }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">My complaints</h1>
      <div className="flex flex-wrap gap-2">
        <select
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {isLoading && <Spinner label="Loading complaints…" />}
      {error && <ErrorBanner message={(error as Error).message} onRetry={refetch} />}
      {!isLoading && !error && !data?.length && (
        <EmptyState title="No complaints found" hint="Try a different filter, or submit a new complaint."
          action={<Link to="/dashboard/complaints/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">New Complaint</Link>} />
      )}
      {!!data?.length && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">District</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th></tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.publicId}</td>
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/complaints/${c.publicId}`} className="font-medium text-blue-600 hover:underline">{c.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.district}</td>
                    <td className="px-4 py-3 text-slate-500">{c.incidentDate}</td>
                    <td className="px-4 py-3"><Badge value={c.status} label={STATUS_LABELS[c.status]} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(Number(c.updatedAt)).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
