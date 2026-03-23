import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';

interface Message {
  id: number;
  sender_role: 'admin' | 'user';
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function SupportChatWidget() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't show for admin users (they use the admin panel)
  if (!user || user.role === 'admin') return null;

  // Poll unread count
  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages when chat is open
  useEffect(() => {
    if (!open) return;
    loadConversation();
    const interval = setInterval(loadConversation, 5000);
    return () => clearInterval(interval);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const checkUnread = async () => {
    try {
      const res = await api.get('/api/support-chat/unread-count');
      setUnreadCount(res.data?.data?.count || 0);
    } catch { /* silent */ }
  };

  const loadConversation = async () => {
    try {
      setLoading(!conversationId);
      const res = await api.get('/api/support-chat/my-conversation');
      const data = res.data?.data;
      if (data) {
        setConversationId(data.conversation_id);
        setMessages(data.messages || []);
        setUnreadCount(0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/api/support-chat/send', { content: input.trim() });
      setInput('');
      await loadConversation();
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            background: '#667eea', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <HelpCircle size={26} color="#fff" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: '#fff',
              fontSize: 11, fontWeight: 700, borderRadius: '50%',
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white',
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 380, maxWidth: 'calc(100vw - 32px)', height: 500, maxHeight: 'calc(100vh - 100px)',
          borderRadius: 16, overflow: 'hidden',
          background: isDark ? '#1a1a1a' : '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
        }}>
          {/* Header */}
          <div style={{
            background: '#667eea', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageCircle size={20} color="#fff" />
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Suporte ArenaAi</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Estamos aqui para ajudar</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={20} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {loading && messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>Carregando...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: isDark ? '#888' : '#999', padding: '2rem 1rem' }}>
                <HelpCircle size={32} color="#667eea" style={{ marginBottom: 8 }} />
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Precisa de ajuda?</p>
                <p style={{ fontSize: 13, margin: 0 }}>Envie uma mensagem e responderemos o mais rapido possivel.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{
                  alignSelf: msg.sender_role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}>
                  <div style={{
                    padding: '8px 12px', borderRadius: 12,
                    background: msg.sender_role === 'user'
                      ? '#667eea'
                      : (isDark ? '#2a2a2a' : '#f3f4f6'),
                    color: msg.sender_role === 'user' ? '#fff' : (isDark ? '#eee' : '#333'),
                    fontSize: 14, lineHeight: 1.4,
                    borderBottomRightRadius: msg.sender_role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: msg.sender_role === 'admin' ? 4 : 12,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#999', marginTop: 2,
                    textAlign: msg.sender_role === 'user' ? 'right' : 'left',
                    paddingInline: 4,
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              ))
            )}
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
              placeholder="Digite sua mensagem..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 24,
                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                background: isDark ? '#141414' : '#f9fafb',
                color: isDark ? '#eee' : '#333',
                fontSize: 14, outline: 'none',
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
                transition: 'background 0.15s',
              }}
            >
              <Send size={16} color={input.trim() ? '#fff' : '#999'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
