import { useEffect, useState } from 'react';
import { api, getToken, API_BASE_URL } from '../api';
import { MediaResource } from '../types';
import { Headphones, Trash2, Video, Plus, ExternalLink } from 'lucide-react';

function getYouTubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) return `https://www.youtube.com/embed/${encodeURIComponent(parts[1])}`;
      if (parts[0] === 'embed' && parts[1]) return `https://www.youtube.com/embed/${encodeURIComponent(parts[1])}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function Media() {
  const [items, setItems] = useState<MediaResource[]>([]);
  const [kind, setKind] = useState<'all' | 'video' | 'audio'>('all');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [newKind, setNewKind] = useState<'video' | 'audio'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<MediaResource[]>(`/api/media${kind === 'all' ? '' : `?kind=${kind}`}`)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load media.'));

  useEffect(() => {
    void load();
  }, [kind]);

  const add = async () => {
    if (!title.trim() || (!file && !url.trim())) {
      setError('Enter a title and provide either an uploaded file or a URL.');
      return;
    }
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('kind', newKind);
    if (url.trim()) fd.append('source_url', url.trim());
    if (file) fd.append('file', file);
    try {
      await api('/api/media', { method: 'POST', body: fd });
      setTitle('');
      setUrl('');
      setFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media resource?')) return;
    try {
      await api(`/api/media/${id}`, { method: 'DELETE' });
      setItems((x) => x.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const token = getToken();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Study Videos & Audio</h1>
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Add Media Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> Add Learning Media
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. MIT OpenCourseWare Lecture 1)"
            className="p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as 'video' | 'audio')}
            className="p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-600 bg-white"
          >
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube link or direct stream URL (optional if uploading file)"
            className="p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-600 md:col-span-2"
          />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Or upload a local file:
            </label>
            <input
              type="file"
              accept={newKind === 'video' ? 'video/*' : 'audio/*'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>
        <button
          onClick={add}
          disabled={busy}
          className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
        >
          {busy ? 'Adding...' : 'Add Resource'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'video', 'audio'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setKind(value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
              kind === value ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {value === 'all' ? 'All Media' : value === 'video' ? 'Videos' : 'Audio'}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item) => {
          const embed = item.kind === 'video' ? getYouTubeEmbedUrl(item.source_url) : null;
          const streamUrl = item.source_url || `${API_BASE_URL}/api/media/${item.id}/file?token=${token || ''}`;

          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {item.kind === 'video' ? (
                        <Video className="text-blue-600" size={20} />
                      ) : (
                        <Headphones className="text-purple-600" size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-[11px] text-gray-400 capitalize">{item.kind}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void remove(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete media"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-2">
                  {embed ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        className="w-full h-full"
                        src={embed}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : item.kind === 'video' ? (
                    <video controls className="w-full rounded-xl bg-black aspect-video" src={streamUrl} preload="metadata" />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <audio controls className="w-full" src={streamUrl} preload="metadata" />
                    </div>
                  )}
                </div>
              </div>

              {item.source_url && !embed && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    Open external media <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!items.length && (
        <p className="text-gray-500 text-center py-12 text-sm">
          No media resources added yet. Add a YouTube link or audio lecture above!
        </p>
      )}
    </div>
  );
}
