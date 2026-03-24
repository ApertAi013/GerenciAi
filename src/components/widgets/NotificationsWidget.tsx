import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCircleExclamation, faCircleInfo, faCircleCheck, faUserPlus, faUserMinus, faPen, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationsWidget() {
  const { notifications, isLoading } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'trial_booking': return faUserPlus;
      case 'trial_cancellation': return faTimesCircle;
      case 'enrollment_created': return faUserPlus;
      case 'enrollment_cancelled': return faUserMinus;
      case 'enrollment_updated': return faPen;
      case 'class_makeup': return faCircleCheck;
      case 'warning': return faCircleExclamation;
      case 'success': return faCircleCheck;
      default: return faCircleInfo;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'trial_booking': return '#8b5cf6';
      case 'trial_cancellation': return '#ef4444';
      case 'enrollment_created': return '#10b981';
      case 'enrollment_cancelled': return '#ef4444';
      case 'enrollment_updated': return '#f59e0b';
      case 'class_makeup': return '#f59e0b';
      case 'warning': return '#f5576c';
      case 'success': return '#38f9d7';
      default: return '#667eea';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f0f0f0',
      }}>
        <FontAwesomeIcon icon={faBell} style={{ color: '#667eea', fontSize: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Notificações</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: '12px',
              marginBottom: '8px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: `3px solid ${getColor(notif.type)}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
              <FontAwesomeIcon
                icon={getIcon(notif.type)}
                style={{ color: getColor(notif.type), fontSize: '18px', marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {notif.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
