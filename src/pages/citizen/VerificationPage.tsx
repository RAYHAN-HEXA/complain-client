import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { submitNid, submitSelfie } from '../../services/endpoints';
import { Spinner, ErrorBanner } from '../../components/ui';
import type { ApiEnvelope, Verification } from '../../types';

export function VerificationPage() {
  const qc = useQueryClient();
  const [nidNumber, setNidNumber] = useState('');
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- Demo-mode helpers (server runs MOCK_PROVIDERS=true, so any
  // 10/13/17-digit NID + any image verifies; these generate valid dummies
  // so testers don't need real documents) ----
  const fillDummyNid = () => {
    const lengths = [10, 13, 17];
    const len = lengths[Math.floor(Math.random() * lengths.length)];
    let digits = '';
    for (let i = 0; i < len; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    setNidNumber(digits);
    const demo = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], // PNG magic bytes
      `demo-nid-${Date.now()}.png`,
      { type: 'image/png' },
    );
    setNidFile(demo);
    setMsg('Demo NID details filled — press "Verify NID".');
    setError(null);
  };

  const fillDummySelfie = () => {
    const demo = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      `demo-selfie-${Date.now()}.png`,
      { type: 'image/png' },
    );
    setSelfieFile(demo);
    setMsg('Demo selfie attached — press "Verify selfie".');
    setError(null);
  };

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['verificationStatus'],
    queryFn: async () => (await api.get<ApiEnvelope<{ verification: Verification }>>('/api/v1/verification/status')).data.data!,
  });

  if (isLoading) return <Spinner label="Loading verification status…" />;
  const v = statusData?.verification;
  const nidDone = v?.nid ?? false;
  const selfieDone = v?.selfie ?? false;

  const doNid = async () => {
    if (!nidFile || !nidNumber.trim()) {
      setError('Enter your NID number and attach an image of it.');
      return;
    }
    setBusy(true); setError(null); setMsg(null);
    try {
      const res = await submitNid(nidNumber, '', nidFile);
      setMsg(res.data?.message ?? 'Verification submitted.');
      await qc.invalidateQueries({ queryKey: ['verificationStatus'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const doSelfie = async () => {
    if (!selfieFile) { setError('Attach a selfie image.'); return; }
    setBusy(true); setError(null); setMsg(null);
    try {
      const res = await submitSelfie(selfieFile);
      setMsg(res.data?.message ?? 'Verification submitted.');
      await qc.invalidateQueries({ queryKey: ['verificationStatus'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const Step = ({ n, title, done }: { n: number; title: string; done: boolean }) => (
    <div className="flex items-center gap-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
        {done ? '✓' : n}
      </span>
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {done && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span>}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Identity verification</h1>
      <p className="text-sm text-slate-500">
        Verifying your identity (NID + selfie) builds trust in your reports. One NID can verify only one account.
      </p>
      {msg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</div>}
      {error && <ErrorBanner message={error} />}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Step n={1} title="NID verification" done={nidDone} />
        {!nidDone ? (
          <div className="space-y-3 pl-11">
            <input value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="NID number (10/13/17 digits)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            <input type="file" accept="image/*" onChange={(e) => setNidFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2">
              <button onClick={doNid} disabled={busy || !nidNumber || !nidFile}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Verifying…' : 'Verify NID'}
              </button>
              <button type="button" onClick={fillDummyNid} disabled={busy}
                className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                title="Fills a random valid NID + demo image (demo mode only)">
                🎲 Use demo data
              </button>
            </div>
          </div>
        ) : <p className="pl-11 text-sm text-green-700">Your NID is verified.</p>}

        <div className="border-t border-slate-100 pt-6" />
        <Step n={2} title="Selfie verification" done={selfieDone} />
        {!selfieDone ? (
          <div className="space-y-3 pl-11">
            {!nidDone && <p className="text-xs text-amber-600">Complete NID verification first.</p>}
            <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2">
              <button onClick={doSelfie} disabled={busy || !nidDone || !selfieFile}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Verifying…' : 'Verify selfie'}
              </button>
              <button type="button" onClick={fillDummySelfie} disabled={busy || !nidDone}
                className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                title="Attaches a demo image (demo mode only)">
                🎲 Use demo selfie
              </button>
            </div>
            <p className="text-xs text-slate-400">Your raw selfie is deleted immediately after verification.</p>
          </div>
        ) : <p className="pl-11 text-sm text-green-700">Face verification passed — you are fully verified.</p>}
      </div>
    </div>
  );
}
