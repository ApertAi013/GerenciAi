export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
export type ScopeType = 'all' | 'classes' | 'students';
export type AsaasChargeStatus = 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
export type TransferStatus = 'PENDING' | 'DONE' | 'CANCELLED' | 'FAILED';

export interface ScopeEntry {
  id: number;
  config_id: number;
  scope_entity_type: 'class' | 'student';
  entity_id: number;
  entity_name: string;
}

export interface AppPaymentConfig {
  id: number;
  user_id: number;
  configured: boolean;
  is_enabled: boolean;
  pix_key: string | null;
  pix_key_type: PixKeyType | null;
  pix_key_holder_name: string | null;
  scope_type: ScopeType;
  asaas_fee_percent: number;
  platform_fee_percent: number;
  accepted_terms_at: string | null;
  credit_card_enabled?: boolean;
  credit_card_fee_mode?: 'absorb' | 'pass_to_student';
  credit_card_asaas_fee_percent?: number;
  credit_card_platform_fee_percent?: number;
  scope_entries: ScopeEntry[];
  created_at: string;
  updated_at: string;
}

export interface FeeBreakdown {
  asaas_fee_percent: number;
  platform_fee_percent: number;
  total_fee_percent: number;
  example: {
    gross: number;
    asaas_fee: number;
    platform_fee: number;
    net: number;
  };
  credit_card?: {
    asaas_fee_percent: number;
    platform_fee_percent: number;
    total_fee_percent: number;
    example: {
      gross: number;
      asaas_fee: number;
      platform_fee: number;
      net: number;
    };
  };
}

export interface AppPaymentCharge {
  id: number;
  user_id: number;
  invoice_id: number;
  student_id: number;
  student_name: string;
  reference_month: string;
  plan_name: string;
  asaas_customer_id: string;
  asaas_charge_id: string;
  asaas_status: AsaasChargeStatus;
  gross_amount_cents: number;
  asaas_fee_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  pix_qr_code: string;
  pix_qr_code_image: string;
  pix_expiration_date: string | null;
  due_date: string;
  paid_at: string | null;
  asaas_transfer_id: string | null;
  transfer_status: TransferStatus | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulkGenerateResponse {
  generated: number;
  skipped: number;
  errors: Array<{
    invoice_id: number;
    student_name: string;
    message: string;
  }>;
}
