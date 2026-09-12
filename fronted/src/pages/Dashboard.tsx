import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BrainCircuit,
  BookOpen,
  MessageSquareText,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Note, Material, QuizSummary } from '../types';

interface DashboardData {
  user: { full_name: string; email: string };
  stats: {
    total_notes: number;
    total_materials: number;
    total_quizzes: number;
    quizzes_attempted: number;
    average_quiz_score: number | null;
    total_chat_sessions: number;
    total_media: number;
  };
  recent_notes: Note[];
  recent_quizzes: QuizSummary[];
  recent_materials: Material[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<DashboardData>('/api/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard.'));
  }, []);

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 max-w-6xl mx-auto py-24">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Loading your personalized study dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Study Notes', value: data.stats.total_notes, icon: FileText, color: 'text-blue-600' },
    { label: 'Study Materials', value: data.stats.total_materials, icon: BookOpen, color: 'text-emerald-600' },
    { label: 'Quizzes Taken', value: data.stats.quizzes_attempted, icon: BrainCircuit, color: 'text-purple-600' },
    {
      label: 'Avg Quiz Score',
      value: data.stats.average_quiz_score == null ? '—' : `${data.stats.average_quiz_score}%`,
      icon: TrendingUp,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back, {user?.full_name || 'Student'}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is an overview of your AI study assistant progress and materials.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  {s.label}
                </p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <Icon size={22} className={s.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Notes & Materials */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Notes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Recent Notes
              </h2>
              <Link
                to="/notes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.recent_notes.length ? (
                data.recent_notes.map((n) => (
                  <div
                    key={n.id}
                    className="flex justify-between items-center p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <span className="font-medium text-sm text-gray-800 truncate pr-4">{n.title}</span>
                    <Link
                      to={`/notes/${n.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      Open
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">No notes created yet.</p>
              )}
            </div>
          </div>

          {/* Recent Study Materials */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600" /> Uploaded Materials
              </h2>
              <Link
                to="/materials"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.recent_materials.length ? (
                data.recent_materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-medium text-sm text-gray-800 truncate">{m.title}</p>
                      <p className="text-[11px] text-gray-400 uppercase">{m.material_type}</p>
                    </div>
                    <Link
                      to={`/materials/${m.id}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 shrink-0"
                    >
                      Study with AI
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">No study materials uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Quizzes */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" /> Quick Actions
            </h2>
            <div className="grid gap-2.5">
              <Link
                to="/notes/new"
                className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 font-medium text-xs flex items-center gap-2.5 transition-colors"
              >
                <FileText size={16} /> Create New Note
              </Link>
              <Link
                to="/quiz"
                className="p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 text-purple-800 font-medium text-xs flex items-center gap-2.5 transition-colors"
              >
                <BrainCircuit size={16} /> Generate AI Quiz
              </Link>
              <Link
                to="/materials"
                className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 font-medium text-xs flex items-center gap-2.5 transition-colors"
              >
                <BookOpen size={16} /> Upload Study Material
              </Link>
              <Link
                to="/chat"
                className="p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-800 font-medium text-xs flex items-center gap-2.5 transition-colors"
              >
                <MessageSquareText size={16} /> Ask AI Assistant (Gemini)
              </Link>
            </div>
          </div>

          {/* Recent Quizzes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BrainCircuit size={18} className="text-purple-600" /> Quizzes
              </h2>
              <Link
                to="/quiz"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Take <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.recent_quizzes.length ? (
                data.recent_quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-gray-800 truncate pr-3">
                      {q.title}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-600 shrink-0">
                      {q.question_count} Qs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-3 text-center">No quizzes generated yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
