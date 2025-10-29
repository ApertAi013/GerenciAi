import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faChevronDown, faUser, faGear, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import '../../styles/Header.css';

export default function Header() {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="header">
      <div className="header-search">
        <input
          type="text"
          placeholder="Pesquisar alunos, turmas e matrículas"
          className="search-input"
        />
      </div>

      <div className="header-actions">
        {/* Notificações */}
        <button className="header-notification">
          <FontAwesomeIcon icon={faBell} />
          <span className="notification-badge">20</span>
        </button>

        {/* Menu do Usuário */}
        <div className="header-user">
          <button
            className="user-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="user-avatar">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.full_name || 'Usuário'}</p>
              <p className="user-role">{user?.role || 'admin'}</p>
            </div>
            <span className="user-arrow">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>

          {showMenu && (
            <div className="user-menu">
              <button className="menu-item">
                <FontAwesomeIcon icon={faUser} /> Meu Perfil
              </button>
              <button className="menu-item">
                <FontAwesomeIcon icon={faGear} /> Configurações
              </button>
              <button className="menu-item logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
