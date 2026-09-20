import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/endpoints';
import { Spinner } from '../components/ui';

export function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Report civic issues.<br />
            <span className="text-blue-600">Track them to resolution.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Verified citizens report complaints with evidence. Admins moderate, investigators
            act — and anyone can track progress anonymously with just the complaint ID.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard/complaints/new" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700">
              Submit a Complaint
            </Link>
            <Link to="/track" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Track a Complaint
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-800">Complaint Categories</h2>
        {isLoading ? (
          <Spinner label="Loading categories…" />
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {(data ?? []).map((c) => (
              <span key={c._id} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 shadow-sm">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { t: 'Verified citizens', d: 'NID + selfie verification keeps the platform free of fake reports.' },
            { t: 'Evidence-based', d: 'Photos, videos and documents attached to every complaint.' },
            { t: 'Transparent', d: 'Public timeline shows each step — submit, review, investigate, resolve.' },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{f.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
