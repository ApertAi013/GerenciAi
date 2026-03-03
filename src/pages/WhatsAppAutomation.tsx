import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faTimes, faSearch, faUsers } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import type { AutomationSettings } from '../types/whatsappTypes';
import type { Modality, Class } from '../types/classTypes';
import type { Student } from '../types/studentTypes';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsAppAutomation.css';

export default function WhatsAppAutomation() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Audience data
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, modalitiesRes, classesRes, studentsRes] = await Promise.all([
        whatsappService.getAutomationSettings(),
        classService.getModalities().catch(() => ({ success: false, data: [] })),
        classService.getClasses({ limit: 500 }).catch(() => ({ success: false, data: [] })),
        studentService.getStudents({ limit: 500, status: 'ativo' }).catch(() => ({ success: false, data: [] })),
      ]);

      if (settingsRes.status === 'success' || settingsRes.success) {
        const s = settingsRes.data;
        if (s) {
          // Parse JSON fields from backend
          if (typeof s.audience_modality_ids === 'string') s.audience_modality_ids = JSON.parse(s.audience_modality_ids);
          if (typeof s.audience_class_ids === 'string') s.audience_class_ids = JSON.parse(s.audience_class_ids);
          if (typeof s.audience_student_ids === 'string') s.audience_student_ids = JSON.parse(s.audience_student_ids);
          if (!s.audience_type) s.audience_type = 'all';
          setSettings(s);
        } else {
          // No settings yet — set defaults so the page renders
          setSettings({
            due_reminder_enabled: false,
            due_reminder_days_before: 3,
            due_reminder_template_id: null,
            overdue_reminder_enabled: false,
            overdue_reminder_frequency_days: 7,
            overdue_reminder_max_count: 3,
            overdue_reminder_template_id: null,
            payment_confirmation_enabled: false,
            payment_confirmation_template_id: null,
            send_time_hour: 9,
            send_time_minute: 0,
            skip_weekends: false,
            audience_type: 'all',
            audience_modality_ids: null,
            audience_class_ids: null,
            audience_student_ids: null,
          });
        }
      }
      if ((modalitiesRes as any).success || (modalitiesRes as any).status === 'success') setModalities((modalitiesRes as any).data || []);
      if ((classesRes as any).success || (classesRes as any).status === 'success') setClasses((classesRes as any).data || []);
      if ((studentsRes as any).success || (studentsRes as any).status === 'success') setAllStudents((studentsRes as any).data || []);
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

      if ((response as any).status === 'success' || (response as any).success === true) {
        const s = response.data;
        if (typeof s.audience_modality_ids === 'string') s.audience_modality_ids = JSON.parse(s.audience_modality_ids);
        if (typeof s.audience_class_ids === 'string') s.audience_class_ids = JSON.parse(s.audience_class_ids);
        if (typeof s.audience_student_ids === 'string') s.audience_student_ids = JSON.parse(s.audience_student_ids);
        setSettings(s);
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

  // Audience helpers
  const toggleModalityId = (id: number) => {
    if (!settings) return;
    const current = settings.audience_modality_ids || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    updateSettings({ audience_modality_ids: updated });
  };

  const toggleClassId = (id: number) => {
    if (!settings) return;
    const current = settings.audience_class_ids || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    updateSettings({ audience_class_ids: updated });
  };

  const addStudentId = (id: number) => {
    if (!settings) return;
    const current = settings.audience_student_ids || [];
    if (!current.includes(id)) {
      updateSettings({ audience_student_ids: [...current, id] });
    }
    setStudentSearch('');
    setShowSearchResults(false);
  };

  const removeStudentId = (id: number) => {
    if (!settings) return;
    const current = settings.audience_student_ids || [];
    updateSettings({ audience_student_ids: current.filter((x) => x !== id) });
  };

  const searchResults = useMemo(() => {
    if (!studentSearch || studentSearch.length < 2) return [];
    const selected = settings?.audience_student_ids || [];
    return allStudents
      .filter(
        (s) =>
          !selected.includes(s.id) &&
          s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
      )
      .slice(0, 8);
  }, [studentSearch, allStudents, settings?.audience_student_ids]);

  const selectedStudents = useMemo(() => {
    if (!settings?.audience_student_ids?.length) return [];
    return allStudents.filter((s) => settings.audience_student_ids!.includes(s.id));
  }, [settings?.audience_student_ids, allStudents]);

  const weekdayLabel: Record<string, string> = {
    seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
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
        {/* Público-alvo */}
        <div className="settings-section">
          <div className="section-header">
            <h2><FontAwesomeIcon icon={faUsers} style={{ marginRight: 8 }} />Público-alvo</h2>
          </div>
          <p>Defina para quais alunos as automações serão enviadas</p>

          <div className="form-group">
            <select
              value={settings.audience_type || 'all'}
              onChange={(e) => updateSettings({ audience_type: e.target.value as any })}
            >
              <option value="all">Todos os alunos</option>
              <option value="by_modality">Por modalidade</option>
              <option value="by_class">Por turma</option>
              <option value="custom">Personalizado (selecionar alunos)</option>
            </select>
          </div>

          {settings.audience_type === 'all' && (
            <small className="audience-info">Automações serão enviadas para todos os alunos com matrícula ativa.</small>
          )}

          {settings.audience_type === 'by_modality' && (
            <div className="audience-checkboxes">
              {modalities.length === 0 ? (
                <small>Nenhuma modalidade cadastrada.</small>
              ) : (
                modalities.map((m) => (
                  <label key={m.id} className="audience-checkbox-item">
                    <input
                      type="checkbox"
                      checked={(settings.audience_modality_ids || []).includes(m.id)}
                      onChange={() => toggleModalityId(m.id)}
                    />
                    <span>{m.name}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {settings.audience_type === 'by_class' && (
            <div className="audience-checkboxes">
              {classes.length === 0 ? (
                <small>Nenhuma turma cadastrada.</small>
              ) : (
                classes.filter((c) => c.status === 'ativa').map((c) => (
                  <label key={c.id} className="audience-checkbox-item">
                    <input
                      type="checkbox"
                      checked={(settings.audience_class_ids || []).includes(c.id)}
                      onChange={() => toggleClassId(c.id)}
                    />
                    <span>
                      {c.modality_name ? `${c.modality_name} — ` : ''}
                      {c.name || `${weekdayLabel[c.weekday] || c.weekday} ${c.start_time?.slice(0, 5) || ''}`}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}

          {settings.audience_type === 'custom' && (
            <div className="audience-custom">
              <div className="audience-search-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar aluno por nome..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="audience-search-results">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        className="search-result-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addStudentId(s.id)}
                      >
                        {s.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedStudents.length > 0 && (
                <div className="audience-chips">
                  {selectedStudents.map((s) => (
                    <span key={s.id} className="audience-chip">
                      {s.full_name}
                      <button onClick={() => removeStudentId(s.id)} title="Remover">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {selectedStudents.length === 0 && (
                <small className="audience-info">Nenhum aluno selecionado. Use a busca acima para adicionar.</small>
              )}
            </div>
          )}
        </div>

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
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '8px' }}>
              O template de confirmação será enviado automaticamente ao registrar um pagamento.
            </p>
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
