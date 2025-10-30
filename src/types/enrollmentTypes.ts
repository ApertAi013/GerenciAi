export interface Plan {
  id: number;
  name: string;
  sessions_per_week: number;
  price_cents: number;
  price?: string;
  description?: string;
  status: 'ativo' | 'inativo';
}

export interface Enrollment {
  id: number;
  student_id: number;
  student_name?: string;
  plan_id: number;
  plan_name?: string;
  start_date: string;
  end_date?: string;
  due_day: number;
  contract_type?: 'mensal' | 'anual';
  status: 'ativa' | 'suspensa' | 'cancelada' | 'concluida';
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
  discount_until?: string;
  created_at?: string;
  class_ids?: number[];
  classes?: any[]; // Full class details
}

export interface EnrollmentClass {
  enrollment_id: number;
  class_id: number;
  student_id?: number;
  student_name?: string;
}

export interface PlansResponse {
  success: boolean;
  message?: string;
  plans: Plan[];
}

export interface EnrollmentsResponse {
  success: boolean;
  message?: string;
  data: Enrollment[];
}

export interface CreateEnrollmentRequest {
  student_id: number;
  plan_id: number;
  start_date: string;
  due_day?: number;
  contract_type?: 'mensal' | 'anual';
  class_ids: number[];
}

export interface UpdateEnrollmentClassesRequest {
  class_ids: number[];
}

export interface UpdateEnrollmentRequest {
  plan_id?: number;
  contract_type?: 'mensal' | 'anual';
  class_ids?: number[];
  discount_type?: 'none' | 'fixed' | 'percentage';
  discount_value?: number;
  discount_until?: string;
  due_day?: number;
  status?: 'ativa' | 'suspensa' | 'cancelada' | 'concluida';
}
