import { api } from './api';
import type {
  TrialStudent,
  TrialStudentDetails,
  TrialMetrics,
  CreateTrialStudentRequest,
  UpdateTrialStudentRequest,
  AddToClassRequest,
  SendFollowupRequest,
  UpgradeToRegularRequest,
  TrialStudentsResponse,
  TrialStudentResponse,
  TrialMetricsResponse,
  UpgradeResponse,
} from '../types/trialStudentTypes';

/**
 * Service for managing trial students (alunos experimentais)
 */
export const trialStudentService = {
  /**
   * Get all trial students with optional filtering
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: 'ativo' | 'inativo';
    expired?: boolean;
    search?: string;
  }): Promise<TrialStudentsResponse> {
    const response = await api.get<TrialStudentsResponse>('/api/trial-students', { params });
    return response.data;
  },

  /**
   * Get trial student by ID with full details
   */
  async getById(id: number): Promise<TrialStudentResponse> {
    const response = await api.get<TrialStudentResponse>(`/api/trial-students/${id}`);
    return response.data;
  },

  /**
   * Get trial students by class and date
   */
  async getByClassAndDate(classId: number, date: string): Promise<{
    status: 'success' | 'error';
    message: string;
    data: TrialStudent[];
  }> {
    const response = await api.get('/api/trial-students/by-class', {
      params: { class_id: classId, attendance_date: date },
    });
    return response.data;
  },

  /**
   * Get conversion metrics
   */
  async getMetrics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TrialMetricsResponse> {
    const response = await api.get<TrialMetricsResponse>('/api/trial-students/metrics', { params });
    return response.data;
  },

  /**
   * Create new trial student
   */
  async create(data: CreateTrialStudentRequest): Promise<{
    status: 'success' | 'error';
    message: string;
    data: TrialStudent;
  }> {
    const response = await api.post('/api/trial-students', data);
    return response.data;
  },

  /**
   * Add trial student to a class
   */
  async addToClass(data: AddToClassRequest): Promise<{
    status: 'success' | 'error';
    message: string;
    data: { id: number };
  }> {
    const response = await api.post('/api/trial-students/add-to-class', data);
    return response.data;
  },

  /**
   * Send follow-up to trial student
   */
  async sendFollowup(data: SendFollowupRequest): Promise<{
    status: 'success' | 'error';
    message: string;
    data: { id: number };
  }> {
    const response = await api.post('/api/trial-students/send-followup', data);
    return response.data;
  },

  /**
   * Upgrade trial student to regular student
   */
  async upgradeToRegular(
    trialStudentId: number,
    data: UpgradeToRegularRequest
  ): Promise<UpgradeResponse> {
    const response = await api.post<UpgradeResponse>(
      `/api/trial-students/${trialStudentId}/upgrade`,
      data
    );
    return response.data;
  },

  /**
   * Update trial student
   */
  async update(id: number, data: UpdateTrialStudentRequest): Promise<{
    status: 'success' | 'error';
    message: string;
    data: TrialStudent;
  }> {
    const response = await api.put(`/api/trial-students/${id}`, data);
    return response.data;
  },

  /**
   * Delete trial student
   */
  async delete(id: number): Promise<{
    status: 'success' | 'error';
    message: string;
  }> {
    const response = await api.delete(`/api/trial-students/${id}`);
    return response.data;
  },
};
