import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { api } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api<{ detail: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-4 text-blue-600"><BrainCircuit size={42} /></div>
        <h1 className="text-3xl font-bold mb-2 text-center">Forgot password?</h1>
        <p className="text-gray-600 text-center mb-6">
          Enter your account email and we will send you a link to set a new password.
        </p>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        {sent ? (
          <div className="p-4 rounded-lg bg-green-50 text-green-800 text-sm">
            If an account exists for <b>{email.trim()}</b>, a reset link has been sent. Check your inbox
            (and the Spam folder). The link works for 30 minutes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded-lg"
              required
            />
            <button
              disabled={busy}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
