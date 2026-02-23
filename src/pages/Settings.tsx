import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCreditCard, faArrowRight, faSlidersH, faUsers, faChalkboardTeacher, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { platformBillingService } from '../services/platformBillingService';
import toast from 'react-hot-toast';
import '../styles/Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await platformBillingService.getMySubscription();
      if (response.data) {
        setSubscription(response.data.subscription);
        setStudentCount(response.data.student_count || 0);
        setClassCount(response.data.class_count || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trial': return 'Teste Grátis';
      case 'cancelled': return 'Cancelado';
      case 'past_due': return 'Pagamento Pendente';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'trial': return 'status-trial';
      case 'cancelled': return 'status-cancelled';
      case 'past_due': return 'status-past-due';
      default: return '';
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-page-header">
        <h1><FontAwesomeIcon icon={faGear} /> Configurações</h1>
      </div>

      <div className="settings-grid">
        {/* Plan Card */}
        <div className="settings-card plan-card">
          <div className="settings-card-header">
            <h2><FontAwesomeIcon icon={faCreditCard} /> Seu Plano</h2>
            {subscription && (
              <span className={`plan-status-badge ${getStatusClass(subscription.status)}`}>
                {getStatusLabel(subscription.status)}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="settings-loading">Carregando...</div>
          ) : subscription ? (
            <div className="plan-details">
              <div className="plan-name">{subscription.plan_name || 'Plano Atual'}</div>

              {subscription.price_cents > 0 && (
                <div className="plan-price">
                  R$ {(subscription.price_cents / 100).toFixed(2).replace('.', ',')}
                  <span>/mês</span>
                </div>
              )}

              <div className="plan-limits">
                <div className="plan-limit-item">
                  <FontAwesomeIcon icon={faUsers} />
                  <span>
                    <strong>{studentCount}</strong> / {subscription.max_students || '∞'} alunos
                  </span>
                </div>
                <div className="plan-limit-item">
                  <FontAwesomeIcon icon={faChalkboardTeacher} />
                  <span>
                    <strong>{classCount}</strong> / {subscription.max_classes || '∞'} turmas
                  </span>
                </div>
              </div>

              {subscription.trial_ends_at && subscription.status === 'trial' && (
                <div className="plan-trial-info">
                  <FontAwesomeIcon icon={faClock} />
                  Teste grátis até {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                </div>
              )}

              <button
                className="settings-action-btn"
                onClick={() => navigate('/meu-plano')}
              >
                Gerenciar Plano <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          ) : (
            <div className="plan-details">
              <p className="no-plan-text">Nenhum plano ativo encontrado.</p>
              <button
                className="settings-action-btn"
                onClick={() => navigate('/meu-plano')}
              >
                Ver Planos <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h2><FontAwesomeIcon icon={faSlidersH} /> Links Rápidos</h2>
          </div>

          <div className="settings-links">
            <button className="settings-link-item" onClick={() => navigate('/preferencias')}>
              <div className="link-icon-wrapper" style={{ background: '#eef2ff' }}>
                <FontAwesomeIcon icon={faSlidersH} style={{ color: '#6366f1' }} />
              </div>
              <div className="link-info">
                <span className="link-title">Preferências</span>
                <span className="link-desc">Templates WhatsApp, senha padrão</span>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="link-arrow" />
            </button>

            <button className="settings-link-item" onClick={() => navigate('/meu-plano')}>
              <div className="link-icon-wrapper" style={{ background: '#fef3c7' }}>
                <FontAwesomeIcon icon={faCreditCard} style={{ color: '#d97706' }} />
              </div>
              <div className="link-info">
                <span className="link-title">Meu Plano</span>
                <span className="link-desc">Assinatura, faturas, upgrades</span>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="link-arrow" />
            </button>

            <button className="settings-link-item" onClick={() => navigate('/perfil')}>
              <div className="link-icon-wrapper" style={{ background: '#fce7f3' }}>
                <FontAwesomeIcon icon={faUsers} style={{ color: '#db2777' }} />
              </div>
              <div className="link-info">
                <span className="link-title">Meu Perfil</span>
                <span className="link-desc">Dados pessoais e senha</span>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="link-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
