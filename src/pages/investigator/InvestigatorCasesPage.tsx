import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAssignedComplaints } from '../../services/endpoints';
import { Spinner, EmptyState, Badge } from '../../components/ui';
import { STATUS_LABELS, type ComplaintStatus } from '../../types';

export function InvestigatorCasesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['invComplaints', status, page],
    queryFn: () => getAssignedComplaints({ status: status || undefined, page, limit: 15 }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Assigned cases</h1>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Filter by status">
        <option value="">All statuses</option>
        {(['assigned', 'investigating', 'additional_info_required', 'resolved'] as ComplaintStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      {isLoading && <Spinner label="Loading cases…" />}
      {!isLoading && !data?.length && <EmptyState title="No cases found" hint="Try a different filter." />}
      {!!data?.length && (
        <>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {data.map((c) => (
              <li key={c._id} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                <div>
                  <Link to={`/investigator/complaints/${c.publicId}`} className="font-medium text-blue-600 hover:underline">{c.title}</Link>
                  <p className="text-xs text-slate-400">{c.publicId} · {c.upazila}, {c.district} · incident {c.incidentDate}</p>
                </div>
                <Badge value={c.status} label={STATUS_LABELS[c.status]} />
              </li>
            ))}
          </ul>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between text-sm">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <span className="self-center text-slate-500">Page {data.pagination.page}/{data.pagination.totalPages}</span>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
