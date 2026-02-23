import { api } from './api';

export interface FormOption {
  id: number;
  form_id?: number;
  label: string;
  sort_order: number;
}

export interface Form {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  response_type: 'single_choice' | 'multiple_choice' | 'text_only' | 'choice_with_text';
  target_type: 'all' | 'modality' | 'level' | 'specific';
  target_modality_id: number | null;
  target_level: string | null;
  modality_name?: string;
  is_required: boolean;
  allow_multiple_submissions: boolean;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by_name?: string;
  response_count?: number;
  target_count?: number;
  options?: FormOption[];
  option_counts?: Record<number, number>;
  target_students?: Array<{ id: number; full_name: string; email: string }>;
}

export interface FormResponse {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  selected_options: number[];
  selected_option_labels: string[];
  text_response: string | null;
  submitted_at: string;
}

export interface CreateFormRequest {
  title: string;
  description?: string;
  image_url?: string;
  response_type: 'single_choice' | 'multiple_choice' | 'text_only' | 'choice_with_text';
  target_type?: string;
  target_modality_id?: number | null;
  target_level?: string | null;
  target_student_ids?: number[];
  is_required?: boolean;
  allow_multiple_submissions?: boolean;
  starts_at: string;
  expires_at?: string | null;
  options?: string[];
}

export const formService = {
  async getForms(page = 1, limit = 20, activeOnly = false): Promise<{
    status: string;
    data: {
      forms: Form[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> {
    const response = await api.get('/api/forms', {
      params: { page, limit, active_only: activeOnly },
    });
    return response.data;
  },

  async getFormById(id: number): Promise<{ status: string; data: Form }> {
    const response = await api.get(`/api/forms/${id}`);
    return response.data;
  },

  async createForm(data: CreateFormRequest): Promise<{ status: string; data: Form }> {
    const response = await api.post('/api/forms', data);
    return response.data;
  },

  async updateForm(id: number, data: Partial<CreateFormRequest> & { is_active?: boolean }): Promise<{ status: string; data: Form }> {
    const response = await api.put(`/api/forms/${id}`, data);
    return response.data;
  },

  async deleteForm(id: number): Promise<{ status: string }> {
    const response = await api.delete(`/api/forms/${id}`);
    return response.data;
  },

  async getFormResponses(id: number, page = 1, limit = 50): Promise<{
    status: string;
    data: {
      responses: FormResponse[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> {
    const response = await api.get(`/api/forms/${id}/responses`, { params: { page, limit } });
    return response.data;
  },

  async exportFormResponses(id: number): Promise<Blob> {
    const response = await api.get(`/api/forms/${id}/responses/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.url;
  },
};
