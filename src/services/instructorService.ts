import { api } from './api';
import type {
  Instructor,
  CreateInstructorRequest,
  UpdateInstructorPermissionsRequest,
  AssignClassRequest,
  InstructorClass,
  AvailablePermissions
} from '../types/instructorTypes';

export const instructorService = {
  // Listar todos os instrutores
  async getInstructors(): Promise<{ success: boolean; message: string; data: Instructor[] }> {
    const response = await api.get<{ success: boolean; message: string; data: Instructor[] }>('/api/instructors');
    return response.data;
  },

  // Obter instrutor por ID
  async getInstructorById(id: number): Promise<{ success: boolean; message: string; data: Instructor }> {
    const response = await api.get<{ success: boolean; message: string; data: Instructor }>(`/api/instructors/${id}`);
    return response.data;
  },

  // Criar novo instrutor
  async createInstructor(data: CreateInstructorRequest): Promise<{ success: boolean; message: string; data: Instructor }> {
    const response = await api.post<{ success: boolean; message: string; data: Instructor }>('/api/instructors', data);
    return response.data;
  },

  // Atualizar permissões do instrutor
  async updateInstructorPermissions(
    id: number,
    data: UpdateInstructorPermissionsRequest
  ): Promise<{ success: boolean; message: string; data: Instructor }> {
    const response = await api.put<{ success: boolean; message: string; data: Instructor }>(
      `/api/instructors/${id}/permissions`,
      data
    );
    return response.data;
  },

  // Atribuir turma ao instrutor
  async assignClass(id: number, data: AssignClassRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/api/instructors/${id}/classes`, data);
    return response.data;
  },

  // Remover turma do instrutor
  async unassignClass(id: number, classId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/instructors/${id}/classes/${classId}`
    );
    return response.data;
  },

  // Obter turmas do instrutor
  async getInstructorClasses(id: number): Promise<{ success: boolean; message: string; data: InstructorClass[] }> {
    const response = await api.get<{ success: boolean; message: string; data: InstructorClass[] }>(
      `/api/instructors/${id}/classes`
    );
    return response.data;
  },

  // Remover instrutor
  async removeInstructor(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/instructors/${id}`);
    return response.data;
  },

  // Obter lista de permissões disponíveis
  async getAvailablePermissions(): Promise<{ success: boolean; message: string; data: AvailablePermissions }> {
    const response = await api.get<{ success: boolean; message: string; data: AvailablePermissions }>(
      '/api/instructors/permissions'
    );
    return response.data;
  },
};
