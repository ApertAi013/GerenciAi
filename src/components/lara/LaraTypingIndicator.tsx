interface Props {
  isDark: boolean;
}

export default function LaraTypingIndicator({ isDark }: Props) {
  return (
    <div className="lara-msg lara-msg-bot">
      <div
        className="lara-msg-avatar-small"
        style={{ background: 'linear-gradient(135deg, #FFD04F, #F58A25)' }}
      >
        <span style={{ color: '#fff', fontSize: 12 }}>L</span>
      </div>
      <div
        className="lara-msg-bubble"
        style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }}
      >
        <div className="lara-typing">
          <span className="lara-typing-dot" />
          <span className="lara-typing-dot" />
          <span className="lara-typing-dot" />
        </div>
      </div>
    </div>
  );
}
