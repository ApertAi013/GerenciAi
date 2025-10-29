import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCircleExclamation, faCircleInfo, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { financialService } from '../../services/financialService';
import { studentService } from '../../services/studentService';
import type { Invoice } from '../../types/financialTypes';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

export default function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs: Notification[] = [];
        const now = new Date();

        // Buscar faturas vencidas
        const invoiceResponse = await financialService.getInvoices();
        if (invoiceResponse.status === 'success') {
          const overdue = invoiceResponse.data.invoices.filter((inv: Invoice) =>
            inv.status === 'vencida'
          );

          if (overdue.length > 0) {
            notifs.push({
              id: 'overdue-invoices',
              type: 'warning',
              title: 'Faturas Vencidas',
              message: `Você tem ${overdue.length} ${overdue.length === 1 ? 'fatura vencida' : 'faturas vencidas'}`,
              timestamp: now,
            });
          }
        }

        // Buscar novos alunos (últimos 7 dias)
        const studentResponse = await studentService.getStudents({});
        if (studentResponse.success) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const newStudents = studentResponse.data.filter((student) =>
            new Date(student.created_at) >= sevenDaysAgo
          );

          if (newStudents.length > 0) {
            notifs.push({
              id: 'new-students',
              type: 'success',
              title: 'Novos Alunos',
              message: `${newStudents.length} ${newStudents.length === 1 ? 'novo aluno cadastrado' : 'novos alunos cadastrados'} esta semana`,
              timestamp: now,
            });
          }
        }

        // Notificação informativa se não houver alertas
        if (notifs.length === 0) {
          notifs.push({
            id: 'all-clear',
            type: 'info',
            title: 'Tudo em dia',
            message: 'Não há pendências no momento',
            timestamp: now,
          });
        }

        setNotifications(notifs);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return faCircleExclamation;
      case 'success': return faCircleCheck;
      default: return faCircleInfo;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
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
