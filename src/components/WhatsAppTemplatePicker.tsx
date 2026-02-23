import { useEffect, useRef } from 'react';
import { getTemplates } from '../utils/whatsappTemplates';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import '../styles/WhatsAppTemplatePicker.css';

interface WhatsAppTemplatePickerProps {
  onSelect: (message: string) => void;
  onClose: () => void;
  position?: 'below' | 'above';
}

export default function WhatsAppTemplatePicker({ onSelect, onClose, position = 'below' }: WhatsAppTemplatePickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const templates = getTemplates();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={`wtp-dropdown ${position === 'above' ? 'wtp-dropdown--above' : ''}`}>
      <div className="wtp-header">Escolha o template</div>
      {templates.map(t => (
        <button
          key={t.id}
          type="button"
          className="wtp-item"
          onClick={() => onSelect(t.message)}
        >
          <FontAwesomeIcon icon={faCommentDots} className="wtp-item-icon" />
          <span className="wtp-item-name">{t.name}</span>
        </button>
      ))}
    </div>
  );
}
