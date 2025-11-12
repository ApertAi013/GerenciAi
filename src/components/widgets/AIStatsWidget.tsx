import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faEye, faHourglass, faCrown } from '@fortawesome/free-solid-svg-icons';
import { aiService } from '../../services/aiService';
import { premiumFeaturesService } from '../../services/premiumFeaturesService';
import '../../styles/widgets/AIStatsWidget.css';

const AI_PROACTIVE_FEATURE_CODE = 'ai_proactive';

interface AIStats {
  total: number;
  pending: number;
  read_count: number;
  executed: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

export default function AIStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccessAndLoadStats();
  }, []);

  const checkAccessAndLoadStats = async () => {
    try {
      setLoading(true);

      // Verificar acesso premium
      const accessResponse = await premiumFeaturesService.getMyAccess(AI_PROACTIVE_FEATURE_CODE);
      const access = accessResponse.data.access;
      setHasAccess(access.hasAccess);

      if (access.hasAccess) {
        // Carregar estatísticas
        const response = await aiService.getStats();
        if ((response as any).status === 'success' || (response as any).success === true) {
          setStats(response.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas da IA:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="widget ai-stats-widget">
        <div className="widget-header">
          <h3>
            <FontAwesomeIcon icon={faRobot} /> Estatísticas da IA
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
      <div className="widget ai-stats-widget">
        <div className="widget-header">
          <h3>
            <FontAwesomeIcon icon={faRobot} /> Estatísticas da IA
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
    <div className="widget ai-stats-widget">
      <div className="widget-header">
        <h3>
          <FontAwesomeIcon icon={faRobot} /> Estatísticas da IA
        </h3>
        <button onClick={() => navigate('/ia/sugestoes')} className="view-all-btn">
          Ver Sugestões
        </button>
      </div>
      <div className="widget-content">
        {!stats || stats.total === 0 ? (
          <div className="empty-state">
            <p>Sem sugestões ainda</p>
            <small>A IA começará a gerar sugestões em breve</small>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-item total">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total de Sugestões</div>
              </div>
            </div>

            <div className="stat-item pending">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faHourglass} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pendentes</div>
              </div>
            </div>

            <div className="stat-item read">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faEye} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.read_count}</div>
                <div className="stat-label">Lidas</div>
              </div>
            </div>

            <div className="stat-item executed">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.executed}</div>
                <div className="stat-label">Executadas</div>
              </div>
            </div>
          </div>
        )}

        {stats && stats.total > 0 && (
          <div className="priority-summary">
            <h4>Por Prioridade</h4>
            <div className="priority-bars">
              <div className="priority-bar">
                <span className="priority-label alta">Alta</span>
                <div className="priority-progress">
                  <div
                    className="priority-fill alta"
                    style={{ width: `${(stats.high_priority / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="priority-count">{stats.high_priority}</span>
              </div>
              <div className="priority-bar">
                <span className="priority-label media">Média</span>
                <div className="priority-progress">
                  <div
                    className="priority-fill media"
                    style={{ width: `${(stats.medium_priority / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="priority-count">{stats.medium_priority}</span>
              </div>
              <div className="priority-bar">
                <span className="priority-label baixa">Baixa</span>
                <div className="priority-progress">
                  <div
                    className="priority-fill baixa"
                    style={{ width: `${(stats.low_priority / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="priority-count">{stats.low_priority}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
