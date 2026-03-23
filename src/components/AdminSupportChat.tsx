import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronLeft } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';

interface Conversation {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  status: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

interface Message {
  id: number;
  sender_role: 'admin' | 'user';
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminSupportChat() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    loadMessages(selectedConv.id);
    const interval = setInterval(() => loadMessages(selectedConv.id), 5000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConv) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selectedConv?.id]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/api/support-chat/admin/conversations');
      const data = res.data?.data || [];
      setConversations(data);
      setTotalUnread(data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0));
    } catch { /* silent */ }
  };

  const loadMessages = async (convId: number) => {
    try {
      const res = await api.get(`/api/support-chat/admin/conversations/${convId}`);
      setMessages(res.data?.data?.messages || []);
    } catch { /* silent */ }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedConv) return;
    setSending(true);
    try {
      await api.post(`/api/support-chat/admin/conversations/${selectedConv.id}/send`, { content: input.trim() });
      setInput('');
      await loadMessages(selectedConv.id);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const cardStyle = {
    background: isDark ? '#1a1a1a' : '#fff',
    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
    borderRadius: 14, overflow: 'hidden' as const,
  };

  return (
    <div style={{ ...cardStyle, display: 'flex', height: 500 }}>
      {/* Conversations list */}
      <div style={{
        width: selectedConv ? 0 : '100%',
        minWidth: selectedConv ? 0 : undefined,
        maxWidth: selectedConv ? 0 : undefined,
        overflow: 'hidden',
        borderRight: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.2s',
        ...(selectedConv ? {} : { width: '100%' }),
      }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} color="#667eea" />
          <span style={{ fontWeight: 600, fontSize: 15, color: isDark ? '#eee' : '#333' }}>
            Chat de Suporte
          </span>
          {totalUnread > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
              {totalUnread}
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: 14 }}>
              Nenhuma conversa ainda
            </div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${isDark ? '#262626' : '#f3f4f6'}`,
                background: conv.unread_count > 0 ? (isDark ? '#1e1e3a' : '#f0f0ff') : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!conv.unread_count) (e.currentTarget.style.background = isDark ? '#222' : '#fafafa'); }}
              onMouseLeave={e => { if (!conv.unread_count) (e.currentTarget.style.background = 'transparent'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: isDark ? '#eee' : '#333' }}>{conv.user_name}</span>
                {conv.unread_count > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{conv.user_email}</div>
              {conv.last_message && (
                <div style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message.substring(0, 60)}
                </div>
              )}
              {conv.last_message_at && (
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{formatTime(conv.last_message_at)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area (shown only when conversation selected on mobile, always on desktop) */}
      {selectedConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <button onClick={() => setSelectedConv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={20} color={isDark ? '#ccc' : '#666'} />
            </button>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: isDark ? '#eee' : '#333' }}>{selectedConv.user_name}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{selectedConv.user_email}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  padding: '8px 12px', borderRadius: 12,
                  background: msg.sender_role === 'admin' ? '#667eea' : (isDark ? '#2a2a2a' : '#f3f4f6'),
                  color: msg.sender_role === 'admin' ? '#fff' : (isDark ? '#eee' : '#333'),
                  fontSize: 14, lineHeight: 1.4,
                  borderBottomRightRadius: msg.sender_role === 'admin' ? 4 : 12,
                  borderBottomLeftRadius: msg.sender_role === 'user' ? 4 : 12,
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: msg.sender_role === 'admin' ? 'right' : 'left', paddingInline: 4 }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Responder..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 24,
                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                background: isDark ? '#141414' : '#f9fafb',
                color: isDark ? '#eee' : '#333', fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() ? '#667eea' : (isDark ? '#333' : '#e5e7eb'),
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={16} color={input.trim() ? '#fff' : '#999'} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          <div style={{ textAlign: 'center' }}>
            <MessageCircle size={40} color="#ddd" />
            <p style={{ marginTop: 8 }}>Selecione uma conversa</p>
          </div>
        </div>
      )}
    </div>
  );
}
