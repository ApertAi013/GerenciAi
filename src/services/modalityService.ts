import { api } from './api';
import type {
  ModalitiesResponse,
  Modality,
  CreateModalityRequest,
  UpdateModalityRequest
} from '../types/levelTypes';

export const modalityService = {
  // List all modalities
  async getModalities(): Promise<ModalitiesResponse> {
    const response = await api.get<ModalitiesResponse>('/api/modalities');
    return response.data;
  },

  // Get modality by ID
  async getModalityById(id: number): Promise<{ success: boolean; data: Modality }> {
    const response = await api.get<{ success: boolean; data: Modality }>(`/api/modalities/${id}`);
    return response.data;
  },

  // Create modality
  async createModality(data: CreateModalityRequest): Promise<{ success: boolean; message: string; data: Modality }> {
    const response = await api.post<{ success: boolean; message: string; data: Modality }>('/api/modalities', data);
    return response.data;
  },

  // Update modality
  async updateModality(id: number, data: UpdateModalityRequest): Promise<{ success: boolean; message: string; data: Modality }> {
    const response = await api.put<{ success: boolean; message: string; data: Modality }>(`/api/modalities/${id}`, data);
    return response.data;
  },

  // Delete modality
  async deleteModality(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/modalities/${id}`);
    return response.data;
  },
};
