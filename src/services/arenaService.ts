import { api } from './api';
import type { Arena } from '../types/authTypes';

interface ArenasResponse {
  status: string;
  data: Arena[];
}

interface ArenaResponse {
  status: string;
  data: Arena;
}

interface ArenaMessageResponse {
  status: string;
  message: string;
}

export interface ArenaKpi {
  arena_id: number;
  arena_name: string;
  student_count: number;
  active_enrollments: number;
  class_count: number;
  total_overdue_cents: number;
  overdue_students: number;
}

export interface ArenaMonthlyEntry {
  arena_id: number;
  arena_name: string;
  faturado_cents: number;
  recebido_cents: number;
  overdue_cents: number;
  pending_cents: number;
}

export interface ArenaDashboardData {
  arenas: ArenaKpi[];
  totals: {
    student_count: number;
    active_enrollments: number;
    class_count: number;
    total_overdue_cents: number;
  };
  monthly: { month: string; arenas: ArenaMonthlyEntry[] }[];
}

interface ArenaDashboardResponse {
  status: string;
  data: ArenaDashboardData;
}

export const arenaService = {
  async getArenas(): Promise<ArenasResponse> {
    const response = await api.get<ArenasResponse>('/api/arenas');
    return response.data;
  },

  async createArena(data: { name: string; description?: string }): Promise<ArenaResponse> {
    const response = await api.post<ArenaResponse>('/api/arenas', data);
    return response.data;
  },

  async updateArena(id: number, data: { name?: string; description?: string }): Promise<ArenaResponse> {
    const response = await api.put<ArenaResponse>(`/api/arenas/${id}`, data);
    return response.data;
  },

  async deleteArena(id: number): Promise<ArenaMessageResponse> {
    const response = await api.delete<ArenaMessageResponse>(`/api/arenas/${id}`);
    return response.data;
  },

  async getDashboard(params?: { months?: number; startMonth?: string; endMonth?: string; modalityId?: number }): Promise<ArenaDashboardResponse> {
    const response = await api.get<ArenaDashboardResponse>('/api/arenas/dashboard', { params });
    return response.data;
  },
};
