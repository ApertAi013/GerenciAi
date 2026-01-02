import { api } from './api';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'event';
  target_type: 'all' | 'modality' | 'level' | 'specific';
  target_modality_id: number | null;
  target_level: string | null;
  modality_name?: string;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by_name?: string;
  target_count?: number;
  read_count?: number;
  target_students?: Array<{
    id: number;
    full_name: string;
    email: string;
    read_at: string | null;
  }>;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'urgent' | 'event';
  target_type?: 'all' | 'modality' | 'level' | 'specific';
  target_modality_id?: number | null;
  target_level?: string | null;
  target_student_ids?: number[];
  starts_at: string;
  expires_at?: string | null;
}

export interface UpdateAnnouncementRequest extends Partial<CreateAnnouncementRequest> {
  is_active?: boolean;
}

export interface AnnouncementsResponse {
  success: boolean;
  message: string;
  data: {
    announcements: Announcement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const announcementService = {
  async getAnnouncements(page = 1, limit = 20, activeOnly = false): Promise<AnnouncementsResponse> {
    const response = await api.get<AnnouncementsResponse>('/api/announcements', {
      params: { page, limit, active_only: activeOnly }
    });
    return response.data;
  },

  async getAnnouncementById(id: number): Promise<{ success: boolean; data: Announcement }> {
    const response = await api.get<{ success: boolean; data: Announcement }>(`/api/announcements/${id}`);
    return response.data;
  },

  async createAnnouncement(data: CreateAnnouncementRequest): Promise<{ success: boolean; message: string; data: Announcement }> {
    const response = await api.post<{ success: boolean; message: string; data: Announcement }>('/api/announcements', data);
    return response.data;
  },

  async updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Promise<{ success: boolean; message: string; data: Announcement }> {
    const response = await api.put<{ success: boolean; message: string; data: Announcement }>(`/api/announcements/${id}`, data);
    return response.data;
  },

  async deleteAnnouncement(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/announcements/${id}`);
    return response.data;
  }
};
