import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-lg" required />
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" required />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" required />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Sign Up</button>
        </form>
        <p className="mt-4 text-center">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  );
}

