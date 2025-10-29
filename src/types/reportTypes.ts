// Tipos para Relatórios Financeiros

export interface RevenueData {
  month: string;
  received: number;
  expected: number;
}

export interface InvoiceSummary {
  total_invoices: number;
  total_value: number;
  paid_invoices: number;
  paid_value: number;
  overdue_invoices: number;
  overdue_value: number;
  pending_invoices: number;
  pending_value: number;
}

export interface OverdueStudent {
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  invoice_id: number;
  reference_month: string;
  due_date: string;
  amount_cents: number;
  days_overdue: number;
}

export interface PaymentHistoryItem {
  invoice_id: number;
  reference_month: string;
  amount_cents: number;
  paid_at: string;
  method: string;
  notes?: string;
}

export interface StudentPaymentHistory {
  student: {
    id: number;
    full_name: string;
    email: string;
  };
  payments: PaymentHistoryItem[];
  total_paid: number;
}

export interface RevenueSummary {
  period: string;
  total_received: number;
  total_expected: number;
  total_overdue: number;
  paid_count: number;
  overdue_count: number;
  pending_count: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  meta?: number;
}

export interface TicketMedioData {
  month: string;
  ticket_medio_geral: number;
  ticket_medio_contrato: number;
  ticket_medio_produto: number;
}

export interface ContractStats {
  month: string;
  novos_contratos: number;
  contratos_renovados: number;
  contratos_cancelados: number;
}

export interface SalesOriginData {
  origin: string;
  percentage: number;
  count: number;
}

export interface ChurnData {
  month: string;
  churn_rate: number;
}

export interface ActiveClientsData {
  month: string;
  active_clients: number;
  meta?: number;
}

export interface ReportsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
