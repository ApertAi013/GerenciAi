import { api } from './api';
import type {
  AppPaymentConfig,
  FeeBreakdown,
  AppPaymentCharge,
  BulkGenerateResponse,
  PixKeyType,
  ScopeType,
} from '../types/appPaymentTypes';

export const appPaymentService = {
  // Config
  async getConfig(): Promise<{ status: string; data: AppPaymentConfig }> {
    const response = await api.get('/api/app-payments/config');
    return response.data;
  },

  async setupPixKey(data: {
    pix_key: string;
    pix_key_type: PixKeyType;
    pix_key_holder_name?: string;
  }): Promise<{ status: string; message: string }> {
    const response = await api.post('/api/app-payments/setup', data);
    return response.data;
  },

  async updateConfig(data: {
    is_enabled?: boolean;
    pix_key?: string;
    pix_key_type?: PixKeyType;
    pix_key_holder_name?: string;
    credit_card_enabled?: boolean;
    credit_card_fee_mode?: 'absorb' | 'pass_to_student';
  }): Promise<{ status: string; message: string }> {
    const response = await api.put('/api/app-payments/config', data);
    return response.data;
  },

  async acceptTerms(): Promise<{ status: string; message: string }> {
    const response = await api.post('/api/app-payments/accept-terms');
    return response.data;
  },

  // Escopo
  async updateScope(data: {
    scope_type: ScopeType;
    entity_ids?: number[];
  }): Promise<{ status: string; message: string }> {
    const response = await api.put('/api/app-payments/scope', data);
    return response.data;
  },

  // Taxas
  async getFees(): Promise<{ status: string; data: FeeBreakdown }> {
    const response = await api.get('/api/app-payments/fees');
    return response.data;
  },

  // Cobranças
  async generateCharge(invoiceId: number): Promise<{ status: string; data: AppPaymentCharge; message: string }> {
    const response = await api.post('/api/app-payments/charges/generate', { invoice_id: invoiceId });
    return response.data;
  },

  async generateBulkCharges(data: {
    invoice_ids?: number[];
    reference_month?: string;
  }): Promise<{ status: string; data: BulkGenerateResponse; message: string }> {
    const response = await api.post('/api/app-payments/charges/generate-bulk', data);
    return response.data;
  },

  async getCharges(params?: {
    status?: string;
    reference_month?: string;
    student_id?: number;
  }): Promise<{ status: string; data: AppPaymentCharge[] }> {
    const response = await api.get('/api/app-payments/charges', { params });
    return response.data;
  },

  async getCharge(id: number): Promise<{ status: string; data: AppPaymentCharge }> {
    const response = await api.get(`/api/app-payments/charges/${id}`);
    return response.data;
  },

  async refreshChargeStatus(id: number): Promise<{ status: string; data: AppPaymentCharge; message: string }> {
    const response = await api.post(`/api/app-payments/charges/${id}/refresh`);
    return response.data;
  },
};
