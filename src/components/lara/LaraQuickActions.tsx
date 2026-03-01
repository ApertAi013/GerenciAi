import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faFlask, faCalendarDays, faMoneyBillWave, faSquare,
  faBullhorn, faCog, faCrown, faGauge, faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import type { LaraCategoryInfo, LaraCategory } from '../../types/laraTypes';

const ICON_MAP: Record<string, typeof faUsers> = {
  faUsers, faFlask, faCalendarDays, faMoneyBillWave, faSquare,
  faBullhorn, faCog, faCrown, faGauge, faTrophy,
};

interface Props {
  categories: LaraCategoryInfo[];
  onCategoryClick: (category: LaraCategory) => void;
  isDark: boolean;
}

export default function LaraQuickActions({ categories, onCategoryClick, isDark }: Props) {
  return (
    <div className="lara-quick-grid">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className="lara-quick-btn"
          onClick={() => onCategoryClick(cat.id)}
          style={{
            background: isDark ? '#262626' : '#fff',
            color: isDark ? '#f0f0f0' : '#333',
            border: `1px solid ${isDark ? '#333' : '#e5e5e5'}`,
          }}
          title={cat.description}
        >
          <span className="lara-quick-btn-icon" style={{ color: '#F58A25' }}>
            <FontAwesomeIcon icon={ICON_MAP[cat.icon] || faUsers} />
          </span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
