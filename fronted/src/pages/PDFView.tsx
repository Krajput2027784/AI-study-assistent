import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Download, User, Sparkles } from 'lucide-react';
import { api, apiBlob } from '../api';
import { Material } from '../types';

const VIEWABLE_TYPES = new Set(['pdf', 'txt', 'md']);

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
}

export default function PDFView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [url, setUrl] = useState('');
  const urlRef = useRef('');
  const [q, setQ] = useState('');
  const [conversation, setConversation] = useState<ChatEntry[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, busy]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setMaterial(null);
    setUrl('');
    setError('');
    setConversation([]);
    setSessionId(null);

    api<Material>(`/api/materials/${id}`)
      .then((m) => {
        if (active) setMaterial(m);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Material load failed.');
      });

    apiBlob(`/api/materials/${id}/download`)
      .then((blob) => {
        const next = URL.createObjectURL(blob);
        if (!active) {
          URL.revokeObjectURL(next);
          return;
        }
        urlRef.current = next;
        setUrl(next);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Document load failed.');
      });

    return () => {
      active = false;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = '';
      }
    };
  }, [id]);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !id || busy) return;
    const userText = q.trim();
    setBusy(true);
    setError('');
    setQ('');

    setConversation((prev) => [...prev, { role: 'user', content: userText }]);

    try {
      let sid = sessionId;
      if (!sid) {
        const s = await api<{ id: number }>('/api/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: `Material: ${material?.title || 'Study material'}` }),
        });
        sid = s.id;
        setSessionId(sid);
      }
      const r = await api<{ assistant_message: { content: string } }>(
        `/api/chat/sessions/${sid}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: userText, material_id: Number(id) }),
        }
      );
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: r.assistant_message.content },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed.');
    } finally {
      setBusy(false);
    }
  };

  const canAsk = !!material && VIEWABLE_TYPES.has(material.material_type.toLowerCase());
  const isPdf = material?.material_type.toLowerCase() === 'pdf';

  return (
    <div className="p-6">
      <button
        onClick={() => nav('/materials')}
        className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors text-sm"
      >
        <ArrowLeft size={18} />
        Back to Materials
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Document Viewer Frame */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[70vh] flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-200 font-semibold flex justify-between items-center gap-3 bg-gray-50/50">
            <span className="truncate text-gray-900">{material?.title || 'Study Material'}</span>
            {url && (
              <a
                href={url}
                download={material?.file_name || 'study-material'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium shadow-sm transition-colors shrink-0"
              >
                <Download size={14} />
                Download
              </a>
            )}
          </div>

          <div className="flex-1 min-h-[65vh]">
            {url && material && isPdf ? (
              <iframe src={url} title="PDF viewer" className="w-full h-full min-h-[65vh]" />
            ) : url && material && VIEWABLE_TYPES.has(material.material_type.toLowerCase()) ? (
              <iframe
                src={url}
                title="Study material viewer"
                className="w-full h-full min-h-[65vh] bg-gray-50"
              />
            ) : url && material ? (
              <div className="min-h-[65vh] grid place-items-center p-8 text-center text-gray-600">
                <div>
                  <p className="mb-4 text-base font-medium">
                    This {material.material_type.toUpperCase()} document cannot be rendered
                    directly in the browser.
                  </p>
                  <a
                    href={url}
                    download={material.file_name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm"
                  >
                    <Download size={18} />
                    Download {material.file_name}
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid place-items-center min-h-[65vh] text-gray-500 text-sm">
                Loading study document...
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Side Panel */}
        <div className="lg:w-96 bg-white border border-gray-200 rounded-xl p-5 flex flex-col min-h-[70vh] shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bot className="text-blue-600" />
              Ask AI about this Material
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by Gemini with context extracted from this file.
            </p>
          </div>

          {!canAsk && material && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-4">
              AI text extraction is currently available for PDF, TXT, and Markdown documents.
            </p>
          )}

          {/* Conversation history */}
          <div className="flex-1 bg-gray-50 p-3.5 rounded-xl overflow-y-auto space-y-3 border border-gray-100 max-h-[480px]">
            {conversation.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-xs">
                <Sparkles size={24} className="mx-auto mb-2 text-blue-400" />
                Ask any question about this document. Gemini will read it and provide targeted
                answers.
              </div>
            )}

            {conversation.map((entry, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs leading-relaxed ${
                  entry.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="p-1 rounded-full bg-white border border-gray-200 h-6 w-6 flex items-center justify-center shrink-0">
                  {entry.role === 'assistant' ? (
                    <Bot size={14} className="text-blue-600" />
                  ) : (
                    <User size={14} className="text-gray-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${
                    entry.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-2xs'
                  }`}
                >
                  {entry.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex gap-2 text-xs">
                <div className="p-1 rounded-full bg-white border border-gray-200 h-6 w-6 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-400 italic">
                  Analyzing document...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Ask Form */}
          <form onSubmit={ask} className="mt-4 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={!canAsk || busy}
              className="flex-1 p-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-600 disabled:bg-gray-100"
              placeholder={canAsk ? 'Ask a question about this file...' : 'AI unavailable for format'}
            />
            <button
              type="submit"
              disabled={busy || !canAsk || !q.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {busy ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
