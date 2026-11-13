import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Card, StageBadge } from '../components/ui.jsx';

export default function LiveBoard() {
  const [data, setData] = useState({ bags: [], total: 0 });

  const load = () => api.get('/admin/live-board').then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Bag Board</h1>
        <span className="text-sm text-slate-500">{data.total} active bags</span>
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Bag</th><th className="p-3">Student</th><th className="p-3">Hostel/Room</th>
              <th className="p-3">Stage</th><th className="p-3">Current Handler</th><th className="p-3">Expected</th>
            </tr>
          </thead>
          <tbody>
            {data.bags.map((b) => (
              <tr key={b.id} className={`border-b border-slate-100 hover:bg-slate-50 ${b.delayed ? 'bg-red-50' : ''}`}>
                <td className="p-3 font-semibold"><Link to={`/orders/${b.id}`} className="text-navy-800 hover:underline">{b.bag_number}</Link></td>
                <td className="p-3">{b.student_name}</td>
                <td className="p-3 text-slate-500">{[b.hostel, b.room_number].filter(Boolean).join(' · ')}</td>
                <td className="p-3"><StageBadge stage={b.current_stage} exception={b.exception_state} /></td>
                <td className="p-3">{b.current_handler_name || <span className="text-slate-400">—</span>}</td>
                <td className="p-3 text-slate-500">
                  {b.delayed && <span className="mr-1 font-semibold text-red-600">DELAYED</span>}
                  {b.expected_completion_time ? new Date(b.expected_completion_time).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {data.bags.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No active bags</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
