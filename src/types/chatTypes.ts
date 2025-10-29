// Tipos para Chat com IA

export interface Message {
  id?: number;
  conversation_id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  status: 'ativa' | 'arquivada';
  created_at: string;
  updated_at: string;
  message_count?: number;
  total_tokens?: number;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export interface Provider {
  name: string;
  available: boolean;
  model?: string;
}

export interface ProvidersResponse {
  available_providers: string[];
  default_provider: string;
  chatgpt?: Provider;
  claude?: Provider;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ChatStatistics {
  total_conversations: number;
  active_conversations: number;
  archived_conversations: number;
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  total_tokens_used: number;
  average_tokens_per_message: number;
  most_used_provider: string;
}

export interface SendMessageRequest {
  content: string;
  provider?: 'chatgpt' | 'claude';
}

export interface SendMessageResponse {
  message_id: number;
  content: string;
  role: 'assistant';
  tokens_used: number;
  model: string;
  created_at: string;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface CreateConversationResponse {
  conversation_id: number;
  title: string;
  status: 'ativa';
  created_at: string;
}

export interface ChatResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
