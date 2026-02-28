import { Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { LaraMessage as LaraMessageType, LaraQuickOption, LaraCategory } from '../../types/laraTypes';
import type { LaraCategoryInfo } from '../../types/laraTypes';
import LaraQuickActions from './LaraQuickActions';

interface Props {
  message: LaraMessageType;
  isDark: boolean;
  categories?: LaraCategoryInfo[];
  onOptionClick?: (option: LaraQuickOption) => void;
  onCategoryClick?: (category: LaraCategory) => void;
}

export default function LaraMessage({ message, isDark, categories, onOptionClick, onCategoryClick }: Props) {
  const isBot = message.role === 'bot';
  const { text, options, steps, link, linkLabel } = message.content;

  return (
    <div className={`lara-msg ${isBot ? 'lara-msg-bot' : 'lara-msg-user'}`}>
      {isBot && (
        <div
          className="lara-msg-avatar-small"
          style={{ background: 'linear-gradient(135deg, #FFD04F, #F58A25)' }}
        >
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>T</span>
        </div>
      )}
      <div>
        <div
          className="lara-msg-bubble"
          style={isBot ? {
            background: isDark ? '#1a1a1a' : '#f5f5f5',
            color: isDark ? '#f0f0f0' : '#333',
          } : undefined}
        >
          {text}
        </div>

        {/* Steps */}
        {steps && steps.length > 0 && (
          <div className="lara-steps" style={{ paddingLeft: 4 }}>
            {steps.map((step, i) => (
              <div key={i} className="lara-step" style={{ color: isDark ? '#a0a0a0' : '#555' }}>
                <span className="lara-step-num">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Link button */}
        {link && linkLabel && (
          <Link to={link} className="lara-link-btn">
            {linkLabel}
            <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 11 }} />
          </Link>
        )}

        {/* Category buttons (for greeting) */}
        {categories && onCategoryClick && (
          <LaraQuickActions
            categories={categories}
            onCategoryClick={onCategoryClick}
            isDark={isDark}
          />
        )}

        {/* Option chips (modules or subtopics) */}
        {options && options.length > 0 && onOptionClick && (
          <div className="lara-options">
            {options.map((opt) => (
              <button
                key={opt.id}
                className="lara-option-chip"
                onClick={() => onOptionClick(opt)}
                style={{
                  background: isDark ? 'rgba(245,138,37,0.12)' : 'rgba(245,138,37,0.08)',
                  color: '#F58A25',
                  border: `1px solid ${isDark ? 'rgba(245,138,37,0.3)' : 'rgba(245,138,37,0.25)'}`,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
