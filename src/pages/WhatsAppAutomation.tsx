import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { AutomationSettings, WhatsAppTemplate } from '../types/whatsappTypes';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsAppAutomation.css';

export default function WhatsAppAutomation() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, templatesRes] = await Promise.all([
        whatsappService.getAutomationSettings(),
        whatsappService.getTemplates(),
      ]);

      if (settingsRes.status === 'success') setSettings(settingsRes.data);
      if (templatesRes.status === 'success') setTemplates(templatesRes.data);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await whatsappService.updateAutomationSettings(settings);

      if (response.status === 'success') {
        setSettings(response.data);
        toast.success('Configurações salvas com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<AutomationSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const getTemplatesByType = (type: string) => {
    return templates.filter((t) => t.template_type === type && t.is_active);
  };

  if (!user || loading) {
    return (
      <div className="whatsapp-automation-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="whatsapp-automation-container">
        <div className="error">Erro ao carregar configurações</div>
      </div>
    );
  }

  return (
    <div className="whatsapp-automation-container">
      <div className="automation-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>
            Configurações de Automação <PremiumBadge />
          </h1>
          <p>Configure regras para envio automático de mensagens</p>
        </div>
      </div>

      <div className="automation-content">
        {/* Lembrete de Vencimento */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Lembrete de Vencimento</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.due_reminder_enabled}
                onChange={(e) => updateSettings({ due_reminder_enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Enviar lembrete antes do vencimento da mensalidade</p>

          {settings.due_reminder_enabled && (
            <>
              <div className="form-group">
                <label>Enviar quantos dias antes?</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.due_reminder_days_before}
                  onChange={(e) => updateSettings({ due_reminder_days_before: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Template</label>
                <select
                  value={settings.due_reminder_template_id || ''}
                  onChange={(e) => updateSettings({ due_reminder_template_id: parseInt(e.target.value) || null })}
                >
                  <option value="">Selecione um template</option>
                  {getTemplatesByType('due_reminder').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Lembrete de Atraso */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Lembrete de Atraso</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.overdue_reminder_enabled}
                onChange={(e) => updateSettings({ overdue_reminder_enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Enviar lembretes para alunos inadimplentes</p>

          {settings.overdue_reminder_enabled && (
            <>
              <div className="form-group">
                <label>Frequência (dias)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.overdue_reminder_frequency_days}
                  onChange={(e) => updateSettings({ overdue_reminder_frequency_days: parseInt(e.target.value) })}
                />
                <small>A cada quantos dias enviar lembrete de atraso</small>
              </div>

              <div className="form-group">
                <label>Máximo de lembretes</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.overdue_reminder_max_count}
                  onChange={(e) => updateSettings({ overdue_reminder_max_count: parseInt(e.target.value) })}
                />
                <small>Número máximo de lembretes por fatura</small>
              </div>

              <div className="form-group">
                <label>Template</label>
                <select
                  value={settings.overdue_reminder_template_id || ''}
                  onChange={(e) => updateSettings({ overdue_reminder_template_id: parseInt(e.target.value) || null })}
                >
                  <option value="">Selecione um template</option>
                  {getTemplatesByType('overdue_reminder').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Confirmação de Pagamento */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Confirmação de Pagamento</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.payment_confirmation_enabled}
                onChange={(e) => updateSettings({ payment_confirmation_enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Enviar mensagem de confirmação ao receber pagamento</p>

          {settings.payment_confirmation_enabled && (
            <div className="form-group">
              <label>Template</label>
              <select
                value={settings.payment_confirmation_template_id || ''}
                onChange={(e) => updateSettings({ payment_confirmation_template_id: parseInt(e.target.value) || null })}
              >
                <option value="">Selecione um template</option>
                {getTemplatesByType('payment_confirmation').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Horário de Envio */}
        <div className="settings-section">
          <h2>Horário de Envio</h2>
          <p>Defina o horário preferencial para envio das mensagens</p>

          <div className="time-inputs">
            <div className="form-group">
              <label>Hora</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.send_time_hour}
                onChange={(e) => updateSettings({ send_time_hour: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Minuto</label>
              <input
                type="number"
                min="0"
                max="59"
                value={settings.send_time_minute}
                onChange={(e) => updateSettings({ send_time_minute: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.skip_weekends}
              onChange={(e) => updateSettings({ skip_weekends: e.target.checked })}
            />
            Pular fins de semana
          </label>
        </div>

        {/* Botão Salvar */}
        <button className="btn-save-large" onClick={handleSave} disabled={saving}>
          <FontAwesomeIcon icon={faSave} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
