import { api } from './api';
import type {
  DashboardMetrics,
  BackendMetrics,
  DatabaseMetrics,
  APIMetrics,
  UsersMetrics,
  HealthCheck,
  User,
  UserDetails,
  Feature,
  FeatureStats,
  GCPMetrics,
  CloudSQLMetrics,
  CloudRunMetrics,
  GCPCosts,
  UpdateUserFeaturesData,
  UpdateUserRoleData,
  UpdateUserStatusData,
  UsersListParams,
} from '../types/monitoringTypes';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    users: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const monitoringService = {
  // ==================== DASHBOARD & MÉTRICAS ====================

  /**
   * Buscar dashboard completo
   */
  getDashboard: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await api.get('/api/admin/monitoring/dashboard');
    return response.data;
  },

  /**
   * Métricas do backend (Node.js)
   */
  getBackendMetrics: async (): Promise<ApiResponse<BackendMetrics>> => {
    const response = await api.get('/api/admin/monitoring/backend');
    return response.data;
  },

  /**
   * Métricas do banco de dados
   */
  getDatabaseMetrics: async (): Promise<ApiResponse<DatabaseMetrics>> => {
    const response = await api.get('/api/admin/monitoring/database');
    return response.data;
  },

  /**
   * Métricas das APIs
   */
  getAPIMetrics: async (): Promise<ApiResponse<APIMetrics>> => {
    const response = await api.get('/api/admin/monitoring/api');
    return response.data;
  },

  /**
   * Métricas de usuários
   */
  getUsersMetrics: async (): Promise<ApiResponse<UsersMetrics>> => {
    const response = await api.get('/api/admin/monitoring/users-stats');
    return response.data;
  },

  /**
   * Health check detalhado
   */
  getHealthCheck: async (): Promise<ApiResponse<HealthCheck>> => {
    const response = await api.get('/api/admin/monitoring/health');
    return response.data;
  },

  // ==================== GOOGLE CLOUD ====================

  /**
   * Todas as métricas do GCP
   */
  getGCPMetrics: async (): Promise<ApiResponse<GCPMetrics>> => {
    const response = await api.get('/api/admin/monitoring/gcp');
    return response.data;
  },

  /**
   * Métricas do Cloud SQL
   */
  getCloudSQLMetrics: async (): Promise<ApiResponse<CloudSQLMetrics>> => {
    const response = await api.get('/api/admin/monitoring/gcp/cloudsql');
    return response.data;
  },

  /**
   * Métricas do Cloud Run
   */
  getCloudRunMetrics: async (): Promise<ApiResponse<CloudRunMetrics>> => {
    const response = await api.get('/api/admin/monitoring/gcp/cloudrun');
    return response.data;
  },

  /**
   * Custos do GCP
   */
  getGCPCosts: async (): Promise<ApiResponse<GCPCosts>> => {
    const response = await api.get('/api/admin/monitoring/gcp/costs');
    return response.data;
  },

  // ==================== USUÁRIOS ====================

  /**
   * Listar usuários com filtros e paginação
   */
  listUsers: async (params?: UsersListParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/api/admin/monitoring/users/list', { params });
    return response.data;
  },

  /**
   * Detalhes de um usuário específico
   */
  getUserDetails: async (userId: number): Promise<ApiResponse<UserDetails>> => {
    const response = await api.get(`/api/admin/monitoring/users/${userId}`);
    return response.data;
  },

  /**
   * Atualizar features premium de um usuário
   */
  updateUserFeatures: async (
    userId: number,
    data: UpdateUserFeaturesData
  ): Promise<ApiResponse<{ userId: number; features: string[] }>> => {
    const response = await api.put(`/api/admin/monitoring/users/${userId}/features`, data);
    return response.data;
  },

  /**
   * Atualizar role de um usuário
   */
  updateUserRole: async (
    userId: number,
    data: UpdateUserRoleData
  ): Promise<ApiResponse<{ userId: number; role: string }>> => {
    const response = await api.put(`/api/admin/monitoring/users/${userId}/role`, data);
    return response.data;
  },

  /**
   * Atualizar status de um usuário
   */
  updateUserStatus: async (
    userId: number,
    data: UpdateUserStatusData
  ): Promise<ApiResponse<{ userId: number; status: string }>> => {
    const response = await api.put(`/api/admin/monitoring/users/${userId}/status`, data);
    return response.data;
  },

  /**
   * Criar novo usuário
   */
  createUser: async (userData: {
    full_name: string;
    email: string;
    password: string;
    role?: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
    status?: 'active' | 'inactive';
    premium_features?: string[];
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/admin/monitoring/users', userData);
    return response.data;
  },

  /**
   * Atualizar dados de um usuário
   */
  updateUser: async (
    userId: number,
    userData: {
      full_name?: string;
      email?: string;
      password?: string;
      role?: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
      status?: 'active' | 'inactive';
    }
  ): Promise<ApiResponse<User>> => {
    const response = await api.put(`/api/admin/monitoring/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Deletar usuário
   */
  deleteUser: async (userId: number): Promise<ApiResponse<{ userId: number }>> => {
    const response = await api.delete(`/api/admin/monitoring/users/${userId}`);
    return response.data;
  },

  // ==================== FEATURES ====================

  /**
   * Listar todas as features
   */
  listFeatures: async (): Promise<ApiResponse<Feature[]>> => {
    const response = await api.get('/api/admin/monitoring/features');
    return response.data;
  },

  /**
   * Estatísticas de uso de features
   */
  getFeaturesStats: async (): Promise<ApiResponse<FeatureStats>> => {
    const response = await api.get('/api/admin/monitoring/features/stats');
    return response.data;
  },
};
