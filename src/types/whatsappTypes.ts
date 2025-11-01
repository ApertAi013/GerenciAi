// WhatsApp Types

export interface WhatsAppConfig {
  id?: number;
  user_id?: number;
  phone_number_id: string;
  business_account_id?: string;
  access_token: string;
  webhook_verify_token?: string;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type TemplateType = 'due_reminder' | 'overdue_reminder' | 'payment_confirmation';

export interface WhatsAppTemplate {
  id?: number;
  user_id?: number;
  name: string;
  template_type: TemplateType;
  message_template: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationSettings {
  id?: number;
  user_id?: number;
  due_reminder_enabled: boolean;
  due_reminder_days_before: number;
  due_reminder_template_id: number | null;
  due_reminder_template_name?: string;
  overdue_reminder_enabled: boolean;
  overdue_reminder_frequency_days: number;
  overdue_reminder_max_count: number;
  overdue_reminder_template_id: number | null;
  overdue_reminder_template_name?: string;
  payment_confirmation_enabled: boolean;
  payment_confirmation_template_id: number | null;
  payment_confirmation_template_name?: string;
  send_time_hour: number;
  send_time_minute: number;
  skip_weekends: boolean;
  created_at?: string;
  updated_at?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'due_reminder' | 'overdue_reminder' | 'payment_confirmation' | 'test';

export interface WhatsAppMessageLog {
  id: number;
  user_id: number;
  student_id: number | null;
  student_name: string | null;
  invoice_id: number | null;
  reference_month: string | null;
  due_date: string | null;
  final_amount_cents: number | null;
  phone_number: string;
  message_type: MessageType;
  message_content: string;
  template_id: number | null;
  whatsapp_message_id: string | null;
  status: MessageStatus;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface CreateConfigData {
  phoneNumberId: string;
  businessAccountId?: string;
  accessToken: string;
  webhookVerifyToken?: string;
}

export interface UpdateConfigData {
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  isActive?: boolean;
}

export interface ToggleActiveData {
  isActive: boolean;
}

export interface SendTestData {
  phoneNumber: string;
}

export interface CreateTemplateData {
  name: string;
  templateType: TemplateType;
  messageTemplate: string;
  isActive: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  messageTemplate?: string;
  isActive?: boolean;
}

export interface UpdateAutomationSettingsData {
  due_reminder_enabled?: boolean;
  due_reminder_days_before?: number;
  due_reminder_template_id?: number | null;
  overdue_reminder_enabled?: boolean;
  overdue_reminder_frequency_days?: number;
  overdue_reminder_max_count?: number;
  overdue_reminder_template_id?: number | null;
  payment_confirmation_enabled?: boolean;
  payment_confirmation_template_id?: number | null;
  send_time_hour?: number;
  send_time_minute?: number;
  skip_weekends?: boolean;
}

export interface LogsFilters {
  studentId?: number;
  messageType?: MessageType;
  status?: MessageStatus;
  limit?: number;
  offset?: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  availableFor: TemplateType[];
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: '{{student_name}}',
    description: 'Nome completo do aluno',
    availableFor: ['due_reminder', 'overdue_reminder', 'payment_confirmation'],
  },
  {
    name: '{{due_date}}',
    description: 'Data de vencimento (ex: 10/11/2025)',
    availableFor: ['due_reminder', 'overdue_reminder', 'payment_confirmation'],
  },
  {
    name: '{{amount}}',
    description: 'Valor formatado (ex: R$ 270,00)',
    availableFor: ['due_reminder', 'overdue_reminder', 'payment_confirmation'],
  },
  {
    name: '{{days_until_due}}',
    description: 'Dias até o vencimento',
    availableFor: ['due_reminder'],
  },
  {
    name: '{{days_overdue}}',
    description: 'Dias de atraso',
    availableFor: ['overdue_reminder'],
  },
];
