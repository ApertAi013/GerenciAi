import { api } from './api';
import type { ClassesResponse, ModalitiesResponse, CreateClassRequest, Class } from '../types/classTypes';

export const classService = {
  // Listar modalidades
  async getModalities(): Promise<ModalitiesResponse> {
    const response = await api.get<ModalitiesResponse>('/api/modalities');
    return response.data;
  },

  // Listar turmas
  async getClasses(params?: {
    modality_id?: number;
    weekday?: string;
    level?: string;
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<ClassesResponse> {
    const response = await api.get<ClassesResponse>('/api/classes', { params });
    return response.data;
  },

  // Obter turma por ID
  async getClassById(id: number): Promise<{ success: boolean; data: Class }> {
    const response = await api.get<{ success: boolean; data: Class }>(`/api/classes/${id}`);
    return response.data;
  },

  // Criar turma
  async createClass(data: CreateClassRequest): Promise<{ success: boolean; message: string; data: Class }> {
    const response = await api.post<{ success: boolean; message: string; data: Class }>('/api/classes', data);
    return response.data;
  },

  // Atualizar turma
  async updateClass(id: number, data: Partial<CreateClassRequest>): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(`/api/classes/${id}`, data);
    return response.data;
  },

  // Deletar turma
  async deleteClass(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/classes/${id}`);
    return response.data;
  },

  // Criar modalidade
  async createModality(data: { name: string; description?: string }): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/api/modalities', data);
    return response.data;
  },

  // Atualizar modalidade
  async updateModality(id: number, data: { name?: string; description?: string }): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(`/api/modalities/${id}`, data);
    return response.data;
  },

  // Deletar modalidade
  async deleteModality(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/modalities/${id}`);
    return response.data;
  },
};
