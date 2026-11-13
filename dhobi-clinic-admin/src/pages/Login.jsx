import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { Btn, Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@dhobiclinic.com');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try { await login(email, password); }
    catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-navy-900">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-navy-800">Dhobi Clinic</div>
          <div className="text-sm text-slate-500">Admin Console</div>
        </div>
        <div className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Btn type="submit" disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign In'}</Btn>
        </div>
      </form>
    </div>
  );
}
