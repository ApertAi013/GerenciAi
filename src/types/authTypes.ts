export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
  status: string;
  premium_features?: string[];
  billing_status?: 'trial' | 'active' | 'past_due' | 'blocked';
  billing_plan_slug?: string;
  max_students?: number;
  max_classes?: number;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
}

export type { User };
