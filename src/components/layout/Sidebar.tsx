import { Link, useLocation } from 'react-router';
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
  faBrain
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import '../../styles/Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: IconDefinition;
  featureCode?: string; // Feature flag opcional
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Início', icon: faHome },
  { path: '/agenda', label: 'Agenda', icon: faCalendarDays },
  { path: '/alunos', label: 'Alunos', icon: faUsers },
  { path: '/turmas', label: 'Turmas', icon: faUserGroup },
  { path: '/matriculas', label: 'Matrículas', icon: faClipboardList },
  { path: '/quadras', label: 'Quadras', icon: faSquare },
  { path: '/locacoes', label: 'Locações', icon: faBaseballBall },
  { path: '/financeiro', label: 'Financeiro', icon: faMoneyBillWave },
  { path: '/relatorios', label: 'Relatórios', icon: faChartBar },
  { path: '/niveis', label: 'Níveis', icon: faLayerGroup },
  { path: '/planos', label: 'Planos', icon: faTags },
  { path: '/ia', label: 'IA', icon: faBrain },
  { path: '/chat', label: 'Chat IA', icon: faRobot },
  { path: '/migracao', label: 'Migração', icon: faDatabase, featureCode: 'data_migration' },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasAccess: hasMigrationAccess, isLoading: isMigrationLoading } = useFeatureAccess('data_migration');

  // Filtra os itens do menu baseado em feature flags
  const visibleMenuItems = menuItems.filter((item) => {
    // Se não tem feature flag, sempre exibe
    if (!item.featureCode) {
      return true;
    }

    // Para migração, verifica o acesso
    if (item.featureCode === 'data_migration') {
      return !isMigrationLoading && hasMigrationAccess;
    }

    return true;
  });

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/arenai-logo.svg" alt="ArenaAi" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
