import { api } from './api';
import type {
  LevelsResponse,
  Level,
  CreateLevelRequest,
  UpdateLevelRequest
} from '../types/levelTypes';

export const levelService = {
  // List all levels
  async getLevels(): Promise<LevelsResponse> {
    const response = await api.get<LevelsResponse>('/api/levels');
    return response.data;
  },

  // Get level by ID
  async getLevelById(id: number): Promise<{ success: boolean; data: Level }> {
    const response = await api.get<{ success: boolean; data: Level }>(`/api/levels/${id}`);
    return response.data;
  },

  // Create level
  async createLevel(data: CreateLevelRequest): Promise<{ success: boolean; message: string; data: Level }> {
    const response = await api.post<{ success: boolean; message: string; data: Level }>('/api/levels', data);
    return response.data;
  },

  // Update level
  async updateLevel(id: number, data: UpdateLevelRequest): Promise<{ success: boolean; message: string; data: Level }> {
    const response = await api.put<{ success: boolean; message: string; data: Level }>(`/api/levels/${id}`, data);
    return response.data;
  },

  // Delete level
  async deleteLevel(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/levels/${id}`);
    return response.data;
  },

  // Reorder levels
  async reorderLevels(levelIds: number[]): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>('/api/levels/reorder', { levelIds });
    return response.data;
  },
};
