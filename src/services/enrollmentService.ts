import { api } from './api';
import type {
  PlansResponse,
  EnrollmentsResponse,
  CreateEnrollmentRequest,
  UpdateEnrollmentClassesRequest,
  UpdateEnrollmentRequest,
  Enrollment,
  EnrollmentClass
} from '../types/enrollmentTypes';

export const enrollmentService = {
  // Listar planos
  async getPlans(): Promise<PlansResponse> {
    const response = await api.get<PlansResponse>('/api/enrollments/plans');
    return response.data;
  },

  // Listar matrículas
  async getEnrollments(params?: {
    student_id?: number;
    status?: string;
    search?: string;
  }): Promise<EnrollmentsResponse> {
    const response = await api.get<EnrollmentsResponse>('/api/enrollments', { params });
    return response.data;
  },

  // Obter matrícula por ID
  // NOTA: Este endpoint não está documentado na API oficial
  // Não usar até confirmar que existe no backend
  // async getEnrollmentById(id: number): Promise<{ success: boolean; data: Enrollment }> {
  //   const response = await api.get<{ success: boolean; data: Enrollment }>(`/api/enrollments/${id}`);
  //   return response.data;
  // },

  // Criar matrícula
  async createEnrollment(data: CreateEnrollmentRequest): Promise<{
    success: boolean;
    message: string;
    data: Enrollment;
  }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: Enrollment;
    }>('/api/enrollments', data);
    return response.data;
  },

  // Atualizar matrícula (novo endpoint completo)
  async updateEnrollment(
    enrollmentId: number,
    data: UpdateEnrollmentRequest
  ): Promise<{ success: boolean; message: string; enrollment?: Enrollment }> {
    console.log('🔵 enrollmentService.updateEnrollment:', {
      enrollmentId,
      data,
      url: `/api/enrollments/${enrollmentId}`
    });

    const response = await api.put<{ success: boolean; message: string; enrollment?: Enrollment }>(
      `/api/enrollments/${enrollmentId}`,
      data
    );

    console.log('🟢 Resposta da API:', response.data);

    return response.data;
  },

  // Atualizar turmas da matrícula (endpoint legado)
  async updateEnrollmentClasses(
    enrollmentId: number,
    data: UpdateEnrollmentClassesRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(
      `/api/enrollments/${enrollmentId}/classes`,
      data
    );
    return response.data;
  },

  // Buscar alunos de uma turma específica
  // NOTA: Não usar! Use GET /api/classes/{id} que já retorna os alunos
  // async getStudentsByClass(classId: number): Promise<{
  //   success: boolean;
  //   students: Array<{ id: number; name: string; enrollment_id: number }>;
  // }> {
  //   try {
  //     const response = await api.get<{
  //       success: boolean;
  //       data: Array<{
  //         id: number;
  //         student_id: number;
  //         student_name: string;
  //         class_ids: number[];
  //       }>;
  //     }>('/api/enrollments', { params: { status: 'ativa' } });
  //
  //     if (!response.data.success) {
  //       return { success: false, students: [] };
  //     }
  //
  //     const students = response.data.data
  //       .filter((enrollment: any) =>
  //         enrollment.class_ids && enrollment.class_ids.includes(classId)
  //       )
  //       .map((enrollment: any) => ({
  //         id: enrollment.student_id,
  //         name: enrollment.student_name || 'Aluno sem nome',
  //         enrollment_id: enrollment.id
  //       }));
  //
  //     return { success: true, students };
  //   } catch (error) {
  //     console.error('Erro ao buscar alunos da turma:', error);
  //     return { success: false, students: [] };
  //   }
  // },

  // Aplicar desconto
  async applyDiscount(
    enrollmentId: number,
    data: {
      discount_type: 'fixed' | 'percentage';
      discount_value: number;
      discount_until?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.patch<{ success: boolean; message: string }>(
      `/api/enrollments/${enrollmentId}/discount`,
      data
    );
    return response.data;
  },

  // Marcar presença
  async markAttendance(data: {
    enrollment_id: number;
    class_id: number;
    class_date: string;
    present: boolean;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/enrollments/attendance',
      data
    );
    return response.data;
  },

  // Consultar presenças
  async getAttendance(params: {
    class_id?: number;
    class_date?: string;
    enrollment_id?: number;
  }): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get<{ success: boolean; data: any[] }>(
      '/api/enrollments/attendance',
      { params }
    );
    return response.data;
  },
};
