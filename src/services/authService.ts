import { api } from './api';
import type { LoginRequest, AuthResponse, User } from '../types/authTypes';

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  // Obter usuário atual
  async getMe(): Promise<{ status: string; data: User }> {
    const response = await api.get<{ status: string; data: User }>('/api/auth/me');
    return response.data;
  },

  // Salvar token no localStorage
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  },

  // Obter token (verifica ambos os storages)
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  // Remover token de ambos os storages
  removeToken(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },

  // Obter perfil completo
  async getProfile(): Promise<{ status: string; data: { id: number; full_name: string; email: string; role: string; status: string; created_at: string } }> {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Atualizar perfil
  async updateProfile(data: { full_name?: string; email?: string; display_name?: string; business_description?: string; logo_url?: string }): Promise<{ status: string; data: any; message: string }> {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },

  // Completar onboarding
  async completeOnboarding(): Promise<{ status: string; message: string }> {
    const response = await api.put('/api/auth/complete-onboarding');
    return response.data;
  },

  // Trocar senha
  async changePassword(data: { current_password: string; new_password: string }): Promise<{ status: string; message: string }> {
    const response = await api.put('/api/auth/change-password', data);
    return response.data;
  },

  // Solicitar reset de senha
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/auth/request-password-reset', { email });
    return response.data;
  },

  // Resetar senha com token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },

  // Logout
  logout(): void {
    this.removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  },
};
