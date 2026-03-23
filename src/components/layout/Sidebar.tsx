import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { useThemeStore } from '../../store/themeStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCalendarDays,
  faUsers,
  faUserGroup,
  faClipboardList,
  faMoneyBillWave,
  faChartBar,
  faRobot,
  faDatabase,
  faLayerGroup,
  faTags,
  faBaseballBall,
  faSquare,
  faBrain,
  faCrown,
  faGauge,
  faChalkboardTeacher,
  faUserClock,
  faCog,
  faBullhorn,
  faMobileAlt,
  faClipboardCheck,
  faBuilding,
  faGripVertical,
  faEye,
  faEyeSlash,
  faChevronUp,
  faChevronDown,
  faRotateLeft,
  faCheck,
  faPen,
  faStore,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useAuthStore } from '../../store/authStore';
import '../../styles/Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: IconDefinition;
  featureCode?: string;
  isPremium?: boolean;
  adminOnly?: boolean;
  gestorOnly?: boolean;
}

interface SidebarConfig {
  order: string[];
  hidden: string[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Início', icon: faHome },
  { path: '/agenda', label: 'Agenda', icon: faCalendarDays },
  { path: '/alunos', label: 'Alunos', icon: faUsers },
  { path: '/alunos-experimentais', label: 'Alunos Experimentais', icon: faUserClock },
  { path: '/turmas', label: 'Turmas', icon: faUserGroup },
  { path: '/matriculas', label: 'Matrículas', icon: faClipboardList },
  { path: '/instrutores', label: 'Instrutores', icon: faChalkboardTeacher },
  { path: '/lojinha', label: 'Lojinha', icon: faStore },
  { path: '/torneios', label: 'Torneios', icon: faTrophy },
  { path: '/quadras', label: 'Quadras', icon: faSquare },
  { path: '/locacoes', label: 'Locações', icon: faBaseballBall },
  { path: '/mensalistas', label: 'Mensalistas', icon: faCalendarDays },
  { path: '/avisos', label: 'Avisos', icon: faBullhorn },
  { path: '/formularios', label: 'Formulários', icon: faClipboardCheck },
  { path: '/financeiro', label: 'Financeiro', icon: faMoneyBillWave },
  { path: '/pagamentos-app', label: 'Pagamento App', icon: faMobileAlt },
  { path: '/relatorios', label: 'Relatórios', icon: faChartBar },
  { path: '/niveis', label: 'Níveis', icon: faLayerGroup },
  { path: '/planos', label: 'Planos', icon: faTags },
  { path: '/ia', label: 'IA', icon: faBrain, isPremium: true },
  { path: '/whatsapp', label: 'WhatsApp', icon: faWhatsapp, isPremium: true },
  { path: '/chat', label: 'Chat IA', icon: faRobot, isPremium: true },
  { path: '/arenas', label: 'Arenas', icon: faBuilding, gestorOnly: true },
  { path: '/meu-plano', label: 'Meu Plano', icon: faCrown },
  { path: '/preferencias', label: 'Preferências', icon: faCog },
  { path: '/admin/monitoring', label: 'Gerenciador', icon: faGauge, adminOnly: true },
  { path: '/migracao', label: 'Migração', icon: faDatabase, featureCode: 'data_migration' },
];

const PROTECTED_PATHS = ['/dashboard'];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const logoSrc = theme === 'dark' ? '/arenai-logo-white.svg' : '/arenai-logo.svg';
  const { hasAccess: hasMigrationAccess, isLoading: isMigrationLoading } = useFeatureAccess('data_migration');

  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>(() => {
    const saved = localStorage.getItem('sidebar_config');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return { order: [], hidden: [] };
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Role/feature based filter
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) return user?.role === 'admin';
    if (item.gestorOnly) return user?.role === 'admin' || user?.role === 'gestor';
    if (!item.featureCode) return true;
    if (item.featureCode === 'data_migration') return !isMigrationLoading && hasMigrationAccess;
    return true;
  });

  // Apply user ordering + hiding
  const orderedMenuItems = useMemo(() => {
    const items = isCustomizing
      ? [...visibleMenuItems] // show all in edit mode
      : visibleMenuItems.filter(i => !sidebarConfig.hidden.includes(i.path));

    if (sidebarConfig.order.length > 0) {
      items.sort((a, b) => {
        const ai = sidebarConfig.order.indexOf(a.path);
        const bi = sidebarConfig.order.indexOf(b.path);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    return items;
  }, [visibleMenuItems, sidebarConfig, isCustomizing]);

  const saveConfig = (config: SidebarConfig) => {
    setSidebarConfig(config);
    localStorage.setItem('sidebar_config', JSON.stringify(config));
  };

  const handleToggleVisibility = (path: string) => {
    if (PROTECTED_PATHS.includes(path)) return;
    const hidden = sidebarConfig.hidden.includes(path)
      ? sidebarConfig.hidden.filter(p => p !== path)
      : [...sidebarConfig.hidden, path];
    saveConfig({ ...sidebarConfig, hidden });
  };

  const handleMoveItem = (path: string, direction: 'up' | 'down') => {
    const currentOrder = sidebarConfig.order.length > 0
      ? [...sidebarConfig.order]
      : visibleMenuItems.map(i => i.path);
    const idx = currentOrder.indexOf(path);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= currentOrder.length) return;
    [currentOrder[idx], currentOrder[swapIdx]] = [currentOrder[swapIdx], currentOrder[idx]];
    saveConfig({ ...sidebarConfig, order: currentOrder });
  };

  const handleResetConfig = () => {
    localStorage.removeItem('sidebar_config');
    setSidebarConfig({ order: [], hidden: [] });
    setIsCustomizing(false);
  };

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <img src={logoSrc} alt="ArenaAi" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {isCustomizing ? (
          /* ── Edit mode ── */
          <>
            <div className="sidebar-edit-header">
              <span>Personalizar menu</span>
            </div>
            {orderedMenuItems.map((item, index) => {
              const isHidden = sidebarConfig.hidden.includes(item.path);
              const isProtected = PROTECTED_PATHS.includes(item.path);
              return (
                <div
                  key={item.path}
                  className={`sidebar-edit-item ${isHidden ? 'sidebar-edit-item-hidden' : ''}`}
                >
                  <button
                    type="button"
                    className="sidebar-edit-vis"
                    onClick={() => handleToggleVisibility(item.path)}
                    disabled={isProtected}
                    title={isProtected ? 'Sempre visível' : isHidden ? 'Mostrar' : 'Esconder'}
                  >
                    <FontAwesomeIcon icon={isHidden ? faEyeSlash : faEye} />
                  </button>
                  <span className="sidebar-edit-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>
                  <span className="sidebar-edit-label">{item.label}</span>
                  <div className="sidebar-edit-arrows">
                    <button
                      type="button"
                      className="sidebar-move-btn"
                      onClick={() => handleMoveItem(item.path, 'up')}
                      disabled={index === 0}
                    >
                      <FontAwesomeIcon icon={faChevronUp} />
                    </button>
                    <button
                      type="button"
                      className="sidebar-move-btn"
                      onClick={() => handleMoveItem(item.path, 'down')}
                      disabled={index === orderedMenuItems.length - 1}
                    >
                      <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="sidebar-edit-bar">
              <button
                type="button"
                className="sidebar-edit-done"
                onClick={() => setIsCustomizing(false)}
              >
                <FontAwesomeIcon icon={faCheck} /> Concluir
              </button>
              <button
                type="button"
                className="sidebar-edit-reset"
                onClick={handleResetConfig}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restaurar
              </button>
            </div>
          </>
        ) : (
          /* ── Normal mode ── */
          orderedMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => onClose?.()}
                {...(item.path === '/arenas' ? { 'data-tour': 'sidebar-arenas' } : {})}
              >
                <span className="sidebar-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span className="sidebar-label">
                  {item.label}
                  {item.isPremium && (
                    <span className="sidebar-pro-badge">
                      <FontAwesomeIcon icon={faCrown} />
                    </span>
                  )}
                </span>
              </Link>
            );
          })
        )}
      </nav>

      {/* App Store link */}
      <a
        href="https://apps.apple.com/br/app/arenai/id6759476669"
        target="_blank"
        rel="noopener noreferrer"
        className="sidebar-appstore-link"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', margin: '0.5rem 0.75rem',
          borderRadius: 8, background: '#000', color: '#fff',
          textDecoration: 'none', fontSize: '0.75rem',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.99 2.97 12.5 4.7 9.43C5.55 7.91 7.13 6.93 8.84 6.91C10.12 6.89 11.34 7.78 12.14 7.78C12.94 7.78 14.41 6.69 15.95 6.86C16.61 6.89 18.38 7.12 19.53 8.78C19.43 8.84 17.16 10.15 17.19 12.94C17.22 16.27 20.06 17.37 20.09 17.38C20.06 17.44 19.63 18.95 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
        <span>Baixar App</span>
      </a>

      {/* Customize button */}
      <button
        type="button"
        className="sidebar-customize-btn"
        onClick={() => setIsCustomizing(!isCustomizing)}
        title="Personalizar menu"
      >
        <FontAwesomeIcon icon={isCustomizing ? faCheck : faPen} />
        <span>{isCustomizing ? 'Concluir' : 'Editar menu'}</span>
      </button>
    </div>
  );
}
