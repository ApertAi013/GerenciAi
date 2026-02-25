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
  faBrain,
  faCrown,
  faGauge,
  faChalkboardTeacher,
  faUserClock,
  faCog,
  faBullhorn,
  faMobileAlt,
  faClipboardCheck,
  faBuilding
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
  featureCode?: string; // Feature flag opcional
  isPremium?: boolean; // Badge PRO
  adminOnly?: boolean; // Apenas para admin
  gestorOnly?: boolean; // Apenas para admin/gestor
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Início', icon: faHome },
  { path: '/agenda', label: 'Agenda', icon: faCalendarDays },
  { path: '/alunos', label: 'Alunos', icon: faUsers },
  { path: '/alunos-experimentais', label: 'Alunos Experimentais', icon: faUserClock },
  { path: '/turmas', label: 'Turmas', icon: faUserGroup },
  { path: '/matriculas', label: 'Matrículas', icon: faClipboardList },
  { path: '/instrutores', label: 'Instrutores', icon: faChalkboardTeacher },
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

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasAccess: hasMigrationAccess, isLoading: isMigrationLoading } = useFeatureAccess('data_migration');

  // Filtra os itens do menu baseado em feature flags e roles
  const visibleMenuItems = menuItems.filter((item) => {
    // Verificar se é admin-only
    if (item.adminOnly) {
      return user?.role === 'admin';
    }

    // Verificar se é gestor-only (admin + gestor)
    if (item.gestorOnly) {
      return user?.role === 'admin' || user?.role === 'gestor';
    }

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
        })}
      </nav>
    </div>
  );
}
