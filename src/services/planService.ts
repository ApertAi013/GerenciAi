import { api } from './api';
import type { Plan } from '../types/enrollmentTypes';

export interface CreatePlanRequest {
  name: string;
  sessions_per_week: number;
  price_cents: number;
  description?: string;
  modality_id?: number;
}

export interface UpdatePlanRequest {
  name?: string;
  sessions_per_week?: number;
  price_cents?: number;
  description?: string;
  status?: 'ativo' | 'inativo';
  modality_id?: number;
}

export interface BulkAdjustRequest {
  plan_ids: number[] | 'all';
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  apply_to_open_invoices?: boolean;
  apply_from_month?: string;
}

export interface BulkAdjustResponse {
  success: boolean;
  message: string;
  data: {
    plans_updated: number;
    invoices_updated: number;
    details: Array<{
      plan_id: number;
      plan_name: string;
      old_price_cents: number;
      new_price_cents: number;
      old_price: string;
      new_price: string;
      change: string;
      invoices_updated: number;
    }>;
  };
}

export const planService = {
  // List all plans
  async getPlans(): Promise<{ success: boolean; data: Plan[] }> {
    const response = await api.get<{ success: boolean; data: Plan[] }>('/api/plans');
    return response.data;
  },

  // Get plan by ID
  async getPlanById(id: number): Promise<{ success: boolean; data: Plan }> {
    const response = await api.get<{ success: boolean; data: Plan }>(`/api/plans/${id}`);
    return response.data;
  },

  // Create plan
  async createPlan(data: CreatePlanRequest): Promise<{ success: boolean; message: string; data: Plan }> {
    const response = await api.post<{ success: boolean; message: string; data: Plan }>('/api/plans', data);
    return response.data;
  },

  // Update plan
  async updatePlan(id: number, data: UpdatePlanRequest): Promise<{ success: boolean; message: string; data: Plan }> {
    const response = await api.put<{ success: boolean; message: string; data: Plan }>(`/api/plans/${id}`, data);
    return response.data;
  },

  // Delete plan
  async deletePlan(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/plans/${id}`);
    return response.data;
  },

  // Bulk adjust prices (reajuste em massa)
  async bulkAdjustPrices(data: BulkAdjustRequest): Promise<BulkAdjustResponse> {
    const response = await api.post<BulkAdjustResponse>('/api/plans/bulk-adjust', data);
    return response.data;
  },
};
