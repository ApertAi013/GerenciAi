import { api } from './api';
import type {
  ReportsResponse,
  OverdueStudent,
  RevenueSummary,
  StudentPaymentHistory,
  InvoiceSummary,
  EnrollmentStatsResponse,
  FinancialMonthlyResponse,
} from '../types/reportTypes';

export const reportService = {
  // Inadimplentes
  async getOverdueByClass(classId: number): Promise<ReportsResponse<OverdueStudent[]>> {
    const response = await api.get<ReportsResponse<OverdueStudent[]>>(`/api/reports/overdue/class/${classId}`);
    return response.data;
  },

  async getOverdueByModality(modalityId: number): Promise<ReportsResponse<OverdueStudent[]>> {
    const response = await api.get<ReportsResponse<OverdueStudent[]>>(`/api/reports/overdue/modality/${modalityId}`);
    return response.data;
  },

  async getAllOverdue(params?: {
    modality_id?: number;
  }): Promise<ReportsResponse<OverdueStudent[]>> {
    const response = await api.get<ReportsResponse<OverdueStudent[]>>('/api/reports/overdue/all', { params });
    return response.data;
  },

  // Receita recebida
  async getReceivedRevenue(params?: {
    period?: 'month' | 'year' | 'custom';
    year?: number;
    month?: number;
    start_date?: string;
    end_date?: string;
    modality_id?: number;
  }): Promise<ReportsResponse<{ total_received: number; invoices: any[] }>> {
    const response = await api.get<ReportsResponse<{ total_received: number; invoices: any[] }>>('/api/reports/revenue/received', { params });
    return response.data;
  },

  // Receita a receber
  async getRevenueToReceive(params?: {
    year?: number;
    month?: number;
    modality_id?: number;
  }): Promise<ReportsResponse<{ total_to_receive: number; invoices: any[] }>> {
    const response = await api.get<ReportsResponse<{ total_to_receive: number; invoices: any[] }>>('/api/reports/revenue/to-receive', { params });
    return response.data;
  },

  // Resumo financeiro
  async getRevenueSummary(params?: {
    year?: number;
    month?: number;
  }): Promise<ReportsResponse<RevenueSummary>> {
    const response = await api.get<ReportsResponse<RevenueSummary>>('/api/reports/revenue/summary', { params });
    return response.data;
  },

  // Histórico de pagamentos por aluno
  async getStudentPaymentHistory(studentId: number): Promise<ReportsResponse<StudentPaymentHistory>> {
    const response = await api.get<ReportsResponse<StudentPaymentHistory>>(`/api/reports/student/${studentId}/payment-history`);
    return response.data;
  },

  // Resumo de faturas (para gráficos)
  async getInvoicesSummary(params?: {
    start_date?: string;
    end_date?: string;
    year?: number;
    month?: number;
  }): Promise<ReportsResponse<InvoiceSummary>> {
    const response = await api.get<ReportsResponse<InvoiceSummary>>('/api/reports/invoices/summary', { params });
    return response.data;
  },

  // Estatísticas de matrículas (novas, canceladas, ativos, churn por mês)
  async getEnrollmentStats(params?: {
    months?: number;
    modality_id?: number;
  }): Promise<ReportsResponse<EnrollmentStatsResponse>> {
    const response = await api.get<ReportsResponse<EnrollmentStatsResponse>>('/api/reports/enrollment-stats', { params });
    return response.data;
  },

  // Dados financeiros mensais completos (receita, ticket médio, por plano, por modalidade)
  async getFinancialMonthly(params?: {
    months?: number;
    modality_id?: number;
  }): Promise<ReportsResponse<FinancialMonthlyResponse>> {
    const response = await api.get<ReportsResponse<FinancialMonthlyResponse>>('/api/reports/financial/monthly', { params });
    return response.data;
  },
};
