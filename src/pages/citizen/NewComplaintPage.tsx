import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories, createComplaint, uploadEvidence } from '../../services/endpoints';
import { ErrorBanner } from '../../components/ui';
import { ApiError } from '../../services/api';

const DISTRICTS = ['Bagerhat', 'Chattogram', 'Dhaka', 'Khulna', 'Rajshahi', 'Rangpur', 'Sylhet'];

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  district: string;
  upazila: string;
  area: string;
  address: string;
  incidentDate: string;
  incidentTime: string;
}

const EMPTY: FormState = {
  title: '', description: '', categoryId: '', district: '', upazila: '',
  area: '', address: '', incidentDate: '', incidentTime: '',
};

export function NewComplaintPage() {
  const navigate = useNavigate();
  const { data: cats, isLoading: catsLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState('image');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (form.title.trim().length < 5 || form.title.length > 150) errs.title = 'Title must be 5–150 characters.';
      if (form.description.trim().length < 20 || form.description.length > 5000) errs.description = 'Description must be 20–5000 characters.';
      if (!form.categoryId) errs.categoryId = 'Choose a category.';
    }
    if (s === 2) {
      if (!form.district) errs.district = 'District is required.';
      if (!form.upazila.trim()) errs.upazila = 'Upazila / Area is required.';
      if (!form.incidentDate) errs.incidentDate = 'Incident date is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(4, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const maxBytes = useMemo(() => (fileType === 'video' ? 100 : 10) * 1024 * 1024, [fileType]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) { setStep(1); return; }
    setBusy(true);
    setError(null);
    let publicId = '';
    try {
      const res = await createComplaint({
        ...form,
        area: form.area || undefined,
        address: form.address || undefined,
        incidentTime: form.incidentTime || undefined,
      });
      publicId = res.complaint.publicId;
      if (files.length) {
        await uploadEvidence(publicId, files, fileType);
      }
      navigate(`/dashboard/complaints/${publicId}?created=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setFieldErrors(err.fields);
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      if (!publicId) setBusy(false);
    }
  };

  const steps = ['Complaint', 'Location', 'Evidence', 'Review'];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Submit a complaint</h1>
      {/* stepper */}
      <ol className="my-6 flex gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} className={`flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium ${
            i + 1 === step ? 'bg-blue-600 text-white' : i + 1 < step ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <ErrorBanner message={error} />}

        {step === 1 && (
          <>
            <label className="block text-sm font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
              <input value={form.title} onChange={set('title')} maxLength={150}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Summarise the issue in one line" />
              {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description <span className="text-red-500">*</span>
              <textarea value={form.description} onChange={set('description')} rows={5} maxLength={5000}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="What happened? When did it start? Who is affected?" />
              <span className="text-xs text-slate-400">{form.description.length}/5000</span>
              {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category <span className="text-red-500">*</span>
              <select value={form.categoryId} onChange={set('categoryId')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="">{catsLoading ? 'Loading…' : 'Select a category'}</option>
                {(cats ?? []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {fieldErrors.categoryId && <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryId}</p>}
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                District <span className="text-red-500">*</span>
                <select value={form.district} onChange={set('district')}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="">Select…</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {fieldErrors.district && <p className="mt-1 text-xs text-red-600">{fieldErrors.district}</p>}
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Upazila / Area <span className="text-red-500">*</span>
                <input value={form.upazila} onChange={set('upazila')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Sonadanga" />
                {fieldErrors.upazila && <p className="mt-1 text-xs text-red-600">{fieldErrors.upazila}</p>}
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Area / Landmark
              <input value={form.area} onChange={set('area')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Near Sonadanga bus stand" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Exact address (optional — never shown publicly)
              <input value={form.address} onChange={set('address')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="House, road, etc." />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Incident date <span className="text-red-500">*</span>
                <input type="date" value={form.incidentDate} onChange={set('incidentDate')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                {fieldErrors.incidentDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.incidentDate}</p>}
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Incident time
                <input type="time" value={form.incidentTime} onChange={set('incidentTime')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <label className="block text-sm font-medium text-slate-700">
              Evidence type
              <select value={fileType} onChange={(e) => setFileType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="image">Image (max 10 MB)</option>
                <option value="video">Video (max 100 MB)</option>
                <option value="document">Document (max 10 MB)</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Attach files
              <input type="file" multiple
                accept={fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.txt'}
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).filter((f) => f.size <= maxBytes))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            {files.length > 0 && (
              <ul className="text-sm text-slate-600">
                {files.map((f, i) => <li key={i}>• {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>)}
              </ul>
            )}
            <p className="text-xs text-slate-400">Evidence is optional but strongly recommended.</p>
          </>
        )}

        {step === 4 && (
          <dl className="space-y-3 text-sm">
            <div><dt className="font-semibold text-slate-700">Title</dt><dd>{form.title}</dd></div>
            <div><dt className="font-semibold text-slate-700">Description</dt><dd className="whitespace-pre-wrap">{form.description}</dd></div>
            <div><dt className="font-semibold text-slate-700">Category</dt><dd>{cats?.find((c) => c._id === form.categoryId)?.name}</dd></div>
            <div><dt className="font-semibold text-slate-700">Location</dt><dd>{form.upazila}, {form.district}{form.area ? ` — ${form.area}` : ''}</dd></div>
            <div><dt className="font-semibold text-slate-700">Incident</dt><dd>{form.incidentDate}{form.incidentTime ? ` ${form.incidentTime}` : ''}</dd></div>
            <div><dt className="font-semibold text-slate-700">Evidence</dt><dd>{files.length ? `${files.length} file(s)` : 'None'}</dd></div>
          </dl>
        )}

        <div className="flex justify-between pt-2">
          {step > 1 ? (
            <button type="button" onClick={back} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50">Back</button>
          ) : <span />}
          {step < 4 ? (
            <button type="button" onClick={next} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next</button>
          ) : (
            <button type="submit" disabled={busy} className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Submit complaint'}
            </button>
          )}
        </div>
      </form>
      <p className="mt-3 text-center text-xs text-slate-400">
        Duplicate submissions of the same issue are detected automatically.
      </p>
    </div>
  );
}
