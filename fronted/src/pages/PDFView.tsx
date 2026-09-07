import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Download } from 'lucide-react';
import { api, apiBlob } from '../api';
import { Material } from '../types';

const VIEWABLE_TYPES = new Set(['pdf', 'txt', 'md']);

export default function PDFView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [url, setUrl] = useState('');
  const urlRef = useRef('');
  const [q, setQ] = useState('');
  const [reply, setReply] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    setMaterial(null); setUrl(''); setError(''); setReply(''); setSessionId(null);

    api<Material>(`/api/materials/${id}`)
      .then(m => { if (active) setMaterial(m); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Material load failed.'); });

    apiBlob(`/api/materials/${id}/download`)
      .then(blob => {
        const next = URL.createObjectURL(blob);
        if (!active) { URL.revokeObjectURL(next); return; }
        urlRef.current = next;
        setUrl(next);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Document load failed.'); });

    return () => {
      active = false;
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ''; }
    };
  }, [id]);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !id) return;
    setBusy(true); setError('');
    try {
      let sid = sessionId;
      if (!sid) {
        const s = await api<{ id: number }>('/api/chat/sessions', {
          method: 'POST', body: JSON.stringify({ title: `Material: ${material?.title || 'Study material'}` }),
        });
        sid = s.id; setSessionId(sid);
      }
      const r = await api<{ assistant_message: { content: string } }>(`/api/chat/sessions/${sid}/messages`, {
        method: 'POST', body: JSON.stringify({ content: q, material_id: Number(id) }),
      });
      setReply(r.assistant_message.content); setQ('');
    } catch (e) { setError(e instanceof Error ? e.message : 'AI request failed.'); }
    finally { setBusy(false); }
  };

  const canAsk = !!material && VIEWABLE_TYPES.has(material.material_type.toLowerCase());
  const isPdf = material?.material_type.toLowerCase() === 'pdf';

  return <div className="p-6">
    <button onClick={() => nav('/materials')} className="flex items-center gap-2 mb-4 text-gray-600"><ArrowLeft size={20} />Back to Materials</button>
    {error && <p className="text-red-600 mb-4">{error}</p>}
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white rounded-xl border overflow-hidden min-h-[70vh]">
        <div className="p-4 border-b font-semibold flex justify-between items-center gap-3">
          <span>{material?.title || 'Study Material'}</span>
          {url && <a href={url} download={material?.file_name || 'study-material'} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"><Download size={16} />Download</a>}
        </div>
        {url && material && isPdf ? <iframe src={url} title="PDF viewer" className="w-full h-[70vh]" />
          : url && material && VIEWABLE_TYPES.has(material.material_type.toLowerCase()) ? <iframe src={url} title="Study material viewer" className="w-full h-[70vh] bg-gray-50" />
          : url && material ? <div className="h-[70vh] grid place-items-center p-8 text-center text-gray-600"><div><p className="mb-3">This {material.material_type.toUpperCase()} file cannot be previewed in the browser.</p><a href={url} download={material.file_name} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Download size={18} />Download file</a></div></div>
          : <div className="grid place-items-center h-[70vh] text-gray-500">Loading document…</div>}
      </div>
      <div className="lg:w-96 bg-white border rounded-xl p-5 flex flex-col min-h-[70vh]">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bot />Ask AI about this material</h2>
        {!canAsk && material && <p className="text-sm text-gray-500 mb-4">AI text extraction is currently available for PDF, TXT and Markdown files.</p>}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg overflow-y-auto"><p className="text-sm text-gray-700 whitespace-pre-wrap">{reply || 'Ask a question about the uploaded material.'}</p></div>
        <form onSubmit={ask} className="mt-4 flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} disabled={!canAsk} className="flex-1 p-3 border rounded-lg disabled:bg-gray-100" placeholder={canAsk ? 'Ask a question…' : 'AI unavailable for this file type'} /><button disabled={busy || !canAsk} className="px-4 bg-blue-600 text-white rounded-lg disabled:opacity-60">{busy ? '…' : 'Ask'}</button></form>
      </div>
    </div>
  </div>;
}
