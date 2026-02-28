import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faDollarSign, faCalendarWeek, faChartLine, faPowerOff, faCheckCircle, faTableTennis } from '@fortawesome/free-solid-svg-icons';
import { planService } from '../services/planService';
import { modalityService } from '../services/modalityService';
import type { CreatePlanRequest, UpdatePlanRequest, BulkAdjustRequest, BulkAdjustResponse } from '../services/planService';
import type { Plan } from '../types/enrollmentTypes';
import type { Modality } from '../types/classTypes';
import { useThemeStore } from '../store/themeStore';
import '../styles/Settings.css';
import '../styles/ModernModal.css';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export default function Plans() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchPlans(), fetchModalities()]);
  };

  const fetchModalities = async () => {
    try {
      const response = await modalityService.getModalities();
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setModalities(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await planService.getPlans();
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      setError('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;

    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      return;
    }

    try {
      await planService.deletePlan(id);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir plano');
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    const newStatus = plan.status === 'ativo' ? 'inativo' : 'ativo';

    try {
      await planService.updatePlan(plan.id, { status: newStatus });
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>Planos</h1>
          <p style={{ color: isDark ? '#a0a0a0' : '#737373', fontSize: '14px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Gerencie os planos de matrícula. Defina preço, frequência semanal e modalidade.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowBulkAdjustModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: isDark ? '#262626' : '#F5F5F5', color: isDark ? '#d0d0d0' : '#404040',
              border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? '#333' : '#EBEBEB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? '#262626' : '#F5F5F5')}
          >
            <FontAwesomeIcon icon={faChartLine} />
            Reajuste Global
          </button>
          <button
            type="button"
            onClick={() => { setEditingPlan(null); setShowCreateModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#FF9900', color: 'white',
              border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e68a00')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FF9900')}
          >
            <FontAwesomeIcon icon={faPlus} />
            Novo Plano
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px',
      }}>
        {plans.map((plan) => {
          const isActive = plan.status === 'ativo';
          return (
            <div
              key={plan.id}
              style={{
                background: isDark ? '#1a1a1a' : 'white', borderRadius: '16px', padding: '24px',
                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                position: 'relative', overflow: 'hidden',
                opacity: isActive ? 1 : 0.65,
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: isActive ? '#FF9900' : '#D4D4D4',
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: isActive ? (isDark ? 'rgba(255, 153, 0, 0.15)' : '#FFF3E0') : (isDark ? '#262626' : '#F5F5F5'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    style={{ fontSize: '20px', color: isActive ? '#FF9900' : '#A3A3A3' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0, fontSize: '18px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                      ...(isActive
                        ? { color: '#16a34a', background: '#f0fdf4' }
                        : { color: '#737373', background: '#F0F0F0' }),
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <FontAwesomeIcon icon={isActive ? faCheckCircle : faPowerOff} style={{ fontSize: '9px' }} />
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {plan.modality_name && (
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: '#6366f1',
                        background: '#EEF2FF', padding: '2px 8px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={faTableTennis} style={{ fontSize: '9px' }} />
                        {plan.modality_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price + sessions */}
              <div style={{
                display: 'flex', gap: '12px', marginBottom: '16px',
              }}>
                <div style={{
                  flex: 1, background: isDark ? '#141414' : '#FAFAFA', borderRadius: '10px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faDollarSign} style={{ color: '#FF9900', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>
                      {formatCurrency(plan.price_cents)}
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#6b6b6b' : '#A3A3A3', fontWeight: 500 }}>por mês</div>
                  </div>
                </div>
                <div style={{
                  flex: 1, background: isDark ? '#141414' : '#FAFAFA', borderRadius: '10px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faCalendarWeek} style={{ color: '#3B82F6', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>
                      {plan.sessions_per_week}x
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#6b6b6b' : '#A3A3A3', fontWeight: 500 }}>por semana</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {plan.description && (
                <p style={{
                  margin: '0 0 16px 0', fontSize: '13px', color: isDark ? '#a0a0a0' : '#737373', lineHeight: '1.5',
                }}>{plan.description}</p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setEditingPlan(plan); setShowCreateModal(true); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? '#262626' : '#F5F5F5', color: isDark ? '#d0d0d0' : '#404040',
                    border: 'none', borderRadius: '10px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? '#333' : '#EBEBEB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? '#262626' : '#F5F5F5')}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: '12px' }} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(plan)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px',
                    background: isActive ? '#FFFBEB' : '#f0fdf4',
                    color: isActive ? '#D97706' : '#16a34a',
                    border: 'none', borderRadius: '10px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isActive ? '#FEF3C7' : '#dcfce7')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? '#FFFBEB' : '#f0fdf4')}
                >
                  <FontAwesomeIcon icon={isActive ? faPowerOff : faCheckCircle} style={{ fontSize: '12px' }} />
                  {isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', color: '#EF4444',
                    border: 'none', borderRadius: '10px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2')}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
                  Excluir
                </button>
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px',
            background: isDark ? '#1a1a1a' : 'white', borderRadius: '16px', boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}>
            <FontAwesomeIcon icon={faDollarSign} style={{ fontSize: '40px', color: isDark ? '#333' : '#E5E5E5', marginBottom: '16px' }} />
            <p style={{ color: isDark ? '#a0a0a0' : '#737373', fontSize: '15px', margin: '0 0 8px 0' }}>Nenhum plano cadastrado ainda.</p>
            <p style={{ color: isDark ? '#6b6b6b' : '#A3A3A3', fontSize: '13px', margin: 0 }}>Clique em "Novo Plano" para começar.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <PlanModal
          plan={editingPlan}
          modalities={modalities}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingPlan(null);
            fetchPlans();
          }}
        />
      )}

      {showBulkAdjustModal && (
        <BulkAdjustModal
          plans={plans}
          onClose={() => setShowBulkAdjustModal(false)}
          onSuccess={() => {
            setShowBulkAdjustModal(false);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}

function PlanModal({
  plan,
  modalities,
  onClose,
  onSuccess,
}: {
  plan: Plan | null;
  modalities: Modality[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!plan;
  const [formData, setFormData] = useState<CreatePlanRequest | UpdatePlanRequest>({
    name: plan?.name || '',
    sessions_per_week: plan?.sessions_per_week || 1,
    price_cents: plan?.price_cents || 0,
    description: plan?.description || '',
    modality_id: plan?.modality_id || undefined,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.sessions_per_week || formData.sessions_per_week < 1) {
      setError('Sessões por semana deve ser pelo menos 1');
      return;
    }

    if (!formData.price_cents || formData.price_cents < 0) {
      setError('Preço deve ser maior ou igual a zero');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && plan) {
        await planService.updatePlan(plan.id, formData);
      } else {
        await planService.createPlan(formData as CreatePlanRequest);
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao ${isEditMode ? 'atualizar' : 'criar'} plano`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{isEditMode ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit} className="level-form">
          <div className="mm-content">
            <div className="mm-field">
              <label htmlFor="name">Nome do Plano *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Plano 2x por semana"
                required
              />
            </div>

            <div className="mm-field-row">
              <div className="mm-field">
                <label htmlFor="sessions_per_week">Aulas por Semana *</label>
                <input
                  id="sessions_per_week"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.sessions_per_week}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessions_per_week: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="mm-field">
                <label htmlFor="price">Preço Mensal (R$) *</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={(formData.price_cents! / 100).toFixed(2)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_cents: Math.round(parseFloat(e.target.value) * 100),
                    })
                  }
                  placeholder="150.00"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Digite o valor desejado (ex: 150.00)
                </small>
              </div>
            </div>

            <div className="mm-field">
              <label htmlFor="modality_id">Modalidade</label>
              <select
                id="modality_id"
                value={formData.modality_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modality_id: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Todas as modalidades</option>
                {modalities.map((modality) => (
                  <option key={modality.id} value={modality.id}>
                    {modality.name}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Se definir uma modalidade, só turmas dessa modalidade aparecerão na matrícula
              </small>
            </div>

            <div className="mm-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Descrição opcional do plano"
              />
            </div>
          </div>

          <div className="mm-footer">
            <button
              type="button"
              className="mm-btn mm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="mm-btn mm-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? 'Salvando...'
                  : 'Criando...'
                : isEditMode
                ? 'Salvar Alterações'
                : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkAdjustModal({
  plans,
  onClose,
  onSuccess,
}: {
  plans: Plan[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [applyToOpenInvoices, setApplyToOpenInvoices] = useState(false);
  const [applyFromMonth, setApplyFromMonth] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkAdjustResponse['data'] | null>(null);

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPlanIds(plans.filter(p => p.status === 'ativo').map(p => p.id));
    } else {
      setSelectedPlanIds([]);
    }
  };

  const handlePlanToggle = (planId: number) => {
    setSelectedPlanIds(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  const calculateNewPrice = (currentPrice: number): number => {
    const value = parseFloat(adjustmentValue) || 0;
    if (adjustmentType === 'percentage') {
      return Math.round(currentPrice * (1 + value / 100));
    } else {
      return Math.max(0, currentPrice + Math.round(value * 100));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedPlanIds.length === 0) {
      setError('Selecione pelo menos um plano');
      return;
    }

    const value = parseFloat(adjustmentValue);
    if (isNaN(value) || value === 0) {
      setError('Digite um valor válido para o ajuste');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: BulkAdjustRequest = {
        plan_ids: selectedPlanIds,
        adjustment_type: adjustmentType,
        adjustment_value: adjustmentType === 'percentage' ? value : Math.round(value * 100),
        apply_to_open_invoices: applyToOpenInvoices,
      };

      if (applyToOpenInvoices && applyFromMonth) {
        request.apply_from_month = applyFromMonth;
      }

      const response = await planService.bulkAdjustPrices(request);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao aplicar reajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show result screen after success
  if (result) {
    return (
      <div className="mm-overlay" onClick={onClose}>
        <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="mm-header">
            <h2>Reajuste Aplicado</h2>
            <button type="button" className="mm-close" onClick={onSuccess}>
              ✕
            </button>
          </div>

          <div className="mm-content">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div>
                <strong style={{ fontSize: '2rem', color: '#4CAF50' }}>{result.plans_updated}</strong>
                <div style={{ color: '#666' }}>planos atualizados</div>
              </div>
              <div>
                <strong style={{ fontSize: '2rem', color: '#2196F3' }}>{result.invoices_updated}</strong>
                <div style={{ color: '#666' }}>faturas atualizadas</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '0.5rem' }}>Detalhes:</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Plano</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Antes</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Depois</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Faturas</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((detail) => (
                    <tr key={detail.plan_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{detail.plan_name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#999' }}>{detail.old_price}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#4CAF50', fontWeight: 'bold' }}>{detail.new_price}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{detail.invoices_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mm-footer">
            <button type="button" className="mm-btn mm-btn-primary" onClick={onSuccess}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Reajuste Global de Valores</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mm-content">
            {/* Plan Selection */}
            <div className="mm-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <strong>Selecionar todos os planos ativos</strong>
              </label>

              <div style={{
                maxHeight: '250px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '0.5rem'
              }}>
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      opacity: plan.status === 'inativo' ? 0.5 : 1,
                      background: selectedPlanIds.includes(plan.id) ? '#e3f2fd' : 'transparent',
                      borderBottom: '1px solid #eee',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlanIds.includes(plan.id)}
                      onChange={() => handlePlanToggle(plan.id)}
                      disabled={plan.status === 'inativo'}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {plan.name}
                    </span>
                    <span style={{ color: '#666', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                    </span>
                    {selectedPlanIds.includes(plan.id) && adjustmentValue ? (
                      <span style={{ color: '#4CAF50', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {'→'} R$ {(calculateNewPrice(plan.price_cents) / 100).toFixed(2).replace('.', ',')}
                      </span>
                    ) : (
                      <span style={{ minWidth: '100px' }}></span>
                    )}
                  </label>
                ))}
              </div>
              <small style={{ color: '#666' }}>
                {selectedPlanIds.length} plano(s) selecionado(s)
              </small>
            </div>

            {/* Adjustment Type */}
            <div className="mm-field" style={{ marginTop: '1rem' }}>
              <label><strong>Tipo de Ajuste</strong></label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === 'percentage'}
                    onChange={() => setAdjustmentType('percentage')}
                  />
                  Porcentagem (%)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === 'fixed'}
                    onChange={() => setAdjustmentType('fixed')}
                  />
                  Valor Fixo (R$)
                </label>
              </div>
            </div>

            {/* Adjustment Value */}
            <div className="mm-field" style={{ marginTop: '1rem' }}>
              <label htmlFor="adjustmentValue">
                <strong>Valor do Ajuste</strong>
                <span style={{ color: '#666', fontWeight: 'normal' }}>
                  {' '}(use valor negativo para redução)
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="adjustmentValue"
                  type="number"
                  step={adjustmentType === 'percentage' ? '0.1' : '0.01'}
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === 'percentage' ? 'Ex: 10 para +10%' : 'Ex: 20.00 para +R$20'}
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#666', minWidth: '30px' }}>
                  {adjustmentType === 'percentage' ? '%' : 'R$'}
                </span>
              </div>
              <small style={{ color: '#666' }}>
                {adjustmentType === 'percentage'
                  ? 'Ex: 10 = aumento de 10%, -5 = redução de 5%'
                  : 'Ex: 20 = aumento de R$20, -10 = redução de R$10'
                }
              </small>
            </div>

            {/* Apply to Invoices */}
            <div className="mm-field" style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff3e0', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={applyToOpenInvoices}
                  onChange={(e) => setApplyToOpenInvoices(e.target.checked)}
                />
                <strong>Aplicar também nas faturas em aberto</strong>
              </label>
              <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                Se marcado, as faturas com status "aberta" ou "vencida" também serão atualizadas com o novo valor.
              </small>

              {applyToOpenInvoices && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="applyFromMonth">A partir de qual mês? (opcional)</label>
                  <input
                    id="applyFromMonth"
                    type="month"
                    value={applyFromMonth}
                    onChange={(e) => setApplyFromMonth(e.target.value)}
                    min={currentMonth}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <small style={{ color: '#666', display: 'block' }}>
                    Deixe em branco para aplicar em todas as faturas em aberto.
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="mm-footer">
            <button
              type="button"
              className="mm-btn mm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="mm-btn mm-btn-primary"
              disabled={isSubmitting || selectedPlanIds.length === 0}
            >
              {isSubmitting ? 'Aplicando...' : `Aplicar Reajuste (${selectedPlanIds.length} planos)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
