import { useState } from 'react';
import { Send, Paperclip, Bot, User } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! I am your AI Study Assistant. How can I help you with your studies today?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { id: Date.now(), sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'That is an interesting question! Let me look into that for you. Based on typical study materials, here is a summary...' }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">AI Study Assistant</h2>
      </div>
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-full ${msg.sender === 'bot' ? 'bg-blue-100' : 'bg-gray-200'}`}>
              {msg.sender === 'bot' ? <Bot size={20} className="text-blue-600" /> : <User size={20} className="text-gray-600" />}
            </div>
            <div className={`p-4 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={24} /></button>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-3 rounded-lg border border-gray-200" 
          placeholder="Ask a question..."
        />
        <button onClick={sendMessage} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
