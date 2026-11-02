import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2"><BrainCircuit size={32}/> StudyHub</h1>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
          <Link to="/signup" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Signup</Link>
        </div>
      </nav>
      
      <header className="py-20 text-center">
        <h1 className="text-6xl font-extrabold mb-6">AI-Powered Learning</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Master your subjects with AI assistance, smart notes, and interactive quizzes.</p>
        <Link to="/signup" className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700">Get Started</Link>
      </header>
    </div>
  );
}

