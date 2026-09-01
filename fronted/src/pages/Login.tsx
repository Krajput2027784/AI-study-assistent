import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" required />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Login</button>
        </form>
        <p className="mt-4 text-center">Don't have an account? <Link to="/signup" className="text-blue-600">Sign up</Link></p>
      </div>
    </div>
  );
}

