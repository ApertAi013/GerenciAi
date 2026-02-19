export interface Invoice {
  id: number;
  enrollment_id: number;
  student_id?: number;
  plan_id?: number;
  student_name?: string;
  student_phone?: string;
  plan_name?: string;
  reference_month: string;
  due_date: string;
  amount_cents: number;
  discount_cents?: number;
  final_amount_cents: number;
  paid_amount_cents?: number;
  payment_id?: number;
  payment_method?: 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro';
  status: 'aberta' | 'paga' | 'vencida' | 'cancelada' | 'estornada';
  notes?: string;
  paid_at?: string;
  created_at?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount_cents: number;
  method: 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro';
  paid_at: string;
  notes?: string;
  created_at?: string;
}

export interface InvoicesResponse {
  status: string;
  data: {
    invoices: Invoice[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GenerateInvoicesRequest {
  reference_month: string;
}

export interface RegisterPaymentRequest {
  invoice_id: number;
  paid_at: string;
  method: 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro';
  amount_cents: number;
  notes?: string;
}
