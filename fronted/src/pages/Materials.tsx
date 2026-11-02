import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { Material } from '../types';

export default function Materials() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const load = () =>
    api<Material[]>('/api/materials')
      .then(setMaterials)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load materials.'));

  useEffect(() => {
    void load();
  }, []);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('title', title.trim() || file.name.replace(/\.[^.]+$/, ''));
    fd.append('file', file);
    try {
      const item = await api<Material>('/api/materials/upload', {
        method: 'POST',
        body: fd,
      });
      setMaterials((m) => [item, ...m]);
      setFile(null);
      setTitle('');
      if (input.current) input.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    try {
      await api(`/api/materials/${id}`, { method: 'DELETE' });
      setMaterials((m) => m.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const size = (n: number) => (n / 1024 / 1024).toFixed(2) + ' MB';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Study Materials</h1>
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-8 bg-white hover:bg-gray-50/50 transition-colors shadow-sm">
        <div className="text-center max-w-lg mx-auto">
          <Upload className="mx-auto mb-3 text-blue-600" size={44} />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Upload a Study Document</h2>
          <p className="text-xs text-gray-500 mb-4">
            Upload PDFs, Markdown, or text files to review and analyze with AI.
          </p>

          <input
            ref={input}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mx-auto block text-xs text-gray-600 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx"
          />

          {file && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title (defaults to filename)"
                className="p-2.5 border border-gray-300 rounded-lg text-xs w-full sm:w-72 focus:outline-none focus:border-blue-600 bg-white"
              />
              <button
                onClick={upload}
                disabled={busy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors shadow-sm whitespace-nowrap"
              >
                {busy ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Materials grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate" title={mat.title}>
                    {mat.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {mat.material_type.toUpperCase()} • {size(mat.file_size)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <Link
                to={`/materials/${mat.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
              >
                Open & Ask AI <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => void del(mat.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md"
                title="Delete material"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!materials.length && (
          <p className="col-span-full text-center py-12 text-gray-500 text-sm">
            No study materials uploaded yet. Upload your first document above!
          </p>
        )}
      </div>
    </div>
  );
}
