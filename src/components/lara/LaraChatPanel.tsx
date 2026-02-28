import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faArrowLeft, faHome, faRobot } from '@fortawesome/free-solid-svg-icons';
import type { LaraMessage as LaraMessageType, LaraQuickOption, LaraCategory, LaraConversationContext } from '../../types/laraTypes';
import type { LaraCategoryInfo } from '../../types/laraTypes';
import LaraMessage from './LaraMessage';
import LaraTypingIndicator from './LaraTypingIndicator';

interface Props {
  messages: LaraMessageType[];
  context: LaraConversationContext;
  isDark: boolean;
  isTyping: boolean;
  isClosing: boolean;
  categories: LaraCategoryInfo[];
  onSendMessage: (text: string) => void;
  onCategoryClick: (category: LaraCategory) => void;
  onOptionClick: (option: LaraQuickOption) => void;
  onBack: () => void;
  onReset: () => void;
  onClose: () => void;
}

export default function LaraChatPanel({
  messages, context, isDark, isTyping, isClosing, categories,
  onSendMessage, onCategoryClick, onOptionClick, onBack, onReset, onClose,
}: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const showNav = context.state !== 'greeting' && context.state !== 'idle';

  return (
    <div
      className={`lara-panel ${isClosing ? 'lara-panel-exit' : 'lara-panel-enter'}`}
      style={{
        background: isDark ? '#141414' : '#fff',
        border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
        boxShadow: isDark
          ? '0 10px 40px rgba(0,0,0,0.5)'
          : '0 10px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <div className="lara-header">
        <div className="lara-avatar">
          <FontAwesomeIcon icon={faRobot} className="lara-avatar-icon" />
        </div>
        <div className="lara-header-info">
          <div className="lara-header-name">Lara</div>
          <div className="lara-header-status">Assistente virtual</div>
        </div>
        <button className="lara-header-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Navigation */}
      {showNav && (
        <div className="lara-nav-bar" style={{ borderBottom: `1px solid ${isDark ? '#262626' : '#f0f0f0'}`, paddingTop: 6 }}>
          {context.history.length > 0 && (
            <button
              className="lara-nav-btn"
              onClick={onBack}
              style={{ color: isDark ? '#a0a0a0' : '#888' }}
            >
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 10 }} />
              Voltar
            </button>
          )}
          <button
            className="lara-nav-btn"
            onClick={onReset}
            style={{ color: isDark ? '#a0a0a0' : '#888' }}
          >
            <FontAwesomeIcon icon={faHome} style={{ fontSize: 10 }} />
            Menu principal
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="lara-messages" style={{ background: isDark ? '#0f0f0f' : '#fafafa' }}>
        {messages.map((msg, i) => (
          <LaraMessage
            key={msg.id}
            message={msg}
            isDark={isDark}
            categories={i === 0 ? categories : undefined}
            onCategoryClick={i === 0 ? onCategoryClick : undefined}
            onOptionClick={msg === messages[messages.length - 1] ? onOptionClick : undefined}
          />
        ))}
        {isTyping && <LaraTypingIndicator isDark={isDark} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        className="lara-input-area"
        onSubmit={handleSubmit}
        style={{ borderTop: `1px solid ${isDark ? '#262626' : '#f0f0f0'}` }}
      >
        <input
          ref={inputRef}
          className="lara-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua duvida..."
          disabled={isTyping}
          style={{
            background: isDark ? '#1a1a1a' : '#f5f5f5',
            color: isDark ? '#f0f0f0' : '#333',
          }}
        />
        <button
          type="submit"
          className="lara-send-btn"
          disabled={!input.trim() || isTyping}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}
