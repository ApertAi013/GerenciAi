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
}

export interface AuthResponse {
  success: boolean;
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
