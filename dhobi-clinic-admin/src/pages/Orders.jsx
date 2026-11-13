import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Card, StageBadge } from '../components/ui.jsx';
import { STAGES, STAGE_LABEL, fmt } from '../lib/constants';

export default function Orders() {
  const [data, setData] = useState({ orders: [], total: 0 });
  const [stage, setStage] = useState('');
  const [exception, setException] = useState(false);
  const [page, setPage] = useState(1);

  const load = () => api.get('/admin/orders', { params: { stage: stage || undefined, exception: exception ? 'true' : undefined, page, limit: 20 } })
    .then((r) => setData(r.data));
  useEffect(() => { load(); }, [stage, exception, page]); // eslint-disable-line

  const pages = Math.max(1, Math.ceil(data.total / 20));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders <span className="text-base font-normal text-slate-400">({data.total})</span></h1>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setStage(''); setException(false); setPage(1); }}
          className={`rounded-full px-3 py-1 text-sm ${!stage && !exception ? 'bg-navy-800 text-white' : 'bg-slate-100'}`}>All</button>
        {STAGES.map((s) => (
          <button key={s} onClick={() => { setStage(s); setException(false); setPage(1); }}
            className={`rounded-full px-3 py-1 text-sm ${stage === s ? 'bg-navy-800 text-white' : 'bg-slate-100'}`}>{STAGE_LABEL[s]}</button>
        ))}
        <button onClick={() => { setException(true); setStage(''); setPage(1); }}
          className={`rounded-full px-3 py-1 text-sm ${exception ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>Exceptions</button>
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Bag</th><th className="p-3">Student</th><th className="p-3">Hostel</th>
              <th className="p-3">Stage</th><th className="p-3">Handler</th><th className="p-3">Submitted</th></tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-semibold"><Link to={`/orders/${o.id}`} className="text-navy-800 hover:underline">{o.bag_number}</Link></td>
                <td className="p-3">{o.student_name}</td>
                <td className="p-3 text-slate-500">{o.hostel || '—'}</td>
                <td className="p-3"><StageBadge stage={o.current_stage} exception={o.exception_state} /></td>
                <td className="p-3">{o.current_handler_name || '—'}</td>
                <td className="p-3 text-slate-500">{fmt(o.submitted_at)}</td>
              </tr>
            ))}
            {data.orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No orders</td></tr>}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">← Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}
