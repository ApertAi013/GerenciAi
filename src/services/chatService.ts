import { api } from './api';
import type {
  ChatResponse,
  Conversation,
  ConversationWithMessages,
  CreateConversationRequest,
  CreateConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
  ProvidersResponse,
  FunctionDefinition,
  ChatStatistics,
} from '../types/chatTypes';

export const chatService = {
  // Verificar provedores disponíveis
  async getProviders(): Promise<ChatResponse<ProvidersResponse>> {
    const response = await api.get<ChatResponse<ProvidersResponse>>('/api/chat/providers');
    return response.data;
  },

  // Listar funções disponíveis
  async getFunctions(): Promise<ChatResponse<FunctionDefinition[]>> {
    const response = await api.get<ChatResponse<FunctionDefinition[]>>('/api/chat/functions');
    return response.data;
  },

  // Obter estatísticas de uso
  async getStatistics(): Promise<ChatResponse<ChatStatistics>> {
    const response = await api.get<ChatResponse<ChatStatistics>>('/api/chat/statistics');
    return response.data;
  },

  // Criar nova conversa
  async createConversation(data?: CreateConversationRequest): Promise<ChatResponse<CreateConversationResponse>> {
    const response = await api.post<ChatResponse<CreateConversationResponse>>(
      '/api/chat/conversations',
      data || { title: 'Nova Conversa' }
    );
    return response.data;
  },

  // Listar conversas
  async getConversations(status: 'ativa' | 'arquivada' = 'ativa'): Promise<ChatResponse<Conversation[]>> {
    const response = await api.get<ChatResponse<Conversation[]>>('/api/chat/conversations', {
      params: { status },
    });
    return response.data;
  },

  // Obter conversa com mensagens
  async getConversation(conversationId: number): Promise<ChatResponse<ConversationWithMessages>> {
    const response = await api.get<ChatResponse<ConversationWithMessages>>(
      `/api/chat/conversations/${conversationId}`
    );
    return response.data;
  },

  // Enviar mensagem
  async sendMessage(
    conversationId: number,
    content: string,
    provider: 'chatgpt' | 'claude' = 'chatgpt'
  ): Promise<ChatResponse<SendMessageResponse>> {
    const data: SendMessageRequest = {
      content,
      provider,
    };
    const response = await api.post<ChatResponse<SendMessageResponse>>(
      `/api/chat/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  // Arquivar conversa
  async archiveConversation(conversationId: number): Promise<ChatResponse<{ message: string }>> {
    const response = await api.patch<ChatResponse<{ message: string }>>(
      `/api/chat/conversations/${conversationId}/archive`
    );
    return response.data;
  },

  // Deletar conversa
  async deleteConversation(conversationId: number): Promise<ChatResponse<{ message: string }>> {
    const response = await api.delete<ChatResponse<{ message: string }>>(
      `/api/chat/conversations/${conversationId}`
    );
    return response.data;
  },
};
