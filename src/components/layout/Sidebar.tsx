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
  faRobot
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import '../../styles/Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: IconDefinition;
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Início', icon: faHome },
  { path: '/agenda', label: 'Agenda', icon: faCalendarDays },
  { path: '/alunos', label: 'Alunos', icon: faUsers },
  { path: '/turmas', label: 'Turmas', icon: faUserGroup },
  { path: '/matriculas', label: 'Matrículas', icon: faClipboardList },
  { path: '/financeiro', label: 'Financeiro', icon: faMoneyBillWave },
  { path: '/relatorios', label: 'Relatórios', icon: faChartBar },
  { path: '/chat', label: 'Chat IA', icon: faRobot },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>GerenciAi</h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
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
