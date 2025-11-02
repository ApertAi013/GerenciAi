import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faChevronDown, faUser, faGear, faRightFromBracket, faSearch, faCircleExclamation, faCircleInfo, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { enrollmentService } from '../../services/enrollmentService';
import { useNotifications } from '../../hooks/useNotifications';
import '../../styles/Header.css';

interface SearchResult {
  type: 'student' | 'class' | 'enrollment';
  id: number;
  title: string;
  subtitle: string;
}

export default function Header() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleLogout = () => {
    authService.logout();
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results: SearchResult[] = [];

        // Search students
        const studentsRes = await studentService.getStudents({ search: searchTerm, limit: 5 });
        if (studentsRes.success && studentsRes.data) {
          studentsRes.data.forEach((student) => {
            results.push({
              type: 'student',
              id: student.id,
              title: student.full_name,
              subtitle: student.email || student.cpf,
            });
          });
        }

        // Search classes
        const classesRes = await classService.getClasses({ search: searchTerm });
        if (classesRes.success && classesRes.data) {
          classesRes.data.slice(0, 5).forEach((cls) => {
            results.push({
              type: 'class',
              id: cls.id,
              title: cls.name || `${cls.modality_name} - ${cls.weekday}`,
              subtitle: `${cls.start_time} - ${cls.modality_name}`,
            });
          });
        }

        // Search enrollments
        const enrollmentsRes = await enrollmentService.getEnrollments({ search: searchTerm });
        if (enrollmentsRes.success && enrollmentsRes.data) {
          enrollmentsRes.data.slice(0, 5).forEach((enrollment) => {
            results.push({
              type: 'enrollment',
              id: enrollment.id,
              title: enrollment.student_name || `Matrícula #${enrollment.id}`,
              subtitle: enrollment.plan_name || 'Plano',
            });
          });
        }

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectResult = (result: SearchResult) => {
    setShowResults(false);
    setSearchTerm('');

    switch (result.type) {
      case 'student':
        navigate(`/alunos/${result.id}`);
        break;
      case 'class':
        navigate('/turmas');
        break;
      case 'enrollment':
        navigate('/matriculas');
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'student':
        return '👤';
      case 'class':
        return '📚';
      case 'enrollment':
        return '📋';
      default:
        return '📄';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return faCircleExclamation;
      case 'success': return faCircleCheck;
      default: return faCircleInfo;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return '#f5576c';
      case 'success': return '#38f9d7';
      default: return '#667eea';
    }
  };

  return (
    <header className="header">
      <div className="header-search" ref={searchRef}>
        <FontAwesomeIcon icon={faSearch} className="search-icon-left" />
        <input
          type="text"
          placeholder="Pesquisar alunos, turmas e matrículas"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        {isSearching && <span className="search-loading">...</span>}

        {showResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="search-result-item"
                onClick={() => handleSelectResult(result)}
              >
                <span className="result-icon">{getResultIcon(result.type)}</span>
                <div className="result-info">
                  <div className="result-title">{result.title}</div>
                  <div className="result-subtitle">{result.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Notificações */}
        <div className="header-notification-container" ref={notificationsRef}>
          <button
            type="button"
            className="header-notification"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read"
                    onClick={markAllAsRead}
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <FontAwesomeIcon icon={faBell} style={{ fontSize: '32px', color: '#ccc' }} />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notification-icon" style={{ color: getNotificationColor(notif.type) }}>
                        <FontAwesomeIcon icon={getNotificationIcon(notif.type)} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                      </div>
                      {!notif.isRead && <div className="unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
              <p className="user-role">
                {user?.role === 'admin' ? 'Administrador' :
                 user?.role === 'gestor' ? 'Gestor' :
                 user?.role === 'instrutor' ? 'Instrutor' :
                 user?.role === 'financeiro' ? 'Financeiro' : 'Usuário'}
              </p>
            </div>
            <span className="user-arrow">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>

          {showMenu && (
            <div className="user-menu">
              <button type="button" className="menu-item">
                <FontAwesomeIcon icon={faUser} /> Meu Perfil
              </button>
              <button type="button" className="menu-item">
                <FontAwesomeIcon icon={faGear} /> Configurações
              </button>
              <button type="button" className="menu-item logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
