import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { useAuth } from '../auth';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [fullName,setFullName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const handleSignup = async (e: FormEvent) => { e.preventDefault(); setError(''); setBusy(true); try { await signup(fullName,email,password); navigate('/dashboard',{replace:true}); } catch(err){setError(err instanceof Error?err.message:'Signup failed.');} finally{setBusy(false);} };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6"><div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl w-full max-w-md">
    <div className="flex justify-center mb-4 text-blue-600"><BrainCircuit size={42}/></div><h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
    {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
    <form onSubmit={handleSignup} className="space-y-4"><input value={fullName} onChange={e=>setFullName(e.target.value)} type="text" placeholder="Full Name" className="w-full p-3 border rounded-lg" required /><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-3 border rounded-lg" required /><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (8+ characters)" className="w-full p-3 border rounded-lg" minLength={8} required /><button disabled={busy} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">{busy?'Creating account…':'Sign Up'}</button></form>
    <p className="mt-4 text-center">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
  </div></div>;
}
