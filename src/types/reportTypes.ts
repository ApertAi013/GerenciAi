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

// Enrollment Stats
export interface EnrollmentMonthlyData {
  month: string;
  new_enrollments: number;
  cancellations: number;
  active_at_end: number;
  churn_rate: number;
}

export interface EnrollmentStatsResponse {
  monthly: EnrollmentMonthlyData[];
  summary: {
    current_active: number;
    total_new: number;
    total_cancellations: number;
  };
}

// Financial Monthly Breakdown
export interface FinancialMonthlyData {
  month: string;
  faturado_cents: number;
  recebido_cents: number;
  overdue_cents: number;
  pending_cents: number;
  invoice_count: number;
  paid_count: number;
  ticket_medio_cents: number;
}

export interface PlanBreakdown {
  plan_name: string;
  enrollment_count: number;
  total_received_cents: number;
  percentage: number;
}

export interface ModalityBreakdown {
  modality_name: string;
  icon?: string;
  enrollment_count: number;
  percentage: number;
}

export interface FinancialMonthlyResponse {
  monthly: FinancialMonthlyData[];
  by_plan: PlanBreakdown[];
  by_modality: ModalityBreakdown[];
  overdue_summary: {
    overdue_students: number;
    total_overdue_cents: number;
    overdue_invoice_count: number;
  };
}

export interface CancelledEnrollment {
  id: number;
  cancelled_at: string;
  created_at: string;
  student_id: number;
  student_name: string;
  student_phone?: string;
  student_email?: string;
  plan_name: string;
}

export interface NewEnrollment {
  id: number;
  created_at: string;
  student_id: number;
  student_name: string;
  student_phone?: string;
  student_email?: string;
  plan_name: string;
}

// Payment Curve (accumulated daily payments per month)
export interface PaymentCurvePoint {
  day: number;
  accumulated_cents: number;
}

export interface PaymentCurveMonth {
  month: string;
  label: string;
  is_current: boolean;
  points: PaymentCurvePoint[];
}

export interface PaymentCurveResponse {
  curves: PaymentCurveMonth[];
}

export interface ReportsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
