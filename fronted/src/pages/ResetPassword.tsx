import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { api } from '../api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Both passwords must match.');
      return;
    }
    setBusy(true);
    try {
      await api<{ detail: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-4 text-blue-600"><BrainCircuit size={42} /></div>
        <h1 className="text-3xl font-bold mb-6 text-center">Set new password</h1>

        {done ? (
          <>
            <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800 text-sm">
              Your password has been changed. You can now log in with the new password.
            </div>
            <Link
              to="/login"
              className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Go to login
            </Link>
          </>
        ) : !token ? (
          <>
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              This reset link is incomplete. Please open the full link from your email, or request a new one.
            </div>
            <Link to="/forgot-password" className="text-blue-600">Request a new link</Link>
          </>
        ) : (
          <>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (8+ characters)"
                className="w-full p-3 border rounded-lg"
                minLength={8}
                maxLength={72}
                required
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-3 border rounded-lg"
                minLength={8}
                maxLength={72}
                required
              />
              <button
                disabled={busy}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Change password'}
              </button>
            </form>
            <p className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-blue-600">Link expired? Request a new one</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
