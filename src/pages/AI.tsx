import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { premiumFeaturesService } from '../services/premiumFeaturesService';
import type { FeatureAccess, UsageInfo } from '../types/premiumFeaturesTypes';
import AIProactiveOnboardingTour from '../components/ai/AIProactiveOnboardingTour';
import LimitReachedModal from '../components/chat/LimitReachedModal';
import '../styles/AI.css';

const ONBOARDING_KEY = 'ai_proactive_onboarding_completed';
const AI_PROACTIVE_FEATURE_CODE = 'ai_proactive';

export default function AI() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Premium features state
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Carregar acesso premium ao iniciar
  useEffect(() => {
    if (user) {
      loadPremiumAccess();
    }
  }, [user]);

  // Verificar se deve mostrar onboarding
  useEffect(() => {
    if (featureAccess?.hasAccess) {
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [featureAccess]);

  // Carregar acesso premium
  const loadPremiumAccess = async () => {
    try {
      setIsLoadingAccess(true);
      const response = await premiumFeaturesService.getMyAccess(AI_PROACTIVE_FEATURE_CODE);
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

  // Concluir onboarding
  const handleOnboardingFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // Ação de upgrade (contatar admin)
  const handleUpgrade = () => {
    alert(
      '💎 Para contratar a IA Proativa com sugestões automáticas:\n\n' +
      '📧 Entre em contato com:\n' +
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
      <div className="ai-container">
        <div className="ai-header">
          <p>Faça login para acessar a IA Proativa</p>
        </div>
      </div>
    );
  }

  if (isLoadingAccess) {
    return (
      <div className="ai-container">
        <div className="ai-header">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const isPremiumUser = featureAccess?.isUnlimited || false;
  const usageInfo: UsageInfo = featureAccess?.usageInfo || {};

  return (
    <div className="ai-container">
      {/* Tour de Onboarding */}
      <AIProactiveOnboardingTour
        run={showOnboarding}
        onFinish={handleOnboardingFinish}
        isPremiumUser={isPremiumUser}
      />

      {/* Modal de Limite Atingido */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        usageInfo={usageInfo}
      />

      <div className="ai-header">
        <h1>Inteligência Artificial {isPremiumUser && '👑'}</h1>
        <p>Gerencie configurações e visualize sugestões inteligentes do sistema</p>
        {!isPremiumUser && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#f59e0b' }}>
            💎 Feature Premium - Entre em contato para contratar
          </p>
        )}
      </div>

      <div className="ai-cards">
        <div className="ai-card" onClick={() => handleNavigation('/ia/sugestoes')}>
          <div className="ai-card-icon suggestions">💡</div>
          <h2>Sugestões</h2>
          <p>Visualize e gerencie sugestões inteligentes geradas pela IA</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              🔒 Requer acesso premium
            </div>
          )}
          <button className="ai-card-button">Acessar Sugestões →</button>
        </div>

        <div className="ai-card" onClick={() => handleNavigation('/ia/configuracoes')}>
          <div className="ai-card-icon settings">⚙️</div>
          <h2>Configurações</h2>
          <p>Configure tipos de análises, frequências e horários da IA</p>
          {!featureAccess?.hasAccess && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>
              🔒 Requer acesso premium
            </div>
          )}
          <button className="ai-card-button">Acessar Configurações →</button>
        </div>
      </div>

      <div className="ai-info">
        <h3>Como funciona?</h3>
        <div className="ai-info-grid">
          <div className="ai-info-item">
            <strong>1. Configure</strong>
            <p>Escolha quais tipos de análises a IA deve fazer e com qual frequência</p>
          </div>
          <div className="ai-info-item">
            <strong>2. IA Analisa</strong>
            <p>O sistema analisa seus dados automaticamente e gera sugestões personalizadas</p>
          </div>
          <div className="ai-info-item">
            <strong>3. Ação</strong>
            <p>Visualize as sugestões e tome ações para otimizar sua gestão</p>
          </div>
        </div>
      </div>
    </div>
  );
}
