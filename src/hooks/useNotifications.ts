import { useEffect, useState } from 'react';
import { financialService } from '../services/financialService';
import { studentService } from '../services/studentService';
import type { Invoice } from '../types/financialTypes';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            isRead: false,
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
            isRead: false,
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
          isRead: true, // Esta notificação já começa como "lida"
        });
      }

      setNotifications(notifs);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
