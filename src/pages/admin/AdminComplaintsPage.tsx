import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminComplaints } from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge } from '../../components/ui';
import { STATUS_LABELS, PRIORITY_LABELS, type ComplaintStatus } from '../../types';

export function AdminComplaintsPage() {
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminComplaints', { status, district, priority, search, onlyFlagged, page }],
    queryFn: () =>
      getAdminComplaints({
        status: (status || undefined) as ComplaintStatus | undefined,
        district: district || undefined,
        priority: priority || undefined,
        search: search || undefined,
        page,
        limit: 15,
      }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Complaint queue</h1>
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search ID or title…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Search" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Priority">
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
          placeholder="District" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="District" />
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          Flagged only
        </label>
      </div>
      {isLoading && <Spinner label="Loading complaints…" />}
      {error && <ErrorBanner message={(error as Error).message} onRetry={refetch} />}
      {!isLoading && !error && !data?.length && <EmptyState title="No complaints found" hint="Adjust the filters." />}
      {!!data?.length && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to={`/admin/complaints/${c.publicId}`} className="text-blue-600 hover:underline">{c.publicId}</Link>
                      {c.flagged && <span title={c.flagReason} className="ml-1">🚩</span>}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{c.title}</td>
                    <td className="px-4 py-3 text-slate-600">{c.district}</td>
                    <td className="px-4 py-3"><Badge value={c.priority} label={PRIORITY_LABELS[c.priority]} /></td>
                    <td className="px-4 py-3"><Badge value={c.status} label={STATUS_LABELS[c.status]} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(Number(c.createdAt)).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{data.pagination.total} complaints · page {data.pagination.page}/{data.pagination.totalPages}</span>
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
