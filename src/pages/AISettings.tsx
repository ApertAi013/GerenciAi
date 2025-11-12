import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { premiumFeaturesService } from '../services/premiumFeaturesService';
import { aiService } from '../services/aiService';
import type { FeatureAccess, UsageInfo } from '../types/premiumFeaturesTypes';
import type { AISettings as AISettingsType, Frequency } from '../types/aiTypes';
import LimitReachedModal from '../components/chat/LimitReachedModal';
import '../styles/AISettings.css';

const AI_PROACTIVE_FEATURE_CODE = 'ai_proactive';

export default function AISettings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AISettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchSettings();
    }
  }, [featureAccess]);

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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await aiService.getSettings();
      if ((response as any).status === 'success' || (response as any).success === true) {
        setSettings(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await aiService.updateSettings({
        is_active: settings.is_active,
        payment_reminders_enabled: settings.payment_reminders_enabled,
        payment_reminders_frequency: settings.payment_reminders_frequency,
        available_slots_enabled: settings.available_slots_enabled,
        available_slots_frequency: settings.available_slots_frequency,
        low_occupancy_enabled: settings.low_occupancy_enabled,
        low_occupancy_frequency: settings.low_occupancy_frequency,
        inactive_students_enabled: settings.inactive_students_enabled,
        inactive_students_frequency: settings.inactive_students_frequency,
        schedule_conflicts_enabled: settings.schedule_conflicts_enabled,
        schedule_conflicts_frequency: settings.schedule_conflicts_frequency,
        preferred_notification_time: settings.preferred_notification_time,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        setSettings(response.data);
        toast.success('Configurações salvas com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setSaving(true);
      const response = await aiService.generateSuggestions();
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(`${response.data.suggestions_created} sugestões geradas!`);
      }
    } catch (error: any) {
      console.error('Erro ao gerar sugestões:', error);
      toast.error(error.response?.data?.message || 'Erro ao gerar sugestões');
    } finally {
      setSaving(false);
    }
  };

  const getFrequencyLabel = (freq: Frequency) => {
    switch (freq) {
      case 'daily': return 'Diariamente';
      case 'every_2_days': return 'A cada 2 dias';
      case 'weekly': return 'Semanalmente';
      case 'disabled': return 'Desativado';
      default: return freq;
    }
  };

  if (!user) {
    return (
      <div className="ai-settings-container">
        <div className="loading">Faça login para acessar as configurações</div>
      </div>
    );
  }

  if (isLoadingAccess || loading) {
    return (
      <div className="ai-settings-container">
        <div className="loading">Carregando configurações...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="ai-settings-container">
        <div className="error">Erro ao carregar configurações</div>
      </div>
    );
  }

  const isPremiumUser = featureAccess?.isUnlimited || false;
  const usageInfo: UsageInfo = featureAccess?.usageInfo || {};

  return (
    <div className="ai-settings-container">
      {/* Modal de Limite Atingido */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={handleCloseModal}
        onUpgrade={handleUpgrade}
        usageInfo={usageInfo}
      />
      <div className="ai-settings-header">
        <div>
          <h1>Configurações da IA</h1>
          <p>Configure as sugestões inteligentes do sistema</p>
        </div>
        <button
          className="btn-generate"
          onClick={handleGenerateSuggestions}
          disabled={saving || !settings.is_active}
        >
          Gerar Sugestões Agora
        </button>
      </div>

      <div className="ai-settings-content">
        {/* Ativar/Desativar IA */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Ativação Geral</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            {settings.is_active
              ? 'IA está ativa e gerando sugestões automaticamente'
              : 'IA está desativada. Ative para receber sugestões inteligentes'}
          </p>
        </div>

        {/* Horário Preferido */}
        <div className="settings-section">
          <h2>Horário Preferido para Notificações</h2>
          <input
            type="time"
            className="time-input"
            value={settings.preferred_notification_time || '09:00'}
            onChange={(e) =>
              setSettings({ ...settings, preferred_notification_time: e.target.value })
            }
            disabled={!settings.is_active}
          />
          <p className="section-description">
            Horário em que você prefere receber as sugestões da IA
          </p>
        </div>

        {/* Lembretes de Pagamento */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Lembretes de Pagamento</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.payment_reminders_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, payment_reminders_enabled: e.target.checked })
                }
                disabled={!settings.is_active}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            Receba alertas sobre alunos com pagamentos próximos do vencimento
          </p>
          {settings.payment_reminders_enabled && (
            <select
              className="frequency-select"
              value={settings.payment_reminders_frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  payment_reminders_frequency: e.target.value as Frequency,
                })
              }
              disabled={!settings.is_active}
            >
              <option value="daily">Diariamente</option>
              <option value="every_2_days">A cada 2 dias</option>
              <option value="weekly">Semanalmente</option>
            </select>
          )}
        </div>

        {/* Vagas Disponíveis */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Vagas Disponíveis</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.available_slots_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, available_slots_enabled: e.target.checked })
                }
                disabled={!settings.is_active}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            Identifique horários vagos e receba sugestões de preenchimento
          </p>
          {settings.available_slots_enabled && (
            <select
              className="frequency-select"
              value={settings.available_slots_frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  available_slots_frequency: e.target.value as Frequency,
                })
              }
              disabled={!settings.is_active}
            >
              <option value="daily">Diariamente</option>
              <option value="every_2_days">A cada 2 dias</option>
              <option value="weekly">Semanalmente</option>
            </select>
          )}
        </div>

        {/* Baixa Ocupação */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Alertas de Baixa Ocupação</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.low_occupancy_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, low_occupancy_enabled: e.target.checked })
                }
                disabled={!settings.is_active}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            Receba avisos sobre turmas com ocupação abaixo de 50%
          </p>
          {settings.low_occupancy_enabled && (
            <select
              className="frequency-select"
              value={settings.low_occupancy_frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  low_occupancy_frequency: e.target.value as Frequency,
                })
              }
              disabled={!settings.is_active}
            >
              <option value="daily">Diariamente</option>
              <option value="every_2_days">A cada 2 dias</option>
              <option value="weekly">Semanalmente</option>
            </select>
          )}
        </div>

        {/* Alunos Inativos */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Alunos Inativos</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.inactive_students_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, inactive_students_enabled: e.target.checked })
                }
                disabled={!settings.is_active}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            Identifique alunos sem pagamentos há mais de 60 dias
          </p>
          {settings.inactive_students_enabled && (
            <select
              className="frequency-select"
              value={settings.inactive_students_frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  inactive_students_frequency: e.target.value as Frequency,
                })
              }
              disabled={!settings.is_active}
            >
              <option value="daily">Diariamente</option>
              <option value="every_2_days">A cada 2 dias</option>
              <option value="weekly">Semanalmente</option>
            </select>
          )}
        </div>

        {/* Conflitos de Horário */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Conflitos de Horário</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.schedule_conflicts_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, schedule_conflicts_enabled: e.target.checked })
                }
                disabled={!settings.is_active}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="section-description">
            Detecte e receba alertas sobre conflitos de agendamento
          </p>
          {settings.schedule_conflicts_enabled && (
            <select
              className="frequency-select"
              value={settings.schedule_conflicts_frequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  schedule_conflicts_frequency: e.target.value as Frequency,
                })
              }
              disabled={!settings.is_active}
            >
              <option value="daily">Diariamente</option>
              <option value="every_2_days">A cada 2 dias</option>
              <option value="weekly">Semanalmente</option>
            </select>
          )}
        </div>

        {/* Botão Salvar */}
        <div className="settings-actions">
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
