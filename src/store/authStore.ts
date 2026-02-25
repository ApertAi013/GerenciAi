import { create } from 'zustand';
import type { User } from '../types/authTypes';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentArenaId: number | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentArena: (arenaId: number) => void;
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

const getStoredArenaId = (): number | null => {
  const stored = localStorage.getItem('currentArenaId') || sessionStorage.getItem('currentArenaId');
  return stored ? parseInt(stored, 10) : null;
};

// Helper: determina qual storage usar baseado na preferência keepLoggedIn
const getStorage = (): Storage => {
  return localStorage.getItem('keepLoggedIn') === 'true' ? localStorage : sessionStorage;
};

// Resolve initial arena: stored preference > user's current_arena_id > first arena
const resolveInitialArena = (): number | null => {
  const stored = getStoredArenaId();
  if (stored) return stored;

  const user = getStoredUser();
  if (user?.current_arena_id) return user.current_arena_id;
  if (user?.arenas && user.arenas.length > 0) {
    const defaultArena = user.arenas.find(a => a.is_default);
    return defaultArena?.id || user.arenas[0].id;
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!(getStoredToken() && getStoredUser()),
  isLoading: false,
  currentArenaId: resolveInitialArena(),

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

    // Resolve arena on login
    let arenaId: number | null = null;
    if (user.current_arena_id) {
      arenaId = user.current_arena_id;
    } else if (user.arenas && user.arenas.length > 0) {
      const defaultArena = user.arenas.find(a => a.is_default);
      arenaId = defaultArena?.id || user.arenas[0].id;
    }
    if (arenaId) {
      storage.setItem('currentArenaId', String(arenaId));
    }

    set({ user, token, isAuthenticated: true, currentArenaId: arenaId });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    localStorage.removeItem('currentArenaId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('currentArenaId');
    set({ user: null, token: null, isAuthenticated: false, currentArenaId: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentArena: (arenaId) => {
    const storage = getStorage();
    storage.setItem('currentArenaId', String(arenaId));
    set({ currentArenaId: arenaId });
  },
}));
