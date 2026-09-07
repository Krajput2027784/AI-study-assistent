import { useEffect, useRef, useState } from 'react';
import { api, apiBlob } from '../api';
import { MediaResource } from '../types';
import { Headphones, Trash2, Video } from 'lucide-react';

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
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});
  const objectUrlsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);

  const load = () => api<MediaResource[]>(`/api/media${kind === 'all' ? '' : `?kind=${kind}`}`)
    .then(setItems)
    .catch(e => setError(e instanceof Error ? e.message : 'Could not load media.'));

  useEffect(() => { void load(); }, [kind]);

  useEffect(() => {
    return () => {
      Object.values(objectUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  const add = async () => {
    if (!title.trim() || (!file && !url.trim())) {
      setError('Enter a title and provide a file or URL.');
      return;
    }
    setBusy(true); setError('');
    const fd = new FormData();
    fd.append('title', title.trim()); fd.append('kind', newKind);
    if (url.trim()) fd.append('source_url', url.trim());
    if (file) fd.append('file', file);
    try {
      await api('/api/media', { method: 'POST', body: fd });
      setTitle(''); setUrl(''); setFile(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/media/${id}`, { method: 'DELETE' });
      setObjectUrls(current => {
        const url = current[id];
        if (url) URL.revokeObjectURL(url);
        const next = { ...current }; delete next[id]; return next;
      });
      setItems(x => x.filter(i => i.id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  const localSrc = async (item: MediaResource) => {
    if (item.source_url) return item.source_url;
    if (objectUrlsRef.current[item.id]) return objectUrlsRef.current[item.id];
    try {
      const blob = await apiBlob(`/api/media/${item.id}/file`);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlsRef.current = { ...objectUrlsRef.current, [item.id]: objectUrl };
      setObjectUrls(objectUrlsRef.current);
      return objectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Media load failed.');
      return '';
    }
  };

  const loadAndPlay = async (
    item: MediaResource,
    element: HTMLVideoElement | HTMLAudioElement,
  ) => {
    const src = await localSrc(item);
    if (src) {
      element.src = src;
      try {
        await element.play();
      } catch {
        // Browser autoplay policies may still require another user gesture.
      }
    }
  };

  return <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Videos & Audio</h1>
    {error && <p className="mb-4 text-red-600">{error}</p>}
    <div className="bg-white border rounded-xl p-6 mb-8">
      <h2 className="font-semibold mb-4">Add a resource</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="p-3 border rounded-lg" />
        <select value={newKind} onChange={e => setNewKind(e.target.value as 'video' | 'audio')} className="p-3 border rounded-lg">
          <option value="video">Video</option><option value="audio">Audio</option>
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube/other direct URL (or choose file below)" className="p-3 border rounded-lg md:col-span-2" />
        <input type="file" accept={newKind === 'video' ? 'video/*' : 'audio/*'} onChange={e => setFile(e.target.files?.[0] || null)} className="p-3 border rounded-lg md:col-span-2" />
      </div>
      <button onClick={add} disabled={busy} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60">{busy ? 'Adding…' : 'Add Resource'}</button>
    </div>
    <div className="flex gap-2 mb-5">
      {(['all', 'video', 'audio'] as const).map(value => <button key={value} onClick={() => setKind(value)} className={`px-4 py-2 rounded-lg ${kind === value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{value === 'all' ? 'All' : value === 'video' ? 'Videos' : 'Audio'}</button>)}
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      {items.map(item => {
        const embed = item.kind === 'video' ? getYouTubeEmbedUrl(item.source_url) : null;
        return <div key={item.id} className="bg-white border rounded-xl p-5">
          <div className="flex justify-between mb-3"><div className="flex items-center gap-3"><div>{item.kind === 'video' ? <Video className="text-blue-600" /> : <Headphones className="text-purple-600" />}</div><div><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-gray-500">{item.kind}</p></div></div><button onClick={() => void remove(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button></div>
          {embed ? <div className="aspect-video"><iframe className="w-full h-full rounded-lg" src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
            : item.kind === 'video' ? <video controls className="w-full rounded-lg bg-black" src={objectUrls[item.id] || undefined} onClick={e => { if (!objectUrlsRef.current[item.id] && !item.source_url) void loadAndPlay(item, e.currentTarget); }} />
            : <audio controls className="w-full" src={objectUrls[item.id] || undefined} onClick={e => { if (!objectUrlsRef.current[item.id] && !item.source_url) void loadAndPlay(item, e.currentTarget); }} />}
          {item.source_url && !embed && <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600">Open external media</a>}
          {!item.source_url && !objectUrls[item.id] && <button onClick={() => void localSrc(item)} className="mt-2 text-sm text-blue-600">Load uploaded file</button>}
        </div>;
      })}
    </div>
    {!items.length && <p className="text-gray-500">No media resources yet.</p>}
  </div>;
}
