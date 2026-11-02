import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { useAuth } from '../auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setBusy(false); }
  };

  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6"><div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md">
    <div className="flex justify-center mb-4 text-blue-600"><BrainCircuit size={42}/></div>
    <h1 className="text-3xl font-bold mb-6 text-center">Welcome back</h1>
    {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
    <form onSubmit={handleLogin} className="space-y-4">
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-lg" required />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded-lg" required />
      <div className="text-right -mt-2"><Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link></div>
      <button disabled={busy} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">{busy ? 'Logging in…' : 'Login'}</button>
    </form>
    <p className="mt-4 text-center">Don't have an account? <Link to="/signup" className="text-blue-600">Sign up</Link></p>
  </div></div>;
}
