import { api } from './api';
import type { Student, StudentsResponse, CreateStudentRequest, UpdateStudentRequest } from '../types/studentTypes';

export const studentService = {
  // Listar alunos
  async getStudents(params?: {
    status?: 'ativo' | 'inativo' | 'pendente';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<StudentsResponse> {
    const response = await api.get<StudentsResponse>('/api/students', { params });
    return response.data;
  },

  // Obter aluno por ID
  async getStudentById(id: number): Promise<{ success: boolean; message: string; data: Student }> {
    const response = await api.get<{ success: boolean; message: string; data: Student }>(`/api/students/${id}`);
    return response.data;
  },

  // Criar aluno
  async createStudent(data: CreateStudentRequest): Promise<{ success: boolean; message: string; data: Student }> {
    const response = await api.post<{ success: boolean; message: string; data: Student }>('/api/students', data);
    return response.data;
  },

  // Atualizar aluno
  async updateStudent(id: number, data: UpdateStudentRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(`/api/students/${id}`, data);
    return response.data;
  },

  // Deletar aluno
  async deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/students/${id}`);
    return response.data;
  },

  // Obter todos os alunos (sem paginação, para selects)
  async getAllStudents(): Promise<{ success: boolean; data: Array<{ id: number; full_name: string; email: string }> }> {
    const response = await api.get<StudentsResponse>('/api/students', { params: { limit: 1000 } });
    return {
      success: response.data.success,
      data: response.data.data || []
    };
  },

  // Registration link
  async getRegistrationToken(): Promise<{ success: boolean; data: { token: string | null } }> {
    const response = await api.get('/api/students/registration-token');
    return response.data;
  },

  async generateRegistrationToken(): Promise<{ success: boolean; data: { token: string } }> {
    const response = await api.post('/api/students/registration-token/generate');
    return response.data;
  },

  async getPendingRegistrations(): Promise<{ success: boolean; data: PendingRegistration[] }> {
    const response = await api.get('/api/students/pending-registrations');
    return response.data;
  },

  async approveRegistration(id: number, level_id: number): Promise<{ success: boolean; data: Student }> {
    const response = await api.put(`/api/students/${id}/approve-registration`, { level_id });
    return response.data;
  },

  async rejectRegistration(id: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/students/${id}/reject-registration`);
    return response.data;
  },
};

export interface PendingRegistration {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  sex?: string;
  created_at: string;
}
