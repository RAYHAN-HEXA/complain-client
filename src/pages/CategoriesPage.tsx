import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/endpoints';
import { Spinner, EmptyState } from '../components/ui';

export function CategoriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Complaint categories</h1>
      <p className="mt-1 text-sm text-slate-500">What can you report? Anything in these areas of public service.</p>
      {isLoading ? (
        <Spinner label="Loading…" />
      ) : !data?.length ? (
        <div className="mt-6"><EmptyState title="No categories yet" /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {data.map((c) => (
            <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
