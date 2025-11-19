import { api } from './api';
import type {
  InvoicesResponse,
  GenerateInvoicesRequest,
  RegisterPaymentRequest,
} from '../types/financialTypes';

export const financialService = {
  // Listar faturas
  async getInvoices(params?: {
    status?: string;
    reference_month?: string;
    student_id?: number;
    instructor_id?: number;
    modality_id?: number;
    page?: number;
    limit?: number;
  }): Promise<InvoicesResponse> {
    const response = await api.get<InvoicesResponse>('/api/invoices', { params });
    return response.data;
  },

  // Buscar filtros disponíveis (instrutores e modalidades)
  async getFilters(): Promise<{
    data: {
      instructors: Array<{ id: number; name: string; email: string }>;
      modalities: Array<{ id: number; name: string }>;
    };
  }> {
    const response = await api.get('/api/invoices/filters');
    return response.data;
  },

  // Gerar faturas do mês
  async generateInvoices(data: GenerateInvoicesRequest): Promise<{
    status: string;
    message: string;
  }> {
    const response = await api.post<{
      status: string;
      message: string;
    }>('/api/invoices/generate', data);
    return response.data;
  },

  // Registrar pagamento
  async registerPayment(data: RegisterPaymentRequest): Promise<{
    status: string;
    message: string;
  }> {
    const response = await api.post<{
      status: string;
      message: string;
    }>('/api/invoices/payment', data);
    return response.data;
  },

  // Cancelar fatura
  async cancelInvoice(invoiceId: number): Promise<{
    status: string;
    message: string;
  }> {
    const response = await api.patch<{
      status: string;
      message: string;
    }>(`/api/invoices/${invoiceId}/cancel`);
    return response.data;
  },

  // Atualizar faturas vencidas
  async updateOverdueInvoices(): Promise<{
    status: string;
    message: string;
  }> {
    const response = await api.post<{
      status: string;
      message: string;
    }>('/api/invoices/update-overdue');
    return response.data;
  },
};
