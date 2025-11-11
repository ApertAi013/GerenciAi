import { useState, useEffect } from 'react';
import { planService } from '../services/planService';
import type { CreatePlanRequest, UpdatePlanRequest } from '../services/planService';
import type { Plan } from '../types/enrollmentTypes';
import '../styles/Settings.css';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await planService.getPlans();
      if (response.status === 'success') {
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
    <div className="settings-page">
      <div className="page-header">
        <h1>Gerenciar Planos</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingPlan(null);
            setShowCreateModal(true);
          }}
        >
          + Novo Plano
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-content">
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.status === 'inativo' ? 'inactive' : ''}`}
            >
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <span className={`badge ${plan.status === 'ativo' ? 'badge-active' : 'badge-inactive'}`}>
                  {plan.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="plan-price">
                R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                <span className="plan-frequency">/mês</span>
              </div>

              <div className="plan-sessions">
                {plan.sessions_per_week}x por semana
              </div>

              {plan.description && (
                <p className="plan-description">{plan.description}</p>
              )}

              <div className="plan-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowCreateModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={plan.status === 'ativo' ? 'btn-warning' : 'btn-success'}
                  onClick={() => handleToggleStatus(plan)}
                >
                  {plan.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(plan.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="empty-state">
              <p>Nenhum plano cadastrado ainda.</p>
              <p>Clique em "+ Novo Plano" para começar.</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <PlanModal
          plan={editingPlan}
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
    </div>
  );
}

function PlanModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!plan;
  const [formData, setFormData] = useState<CreatePlanRequest | UpdatePlanRequest>({
    name: plan?.name || '',
    sessions_per_week: plan?.sessions_per_week || 1,
    price_cents: plan?.price_cents || 0,
    description: plan?.description || '',
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="level-form">
          <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
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

          <div className="form-group">
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

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
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
