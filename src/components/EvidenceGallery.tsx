import { useEffect, useState } from 'react';
import { fetchFileBlob } from '../services/api';
import type { Evidence } from '../types';

/**
 * Authenticated evidence image thumbnail: fetches via Bearer token to a
 * blob URL. Used on admin and investigator case views.
 */
export function EvidenceThumb({ evidenceId, fileName, onOpen }: { evidenceId: string; fileName: string; onOpen: (id: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let alive = true;
    fetchFileBlob(evidenceId)
      .then((u) => { if (alive) { revoked = u; setUrl(u); } else URL.revokeObjectURL(u); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (revoked) URL.revokeObjectURL(revoked); };
  }, [evidenceId]);

  return (
    <button
      onClick={() => onOpen(evidenceId)}
      title={`Open ${fileName}`}
      className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
    >
      {url ? (
        <img src={url} alt={fileName} className="h-full w-full object-cover transition group-hover:scale-105" />
      ) : failed ? (
        <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">⚠ unavailable</span>
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
        {fileName.slice(0, 24)}
      </span>
    </button>
  );
}

/** Photo grid + non-image file list, shared by staff case views. */
export function EvidenceGallery({ evidence, onOpen }: { evidence: Evidence[]; onOpen: (id: string) => void }) {
  const images = evidence.filter((e) => e.type === 'image');
  const others = evidence.filter((e) => e.type !== 'image');
  if (!evidence.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">
        Evidence photos ({images.length})
      </p>
      {images.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((ev) => (
            <EvidenceThumb key={ev._id} evidenceId={ev._id} fileName={ev.fileName} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-400">No photos attached.</p>
      )}
      {others.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {others.map((ev) => (
            <li key={ev._id} className="flex items-center justify-between">
              <span>📄 {ev.fileName} <span className="text-slate-400">({ev.type})</span></span>
              <button onClick={() => onOpen(ev._id)} className="text-blue-600 hover:underline">View</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
