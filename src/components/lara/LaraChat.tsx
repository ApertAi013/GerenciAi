import { useState, useCallback, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { LARA_CATEGORIES, LARA_MODULES, getModuleById, getModulesByCategory } from '../../data/laraKnowledgeBase';
import { getBestMatch } from '../../utils/laraIntentMatcher';
import type {
  LaraMessage, LaraConversationContext,
  LaraCategory, LaraQuickOption, LaraHistoryEntry,
} from '../../types/laraTypes';
import LaraChatBubble from './LaraChatBubble';
import LaraChatPanel from './LaraChatPanel';
import '../../styles/LaraChat.css';

let msgCounter = 0;
function createMsg(role: LaraMessage['role'], content: LaraMessage['content']): LaraMessage {
  return { id: `lara-${++msgCounter}`, role, content, timestamp: Date.now() };
}

export default function LaraChat() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<LaraMessage[]>([]);
  const [context, setContext] = useState<LaraConversationContext>({
    state: 'idle',
    history: [],
  });
  const hasGreeted = useRef(false);

  // Support chat state
  const [supportUnread, setSupportUnread] = useState(0);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const supportEndRef = useRef<HTMLDivElement>(null);

  // Poll support unread (only for non-admin users)
  useEffect(() => {
    if (user?.role === 'admin') return;
    const check = async () => {
      try {
        const res = await api.get('/api/support-chat/unread-count');
        setSupportUnread(res.data?.data?.count || 0);
      } catch { /* silent */ }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Load support messages when opened
  useEffect(() => {
    if (!showSupportChat) return;
    const load = async () => {
      try {
        const res = await api.get('/api/support-chat/my-conversation');
        setSupportMessages(res.data?.data?.messages || []);
        setSupportUnread(0);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [showSupportChat]);

  useEffect(() => {
    supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  const handleSendSupport = async () => {
    if (!supportInput.trim() || sendingSupport) return;
    setSendingSupport(true);
    try {
      await api.post('/api/support-chat/send', { content: supportInput.trim() });
      setSupportInput('');
      const res = await api.get('/api/support-chat/my-conversation');
      setSupportMessages(res.data?.data?.messages || []);
    } catch { /* silent */ }
    finally { setSendingSupport(false); }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'usuario';

  // ── Helpers ──
  const addMessages = useCallback((...msgs: LaraMessage[]) => {
    setMessages(prev => [...prev, ...msgs]);
  }, []);

  const pushHistory = useCallback((ctx: LaraConversationContext): LaraHistoryEntry => {
    return {
      state: ctx.state,
      selectedCategory: ctx.selectedCategory,
      selectedModuleId: ctx.selectedModuleId,
    };
  }, []);

  const simulateTyping = useCallback((callback: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, 400);
  }, []);

  // ── Greeting ──
  const sendGreeting = useCallback(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const msg = createMsg('bot', {
      text: `Ola, ${firstName}! Eu sou o Tony, seu assistente virtual. Posso te ajudar a navegar pelo sistema e tirar duvidas sobre qualquer funcionalidade. Escolha uma categoria ou me pergunte qualquer coisa!`,
    });
    setMessages([msg]);
    setContext({ state: 'greeting', history: [] });
  }, [firstName]);

  // ── Open / Close ──
  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setIsOpen(false);
      }, 200);
    } else {
      setIsOpen(true);
      if (!hasGreeted.current) {
        setTimeout(sendGreeting, 100);
      }
    }
  }, [isOpen, sendGreeting]);

  // ── Module Click ──
  const showModuleSubTopics = useCallback((moduleId: string, addToHistory: boolean = true) => {
    const mod = getModuleById(moduleId);
    if (!mod) return;

    const options: LaraQuickOption[] = mod.subTopics.map(st => ({
      id: st.id,
      label: st.label,
      type: 'subtopic' as const,
    }));

    simulateTyping(() => {
      addMessages(
        createMsg('bot', {
          text: `${mod.name}: ${mod.description}\n\nSobre o que voce quer saber?`,
          options,
        })
      );
      setContext(prev => ({
        state: 'module_selected',
        selectedModuleId: moduleId,
        selectedCategory: prev.selectedCategory,
        history: addToHistory ? [...prev.history, pushHistory(prev)] : prev.history,
      }));
    });
  }, [addMessages, pushHistory, simulateTyping]);

  // ── Category Click ──
  const handleCategoryClick = useCallback((category: LaraCategory) => {
    const modules = getModulesByCategory(category);
    const catInfo = LARA_CATEGORIES.find(c => c.id === category);

    addMessages(createMsg('user', { text: catInfo?.label || category }));

    // If category has only 1 module, skip straight to subtopics
    if (modules.length === 1) {
      setContext(prev => ({
        ...prev,
        selectedCategory: category,
        history: [...prev.history, pushHistory(prev)],
      }));
      showModuleSubTopics(modules[0].id);
      return;
    }

    const options: LaraQuickOption[] = modules.map(m => ({
      id: m.id,
      label: m.name,
      type: 'module' as const,
    }));

    simulateTyping(() => {
      addMessages(
        createMsg('bot', {
          text: `${catInfo?.label || 'Categoria'}: escolha o modulo que voce precisa de ajuda!`,
          options,
        })
      );
      setContext(prev => ({
        state: 'category_selected',
        selectedCategory: category,
        history: [...prev.history, pushHistory(prev)],
      }));
    });
  }, [addMessages, pushHistory, simulateTyping, showModuleSubTopics]);

  // ── SubTopic Click ──
  const showSubTopicAnswer = useCallback((subTopicId: string) => {
    const moduleId = context.selectedModuleId;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    // Also search all modules if not found in current
    let sub = mod?.subTopics.find(st => st.id === subTopicId);
    let foundModuleId = moduleId;
    if (!sub) {
      for (const m of LARA_MODULES) {
        const found = m.subTopics.find(st => st.id === subTopicId);
        if (found) {
          sub = found;
          foundModuleId = m.id;
          break;
        }
      }
    }
    if (!sub) return;

    simulateTyping(() => {
      addMessages(
        createMsg('bot', {
          text: sub!.response,
          steps: sub!.steps,
          link: sub!.link,
          linkLabel: sub!.linkLabel,
        })
      );
      setContext(prev => ({
        state: 'answer',
        selectedModuleId: foundModuleId,
        selectedCategory: prev.selectedCategory,
        history: [...prev.history, pushHistory(prev)],
      }));
    });
  }, [context.selectedModuleId, addMessages, pushHistory, simulateTyping]);

  // ── Option Click (dispatch) ──
  const handleOptionClick = useCallback((option: LaraQuickOption) => {
    // Add user click as message
    addMessages(createMsg('user', { text: option.label }));

    if (option.type === 'module') {
      showModuleSubTopics(option.id);
    } else if (option.type === 'subtopic') {
      showSubTopicAnswer(option.id);
    }
  }, [addMessages, showModuleSubTopics, showSubTopicAnswer]);

  // ── Free Text ──
  const handleSendMessage = useCallback((text: string) => {
    addMessages(createMsg('user', { text }));

    const match = getBestMatch(text);

    if (!match) {
      // Fallback
      simulateTyping(() => {
        addMessages(
          createMsg('bot', {
            text: 'Hmm, nao encontrei nada sobre isso. Tente perguntar de outra forma ou escolha uma das categorias acima. Voce tambem pode consultar o Guia do Sistema completo!',
            link: '/guia-do-sistema',
            linkLabel: 'Abrir Guia do Sistema',
          })
        );
        setContext(prev => ({
          state: 'fallback',
          history: [...prev.history, pushHistory(prev)],
        }));
      });
      return;
    }

    const mod = getModuleById(match.moduleId);
    if (!mod) return;

    if (match.subTopicId) {
      // Direct answer
      const sub = mod.subTopics.find(st => st.id === match.subTopicId);
      if (sub) {
        simulateTyping(() => {
          addMessages(
            createMsg('bot', {
              text: sub.response,
              steps: sub.steps,
              link: sub.link,
              linkLabel: sub.linkLabel,
            })
          );
          setContext(prev => ({
            state: 'answer',
            selectedModuleId: match.moduleId,
            selectedCategory: prev.selectedCategory,
            history: [...prev.history, pushHistory(prev)],
          }));
        });
        return;
      }
    }

    // Show module subtopics
    setContext(prev => ({
      ...prev,
      selectedModuleId: match.moduleId,
    }));
    showModuleSubTopics(match.moduleId);
  }, [addMessages, pushHistory, simulateTyping, showModuleSubTopics]);

  // ── Back ──
  const handleBack = useCallback(() => {
    setContext(prev => {
      if (prev.history.length === 0) return { state: 'greeting', history: [] };
      const newHistory = [...prev.history];
      const last = newHistory.pop()!;
      return {
        state: last.state,
        selectedCategory: last.selectedCategory,
        selectedModuleId: last.selectedModuleId,
        history: newHistory,
      };
    });
    // Remove last 2 messages (user + bot) to "go back"
    setMessages(prev => prev.length >= 2 ? prev.slice(0, -2) : prev);
  }, []);

  // ── Reset to greeting ──
  const handleReset = useCallback(() => {
    hasGreeted.current = false;
    setMessages([]);
    setContext({ state: 'idle', history: [] });
    setTimeout(() => sendGreeting(), 100);
  }, [sendGreeting]);

  const formatSupportTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <LaraChatBubble isOpen={isOpen} onClick={handleToggle} isDark={isDark} supportUnread={supportUnread} />
      {(isOpen || isClosing) && (
        <>
          {showSupportChat ? (
            /* Support Chat Panel - replaces Lara panel */
            <div
              className={`lara-panel${isClosing ? ' closing' : ''}`}
              style={{
                position: 'fixed', bottom: 90, right: 16, zIndex: 1001,
                width: 380, maxWidth: 'calc(100vw - 32px)', height: 500, maxHeight: 'calc(100vh - 120px)',
                borderRadius: 16, overflow: 'hidden',
                background: isDark ? '#1a1a1a' : '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
              }}
            >
              <div style={{
                background: '#667eea', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <button onClick={() => setShowSupportChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18 }}>
                  ←
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Chat com Suporte</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Estamos aqui para ajudar</div>
                </div>
                <button onClick={handleToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {supportMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '2rem 1rem' }}>
                    <p style={{ fontWeight: 500 }}>Envie uma mensagem e responderemos o mais rapido possivel.</p>
                  </div>
                ) : supportMessages.map((msg: any) => (
                  <div key={msg.id} style={{ alignSelf: msg.sender_role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{
                      padding: '8px 12px', borderRadius: 12, fontSize: 14, lineHeight: 1.4,
                      background: msg.sender_role === 'user' ? '#667eea' : (isDark ? '#2a2a2a' : '#f3f4f6'),
                      color: msg.sender_role === 'user' ? '#fff' : (isDark ? '#eee' : '#333'),
                      borderBottomRightRadius: msg.sender_role === 'user' ? 4 : 12,
                      borderBottomLeftRadius: msg.sender_role === 'admin' ? 4 : 12,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: msg.sender_role === 'user' ? 'right' : 'left' }}>
                      {formatSupportTime(msg.created_at)}
                    </div>
                  </div>
                ))}
                <div ref={supportEndRef} />
              </div>

              <div style={{ padding: '10px 12px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={supportInput}
                  onChange={e => setSupportInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendSupport()}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 24,
                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                    background: isDark ? '#141414' : '#f9fafb',
                    color: isDark ? '#eee' : '#333', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendSupport}
                  disabled={!supportInput.trim() || sendingSupport}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: supportInput.trim() ? '#667eea' : (isDark ? '#333' : '#e5e7eb'),
                    border: 'none', cursor: supportInput.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: supportInput.trim() ? '#fff' : '#999', fontSize: 16,
                  }}
                >
                  ➤
                </button>
              </div>
            </div>
          ) : (
            <LaraChatPanel
              messages={messages}
              context={context}
              isDark={isDark}
              isTyping={isTyping}
              isClosing={isClosing}
              categories={LARA_CATEGORIES}
              onSendMessage={handleSendMessage}
              onCategoryClick={handleCategoryClick}
              onOptionClick={handleOptionClick}
              onBack={handleBack}
              onReset={handleReset}
              onClose={handleToggle}
              onOpenSupport={() => setShowSupportChat(true)}
              supportUnread={supportUnread}
            />
          )}
        </>
      )}
    </>
  );
}
