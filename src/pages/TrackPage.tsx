import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackComplaint } from '../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge } from '../components/ui';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { STATUS_LABELS, type ComplaintStatus } from '../types';

export function TrackPage() {
  const [input, setInput] = useState('');
  const [publicId, setPublicId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['track', publicId],
    queryFn: () => trackComplaint(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = input.trim();
    setPublicId(id || null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Track a complaint</h1>
      <p className="mt-1 text-sm text-slate-500">
        No account needed. Enter the complaint ID (e.g. CMP-2026-KHL-000001) to see its public status.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="CMP-2026-KHL-000001"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
          aria-label="Complaint ID"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
          Track
        </button>
      </form>

      {publicId && (
        <div className="mt-8">
          {isLoading && <Spinner label="Looking up complaint…" />}
          {error && <ErrorBanner message={(error as Error).message} />}
          {data && (
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-slate-500">{data.publicId}</p>
                  <h2 className="text-lg font-bold text-slate-900">{data.title}</h2>
                </div>
                <Badge value={data.status} label={STATUS_LABELS[data.status as ComplaintStatus]} />
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{data.category}</dd></div>
                <div><dt className="text-slate-500">District</dt><dd className="font-medium">{data.district}</dd></div>
                <div><dt className="text-slate-500">Submitted</dt><dd className="font-medium">{new Date(Number(data.submittedAt ?? data.createdAt)).toLocaleDateString()}</dd></div>
                <div><dt className="text-slate-500">Last updated</dt><dd className="font-medium">{new Date(Number(data.lastUpdatedAt ?? data.updatedAt)).toLocaleDateString()}</dd></div>
              </dl>
              {data.resolutionSummary && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">Resolution</p>
                  <p className="mt-1">{data.resolutionSummary}</p>
                </div>
              )}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Timeline</h3>
                <ComplaintTimeline timeline={data.timeline ?? []} />
              </div>
            </div>
          )}
          {!isLoading && !error && !data && (
            <EmptyState title="No complaint found" hint={`Nothing matched "${publicId}".`} />
          )}
        </div>
      )}
    </div>
  );
}
