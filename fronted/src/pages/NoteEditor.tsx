import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { Note } from '../types';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note>({ id: '', title: '', content: '', updatedAt: '' });

  useEffect(() => {
    if (id !== 'new') {
      const savedNotes = JSON.parse(localStorage.getItem('study-notes') || '[]');
      const foundNote = savedNotes.find((n: Note) => n.id === id);
      if (foundNote) setNote(foundNote);
    }
  }, [id]);

  const saveNote = () => {
    const savedNotes = JSON.parse(localStorage.getItem('study-notes') || '[]');
    let updatedNotes;
    if (id === 'new') {
      const newNote = { ...note, id: Date.now().toString(), updatedAt: new Date().toISOString().split('T')[0] };
      updatedNotes = [...savedNotes, newNote];
    } else {
      updatedNotes = savedNotes.map((n: Note) => n.id === id ? { ...note, updatedAt: new Date().toISOString().split('T')[0] } : n);
    }
    localStorage.setItem('study-notes', JSON.stringify(updatedNotes));
    navigate('/notes');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/notes')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Back to Notes
        </button>
        <button onClick={saveNote} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save size={20} /> Save Note
        </button>
      </div>

      <input 
        type="text" 
        value={note.title} 
        onChange={e => setNote({...note, title: e.target.value})} 
        placeholder="Note Title" 
        className="w-full text-3xl font-bold mb-6 p-4 rounded-lg border border-gray-200"
      />
      <textarea 
        value={note.content} 
        onChange={e => setNote({...note, content: e.target.value})} 
        placeholder="Start writing your note..." 
        className="w-full h-96 p-4 rounded-lg border border-gray-200"
      />
    </div>
  );
}
