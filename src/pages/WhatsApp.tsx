import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faFileAlt,
  faRobot,
  faHistory,
  faCrown,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useAuthStore } from '../store/authStore';
import { premiumFeaturesService } from '../services/premiumFeaturesService';
import type { FeatureAccess, UsageInfo } from '../types/premiumFeaturesTypes';
import LimitReachedModal from '../components/chat/LimitReachedModal';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsApp.css';

const WHATSAPP_FEATURE_CODE = 'whatsapp_automation';

export default function WhatsApp() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Premium features state
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Carregar acesso premium ao iniciar
  useEffect(() => {
    if (user) {
      loadPremiumAccess();
    }
  }, [user]);

  // Carregar acesso premium
  const loadPremiumAccess = async () => {
    try {
      setIsLoadingAccess(true);
      const response = await premiumFeaturesService.getMyAccess(WHATSAPP_FEATURE_CODE);
      setFeatureAccess(response.data.access);
    } catch (error: any) {
      console.error('Erro ao carregar acesso premium:', error);
      // Se houver erro, assume que não tem acesso
      setFeatureAccess({
        hasAccess: false,
        isUnlimited: false,
        usageInfo: {},
      });
    } finally {
      setIsLoadingAccess(false);
    }
  };

  // Ação de upgrade (contatar admin)
  const handleUpgrade = () => {
    alert(
      'Para contratar a Automação WhatsApp:\n\n' +
        'Entre em contato com:\n' +
        '- teus.hcp@gmail.com\n' +
        '- samuelfranca.m@gmail.com\n\n' +
        'Teremos prazer em ativar seu acesso premium!'
    );
  };

  // Verificar acesso antes de navegar
  const handleNavigation = (path: string) => {
    if (!featureAccess?.hasAccess) {
      setShowLimitModal(true);
      return;
    }
    navigate(path);
  };

  if (!user) {
    return (
      <div className="whatsapp-container">
        <div className="whatsapp-header">
          <p>Faça login para acessar a Automação WhatsApp</p>
        </div>
      </div>
    );
  }

  if (isLoadingAccess) {
    return (
      <div className="whatsapp-container">
        <div className="whatsapp-header">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const isPremiumUser = featureAccess?.isUnlimited || false;
  const usageInfo: UsageInfo = featureAccess?.usageInfo || {};

  return (
    <div className="whatsapp-container">
      {/* Modal de Limite Atingido */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        usageInfo={usageInfo}
      />

      <div className="whatsapp-header">
        <h1>
          <FontAwesomeIcon icon={faWhatsapp} className="whatsapp-icon" />
          Automação WhatsApp {isPremiumUser && <PremiumBadge />}
        </h1>
        <p>Automatize cobranças e envie lembretes de pagamento via WhatsApp</p>
        {!isPremiumUser && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faCrown} /> Feature Premium - Entre em contato para contratar
          </p>
        )}
      </div>

      <div className="whatsapp-cards">
        <div className="whatsapp-card" onClick={() => handleNavigation('/whatsapp/config')}>
          <div className="whatsapp-card-icon config">
            <FontAwesomeIcon icon={faCog} />
          </div>
          <h2>Status & Teste</h2>
          <p>Verifique o status da integração e teste o envio de mensagens</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              <FontAwesomeIcon icon={faCrown} /> Requer acesso premium
            </div>
          )}
          <button className="whatsapp-card-button">Verificar Status →</button>
        </div>

        <div className="whatsapp-card" onClick={() => handleNavigation('/whatsapp/templates')}>
          <div className="whatsapp-card-icon templates">
            <FontAwesomeIcon icon={faFileAlt} />
          </div>
          <h2>Templates</h2>
          <p>Gerencie templates de mensagens personalizadas para cobranças</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              <FontAwesomeIcon icon={faCrown} /> Requer acesso premium
            </div>
          )}
          <button className="whatsapp-card-button">Gerenciar Templates →</button>
        </div>

        <div className="whatsapp-card" onClick={() => handleNavigation('/whatsapp/automation')}>
          <div className="whatsapp-card-icon automation">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <h2>Automação</h2>
          <p>Configure regras automáticas para envio de lembretes e cobranças</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              <FontAwesomeIcon icon={faCrown} /> Requer acesso premium
            </div>
          )}
          <button className="whatsapp-card-button">Configurar Automação →</button>
        </div>

        <div className="whatsapp-card" onClick={() => handleNavigation('/whatsapp/logs')}>
          <div className="whatsapp-card-icon logs">
            <FontAwesomeIcon icon={faHistory} />
          </div>
          <h2>Histórico</h2>
          <p>Visualize todas as mensagens enviadas e seus status de entrega</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              <FontAwesomeIcon icon={faCrown} /> Requer acesso premium
            </div>
          )}
          <button className="whatsapp-card-button">Ver Histórico →</button>
        </div>
      </div>

      <div className="whatsapp-info">
        <h3>Como funciona?</h3>
        <div className="whatsapp-info-grid">
          <div className="whatsapp-info-item">
            <strong>1. Verifique o Status</strong>
            <p>Confira se a integração está ativa e teste o envio de mensagens</p>
          </div>
          <div className="whatsapp-info-item">
            <strong>2. Personalize Templates</strong>
            <p>Crie mensagens personalizadas com variáveis dinâmicas para diferentes situações</p>
          </div>
          <div className="whatsapp-info-item">
            <strong>3. Configure Automação</strong>
            <p>Defina regras automáticas de envio, frequência e horários dos lembretes</p>
          </div>
          <div className="whatsapp-info-item">
            <strong>4. Acompanhe Resultados</strong>
            <p>Monitore o histórico completo de mensagens e status de entrega</p>
          </div>
        </div>
      </div>

      <div className="whatsapp-features">
        <h3>Recursos Disponíveis</h3>
        <ul>
          <li>Integração oficial com WhatsApp Business API (gerenciada centralmente)</li>
          <li>Lembretes automáticos de vencimento de mensalidades</li>
          <li>Cobranças programadas para alunos inadimplentes</li>
          <li>Confirmação automática de pagamento recebido</li>
          <li>Templates personalizáveis com variáveis dinâmicas</li>
          <li>Controle total de frequência e horário de envio</li>
          <li>Histórico completo com status de entrega em tempo real</li>
          <li>Envio de mensagens de teste para validação</li>
        </ul>
      </div>
    </div>
  );
}
