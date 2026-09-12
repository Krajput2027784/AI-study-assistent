import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Trash2, Edit3 } from 'lucide-react';
import { api } from '../api';
import { Note } from '../types';

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api<Note[]>(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(setNotes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load notes.'));

  useEffect(() => {
    void load();
  }, [q]);

  const del = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api<void>(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((n) => n.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Study Notes</h1>
        <Link
          to="/notes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={18} />
          Create Note
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes by title or content..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 text-sm bg-white shadow-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <FileText size={20} />
                <h3 className="font-semibold text-gray-900 truncate">{note.title}</h3>
              </div>
              <p className="text-gray-600 text-xs mb-4 line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap">
                {note.content || 'Empty note'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
              <span className="text-[11px] text-gray-400">
                Updated {new Date(note.updated_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-3">
                <Link
                  to={`/notes/${note.id}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit3 size={14} /> Edit
                </Link>
                <button
                  onClick={() => void del(note.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!notes.length && (
          <p className="col-span-full text-center py-12 text-gray-500 text-sm">
            No notes found. Click "Create Note" to start writing!
          </p>
        )}
      </div>
    </div>
  );
}
