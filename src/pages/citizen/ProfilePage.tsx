import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/endpoints';
import { ErrorBanner, Badge } from '../../components/ui';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const save = async () => {
    setBusy(true); setError(null); setSaved(false);
    try {
      await updateProfile({ name, phone, district: district || undefined });
      await refresh();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  // Demo-mode helper (server MOCK_PROVIDERS=true): fills plausible profile
  // data so testers don't have to invent values.
  const fillDemo = () => {
    const firstNames = ['Roxy', 'Arif', 'Nusrat', 'Tanvir', 'Sultana', 'Rafiq', 'Mitu', 'Jahid'];
    const lastNames = ['Islam', 'Akter', 'Hossain', 'Rahman', 'Chowdhury', 'Khan', 'Sultana'];
    const districts = ['Khulna', 'Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet', 'Bagerhat', 'Rangpur'];
    const upazilas: Record<string, string[]> = {
      Khulna: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Batiaghata'],
      Dhaka: ['Mirpur', 'Gulshan', 'Dhanmondi', 'Mohammadpur'],
      Chattogram: ['Pahartali', 'Kotwali', 'Halishahar'],
      Rajshahi: ['Boalia', 'Motihar', 'Shah Makhdum'],
      Sylhet: ['Ambarkhana', 'Shahpori', 'Kadamtoli'],
      Bagerhat: ['Sadar', 'Chitalmari', 'Fakirhat'],
      Rangpur: ['Sadar', 'Gangachara', 'Mithapukur'],
    };
    const district = districts[Math.floor(Math.random() * districts.length)];
    const ups = upazilas[district];
    const phone = '+8801' + Math.floor(300000000 + Math.random() * 699999999); // 11-digit local format
    setName(`${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`);
    setPhone(phone);
    setDistrict(`${district} — ${ups[Math.floor(Math.random() * ups.length)]}`);
    setSaved(false);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      {error && <ErrorBanner message={error} />}
      {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Profile saved.</div>}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Email</span>
          <span className="font-medium">{user.email || '—'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Role</span>
          <span className="font-medium capitalize">{user.role}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Verification</span>
          <Badge value={user.verification.overall === 'verified' ? 'resolved' : user.verification.overall === 'basic' ? 'pending_review' : 'rejected'}
            label={user.verification.overall} />
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="+8801XXXXXXXXX" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          District
          <input value={district} onChange={(e) => setDistrict(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={fillDemo} disabled={busy}
            className="rounded-lg border border-amber-400 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            title="Fills random plausible profile values (demo mode only)">
            🎲 Use demo data
          </button>
        </div>
      </div>
    </div>
  );
}
