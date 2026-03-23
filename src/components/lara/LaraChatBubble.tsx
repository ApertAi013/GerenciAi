import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Props {
  isOpen: boolean;
  onClick: () => void;
  isDark: boolean;
  supportUnread?: number;
}

export default function LaraChatBubble({ isOpen, onClick, isDark, supportUnread = 0 }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOpen || dismissed) {
      setShowTooltip(false);
      return;
    }
    const timer = setTimeout(() => setShowTooltip(true), 2000);
    return () => clearTimeout(timer);
  }, [isOpen, dismissed]);

  useEffect(() => {
    if (isOpen) setDismissed(true);
  }, [isOpen]);

  return (
    <>
      {showTooltip && !isOpen && (
        <div
          className="lara-tooltip"
          onClick={onClick}
          style={{
            position: 'fixed' as const,
            bottom: 84,
            right: 24,
            zIndex: 1000,
            background: isDark ? '#1a1a1a' : '#fff',
            color: isDark ? '#f0f0f0' : '#333',
            padding: '10px 14px',
            borderRadius: 12,
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.12)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            maxWidth: 200,
            animation: 'laraTooltipIn 0.4s ease-out',
            border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
          }}
        >
          Oi! Estou aqui pra te ajudar 😊
          <div
            style={{
              position: 'absolute' as const,
              bottom: -7,
              right: 20,
              width: 14,
              height: 14,
              background: isDark ? '#1a1a1a' : '#fff',
              border: `1px solid ${isDark ? '#262626' : '#e5e5e5'}`,
              borderTop: 'none',
              borderLeft: 'none',
              transform: 'rotate(45deg)',
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            style={{
              position: 'absolute' as const,
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: isDark ? '#333' : '#e5e5e5',
              color: isDark ? '#a0a0a0' : '#888',
              border: 'none',
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Support unread badge - positioned to the left of the bubble */}
      {supportUnread > 0 && !isOpen && (
        <div
          onClick={onClick}
          style={{
            position: 'fixed' as const,
            bottom: 30,
            right: 80,
            zIndex: 1000,
            background: '#667eea',
            color: '#fff',
            borderRadius: 20,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            animation: 'laraTooltipIn 0.4s ease-out',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
          {supportUnread} nova{supportUnread > 1 ? 's' : ''} do suporte
        </div>
      )}

      <button
        className={`lara-bubble${isOpen ? ' open' : ''}`}
        onClick={onClick}
        title={isOpen ? 'Fechar chat' : 'Falar com o Tony'}
        style={{
          background: '#F58A25',
          color: '#fff',
          boxShadow: isDark
            ? '0 4px 16px rgba(0,0,0,0.45)'
            : '0 4px 16px rgba(245,138,37,0.35)',
        }}
      >
        <FontAwesomeIcon
          icon={isOpen ? faTimes : faRobot}
          style={{
            fontSize: isOpen ? 18 : 22,
            transition: 'all 0.2s ease',
          }}
        />
        {supportUnread > 0 && isOpen && (
          <span style={{
            position: 'absolute' as const, top: -4, left: -4,
            background: '#667eea', color: '#fff',
            fontSize: 10, fontWeight: 700, borderRadius: '50%',
            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>
            {supportUnread}
          </span>
        )}
      </button>
    </>
  );
}
