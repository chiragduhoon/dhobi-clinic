import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../lib/api';
import { Card } from '../components/ui.jsx';

const Stat = ({ label, value, accent = '#1e3a8a' }) => (
  <Card>
    <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
    <div className="mt-1 text-sm text-slate-500">{label}</div>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [prod, setProd] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/productivity').then((r) => setProd(r.data));
  }, []);

  if (!stats) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today's Orders" value={stats.today_orders} />
        <Stat label="In Progress" value={stats.in_progress} accent="#2563eb" />
        <Stat label="Ready for Collection" value={stats.ready} accent="#16a34a" />
        <Stat label="Completed" value={stats.completed} accent="#15803d" />
        <Stat label="On Time" value={stats.on_time} accent="#0d9488" />
        <Stat label="Delayed" value={stats.delayed} accent="#dc2626" />
        <Stat label="Exceptions" value={stats.exceptions} accent="#d97706" />
        <Stat label="Avg Completion (h)" value={stats.avg_completion_hours} accent="#7c3aed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Worker Productivity (stages completed)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={prod}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="stages_completed" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-sm text-slate-500">Most Active Hostel</div>
            <div className="mt-1 text-xl font-bold">{stats.most_active_hostel?.hostel || '—'}</div>
            <div className="text-sm text-slate-400">{stats.most_active_hostel?.count || 0} orders</div>
          </Card>
          <Card>
            <div className="text-sm text-slate-500">Most Active Worker</div>
            <div className="mt-1 text-xl font-bold">{stats.most_active_worker?.name || '—'}</div>
            <div className="text-sm text-slate-400">{stats.most_active_worker?.count || 0} stages</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
