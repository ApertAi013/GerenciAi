// Types for Trial Students (Alunos Experimentais)

export interface TrialStudent {
  id: number;
  user_id: number;
  full_name: string;
  phone?: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  sex?: 'M' | 'F' | 'N/I';
  level?: 'iniciante' | 'intermediario' | 'avancado';
  status: 'ativo' | 'inativo';
  is_trial: boolean;
  trial_retention_days?: number;
  trial_expiration_date?: string;
  trial_start_date?: string;
  trial_converted_to_regular: boolean;
  trial_converted_at?: string;
  trial_notes?: string;
  trial_classes_count?: number;
  followups_count?: number;
  is_expired?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TrialClass {
  id: number;
  class_id: number;
  class_name: string;
  attendance_date: string;
  attended: boolean;
  notes?: string;
  created_at: string;
}

export interface TrialFollowup {
  id: number;
  followup_type: 'email' | 'whatsapp' | 'phone' | 'other';
  followup_date: string;
  message_sent?: string;
  response_received?: string;
  status: 'pending' | 'sent' | 'delivered' | 'responded' | 'failed';
  sent_by_user_id?: number;
  sent_by_user_name?: string;
}

export interface TrialStudentDetails extends TrialStudent {
  trial_classes: TrialClass[];
  followups: TrialFollowup[];
}

export interface TrialMetrics {
  total_trial_students: number;
  converted_students: number;
  active_trial_students: number;
  avg_days_to_convert: number;
  total_conversion_value_cents: number;
  conversion_rate_percentage: number;
}

export interface CreateTrialStudentRequest {
  full_name: string;
  phone?: string;
  email?: string;
  retention_days?: 30 | 60 | 90 | null;
  notes?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado';
}

export interface UpdateTrialStudentRequest {
  full_name?: string;
  phone?: string;
  email?: string;
  trial_retention_days?: 30 | 60 | 90 | null;
  trial_notes?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado';
  status?: 'ativo' | 'inativo';
}

export interface AddToClassRequest {
  trial_student_id: number;
  class_id: number;
  attendance_date: string;
  notes?: string;
}

export interface SendFollowupRequest {
  trial_student_id: number;
  followup_type?: 'email' | 'whatsapp' | 'phone' | 'other';
  custom_message?: string;
}

export interface UpgradeToRegularRequest {
  cpf: string;
  birth_date?: string;
  sex?: 'M' | 'F' | 'N/I';
  plan_id: number;
  class_ids: number[];
  start_date: string;
  due_day?: number;
  contract_type?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
}

export interface TrialStudentsResponse {
  status: 'success' | 'error';
  message: string;
  data: TrialStudent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TrialStudentResponse {
  status: 'success' | 'error';
  message: string;
  data: TrialStudentDetails;
}

export interface TrialMetricsResponse {
  status: 'success' | 'error';
  message: string;
  data: TrialMetrics;
}

export interface UpgradeResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    student_id: number;
    enrollment_id: number;
    invoice_id: number;
  };
}

// Email automation configuration types
export interface EmailAutomationConfig {
  enabled: boolean;
  days_after_first_class: number;
  template_message: string;
  send_time: string; // HH:mm format
  send_to_expired_only: boolean;
  max_followups_per_student: number;
}
