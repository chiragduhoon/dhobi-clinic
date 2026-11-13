import { download } from '../lib/api';
import { Card, Btn } from '../components/ui.jsx';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Orders Report</h2>
          <p className="mt-1 text-sm text-slate-500">All orders with bag, student, stage, and timestamps (CSV).</p>
          <Btn className="mt-4" onClick={() => download('get', '/admin/reports/orders.csv', 'orders-report.csv')}>Download CSV</Btn>
        </Card>
        <Card>
          <h2 className="font-semibold">Worker Productivity Report</h2>
          <p className="mt-1 text-sm text-slate-500">Per-worker stages, avg time, rework, late deliveries, score (CSV).</p>
          <Btn className="mt-4" onClick={() => download('get', '/admin/reports/productivity.csv', 'productivity-report.csv')}>Download CSV</Btn>
        </Card>
      </div>
    </div>
  );
}
