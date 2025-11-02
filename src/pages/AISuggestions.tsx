import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faCalendarAlt, faChartLine, faUserSlash, faExclamationTriangle, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../store/authStore';
import { premiumFeaturesService } from '../services/premiumFeaturesService';
import { aiService } from '../services/aiService';
import type { FeatureAccess, UsageInfo } from '../types/premiumFeaturesTypes';
import type { AISuggestion, SuggestionPriority, SuggestionStatus, SuggestionType, ActionData } from '../types/aiTypes';
import SuggestionActionModal from '../components/SuggestionActionModal';
import LimitReachedModal from '../components/chat/LimitReachedModal';
import '../styles/AISuggestions.css';

const AI_PROACTIVE_FEATURE_CODE = 'ai_proactive';

export default function AISuggestions() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ActionData | null>(null);
  const [currentSuggestionType, setCurrentSuggestionType] = useState<string>('');

  // Premium features state
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadPremiumAccess();
    }
  }, [user]);

  useEffect(() => {
    if (featureAccess?.hasAccess) {
      fetchSuggestions();
    }
  }, [filterStatus, filterPriority, featureAccess]);

  // Carregar acesso premium
  const loadPremiumAccess = async () => {
    try {
      setIsLoadingAccess(true);
      const response = await premiumFeaturesService.getMyAccess(AI_PROACTIVE_FEATURE_CODE);
      setFeatureAccess(response.data.access);

      // Se não tem acesso, mostrar modal
      if (!response.data.access.hasAccess) {
        setShowLimitModal(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar acesso premium:', error);
      setFeatureAccess({
        hasAccess: false,
        isUnlimited: false,
        usageInfo: {},
      });
      setShowLimitModal(true);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  // Ação de upgrade (contatar admin)
  const handleUpgrade = () => {
    alert(
      'Para contratar a IA Proativa com sugestões automáticas:\n\n' +
      'Entre em contato com:\n' +
      '- teus.hcp@gmail.com\n' +
      '- samuelfranca.m@gmail.com\n\n' +
      'Teremos prazer em ativar seu acesso premium!'
    );
  };

  // Fechar modal e voltar para página inicial da IA
  const handleCloseModal = () => {
    setShowLimitModal(false);
    navigate('/ia');
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };

      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;

      const response = await aiService.getSuggestions(params);
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar sugestões:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await aiService.markAsRead(id);
      if (response.success) {
        setSuggestions(suggestions.map(s => s.id === id ? response.data : s));
        toast.success('Sugestão marcada como lida');
      }
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error);
      toast.error(error.response?.data?.message || 'Erro ao marcar como lida');
    }
  };

  const handleExecuteAction = async (suggestion: AISuggestion) => {
    try {
      console.log('Executando ação para sugestão:', suggestion);
      const response = await aiService.executeAction(suggestion.id);
      console.log('Resposta da ação:', response);

      if (response.success) {
        // Validar se os dados retornados são válidos
        if (!response.data || typeof response.data !== 'object') {
          console.error('Dados inválidos retornados:', response.data);
          toast.error('Erro: dados inválidos retornados do servidor');
          return;
        }

        console.log('Abrindo modal com dados:', response.data);
        setModalData(response.data);
        setCurrentSuggestionType(suggestion.type);
        setShowModal(true);

        // Mark as executed after opening modal
        await aiService.markAsExecuted(suggestion.id);
        setSuggestions(suggestions.map(s =>
          s.id === suggestion.id ? { ...s, status: 'executada' as SuggestionStatus } : s
        ));

        toast.success('Ação executada com sucesso!');
      } else {
        toast.error(response.message || 'Erro ao executar ação');
      }
    } catch (error: any) {
      console.error('Erro ao executar ação:', error);
      console.error('Detalhes do erro:', error.response);
      toast.error(error.response?.data?.message || 'Erro ao executar ação');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta sugestão?')) return;

    try {
      const response = await aiService.deleteSuggestion(id);
      if (response.success) {
        setSuggestions(suggestions.filter(s => s.id !== id));
        toast.success('Sugestão deletada');
      }
    } catch (error: any) {
      console.error('Erro ao deletar sugestão:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar sugestão');
    }
  };

  const getTypeLabel = (type: SuggestionType) => {
    switch (type) {
      case 'payment_reminder': return 'Lembrete de Pagamento';
      case 'available_slots': return 'Vagas Disponíveis';
      case 'low_occupancy': return 'Baixa Ocupação';
      case 'inactive_students': return 'Alunos Inativos';
      case 'schedule_conflict': return 'Conflito de Horário';
      default: return type;
    }
  };

  const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
      case 'payment_reminder': return <FontAwesomeIcon icon={faDollarSign} />;
      case 'available_slots': return <FontAwesomeIcon icon={faCalendarAlt} />;
      case 'low_occupancy': return <FontAwesomeIcon icon={faChartLine} />;
      case 'inactive_students': return <FontAwesomeIcon icon={faUserSlash} />;
      case 'schedule_conflict': return <FontAwesomeIcon icon={faExclamationTriangle} />;
      default: return <FontAwesomeIcon icon={faLightbulb} />;
    }
  };

  const getPriorityClass = (priority: SuggestionPriority) => {
    switch (priority) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baixa': return 'priority-low';
      default: return '';
    }
  };

  const getStatusLabel = (status: SuggestionStatus) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'lida': return 'Lida';
      case 'executada': return 'Executada';
      default: return status;
    }
  };

  const getStatusClass = (status: SuggestionStatus) => {
    switch (status) {
      case 'pendente': return 'status-pending';
      case 'lida': return 'status-read';
      case 'executada': return 'status-executed';
      default: return '';
    }
  };

  if (!user) {
    return (
      <div className="ai-suggestions-container">
        <div className="loading">Faça login para acessar as sugestões</div>
      </div>
    );
  }

  if (isLoadingAccess || loading) {
    return (
      <div className="ai-suggestions-container">
        <div className="loading">Carregando sugestões...</div>
      </div>
    );
  }

  const isPremiumUser = featureAccess?.isUnlimited || false;
  const usageInfo: UsageInfo = featureAccess?.usageInfo || {};

  return (
    <div className="ai-suggestions-container">
      {/* Modal de Limite Atingido */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={handleCloseModal}
        onUpgrade={handleUpgrade}
        usageInfo={usageInfo}
      />
      <div className="suggestions-header">
        <h1>Sugestões da IA</h1>
        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="lida">Lida</option>
            <option value="executada">Executada</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="no-suggestions">
          <p>Nenhuma sugestão encontrada</p>
        </div>
      ) : (
        <div className="suggestions-list">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className={`suggestion-card ${getPriorityClass(suggestion.priority)}`}>
              <div className="suggestion-header">
                <div className="suggestion-type">
                  <span className="type-icon">{getTypeIcon(suggestion.type)}</span>
                  <span className="type-label">{getTypeLabel(suggestion.type)}</span>
                </div>
                <div className="suggestion-badges">
                  <span className={`priority-badge ${getPriorityClass(suggestion.priority)}`}>
                    {suggestion.priority.toUpperCase()}
                  </span>
                  <span className={`status-badge ${getStatusClass(suggestion.status)}`}>
                    {getStatusLabel(suggestion.status)}
                  </span>
                </div>
              </div>

              <div className="suggestion-content">
                <h3>{suggestion.title}</h3>
                <p>{suggestion.description}</p>
                {suggestion.metadata && (
                  <div className="suggestion-metadata">
                    <pre>{JSON.stringify(suggestion.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="suggestion-footer">
                <div className="suggestion-date">
                  Criada em {new Date(suggestion.created_at).toLocaleString('pt-BR')}
                </div>
                <div className="suggestion-actions">
                  {suggestion.status === 'pendente' && (
                    <>
                      <button
                        className="btn-action btn-read"
                        onClick={() => handleMarkAsRead(suggestion.id)}
                      >
                        Marcar como Lida
                      </button>
                      <button
                        className="btn-action btn-execute"
                        onClick={() => handleExecuteAction(suggestion)}
                      >
                        Executar
                      </button>
                    </>
                  )}
                  {suggestion.status === 'lida' && (
                    <button
                      className="btn-action btn-execute"
                      onClick={() => handleExecuteAction(suggestion)}
                    >
                      Executar
                    </button>
                  )}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(suggestion.id)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SuggestionActionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        actionData={modalData}
        suggestionType={currentSuggestionType}
      />
    </div>
  );
}
