import { STAGE_COLOR, STAGE_LABEL, EXCEPTION_LABEL } from '../lib/constants';

export const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>
);

export const Btn = ({ children, variant = 'primary', className = '', ...p }) => {
  const styles = {
    primary: 'bg-navy-800 text-white hover:bg-navy-900',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  return (
    <button className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`} {...p}>
      {children}
    </button>
  );
};

export const StageBadge = ({ stage, exception }) => {
  if (exception) {
    return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">{EXCEPTION_LABEL[exception] || exception}</span>;
  }
  const c = STAGE_COLOR[stage] || '#64748b';
  return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${c}1a`, color: c }}>{STAGE_LABEL[stage] || stage}</span>;
};

export const Field = ({ label, ...p }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
    <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none" {...p} />
  </label>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
      {children}
    </div>
  </div>
);
