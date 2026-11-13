import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/live', label: 'Live Bag Board', icon: '🎯' },
  { to: '/bags', label: 'Bags', icon: '👜' },
  { to: '/orders', label: 'Orders', icon: '📋' },
  { to: '/workers', label: 'Workers', icon: '🧑‍🔧' },
  { to: '/students', label: 'Students', icon: '🎓' },
  { to: '/reports', label: 'Reports', icon: '📥' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col bg-navy-900 text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-lg font-bold">Dhobi Clinic</div>
          <div className="text-xs text-white/60">Admin Console</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-white/15 font-semibold' : 'text-white/70 hover:bg-white/10'
                }`}>
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <div className="mb-2 text-white/70">{user?.name}</div>
          <button onClick={logout} className="w-full rounded-lg bg-white/10 py-2 text-sm hover:bg-white/20">Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
