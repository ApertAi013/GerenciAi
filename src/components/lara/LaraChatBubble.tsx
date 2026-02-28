import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Props {
  isOpen: boolean;
  onClick: () => void;
  isDark: boolean;
}

export default function LaraChatBubble({ isOpen, onClick, isDark }: Props) {
  return (
    <button
      className={`lara-bubble${isOpen ? ' open' : ''}`}
      onClick={onClick}
      title={isOpen ? 'Fechar chat' : 'Falar com a Lara'}
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
    </button>
  );
}
