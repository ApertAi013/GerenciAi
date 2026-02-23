import { api } from './api';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const notificationService = {
  async getNotifications(limit = 50, offset = 0): Promise<{
    status: string;
    data: Notification[];
  }> {
    const response = await api.get('/api/notifications', { params: { limit, offset } });
    return response.data;
  },

  async getUnreadCount(): Promise<{
    status: string;
    data: { count: number };
  }> {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  },

  async markAsRead(id: number): Promise<{ status: string }> {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ status: string }> {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  },
};
