import { api } from './api';

// Tipos
export interface CreditBalance {
  makeup_credits: number;
}

export interface CreditHistoryItem {
  id: number;
  credit_change: number;
  reason: 'cancel_8h' | 'use_reservation' | 'manual_add' | 'manual_remove';
  notes?: string;
  created_at: string;
  court_name?: string;
  reservation_date?: string;
  start_time?: string;
}

export interface AddCreditsRequest {
  credits: number;
  notes?: string;
}

export interface RemoveCreditsRequest {
  credits: number;
  notes?: string;
}

export interface SetPasswordRequest {
  password: string;
}

export interface CreditManagementResponse {
  success: boolean;
  message: string;
  data: {
    student_id: number;
    student_name: string;
    old_balance: number;
    new_balance: number;
    credits_changed: number;
  };
}

export interface PasswordSetResponse {
  success: boolean;
  message: string;
  data: {
    student_id: number;
    student_name: string;
  };
}

export interface StudentCreditsResponse {
  success: boolean;
  message: string;
  data: {
    student: {
      id: number;
      full_name: string;
      email: string;
      makeup_credits: number;
    };
    history: CreditHistoryItem[];
  };
}

export const courtReservationService = {
  /**
   * Buscar créditos e histórico de um aluno (Gestor)
   */
  async getStudentCredits(studentId: number): Promise<StudentCreditsResponse> {
    const response = await api.get<StudentCreditsResponse>(
      `/api/court-reservations/students/${studentId}/credits`
    );
    return response.data;
  },

  /**
   * Adicionar créditos manualmente a um aluno (Gestor)
   */
  async addCredits(
    studentId: number,
    data: AddCreditsRequest
  ): Promise<CreditManagementResponse> {
    const response = await api.post<CreditManagementResponse>(
      `/api/court-reservations/students/${studentId}/credits/add`,
      data
    );
    return response.data;
  },

  /**
   * Remover créditos manualmente de um aluno (Gestor)
   */
  async removeCredits(
    studentId: number,
    data: RemoveCreditsRequest
  ): Promise<CreditManagementResponse> {
    const response = await api.post<CreditManagementResponse>(
      `/api/court-reservations/students/${studentId}/credits/remove`,
      data
    );
    return response.data;
  },

  /**
   * Definir senha inicial do aluno (Gestor)
   */
  async setStudentPassword(
    studentId: number,
    data: SetPasswordRequest
  ): Promise<PasswordSetResponse> {
    const response = await api.post<PasswordSetResponse>(
      `/api/court-reservations/students/${studentId}/set-password`,
      data
    );
    return response.data;
  },
};
