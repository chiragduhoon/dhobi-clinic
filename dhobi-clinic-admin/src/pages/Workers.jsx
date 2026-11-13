import { useEffect, useState } from 'react';
import api, { apiErr } from '../lib/api';
import { Card, Btn, Field, Modal } from '../components/ui.jsx';

export default function Workers() {
  const [prod, setProd] = useState([]);
  const [add, setAdd] = useState(false);

  const load = () => api.get('/admin/productivity').then((r) => setProd(r.data));
  useEffect(() => { load(); }, []);

  const top = [...prod].sort((a, b) => b.productivity_score - a.productivity_score)[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workers & Productivity</h1>
        <Btn onClick={() => setAdd(true)}>+ Add Worker</Btn>
      </div>

      {top && (
        <Card className="bg-navy-50">
          <span className="text-sm text-slate-500">🏆 Top Performer</span>
          <div className="text-xl font-bold">{top.name} <span className="text-sm font-normal text-slate-500">· score {top.productivity_score}</span></div>
        </Card>
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Worker</th><th className="p-3 text-right">Stages</th><th className="p-3 text-right">Avg min/stage</th>
              <th className="p-3 text-right">Rework</th><th className="p-3 text-right">Late</th><th className="p-3 text-right">Score</th></tr>
          </thead>
          <tbody>
            {prod.map((w) => (
              <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium">{w.name}</td>
                <td className="p-3 text-right">{w.stages_completed}</td>
                <td className="p-3 text-right">{w.avg_stage_minutes}</td>
                <td className="p-3 text-right">{w.rework_count}</td>
                <td className="p-3 text-right text-red-600">{w.late_deliveries}</td>
                <td className="p-3 text-right font-bold">{w.productivity_score}</td>
              </tr>
            ))}
            {prod.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No workers yet</td></tr>}
          </tbody>
        </table>
      </Card>

      {add && <AddWorker onClose={() => setAdd(false)} onDone={() => { setAdd(false); load(); }} />}
    </div>
  );
}

function AddWorker({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '', staff_code: '', specialty_role: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    setErr('');
    try { await api.post('/admin/users', { ...f, role: 'worker' }); onDone(); }
    catch (e) { setErr(apiErr(e)); }
  };
  return (
    <Modal title="Add Worker" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name" value={f.name} onChange={set('name')} />
        <Field label="Email" type="email" value={f.email} onChange={set('email')} />
        <Field label="Password" type="password" value={f.password} onChange={set('password')} />
        <Field label="Staff Code" value={f.staff_code} onChange={set('staff_code')} />
        <Field label="Specialty (optional)" value={f.specialty_role} onChange={set('specialty_role')} placeholder="e.g. ironing" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={go}>Create</Btn></div>
      </div>
    </Modal>
  );
}
