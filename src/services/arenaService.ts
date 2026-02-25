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
};
