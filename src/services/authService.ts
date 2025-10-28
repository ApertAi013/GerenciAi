import { api } from './api';
import type { LoginRequest, AuthResponse, User } from '../types/authTypes';

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  // Obter usuário atual
  async getMe(): Promise<{ success: boolean; user: User }> {
    const response = await api.get<{ success: boolean; user: User }>('/api/auth/me');
    return response.data;
  },

  // Salvar token no localStorage
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  },

  // Obter token do localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Remover token do localStorage
  removeToken(): void {
    localStorage.removeItem('token');
  },

  // Logout
  logout(): void {
    this.removeToken();
    window.location.href = '/login';
  },
};
