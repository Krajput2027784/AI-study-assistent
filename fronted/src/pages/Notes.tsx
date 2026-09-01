import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import { Note } from '../types';

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('study-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes([
        { id: '1', title: 'Introduction to Psychology', content: 'Psychology is the study of mind and behavior...', updatedAt: '2026-08-30' },
        { id: '2', title: 'Advanced Calculus', content: 'Limits, derivatives, integrals...', updatedAt: '2026-08-29' },
      ]);
    }
  }, []);

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('study-notes', JSON.stringify(updatedNotes));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        <Link to="/notes/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Create Note
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input type="text" placeholder="Search notes..." className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <FileText size={20} />
                <h3 className="font-semibold">{note.title}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.content}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-400">{note.updatedAt}</span>
              <div className="flex gap-2">
                <Link to={`/notes/${note.id}`} className="text-gray-600 hover:text-blue-600">Edit</Link>
                <button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
