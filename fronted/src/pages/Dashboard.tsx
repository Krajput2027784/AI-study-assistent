import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Note, Material, QuizSummary } from '../types';

interface DashboardData { user: { full_name: string; email: string }; stats: { total_notes:number; total_materials:number; total_quizzes:number; quizzes_attempted:number; average_quiz_score:number|null; total_chat_sessions:number; total_media:number }; recent_notes: Note[]; recent_quizzes: QuizSummary[]; recent_materials: Material[]; }

export default function Dashboard() {
  const { user } = useAuth(); const [data,setData]=useState<DashboardData|null>(null); const [error,setError]=useState('');
  useEffect(()=>{api<DashboardData>('/api/dashboard').then(setData).catch(e=>setError(e.message));},[]);
  if(error) return <div className="p-8 text-red-600">{error}</div>;
  if(!data) return <div className="p-8 text-gray-500">Loading dashboard…</div>;
  const stats=[['Notes',data.stats.total_notes],['Materials',data.stats.total_materials],['Quizzes Taken',data.stats.quizzes_attempted],['Avg Quiz',data.stats.average_quiz_score==null?'—':`${data.stats.average_quiz_score}%`]];
  return <div className="p-8"><h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome back, {user?.full_name}!</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{stats.map(([label,value])=><div key={label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-sm text-gray-500 mb-1">{label}</p><p className="text-2xl font-bold text-blue-600">{value}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-semibold mb-4">Recent Notes</h2>{data.recent_notes.length?data.recent_notes.map(n=><div key={n.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-3"><span className="font-medium">{n.title}</span><Link to={`/notes/${n.id}`} className="text-blue-600">Open</Link></div>):<p className="text-gray-500">No notes yet.</p>}</div>
    <div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-semibold mb-4">Quick Actions</h2><div className="grid gap-3"><Link to="/notes/new" className="p-3 rounded-lg bg-blue-50 text-blue-700 font-medium">Create New Note</Link><Link to="/quiz" className="p-3 rounded-lg bg-purple-50 text-purple-700 font-medium">Generate New Quiz</Link><Link to="/materials" className="p-3 rounded-lg bg-gray-50 text-gray-700 font-medium">Upload Material</Link><Link to="/chat" className="p-3 rounded-lg bg-green-50 text-green-700 font-medium">Ask AI Assistant</Link></div></div></div>
  </div>;
}
