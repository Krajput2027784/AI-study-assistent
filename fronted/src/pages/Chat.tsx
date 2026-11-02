import { FormEvent, useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../api';
import { Material } from '../types';

interface Msg {
  id: number;
  role: string;
  content: string;
}

interface Session {
  id: number;
  title: string;
}

export default function Chat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [usedMockAi, setUsedMockAi] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  const loadSessions = () =>
    api<Session[]>('/api/chat/sessions')
      .then(async (s) => {
        setSessions(s);
        if (s[0] && sessionId === null) {
          await loadSession(s[0].id);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions.'));

  const loadSession = async (id: number) => {
    try {
      const s = await api<{ id: number; messages: Msg[] }>(`/api/chat/sessions/${id}`);
      setSessionId(id);
      setMessages(s.messages);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session.');
    }
  };

  useEffect(() => {
    void loadSessions();
    api<Material[]>('/api/materials')
      .then(setMaterials)
      .catch(() => {});
  }, []);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || busy) return;
    const text = input;
    setBusy(true);
    setError('');

    try {
      let sid = sessionId;
      if (!sid) {
        const s = await api<Session>('/api/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: input.trim().slice(0, 60) || 'New chat' }),
        });
        sid = s.id;
        setSessionId(sid);
        setSessions((prev) => [s, ...prev]);
      }

      setInput('');

      const bodyPayload: { content: string; material_id?: number } = { content: text };
      if (selectedMaterialId) {
        bodyPayload.material_id = selectedMaterialId;
      }

      const r = await api<{ user_message: Msg; assistant_message: Msg; used_mock_ai: boolean }>(
        `/api/chat/sessions/${sid}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(bodyPayload),
        }
      );

      setMessages((m) => [...m, r.user_message, r.assistant_message]);
      setUsedMockAi(r.used_mock_ai);

      // Refresh sessions to sync updated title if it was a new chat
      api<Session[]>('/api/chat/sessions').then(setSessions).catch(() => {});
    } catch (e) {
      setInput(text); // give the user's text back so it isn't lost
      setError(e instanceof Error ? e.message : 'Message failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 h-[calc(100vh-3.5rem)] md:h-screen flex gap-3 sm:gap-4 min-w-0">
      {/* Sessions sidebar */}
      <aside className="w-64 bg-white border border-gray-200 rounded-xl p-4 hidden md:flex flex-col">
        <button
          onClick={() => {
            setSessionId(null);
            setMessages([]);
            setUsedMockAi(null);
          }}
          className="w-full mb-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>+ New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => void loadSession(s.id)}
              className={`w-full text-left p-3 rounded-lg text-sm truncate transition-colors ${
                sessionId === s.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {s.title}
            </button>
          ))}
          {!sessions.length && (
            <p className="text-xs text-gray-400 text-center py-4">No previous chats</p>
          )}
        </div>
      </aside>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with status and material context selector */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">AI Study Assistant</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Sparkles size={12} />
                {usedMockAi === false ? 'Gemini 3.6 Flash' : 'AI Powered'}
              </span>
            </div>
            <p className="text-xs text-gray-500">FastAPI & Google Gemini Integration</p>
          </div>

          {/* Context Material Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <BookOpen size={16} className="text-gray-400" />
            <span className="text-gray-600 font-medium">Context Material:</span>
            <select
              value={selectedMaterialId ?? ''}
              onChange={(e) => setSelectedMaterialId(e.target.value ? Number(e.target.value) : null)}
              className="p-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 max-w-[200px] truncate"
            >
              <option value="">None (General Q&A)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.material_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message history */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 min-w-0">
          {messages.length === 0 && (
            <div className="text-center mt-16 max-w-md mx-auto text-gray-500">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Bot size={28} />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                How can I help your studies today?
              </h3>
              <p className="text-xs text-gray-500">
                Ask questions on complex academic concepts, request study summaries, or attach an
                uploaded material for targeted explanations.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="p-2 rounded-full bg-gray-100 h-9 w-9 flex items-center justify-center shrink-0">
                {msg.role === 'assistant' ? (
                  <Bot size={20} className="text-blue-600" />
                ) : (
                  <User size={20} className="text-gray-600" />
                )}
              </div>
              <div
                className={`p-3 sm:p-4 rounded-xl max-w-[88%] sm:max-w-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm break-words ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex gap-3">
              <div className="p-2 rounded-full bg-gray-100 h-9 w-9 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-blue-600" />
              </div>
              <div className="p-4 rounded-xl bg-gray-100 text-gray-500 text-sm italic rounded-tl-none flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Generating study response with Gemini...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {usedMockAi === true && (
          <div className="px-4 py-2 bg-amber-50 text-amber-800 text-xs border-t border-amber-100">
            Gemini did not respond, so the last reply is a fallback. Check GEMINI_API_KEY and the
            backend logs.
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100">
            {error}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={send} className="p-4 border-t border-gray-200 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600 disabled:bg-gray-50"
            placeholder="Ask a question or request a study summary..."
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
