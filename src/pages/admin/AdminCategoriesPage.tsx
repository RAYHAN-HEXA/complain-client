import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, ConfirmDialog } from '../../components/ui';

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ _id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const create = useMutation({
    mutationFn: () => createCategory({ name, description: description || undefined }),
    onSuccess: () => { setName(''); setDescription(''); return invalidate(); },
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to create'),
  });
  const toggle = useMutation({
    mutationFn: (c: { _id: string; active: boolean }) => updateCategory(c._id, { active: !c.active }),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to update'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => { setToDelete(null); return invalidate(); },
    onError: (e) => setError(e instanceof Error ? e.message : 'Failed to delete'),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 3) { setError('Category name must be at least 3 characters.'); return; }
    create.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
      {error && <ErrorBanner message={error} />}

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={60}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Street Lighting" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-64 rounded-lg border border-slate-300 px-3 py-2" placeholder="Optional" />
        </label>
        <button type="submit" disabled={create.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {create.isPending ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {isLoading ? <Spinner label="Loading…" /> : !data?.length ? (
        <EmptyState title="No categories" />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {data.map((c) => (
            <li key={c._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-800">{c.name}</p>
                {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={c.active ? 'text-green-700' : 'text-slate-400'}>{c.active ? 'active' : 'inactive'}</span>
                <button onClick={() => toggle.mutate(c)} className="font-medium text-blue-600 hover:underline">
                  {c.active ? 'Deactivate' : 'Activate'}
                </button>
                {!c.active && (
                  <button onClick={() => setToDelete(c)} className="font-medium text-red-600 hover:underline">Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        message="Categories in use are deactivated instead of deleted."
        confirmLabel="Delete" danger busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete._id)}
      />
    </div>
  );
}
