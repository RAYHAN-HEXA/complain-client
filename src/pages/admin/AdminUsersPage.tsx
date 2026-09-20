import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getAdminUsers, setUserStatus } from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge, ConfirmDialog } from '../../components/ui';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toSuspend, setToSuspend] = useState<{ _id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { role, search, page }],
    queryFn: () => getAdminUsers({ role: role || undefined, search: search || undefined, page, limit: 15 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) => setUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
    onError: (e) => setError(e instanceof Error ? e.message : 'Action failed'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Search users" />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Role filter">
          <option value="">All roles</option>
          <option value="citizen">Citizen</option>
          <option value="investigator">Investigator</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <ErrorBanner message={error} />}
      {isLoading && <Spinner label="Loading users…" />}
      {!isLoading && !data?.length && <EmptyState title="No users found" />}
      {!!data?.length && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verification</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email || '—'}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">{u.verification.overall}</td>
                    <td className="px-4 py-3">
                      <Badge value={u.accountStatus === 'active' ? 'resolved' : 'rejected'} label={u.accountStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {u.accountStatus === 'active' ? (
                        <button onClick={() => setToSuspend({ _id: u._id, name: u.name })}
                          className="text-sm font-medium text-red-600 hover:underline">Suspend</button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: u._id, status: 'active' })}
                          className="text-sm font-medium text-green-700 hover:underline">Activate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{data.pagination.total} users · page {data.pagination.page}/{data.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        open={!!toSuspend}
        title={`Suspend ${toSuspend?.name}?`}
        message="The user will be unable to sign in until reactivated."
        confirmLabel="Suspend" danger busy={statusMutation.isPending}
        onCancel={() => setToSuspend(null)}
        onConfirm={() => {
          if (toSuspend) statusMutation.mutate({ id: toSuspend._id, status: 'suspended' });
          setToSuspend(null);
        }}
      />
    </div>
  );
}
