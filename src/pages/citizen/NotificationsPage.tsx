import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../services/endpoints';
import { Spinner, EmptyState } from '../../components/ui';

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications({ page: 1 }) });
  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) return <Spinner label="Loading notifications…" />;
  const items = data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      {!items.length ? (
        <EmptyState title="No notifications yet" hint="Updates about your complaints will appear here." />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {items.map((n) => (
            <li key={n._id} className={`flex items-start gap-3 p-4 ${n.read ? '' : 'bg-blue-50/50'}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span>{new Date(Number(n.createdAt)).toLocaleString()}</span>
                  {n.complaintPublicId && (
                    <Link to={`/dashboard/complaints/${n.complaintPublicId}`} className="font-medium text-blue-600 hover:underline">
                      View complaint
                    </Link>
                  )}
                  {!n.read && (
                    <button onClick={() => markRead.mutate(n._id)} className="font-medium hover:text-slate-600">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
