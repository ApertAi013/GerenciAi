import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronLeft, Plus, Search } from 'lucide-react';
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
  const [showNewChat, setShowNewChat] = useState(false);
  const [gestors, setGestors] = useState<any[]>([]);
  const [gestorSearch, setGestorSearch] = useState('');
  const [loadingGestors, setLoadingGestors] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
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

  const loadGestors = async () => {
    setLoadingGestors(true);
    try {
      const res = await api.get('/api/admin/monitoring/gestores');
      setGestors(res.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingGestors(false); }
  };

  const handleStartChat = async (userId: number) => {
    setStartingChat(true);
    try {
      const res = await api.post(`/api/support-chat/admin/start/${userId}`, {});
      const convId = res.data?.data?.conversation_id;
      if (convId) {
        setShowNewChat(false);
        await loadConversations();
        // Find and select the conversation
        const conv = conversations.find(c => c.user_id === userId);
        if (conv) setSelectedConv(conv);
        else {
          // Reload and try again
          const res2 = await api.get('/api/support-chat/admin/conversations');
          const data = res2.data?.data || [];
          setConversations(data);
          const found = data.find((c: any) => c.user_id === userId);
          if (found) setSelectedConv(found);
        }
      }
    } catch { /* silent */ }
    finally { setStartingChat(false); }
  };

  const filteredGestors = gestors.filter(g => {
    if (!gestorSearch.trim()) return true;
    const q = gestorSearch.toLowerCase();
    return g.full_name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q);
  });

  const cardStyle = {
    background: isDark ? '#1a1a1a' : '#fff',
    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
    borderRadius: 14, overflow: 'hidden' as const,
  };

  return (
    <div style={{ ...cardStyle, display: 'flex', height: 500, position: 'relative' }}>
      {/* Conversations list */}
      <div style={{
        width: selectedConv ? 280 : '100%',
        minWidth: selectedConv ? 280 : undefined,
        borderRight: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} color="#667eea" />
          <span style={{ fontWeight: 600, fontSize: 15, color: isDark ? '#eee' : '#333', flex: 1 }}>
            Chat de Suporte
          </span>
          {totalUnread > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
              {totalUnread}
            </span>
          )}
          <button
            onClick={() => { setShowNewChat(true); loadGestors(); }}
            style={{
              background: '#667eea', border: 'none', borderRadius: 8,
              color: '#fff', cursor: 'pointer', padding: '6px 12px',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={14} /> Nova
          </button>
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
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <MessageCircle size={48} color={isDark ? '#444' : '#ddd'} />
            <p style={{ marginTop: 12, fontSize: 16, fontWeight: 500, color: isDark ? '#888' : '#999' }}>
              Selecione uma conversa na lista ou inicie uma nova
            </p>
            <button
              onClick={() => { setShowNewChat(true); loadGestors(); }}
              style={{
                marginTop: 16, padding: '10px 24px', borderRadius: 8,
                background: '#667eea', color: '#fff', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: 14,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={16} /> Iniciar conversa
            </button>
          </div>
        </div>
      )}

      {/* New conversation modal */}
      {showNewChat && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          borderRadius: 14,
        }} onClick={() => setShowNewChat(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? '#1a1a1a' : '#fff', borderRadius: 14,
              width: '90%', maxWidth: 400, maxHeight: '80%',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: isDark ? '#eee' : '#333' }}>Iniciar conversa</span>
              <button onClick={() => setShowNewChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={isDark ? '#aaa' : '#666'} />
              </button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? '#141414' : '#f3f4f6', borderRadius: 8, padding: '8px 12px' }}>
                <Search size={16} color="#999" />
                <input
                  type="text"
                  value={gestorSearch}
                  onChange={e => setGestorSearch(e.target.value)}
                  placeholder="Buscar gestor..."
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: isDark ? '#eee' : '#333', fontSize: 14 }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 300 }}>
              {loadingGestors ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Carregando...</div>
              ) : filteredGestors.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Nenhum gestor encontrado</div>
              ) : filteredGestors.map((g: any) => (
                <div
                  key={g.id}
                  onClick={() => !startingChat && handleStartChat(g.id)}
                  style={{
                    padding: '12px 16px', cursor: startingChat ? 'wait' : 'pointer',
                    borderBottom: `1px solid ${isDark ? '#262626' : '#f3f4f6'}`,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#222' : '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: isDark ? '#eee' : '#333' }}>{g.full_name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{g.email}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
