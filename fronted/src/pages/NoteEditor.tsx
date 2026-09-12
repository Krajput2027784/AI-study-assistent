import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '../api';
import { Note } from '../types';

export default function NoteEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [note, setNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      api<Note>(`/api/notes/${id}`)
        .then((n) => setNote({ title: n.title, content: n.content }))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load note.'));
    }
  }, [id]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (id === 'new') {
        await api('/api/notes', { method: 'POST', body: JSON.stringify(note) });
      } else {
        await api(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) });
      }
      nav('/notes');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAiEnhance = async () => {
    if (!note.content.trim()) {
      setError('Please write some note content first before asking AI to enhance it.');
      return;
    }
    setEnhancing(true);
    setError('');
    setSuccess('');
    try {
      const res = await api<{ enhanced_content: string; used_mock_ai: boolean }>(
        '/api/notes/ai-enhance',
        {
          method: 'POST',
          body: JSON.stringify({
            title: note.title.trim() || 'Study Notes',
            content: note.content,
          }),
        }
      );
      setNote((prev) => ({
        ...prev,
        content: res.enhanced_content,
      }));
      setSuccess('Notes structured and enhanced with AI!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI note enhancement failed.');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => nav('/notes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Notes
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAiEnhance}
            disabled={enhancing || busy || !note.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg disabled:opacity-50 transition-colors text-sm border border-purple-200"
          >
            <Sparkles size={16} />
            {enhancing ? 'Enhancing with Gemini...' : 'AI Enhance / Study Guide'}
          </button>

          <button
            form="note-form"
            disabled={busy || enhancing}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-60 transition-colors shadow-sm text-sm"
          >
            <Save size={18} />
            {busy ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-100">
          {success}
        </div>
      )}

      <form id="note-form" onSubmit={save} className="space-y-4">
        <input
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          placeholder="Note Title (e.g. Operating System Scheduling Algorithms)"
          className="w-full text-2xl font-bold p-4 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 bg-white"
          required
        />
        <textarea
          value={note.content}
          onChange={(e) => setNote({ ...note, content: e.target.value })}
          placeholder="Start typing your study notes, rough notes, or revision points... Click 'AI Enhance' to have Gemini turn them into a structured study guide."
          className="w-full h-[500px] p-4 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-600 font-mono text-sm leading-relaxed bg-white"
        />
      </form>
    </div>
  );
}
