import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../services/endpoints';
import { Spinner, EmptyState } from '../../components/ui';

export function AdminAuditLogsPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', action, page],
    queryFn: () => getAuditLogs({ action: action || undefined, page, limit: 30 }),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Audit logs</h1>
      <p className="text-sm text-slate-500">Every privileged action is recorded. Logs are read-only.</p>
      <input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
        placeholder="Filter by action (e.g. ASSIGN)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Filter action" />
      {isLoading && <Spinner label="Loading logs…" />}
      {!isLoading && !data?.length && <EmptyState title="No audit entries found" />}
      {!!data?.length && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th>
                </tr>
              </thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l._id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-500">{new Date(Number(l.createdAt)).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium">{l.actorName ?? l.actorId?.slice(0, 8) ?? '—'}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-600">{l.actorRole}</td>
                    <td className="px-4 py-2.5"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{l.action}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{l.resourceType}{l.resourceKey ? ` · ${l.resourceKey}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between text-sm">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <span className="self-center text-slate-500">{data.pagination.total} entries</span>
              <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
