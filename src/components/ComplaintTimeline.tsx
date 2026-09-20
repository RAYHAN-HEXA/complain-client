import type { TimelineEvent } from '../types';
import { STATUS_LABELS, type ComplaintStatus } from '../types';

/** Vertical status timeline from status logs (internal notes never shown here). */
export function ComplaintTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  if (!timeline?.length) return null;
  return (
    <ol className="relative ml-3 border-l-2 border-slate-200">
      {timeline.map((ev, i) => {
        const status = (ev.toStatus ?? ev.status ?? '') as ComplaintStatus;
        const at = ev.createdAt ?? ev.at;
        const date = at ? new Date(Number.isNaN(Number(at)) ? at : Number(at)) : null;
        return (
          <li key={ev._id ?? i} className="ml-6 pb-6 last:pb-0">
            <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-blue-100" />
            <p className="font-medium text-slate-800">{STATUS_LABELS[status] ?? status}</p>
            {ev.reason && <p className="text-sm text-slate-500">{ev.reason}</p>}
            {date && (
              <time className="text-xs text-slate-400">{date.toLocaleString()}</time>
            )}
          </li>
        );
      })}
    </ol>
  );
}
