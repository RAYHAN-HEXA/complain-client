import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getInvestigators, createInvestigator } from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner } from '../../components/ui';

export function AdminInvestigatorsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['investigators'], queryFn: getInvestigators });

  const create = useMutation({
    mutationFn: () => createInvestigator({ name, email }),
    onSuccess: async () => {
      setMsg('Investigator created. They must register with this email to bind their Firebase account.');
      setName(''); setEmail('');
      await qc.invalidateQueries({ queryKey: ['investigators'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to create investigator'),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null); setMsg(null);
    create.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Investigators</h1>
      {msg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</div>}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" placeholder="Full name" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" placeholder="investigator@gov.example" />
        </label>
        <button type="submit" disabled={create.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {create.isPending ? 'Creating…' : 'Add investigator'}
        </button>
      </form>

      {isLoading ? <Spinner label="Loading investigators…" /> : !data?.length ? (
        <EmptyState title="No investigators yet" hint="Add the first investigator above." />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {data.map((i) => (
            <li key={i._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-800">{i.name}</p>
                <p className="text-sm text-slate-500">{i.email}</p>
              </div>
              <span className="text-xs text-slate-400">{i.accountStatus}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
