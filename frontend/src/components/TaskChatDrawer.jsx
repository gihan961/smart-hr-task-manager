import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Send, X, User } from 'lucide-react';

export default function TaskChatDrawer({ task, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) fetchMessages();
  }, [task]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/collaboration/messages/${task.id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/collaboration/messages', {
        taskId: task.id,
        content: text
      });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 glass-panel border-l border-slate-800 shadow-2xl flex flex-col justify-between p-4 animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-bold text-white truncate max-w-[200px]">{task.title}</h3>
            <p className="text-[10px] text-slate-400">Task Collaboration Thread</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">{m.senderName}</span>
                <span className="text-[10px] text-slate-500">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300">{m.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex items-center space-x-2 border-t border-slate-800 pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type task comment..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
