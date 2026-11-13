import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { apiErr } from '../lib/api';
import { Card, Btn, StageBadge } from '../components/ui.jsx';
import { STAGE_TIMELINE_LABEL, STAGE_COLOR, EXCEPTION_STATES, EXCEPTION_LABEL, fmt } from '../lib/constants';

export default function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [audit, setAudit] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const r = await api.get(`/orders/${id}`);
    setO(r.data);
    if (r.data.bag_id) api.get(`/admin/bags/${r.data.bag_id}/audit`).then((a) => setAudit(a.data.events));
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const act = async (fn) => {
    setMsg('');
    try { await fn(); await load(); }
    catch (e) { setMsg(apiErr(e)); }
  };

  if (!o) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link to="/orders" className="text-sm text-navy-600 hover:underline">← Orders</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{o.bag_number}</h1>
          <p className="text-slate-500">{o.student_name} · {o.enrollment_no} · {[o.hostel, o.room_number].filter(Boolean).join(' / ')}</p>
        </div>
        <StageBadge stage={o.current_stage} exception={o.exception_state} />
      </div>

      {msg && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <h2 className="mb-4 font-semibold">Handling Timeline (attribution)</h2>
            <ol className="space-y-3">
              {o.timeline.map((t, i) => {
                const color = t.kind === 'exception' ? '#dc2626' : t.kind === 'rework' ? '#d97706' : (STAGE_COLOR[t.stage] || '#64748b');
                return (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                    <div>
                      <div className="font-medium">{STAGE_TIMELINE_LABEL[t.stage] || t.stage}{t.kind !== 'advance' && <span className="ml-1 text-xs uppercase text-amber-600">({t.kind})</span>}</div>
                      <div className="text-sm text-slate-500">{t.worker_name ? `by ${t.worker_name}` : 'Student / system'} · {fmt(t.completed_at)}</div>
                      {t.notes && <div className="text-xs italic text-slate-400">{t.notes}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Items */}
          <Card>
            <h2 className="mb-3 font-semibold">Garments</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {o.items.map((it, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{it.item_type.replace(/_/g, ' ')} <span className="text-xs text-slate-400">({it.category})</span></span>
                  <span className="font-semibold">×{it.quantity}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Scan audit */}
          <Card>
            <h2 className="mb-3 font-semibold">Audit Trail (scans + stages)</h2>
            <div className="max-h-64 overflow-auto text-sm">
              {audit.map((e, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 py-1.5">
                  <span><span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase">{e.type}</span>{e.stage || '—'} {e.kind && e.kind !== 'advance' ? `(${e.kind})` : ''}</span>
                  <span className="text-slate-500">{e.worker_name || '—'} · {fmt(e.at)}</span>
                </div>
              ))}
              {audit.length === 0 && <p className="text-slate-400">No events</p>}
            </div>
          </Card>
        </div>

        {/* Admin actions */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-semibold">Status</h2>
            <dl className="space-y-1 text-sm">
              <Row k="Handler" v={o.current_handler_name || '—'} />
              <Row k="Submitted" v={fmt(o.submitted_at)} />
              <Row k="Expected" v={fmt(o.expected_completion_time)} />
              <Row k="Delivered" v={fmt(o.delivered_at)} />
              <Row k="Rework count" v={o.rework_count} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Admin Actions</h2>
            {o.exception_state ? (
              <div className="space-y-2">
                <p className="text-sm text-red-600">Marked: {EXCEPTION_LABEL[o.exception_state]}</p>
                <Btn variant="success" className="w-full" onClick={() => act(() => api.post(`/admin/orders/${id}/clear-exception`, {}))}>Clear Exception</Btn>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {EXCEPTION_STATES.map((s) => (
                    <Btn key={s} variant="danger" onClick={() => act(() => api.post(`/admin/orders/${id}/exception`, { state: s }))}>{EXCEPTION_LABEL[s]}</Btn>
                  ))}
                </div>
                {o.current_stage !== 'delivered' && (
                  <Btn variant="ghost" className="w-full" onClick={() => act(() => api.post(`/admin/orders/${id}/rework`, {}))}>↩ Send back (rework)</Btn>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
);
