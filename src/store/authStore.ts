import { create } from 'zustand';
import type { User } from '../types/authTypes';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

// Helper: busca de ambos os storages (localStorage tem prioridade)
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

const getStoredToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper: determina qual storage usar baseado na preferência keepLoggedIn
const getStorage = (): Storage => {
  return localStorage.getItem('keepLoggedIn') === 'true' ? localStorage : sessionStorage;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!(getStoredToken() && getStoredUser()),
  isLoading: false,

  setUser: (user) => {
    const storage = getStorage();
    storage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  setToken: (token) => {
    const storage = getStorage();
    storage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },

  setAuth: (user, token) => {
    const storage = getStorage();
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
