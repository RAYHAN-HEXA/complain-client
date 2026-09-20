import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminComplaint, setComplaintStatus, setComplaintPriority, assignInvestigator,
  rejectComplaint, confirmResolution, getInvestigators, fetchFileBlob,
} from '../../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, Badge, ConfirmDialog } from '../../components/ui';
import { ComplaintTimeline } from '../../components/ComplaintTimeline';
import { EvidenceGallery } from '../../components/EvidenceGallery';
import { STATUS_LABELS, PRIORITY_LABELS, REJECTION_REASONS, type ComplaintStatus } from '../../types';
import { useQuery as useRQ } from '@tanstack/react-query';
import { getCategories } from '../../services/endpoints';

export function AdminComplaintDetailPage() {
  const { publicId = '' } = useParams();
  const qc = useQueryClient();
  const [newPriority, setNewPriority] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDetail, setRejectDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | 'reject' | 'status'>(null);
  const [pendingStatus, setPendingStatus] = useState('');

  const { data: c, isLoading, error: qError } = useQuery({
    queryKey: ['adminComplaint', publicId],
    queryFn: () => getAdminComplaint(publicId),
    retry: false,
  });
  const { data: investigators } = useQuery({ queryKey: ['investigators'], queryFn: getInvestigators });
  const { data: categories } = useRQ({ queryKey: ['categories'], queryFn: getCategories });
  const categoryName = categories?.find((k) => k._id === (c as { categoryId?: string })?.categoryId)?.name;

  const act = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await fn();
      setMsg(success);
      await qc.invalidateQueries({ queryKey: ['adminComplaint', publicId] });
      await qc.invalidateQueries({ queryKey: ['adminComplaints'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  const openFile = async (id: string) => {
    try { window.open(await fetchFileBlob(id), '_blank'); }
    catch { setError('Could not open file.'); }
  };

  if (isLoading) return <Spinner label="Loading complaint…" />;
  if (qError) return <ErrorBanner message={(qError as Error).message} />;
  if (!c) return <EmptyState title="Complaint not found" />;

  const statusEl = (s: ComplaintStatus) => (
    <button
      key={s}
      disabled={busy}
      onClick={() => { setPendingStatus(s); setConfirming('status'); }}
      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
    >
      → {STATUS_LABELS[s]}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/complaints" className="text-sm text-blue-600 hover:underline">← Complaint queue</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
            <p className="font-mono text-sm text-slate-500">{c.publicId}</p>
          </div>
          <div className="flex gap-2">
            <Badge value={c.priority} label={PRIORITY_LABELS[c.priority]} />
            <Badge value={c.status} label={STATUS_LABELS[c.status]} />
            {c.flagged && <Badge value="critical" label="🚩 Flagged" />}
          </div>
        </div>
      </div>
      {msg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</div>}
      {error && <ErrorBanner message={error} />}
      {c.flagged && c.flagReason && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Flag reason: {c.flagReason}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Complaint</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{c.description}</p>

          {/* Evidence photos — admin sees them here; the assigned investigator
              sees the same gallery after the case is transferred */}
          <EvidenceGallery evidence={c.evidence ?? []} onOpen={openFile} />

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Location</dt><dd>{c.upazila}, {c.district}</dd></div>
            <div><dt className="text-slate-500">Incident</dt><dd>{c.incidentDate} {c.incidentTime ?? ''}</dd></div>
            <div><dt className="text-slate-500">Address (private)</dt><dd>{c.address || '—'}</dd></div>
            <div><dt className="text-slate-500">Category</dt><dd>{categoryName ?? '—'}</dd></div>
          </dl>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700">Reporter</p>
            <p className="text-slate-600">{c.reporter?.name ?? 'Unknown'} · verification: {c.reporter?.verificationOverall ?? 'unknown'}</p>
            <p className="mt-1 text-xs text-slate-400">NID, phone and selfie are never exposed to staff.</p>
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Moderation</h2>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Status transitions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(c.status === 'submitted' ? ['pending_review', 'in_review'] as ComplaintStatus[] :
                c.status === 'pending_review' ? ['in_review', 'rejected'] as ComplaintStatus[] :
                c.status === 'in_review' ? ['assigned', 'rejected', 'pending_review'] as ComplaintStatus[] :
                c.status === 'assigned' ? ['rejected'] as ComplaintStatus[] : []).map(statusEl)}
              {!['submitted', 'pending_review', 'in_review', 'assigned'].includes(c.status) && (
                <p className="text-sm text-slate-400">No admin transitions available at this stage.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Priority</p>
            <div className="mt-2 flex gap-2">
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="New priority">
                <option value="">Change priority…</option>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button disabled={busy || !newPriority}
                onClick={() => act(() => setComplaintPriority(publicId, newPriority), 'Priority updated.')}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                Apply
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Assign investigator</p>
            <div className="mt-2 flex gap-2">
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Investigator">
                <option value="">Select investigator…</option>
                {(investigators ?? []).map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
              <button disabled={busy || !assignTo}
                onClick={() => act(() => assignInvestigator(publicId, assignTo), 'Investigator assigned.')}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                Assign
              </button>
            </div>
          </div>

          {(c.status === 'pending_review' || c.status === 'in_review' || c.status === 'assigned') && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Reject complaint</p>
              <div className="mt-2 space-y-2">
                <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Rejection reason">
                  <option value="">Reason (required)…</option>
                  {REJECTION_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <input value={rejectDetail} onChange={(e) => setRejectDetail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Explain the decision…" />
                <button disabled={busy || !rejectReason || (rejectReason !== 'duplicate' && rejectDetail.trim().length < 3)}
                  onClick={() => setConfirming('reject')}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  Reject complaint
                </button>
              </div>
            </div>
          )}

          {c.status === 'resolved' && (
            <button disabled={busy}
              onClick={() => act(() => confirmResolution(publicId), 'Resolution confirmed.')}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              Confirm investigator's resolution
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Timeline</h2>
        <ComplaintTimeline timeline={c.timeline ?? []} />
      </div>

      {!!c.evidence?.length && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Evidence ({c.evidence.length})</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {c.evidence.map((ev) => (
              <li key={ev._id} className="flex items-center justify-between py-2">
                <span>{ev.fileName} <span className="text-slate-400">({ev.type}, {(ev.fileSize / 1024).toFixed(0)} KB)</span></span>
                <button onClick={() => openFile(ev._id)} className="text-blue-600 hover:underline">View</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!c.investigationNotes?.length && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Investigation notes</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {c.investigationNotes.map((n) => (
              <li key={n._id} className="py-2">
                <p className="text-slate-700">{n.note}</p>
                <p className="text-xs text-slate-400">{n.visibility === 'internal' ? '🔒 Internal' : '👁 Citizen-visible'} · {new Date(Number(n.createdAt)).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirming === 'reject'}
        title="Reject this complaint?"
        message="The citizen will see the rejection reason. This action is logged."
        confirmLabel="Reject"
        danger busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={() => act(() => rejectComplaint(publicId, rejectReason, rejectDetail || '—'), 'Complaint rejected.')}
      />
      <ConfirmDialog
        open={confirming === 'status'}
        title="Change status?"
        message={`Move this complaint to "${STATUS_LABELS[pendingStatus as ComplaintStatus]}"?`}
        busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={() => act(() => setComplaintStatus(publicId, pendingStatus), 'Status updated.')}
      />
    </div>
  );
}
