import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Megaphone, Send, Paperclip, FileText, User, Sparkles, Plus } from 'lucide-react';

export default function CollaborationPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // New Announcement modal state
  const [showAncModal, setShowAncModal] = useState(false);
  const [ancForm, setAncForm] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ancRes, msgRes] = await Promise.all([
        api.get('/collaboration/announcements'),
        api.get('/collaboration/messages')
      ]);
      setAnnouncements(ancRes.data || []);
      setMessages(msgRes.data || []);
    } catch (err) {
      console.error('Failed to fetch collaboration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post('/collaboration/messages', {
        taskId: 'general',
        content: newMessage
      });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/collaboration/announcements', ancForm);
      setShowAncModal(false);
      setAncForm({ title: '', content: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  const canPostAnnouncement = user && ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            Collaboration Workspace & Team Chat
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time organization noticeboard, team messaging, and shared document exchange.
          </p>
        </div>

        {canPostAnnouncement && (
          <button
            onClick={() => setShowAncModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Post Noticeboard Announcement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Announcements (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Company Noticeboard
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No announcements published yet.</p>
            ) : (
              announcements.map(anc => (
                <div key={anc.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300">{anc.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{anc.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>By {anc.authorName}</span>
                    <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Team Messaging & Files (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between h-[580px]">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              General Organization Chat
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Channel
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 my-2">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No messages sent in this channel yet.</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start space-x-3 text-xs">
                  <img
                    src={msg.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 max-w-lg space-y-1">
                    <div className="flex items-center justify-between gap-4 text-[10px]">
                      <span className="font-bold text-indigo-300">{msg.senderName}</span>
                      <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-slate-800">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a team message or updates..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>

      {/* New Announcement Modal */}
      {showAncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Post Noticeboard Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={ancForm.title}
                  onChange={e => setAncForm({ ...ancForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Q3 Roadmap Release..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={ancForm.content}
                  onChange={e => setAncForm({ ...ancForm, content: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Write noticeboard announcement details..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAncModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
