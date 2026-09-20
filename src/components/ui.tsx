import { type ReactNode } from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10" role="status" aria-live="polite">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 px-6 text-center">
      <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 font-medium underline hover:text-red-900">
          Retry
        </button>
      )}
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-700 ring-slate-200',
  pending_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_review: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  assigned: 'bg-blue-50 text-blue-700 ring-blue-200',
  investigating: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  additional_info_required: 'bg-orange-50 text-orange-700 ring-orange-200',
  resolved: 'bg-green-50 text-green-700 ring-green-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  medium: 'bg-blue-50 text-blue-600 ring-blue-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-red-100 text-red-800 ring-red-300',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const style = badgeStyles[value] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {label ?? value.replaceAll('_', ' ')}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, tone = 'blue' }: { label: string; value: number | string; tone?: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 inline-block rounded-lg px-2 py-1 text-2xl font-bold ${tones[tone] ?? tones.blue}`}>{value}</p>
    </div>
  );
}
