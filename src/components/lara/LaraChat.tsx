import { useState, useCallback, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
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

  // ── Category Click ──
  const handleCategoryClick = useCallback((category: LaraCategory) => {
    const modules = getModulesByCategory(category);
    const catInfo = LARA_CATEGORIES.find(c => c.id === category);
    const options: LaraQuickOption[] = modules.map(m => ({
      id: m.id,
      label: m.name,
      type: 'module' as const,
    }));

    addMessages(createMsg('user', { text: catInfo?.label || category }));

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
  }, [addMessages, pushHistory, simulateTyping]);

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

  return (
    <>
      <LaraChatBubble isOpen={isOpen} onClick={handleToggle} isDark={isDark} />
      {(isOpen || isClosing) && (
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
        />
      )}
    </>
  );
}
