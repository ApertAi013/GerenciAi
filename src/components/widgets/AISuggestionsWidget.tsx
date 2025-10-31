import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb,
  faDollarSign,
  faCalendarAlt,
  faChartLine,
  faUserSlash,
  faExclamationTriangle,
  faCrown
} from '@fortawesome/free-solid-svg-icons';
import { aiService } from '../../services/aiService';
import { premiumFeaturesService } from '../../services/premiumFeaturesService';
import type { AISuggestion, SuggestionType } from '../../types/aiTypes';
import '../../styles/widgets/AISuggestionsWidget.css';

const AI_PROACTIVE_FEATURE_CODE = 'ai_proactive';

export default function AISuggestionsWidget() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccessAndLoadSuggestions();
  }, []);

  const checkAccessAndLoadSuggestions = async () => {
    try {
      setLoading(true);

      // Verificar acesso premium
      const accessResponse = await premiumFeaturesService.getMyAccess(AI_PROACTIVE_FEATURE_CODE);
      const access = accessResponse.data.access;
      setHasAccess(access.hasAccess);

      if (access.hasAccess) {
        // Carregar sugestões pendentes
        const response = await aiService.getSuggestions({ status: 'pendente', limit: 5 });
        if (response.success) {
          setSuggestions(response.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões da IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
      case 'payment_reminder':
        return <FontAwesomeIcon icon={faDollarSign} />;
      case 'available_slots':
        return <FontAwesomeIcon icon={faCalendarAlt} />;
      case 'low_occupancy':
        return <FontAwesomeIcon icon={faChartLine} />;
      case 'inactive_students':
        return <FontAwesomeIcon icon={faUserSlash} />;
      case 'schedule_conflict':
        return <FontAwesomeIcon icon={faExclamationTriangle} />;
      default:
        return <FontAwesomeIcon icon={faLightbulb} />;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'priority-high';
      case 'media':
        return 'priority-medium';
      case 'baixa':
        return 'priority-low';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="widget ai-suggestions-widget">
        <div className="widget-header">
          <h3>
            <FontAwesomeIcon icon={faLightbulb} /> Sugestões da IA
          </h3>
        </div>
        <div className="widget-content">
          <div className="loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="widget ai-suggestions-widget">
        <div className="widget-header">
          <h3>
            <FontAwesomeIcon icon={faLightbulb} /> Sugestões da IA
          </h3>
        </div>
        <div className="widget-content premium-locked">
          <div className="premium-message">
            <FontAwesomeIcon icon={faCrown} size="2x" />
            <p>Feature Premium</p>
            <small>Entre em contato para ativar</small>
            <button onClick={() => navigate('/ia')} className="btn-unlock">
              Saiba Mais
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget ai-suggestions-widget">
      <div className="widget-header">
        <h3>
          <FontAwesomeIcon icon={faLightbulb} /> Sugestões da IA
        </h3>
        <button onClick={() => navigate('/ia/sugestoes')} className="view-all-btn">
          Ver Todas
        </button>
      </div>
      <div className="widget-content">
        {suggestions.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma sugestão pendente</p>
            <small>A IA está analisando seus dados</small>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`suggestion-item ${getPriorityClass(suggestion.priority)}`}
                onClick={() => navigate('/ia/sugestoes')}
              >
                <div className="suggestion-icon">{getTypeIcon(suggestion.type)}</div>
                <div className="suggestion-content">
                  <div className="suggestion-title">{suggestion.title}</div>
                  <div className="suggestion-description">{suggestion.description}</div>
                </div>
                <div className={`suggestion-priority ${getPriorityClass(suggestion.priority)}`}>
                  {suggestion.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
