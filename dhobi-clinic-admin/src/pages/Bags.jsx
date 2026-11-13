import { useEffect, useState } from 'react';
import api, { download, apiErr } from '../lib/api';
import { Card, Btn, Field, Modal } from '../components/ui.jsx';

export default function Bags() {
  const [data, setData] = useState({ bags: [], total: 0, page: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bulk, setBulk] = useState(false);
  const [assign, setAssign] = useState(null); // bag being assigned

  const load = () => api.get('/bags', { params: { search, page, limit: 20 } }).then((r) => setData(r.data));
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const pages = Math.max(1, Math.ceil(data.total / 20));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bags <span className="text-base font-normal text-slate-400">({data.total})</span></h1>
        <Btn onClick={() => setBulk(true)}>+ Generate Bags</Btn>
      </div>

      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search bag / student / enrollment"
          value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())} />
        <Btn variant="ghost" onClick={() => { setPage(1); load(); }}>Search</Btn>
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Bag</th><th className="p-3">Student</th><th className="p-3">Enrollment</th>
              <th className="p-3">Hostel/Room</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {data.bags.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-semibold">{b.bag_number}</td>
                <td className="p-3">{b.student_name || <span className="text-amber-600">Unassigned</span>}</td>
                <td className="p-3 text-slate-500">{b.enrollment_no || '—'}</td>
                <td className="p-3 text-slate-500">{[b.hostel, b.room_number].filter(Boolean).join(' · ') || '—'}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="text-navy-600 hover:underline" onClick={() => download('get', `/admin/bags/${b.id}/label.pdf`, `${b.bag_number}.pdf`)}>Label</button>
                  <button className="text-navy-600 hover:underline" onClick={() => setAssign(b)}>{b.student_name ? 'Reassign' : 'Assign'}</button>
                </td>
              </tr>
            ))}
            {data.bags.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No bags</td></tr>}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">← Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next →</button>
      </div>

      {bulk && <BulkModal onClose={() => setBulk(false)} onDone={() => { setBulk(false); setPage(1); load(); }} />}
      {assign && <AssignModal bag={assign} onClose={() => setAssign(null)} onDone={() => { setAssign(null); load(); }} />}
    </div>
  );
}

function BulkModal({ onClose, onDone }) {
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.post('/bags/bulk', { count: Number(count) });
      // offer immediate batch labels
      await download('post', '/admin/bags/labels.pdf', 'new-bag-labels.pdf', { bag_ids: r.data.bags.map((b) => b.id) });
      onDone();
    } catch (e) { setErr(apiErr(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title="Generate Bags" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">Creates N new bags with sequential DHB numbers and downloads their printable labels.</p>
      <Field label="How many bags?" type="number" value={count} onChange={(e) => setCount(e.target.value)} />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn disabled={busy} onClick={go}>{busy ? 'Generating…' : 'Generate + Labels'}</Btn>
      </div>
    </Modal>
  );
}

function AssignModal({ bag, onClose, onDone }) {
  const [students, setStudents] = useState([]);
  const [sel, setSel] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/admin/users', { params: { role: 'student', limit: 500 } }).then((r) => setStudents(r.data.users)); }, []);
  const go = async () => {
    setErr('');
    try { await api.patch(`/bags/${bag.id}/assign`, { student_id: sel }); onDone(); }
    catch (e) { setErr(apiErr(e)); }
  };
  return (
    <Modal title={`Assign ${bag.bag_number}`} onClose={onClose}>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Student</span>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Select a student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.enrollment_no || s.email}</option>)}
        </select>
      </label>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!sel} onClick={go}>Assign</Btn>
      </div>
    </Modal>
  );
}
