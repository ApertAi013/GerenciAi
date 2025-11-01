import { api } from './api';
import type {
  WhatsAppConfig,
  WhatsAppTemplate,
  AutomationSettings,
  WhatsAppMessageLog,
  CreateConfigData,
  UpdateConfigData,
  ToggleActiveData,
  SendTestData,
  CreateTemplateData,
  UpdateTemplateData,
  UpdateAutomationSettingsData,
  LogsFilters,
} from '../types/whatsappTypes';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export const whatsappService = {
  // ==================== CONFIG ====================

  /**
   * Buscar configuração atual do WhatsApp
   */
  getConfig: async (): Promise<ApiResponse<WhatsAppConfig>> => {
    const response = await api.get('/api/whatsapp/config');
    return response.data;
  },

  /**
   * Salvar/Atualizar configuração do WhatsApp
   */
  saveConfig: async (data: CreateConfigData): Promise<ApiResponse<WhatsAppConfig>> => {
    const response = await api.post('/api/whatsapp/config', data);
    return response.data;
  },

  /**
   * Atualizar configuração existente
   */
  updateConfig: async (data: UpdateConfigData): Promise<ApiResponse<WhatsAppConfig>> => {
    const response = await api.put('/api/whatsapp/config', data);
    return response.data;
  },

  /**
   * Ativar/Desativar integração WhatsApp
   */
  toggleActive: async (isActive: boolean): Promise<ApiResponse<null>> => {
    const response = await api.put('/api/whatsapp/config/toggle', { isActive });
    return response.data;
  },

  /**
   * Enviar mensagem de teste
   */
  sendTest: async (phoneNumber: string): Promise<ApiResponse<{ success: boolean; messageId: string }>> => {
    const response = await api.post('/api/whatsapp/test', { phoneNumber });
    return response.data;
  },

  // ==================== TEMPLATES ====================

  /**
   * Listar todos os templates
   */
  getTemplates: async (): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    const response = await api.get('/api/whatsapp/templates');
    return response.data;
  },

  /**
   * Buscar template específico por ID
   */
  getTemplate: async (id: number): Promise<ApiResponse<WhatsAppTemplate>> => {
    const response = await api.get(`/api/whatsapp/templates/${id}`);
    return response.data;
  },

  /**
   * Criar novo template
   */
  createTemplate: async (data: CreateTemplateData): Promise<ApiResponse<WhatsAppTemplate>> => {
    const response = await api.post('/api/whatsapp/templates', data);
    return response.data;
  },

  /**
   * Atualizar template existente
   */
  updateTemplate: async (id: number, data: UpdateTemplateData): Promise<ApiResponse<WhatsAppTemplate>> => {
    const response = await api.put(`/api/whatsapp/templates/${id}`, data);
    return response.data;
  },

  /**
   * Deletar template
   */
  deleteTemplate: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/whatsapp/templates/${id}`);
    return response.data;
  },

  // ==================== AUTOMATION SETTINGS ====================

  /**
   * Buscar configurações de automação
   */
  getAutomationSettings: async (): Promise<ApiResponse<AutomationSettings>> => {
    const response = await api.get('/api/whatsapp/automation/settings');
    return response.data;
  },

  /**
   * Atualizar configurações de automação
   */
  updateAutomationSettings: async (data: UpdateAutomationSettingsData): Promise<ApiResponse<AutomationSettings>> => {
    const response = await api.put('/api/whatsapp/automation/settings', data);
    return response.data;
  },

  // ==================== LOGS ====================

  /**
   * Buscar logs de mensagens
   */
  getLogs: async (filters?: LogsFilters): Promise<ApiResponse<WhatsAppMessageLog[]>> => {
    const params = new URLSearchParams();

    if (filters?.studentId) params.append('studentId', filters.studentId.toString());
    if (filters?.messageType) params.append('messageType', filters.messageType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/whatsapp/logs?${params.toString()}`);
    return response.data;
  },
};
