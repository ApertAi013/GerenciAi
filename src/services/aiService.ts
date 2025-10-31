import { api } from './api';
import type {
  AISettings,
  AISuggestion,
  AIStats,
  UpdateAISettingsData,
} from '../types/aiTypes';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const aiService = {
  /**
   * Buscar configurações da IA do usuário
   */
  getSettings: async (): Promise<ApiResponse<AISettings>> => {
    const response = await api.get('/api/ai-proactive/settings');
    return response.data;
  },

  /**
   * Atualizar configurações da IA
   */
  updateSettings: async (data: UpdateAISettingsData): Promise<ApiResponse<AISettings>> => {
    const response = await api.put('/api/ai-proactive/settings', data);
    return response.data;
  },

  /**
   * Gerar sugestões manualmente
   */
  generateSuggestions: async (): Promise<ApiResponse<{ suggestions_created: number }>> => {
    const response = await api.post('/api/ai-proactive/generate');
    return response.data;
  },

  /**
   * Listar sugestões
   */
  getSuggestions: async (params?: {
    status?: string;
    type?: string;
    priority?: string;
    limit?: number;
  }): Promise<ApiResponse<AISuggestion[]>> => {
    const response = await api.get('/api/ai-proactive/suggestions', { params });
    return response.data;
  },

  /**
   * Marcar sugestão como lida
   */
  markAsRead: async (id: number): Promise<ApiResponse<AISuggestion>> => {
    const response = await api.patch(`/api/ai-proactive/suggestions/${id}/read`);
    return response.data;
  },

  /**
   * Marcar sugestão como executada
   */
  markAsExecuted: async (id: number): Promise<ApiResponse<AISuggestion>> => {
    const response = await api.patch(`/api/ai-proactive/suggestions/${id}/execute`);
    return response.data;
  },

  /**
   * Deletar sugestão
   */
  deleteSuggestion: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/ai-proactive/suggestions/${id}`);
    return response.data;
  },

  /**
   * Obter estatísticas
   */
  getStats: async (): Promise<ApiResponse<AIStats>> => {
    const response = await api.get('/api/ai-proactive/stats');
    return response.data;
  },
};
