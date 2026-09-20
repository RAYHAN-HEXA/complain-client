import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getComplaint, getEvidence, fetchFileBlob, deleteEvidence, respondInfoRequest,
} from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge, ConfirmDialog } from '../../components/ui';
import { ComplaintTimeline } from '../../components/ComplaintTimeline';
import { STATUS_LABELS, PRIORITY_LABELS, type Evidence } from '../../types';

export function ComplaintDetailPage() {
  const { publicId = '' } = useParams();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created] = useState(params.get('created') === '1');
  const [evList, setEvList] = useState<Evidence[] | null>(null);
  const [toDelete, setToDelete] = useState<Evidence | null>(null);

  const { data: c, isLoading, error: qError } = useQuery({
    queryKey: ['complaint', publicId],
    queryFn: () => getComplaint(publicId),
    retry: false,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', publicId],
    queryFn: () => getEvidence(publicId),
    enabled: !!c,
  });

  const openFile = async (ev: Evidence) => {
    setBusy(true);
    try {
      const url = await fetchFileBlob(ev._id);
      window.open(url, '_blank');
    } catch {
      setError('Could not open file.');
    } finally {
      setBusy(false);
    }
  };

  const submitResponse = async () => {
    setBusy(true);
    setError(null);
    try {
      await respondInfoRequest(publicId, response);
      setResponding(false);
      setResponse('');
      await qc.invalidateQueries({ queryKey: ['complaint', publicId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setBusy(false);
    }
  };

  const removeEvidence = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await deleteEvidence(publicId, toDelete._id);
      setEvList((evidence ?? []).filter((x) => x._id !== toDelete._id));
      await qc.invalidateQueries({ queryKey: ['evidence', publicId] });
      setToDelete(null);
    } catch {
      setError('Could not delete evidence.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Spinner label="Loading complaint…" />;
  if (qError) return <ErrorBanner message={(qError as Error).message} />;
  if (!c) return <EmptyState title="Complaint not found" action={<Link to="/dashboard/complaints" className="text-sm text-blue-600 hover:underline">Back to list</Link>} />;

  const evidenceShown = evList ?? evidence ?? [];
  const openInfo = (c.infoRequests ?? []).filter((r) => r.status === 'open');

  return (
    <div className="space-y-6">
      {created && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Complaint submitted successfully!</p>
          Your complaint ID is <span className="font-mono font-bold">{c.publicId}</span> — keep it to track progress publicly.
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/dashboard/complaints" className="text-sm text-blue-600 hover:underline">← All complaints</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{c.title}</h1>
          <p className="font-mono text-sm text-slate-500">{c.publicId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={c.priority} label={PRIORITY_LABELS[c.priority]} />
          <Badge value={c.status} label={STATUS_LABELS[c.status]} />
        </div>
      </div>
      {c.flagged && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          This complaint was flagged for manual review{c.flagReason ? `: ${c.flagReason}` : '.'}
        </div>
      )}
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Details</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{c.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">District</dt><dd>{c.district}</dd></div>
            <div><dt className="text-slate-500">Upazila</dt><dd>{c.upazila}</dd></div>
            <div><dt className="text-slate-500">Incident date</dt><dd>{c.incidentDate}</dd></div>
            <div><dt className="text-slate-500">Incident time</dt><dd>{c.incidentTime || '—'}</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Timeline</h2>
          <ComplaintTimeline timeline={c.timeline ?? []} />
        </div>
      </div>

      {openInfo.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="font-semibold text-orange-900">Additional information requested</h2>
          {openInfo.map((r) => (
            <div key={r._id} className="mt-3">
              <p className="text-sm text-orange-900">{r.question}</p>
              {!responding ? (
                <button onClick={() => setResponding(true)} className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                  Respond
                </button>
              ) : (
                <div className="mt-2">
                  <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3}
                    className="w-full rounded-lg border border-orange-300 px-3 py-2" placeholder="Your answer…" />
                  <button onClick={submitResponse} disabled={busy || response.trim().length < 3}
                    className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {busy ? 'Submitting…' : 'Submit response'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Evidence ({evidenceShown.length})</h2>
        {!evidenceShown.length ? (
          <p className="text-sm text-slate-500">No evidence attached.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {evidenceShown.map((ev) => (
              <li key={ev._id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{ev.fileName} <span className="text-slate-400">({ev.type}, {(ev.fileSize / 1024).toFixed(0)} KB)</span></span>
                <span className="flex gap-2">
                  <button onClick={() => openFile(ev)} disabled={busy} className="text-blue-600 hover:underline">View</button>
                  <button onClick={() => setToDelete(ev)} className="text-red-600 hover:underline">Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete evidence?"
        message={`"${toDelete?.fileName}" will be permanently removed.`}
        confirmLabel="Delete"
        danger busy={busy}
        onConfirm={removeEvidence}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
