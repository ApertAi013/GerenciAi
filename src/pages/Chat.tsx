import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chatService';
import type { Conversation, Message } from '../types/chatTypes';
import '../styles/Chat.css';

export default function Chat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider] = useState<'chatgpt' | 'claude'>('chatgpt');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar conversas ao iniciar
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Scroll automático para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  // Carregar lista de conversas
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await chatService.getConversations();
      setConversations(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      // Em caso de erro, define array vazio para não quebrar a UI
      setConversations([]);
      // Não mostra alert para não incomodar o usuário na carga inicial
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Criar nova conversa
  const handleNewConversation = async () => {
    try {
      const response = await chatService.createConversation();
      setCurrentConversation(response.data.conversation_id);
      setMessages([]);
      await loadConversations();
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      alert('Erro ao criar conversa: ' + errorMessage);
    }
  };

  // Carregar conversa específica
  const loadConversation = async (conversationId: number) => {
    try {
      const response = await chatService.getConversation(conversationId);
      setCurrentConversation(conversationId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    const userMessage = newMessage;
    setNewMessage('');
    setLoading(true);

    // Adicionar mensagem do usuário à interface
    const tempUserMessage: Message = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatService.sendMessage(
        currentConversation,
        userMessage,
        provider
      );

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content,
        tokens_used: response.data.tokens_used,
        model: response.data.model,
        created_at: response.data.created_at,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Atualizar lista de conversas
      await loadConversations();
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem: ' + (error.response?.data?.message || error.message));
      // Remover mensagem do usuário em caso de erro
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Deletar conversa
  const handleDeleteConversation = async (conversationId: number) => {
    if (!confirm('Deseja realmente deletar esta conversa?')) return;

    try {
      await chatService.deleteConversation(conversationId);
      await loadConversations();
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa');
    }
  };

  // Sugestões de mensagem
  const handleSuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="chat-container">
        <div className="empty-state">
          <p>Faça login para acessar o chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Sidebar - Lista de conversas */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <button onClick={handleNewConversation} className="btn-new-conversation">
            ✨ Nova Conversa
          </button>
        </div>

        <div className="conversations-list">
          {isLoadingConversations ? (
            <div className="loading-conversations">
              <div className="spinner"></div>
              <p>Carregando conversas...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Nenhuma conversa ainda</p>
              <p className="text-small">Clique em "Nova Conversa" para começar</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`conversation-item ${currentConversation === conv.id ? 'active' : ''}`}
              >
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h3 className="conversation-title">{conv.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="btn-delete-conversation"
                      title="Deletar conversa"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="conversation-date">{formatDate(conv.updated_at)}</p>
                  {conv.message_count !== undefined && (
                    <p className="conversation-meta">
                      {conv.message_count} mensagens
                      {conv.total_tokens !== undefined && ` · ${conv.total_tokens} tokens`}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Área principal - Mensagens */}
      <div className="chat-main">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div>
                <h2 className="chat-title">Assistente GerenciAi 🤖</h2>
                <p className="chat-subtitle">
                  Tire suas dúvidas e gerencie sua academia com inteligência artificial
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <div className="welcome-message">
                    <h3>👋 Olá! Como posso ajudar?</h3>
                    <p>Faça perguntas sobre:</p>
                    <ul>
                      <li>💰 Situação financeira da academia</li>
                      <li>👥 Alunos e matrículas</li>
                      <li>🏐 Turmas e horários</li>
                      <li>📊 Relatórios e estatísticas</li>
                      <li>🚨 Inadimplências</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
                  >
                    <div className="message-content">
                      <p className="message-text">{msg.content}</p>
                      {msg.tokens_used && (
                        <p className="message-meta">
                          Tokens: {msg.tokens_used} · {msg.model}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="message message-assistant">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p className="message-meta">IA está pensando...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="chat-input-container">
              <form onSubmit={handleSendMessage} className="chat-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  className="chat-input"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="btn-send"
                >
                  {loading ? '⏳' : '📨'}
                </button>
              </form>

              {/* Sugestões */}
              {messages.length === 0 && (
                <div className="suggestions-container">
                  <button
                    onClick={() => handleSuggestion('Me dê um resumo financeiro completo')}
                    className="suggestion-btn"
                  >
                    💰 Resumo financeiro
                  </button>
                  <button
                    onClick={() => handleSuggestion('Quais alunos estão inadimplentes?')}
                    className="suggestion-btn"
                  >
                    🚨 Inadimplentes
                  </button>
                  <button
                    onClick={() => handleSuggestion('Quantos alunos ativos temos?')}
                    className="suggestion-btn"
                  >
                    👥 Alunos ativos
                  </button>
                  <button
                    onClick={() => handleSuggestion('Quais turmas temos disponíveis?')}
                    className="suggestion-btn"
                  >
                    🏐 Turmas
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">💬</div>
              <h3>Bem-vindo ao Assistente GerenciAi</h3>
              <p>Selecione uma conversa ou crie uma nova para começar a gerenciar sua academia com IA</p>
              <button onClick={handleNewConversation} className="btn-primary">
                ✨ Criar Primeira Conversa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
