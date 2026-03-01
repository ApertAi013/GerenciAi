// ===== Knowledge Base Types =====

export type LaraCategory =
  | 'gestao_alunos'
  | 'experimentais'
  | 'aulas_agenda'
  | 'financeiro'
  | 'quadras_locacoes'
  | 'comunicacao'
  | 'torneios_loja'
  | 'configuracoes'
  | 'premium'
  | 'admin';

export interface LaraCategoryInfo {
  id: LaraCategory;
  label: string;
  icon: string;
  description: string;
}

export interface LaraSubTopic {
  id: string;
  label: string;
  keywords: string[];
  response: string;
  steps?: string[];
  link?: string;
  linkLabel?: string;
}

export interface LaraModuleKeywords {
  primary: string[];
  secondary: string[];
}

export interface LaraModule {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  keywords: LaraModuleKeywords;
  category: LaraCategory;
  subTopics: LaraSubTopic[];
}

// ===== Conversation Types =====

export type LaraMessageRole = 'bot' | 'user';

export interface LaraQuickOption {
  id: string;
  label: string;
  icon?: string;
  type?: 'category' | 'module' | 'subtopic' | 'action';
}

export interface LaraMessageContent {
  text: string;
  options?: LaraQuickOption[];
  steps?: string[];
  link?: string;
  linkLabel?: string;
}

export interface LaraMessage {
  id: string;
  role: LaraMessageRole;
  content: LaraMessageContent;
  timestamp: number;
}

// ===== Conversation State Machine =====

export type LaraConversationState =
  | 'idle'
  | 'greeting'
  | 'category_selected'
  | 'module_selected'
  | 'answer'
  | 'fallback';

export interface LaraHistoryEntry {
  state: LaraConversationState;
  selectedCategory?: LaraCategory;
  selectedModuleId?: string;
}

export interface LaraConversationContext {
  state: LaraConversationState;
  selectedCategory?: LaraCategory;
  selectedModuleId?: string;
  history: LaraHistoryEntry[];
}

// ===== Intent Matching =====

export interface LaraIntentMatch {
  moduleId: string;
  score: number;
  matchedKeywords: string[];
  subTopicId?: string;
}
