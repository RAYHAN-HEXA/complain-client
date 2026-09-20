import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getInvestigatorCase, getEvidence, fetchFileBlob, startInvestigation, addNote,
  requestInfo, completeInvestigation,
} from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge, ConfirmDialog } from '../../components/ui';
import { EvidenceGallery } from '../../components/EvidenceGallery';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../types';

export function InvestigatorCasePage() {
  const { publicId = '' } = useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'internal' | 'citizen_visible'>('internal');
  const [question, setQuestion] = useState('');
  const [finding, setFinding] = useState('verified');
  const [recommendation, setRecommendation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const { data: c, isLoading, error: qError } = useQuery({
    queryKey: ['invCase', publicId],
    queryFn: () => getInvestigatorCase(publicId),
    retry: false,
  });
  const { data: evidence } = useQuery({
    queryKey: ['invEvidence', publicId],
    queryFn: () => getEvidence(publicId),
    enabled: !!c,
  });

  const act = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await fn();
      setMsg(successMsg);
      await qc.invalidateQueries({ queryKey: ['invCase', publicId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const openFile = async (id: string) => {
    try {
      const url = await fetchFileBlob(id);
      window.open(url, '_blank');
    } catch {
      setError('Could not open file.');
    }
  };

  if (isLoading) return <Spinner label="Loading case…" />;
  if (qError) return <ErrorBanner message={(qError as Error).message} />;
  if (!c) return <EmptyState title="Case not found" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/investigator/complaints" className="text-sm text-blue-600 hover:underline">← All cases</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
            <p className="font-mono text-sm text-slate-500">{c.publicId}</p>
          </div>
          <div className="flex gap-2">
            <Badge value={c.priority} label={PRIORITY_LABELS[c.priority]} />
            <Badge value={c.status} label={STATUS_LABELS[c.status]} />
          </div>
        </div>
      </div>
      {msg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</div>}
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Case details</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{c.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Location</dt><dd>{c.upazila}, {c.district}</dd></div>
            <div><dt className="text-slate-500">Incident</dt><dd>{c.incidentDate} {c.incidentTime ?? ''}</dd></div>
            <div><dt className="text-slate-500">Area</dt><dd>{c.location?.area || '—'}</dd></div>
            <div><dt className="text-slate-500">Coordinates</dt><dd>{c.location?.latitude ? `${c.location.latitude.toFixed(4)}, ${c.location.longitude?.toFixed(4)}` : '—'}</dd></div>
          </dl>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Actions</h2>
          {c.status === 'assigned' && (
            <button onClick={() => act(() => startInvestigation(publicId), 'Investigation started.')} disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              Start investigation
            </button>
          )}
          {c.status === 'investigating' && (
            <div className="space-y-2">
              <button onClick={() => setConfirmComplete(true)} disabled={busy}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                Complete investigation
              </button>
            </div>
          )}
          {c.status === 'additional_info_required' && (
            <p className="text-sm text-amber-700">Waiting for the citizen to respond to your information request.</p>
          )}
          {c.status === 'resolved' && <p className="text-sm text-green-700">Investigation completed.</p>}

          {/* request info */}
          {(c.status === 'investigating' || c.status === 'additional_info_required') && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700">Request additional information</h3>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="What do you need from the citizen?" />
              <button
                onClick={() => act(async () => { await requestInfo(publicId, question); setQuestion(''); }, 'Information request sent.')}
                disabled={busy || question.trim().length < 5}
                className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                Send request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* notes */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Investigation notes</h2>
        <div className="mt-3 space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note…" />
          <div className="flex items-center gap-3">
            <select value={noteVisibility} onChange={(e) => setNoteVisibility(e.target.value as 'internal' | 'citizen_visible')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Note visibility">
              <option value="internal">Internal only</option>
              <option value="citizen_visible">Visible to citizen</option>
            </select>
            <button
              onClick={() => act(async () => { await addNote(publicId, note, noteVisibility); setNote(''); }, 'Note added.')}
              disabled={busy || note.trim().length < 3}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Add note
            </button>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {(c.notes ?? []).map((n) => (
            <li key={n._id} className="py-2">
              <p className="text-slate-700">{n.note}</p>
              <p className="text-xs text-slate-400">
                {n.visibility === 'internal' ? '🔒 Internal' : '👁 Visible to citizen'} · {new Date(Number(n.createdAt)).toLocaleString()}
              </p>
            </li>
          ))}
          {!c.notes?.length && <li className="py-2 text-slate-400">No notes yet.</li>}
        </ul>
      </div>

      {/* evidence — photo thumbnails + documents (same view the admin used
          when transferring this case) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Evidence ({evidence?.length ?? 0})</h2>
        {!evidence?.length ? <p className="mt-2 text-sm text-slate-500">No evidence attached.</p> : (
          <div className="mt-2">
            <EvidenceGallery evidence={evidence} onOpen={openFile} />
          </div>
        )}
      </div>

      {/* info requests */}
      {!!c.infoRequests?.length && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Information requests</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {c.infoRequests.map((r) => (
              <li key={r._id} className="py-2">
                <p className="text-slate-700">{r.question}</p>
                {r.status === 'answered' ? (
                  <p className="mt-1 text-green-700">Citizen: {r.response}</p>
                ) : (
                  <p className="mt-1 text-amber-600">Awaiting citizen response</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmComplete}
        title="Complete investigation?"
        message="Submit your finding and recommendation. The complaint will be marked resolved."
        confirmLabel="Submit finding"
        busy={busy}
        onCancel={() => setConfirmComplete(false)}
        onConfirm={async () => {
          if (recommendation.trim().length < 10) {
            setError('Recommendation must be at least 10 characters.');
            return;
          }
          await act(() => completeInvestigation(publicId, finding, recommendation), 'Investigation completed.');
          setConfirmComplete(false);
        }}
      />
      {confirmComplete && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-2xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Submit finding</h3>
            <div className="grid grid-cols-2 gap-3">
              <select value={finding} onChange={(e) => setFinding(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Finding">
                <option value="verified">Verified</option>
                <option value="partially_verified">Partially verified</option>
                <option value="unverifiable">Unverifiable</option>
                <option value="false_report">False report</option>
              </select>
              <input value={recommendation} onChange={(e) => setRecommendation(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Recommendation summary…" />
            </div>
            <button onClick={() => {
                if (recommendation.trim().length < 10) { setError('Recommendation must be at least 10 characters.'); return; }
                setConfirmComplete(false);
                act(() => completeInvestigation(publicId, finding, recommendation), 'Investigation completed.');
              }}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Confirm resolution
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
