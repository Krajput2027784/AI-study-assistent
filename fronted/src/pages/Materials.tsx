import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Bot, BookOpen } from 'lucide-react';

export default function Materials() {
  const [materials] = useState([
    { id: '1', title: 'Biology Chapter 4 Metabolism', type: 'PDF', size: '5MB' },
    { id: '2', title: 'CS101 Intro Lecture', type: 'PDF', size: '2MB' },
  ]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8 bg-gray-50">
        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-lg font-medium">Drag and drop your PDFs here</p>
        <p className="text-gray-500">Supported: PDF up to 50MB</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(mat => (
          <div key={mat.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="text-red-500" size={32} />
              <div>
                <h3 className="font-semibold">{mat.title}</h3>
                <p className="text-sm text-gray-500">{mat.type} • {mat.size}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/materials/${mat.id}`} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Open</Link>
              <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                <Bot size={14} /> Ask AI
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

