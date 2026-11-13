import { useEffect, useState } from 'react';
import api, { apiErr } from '../lib/api';
import { Card, Btn, Field, Modal } from '../components/ui.jsx';

export default function Students() {
  const [data, setData] = useState({ users: [], total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [add, setAdd] = useState(false);

  const load = () => api.get('/admin/users', { params: { role: 'student', search, page, limit: 20 } }).then((r) => setData(r.data));
  useEffect(() => { load(); }, [page]); // eslint-disable-line
  const pages = Math.max(1, Math.ceil(data.total / 20));

  const toggle = async (u) => { await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active }); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students <span className="text-base font-normal text-slate-400">({data.total})</span></h1>
        <Btn onClick={() => setAdd(true)}>+ Add Student</Btn>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search name / email / enrollment"
          value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())} />
        <Btn variant="ghost" onClick={() => { setPage(1); load(); }}>Search</Btn>
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Name</th><th className="p-3">Enrollment</th><th className="p-3">Hostel/Room</th>
              <th className="p-3">Email</th><th className="p-3 text-right">Status</th></tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-slate-500">{u.enrollment_no || '—'}</td>
                <td className="p-3 text-slate-500">{[u.hostel, u.room_number].filter(Boolean).join(' · ') || '—'}</td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3 text-right">
                  <button onClick={() => toggle(u)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
            {data.users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No students</td></tr>}
          </tbody>
        </table>
      </Card>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">← Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next →</button>
      </div>
      {add && <AddStudent onClose={() => setAdd(false)} onDone={() => { setAdd(false); setPage(1); load(); }} />}
    </div>
  );
}

function AddStudent({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '', enrollment_no: '', hostel: '', room_number: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    setErr('');
    try { await api.post('/admin/users', { ...f, role: 'student' }); onDone(); }
    catch (e) { setErr(apiErr(e)); }
  };
  return (
    <Modal title="Add Student" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name" value={f.name} onChange={set('name')} />
        <Field label="Email" type="email" value={f.email} onChange={set('email')} />
        <Field label="Password" type="password" value={f.password} onChange={set('password')} />
        <Field label="Enrollment No" value={f.enrollment_no} onChange={set('enrollment_no')} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Hostel" value={f.hostel} onChange={set('hostel')} />
          <Field label="Room" value={f.room_number} onChange={set('room_number')} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={go}>Create</Btn></div>
      </div>
    </Modal>
  );
}
