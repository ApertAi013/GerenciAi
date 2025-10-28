import { Link, useLocation } from 'react-router';
import '../../styles/Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Início', icon: '🏠' },
  { path: '/agenda', label: 'Agenda', icon: '📅' },
  { path: '/alunos', label: 'Alunos', icon: '👥' },
  { path: '/turmas', label: 'Turmas', icon: '🏐' },
  { path: '/matriculas', label: 'Matrículas', icon: '📝' },
  { path: '/financeiro', label: 'Financeiro', icon: '💰' },
  { path: '/relatorios', label: 'Relatórios', icon: '📊' },
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
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
