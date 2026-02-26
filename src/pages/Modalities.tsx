import { useState, useEffect } from 'react';
import { modalityService } from '../services/modalityService';
import type { Modality, CreateModalityRequest, UpdateModalityRequest } from '../types/levelTypes';
import '../styles/Settings.css';
import '../styles/ModernModal.css';

export default function Modalities() {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModality, setEditingModality] = useState<Modality | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModalities();
  }, []);

  const fetchModalities = async () => {
    try {
      setIsLoading(true);
      const response = await modalityService.getModalities();
      if ((response as any).status === 'success' || (response as any).success === true) {
        setModalities(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error);
      setError('Erro ao carregar modalidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const modality = modalities.find((m) => m.id === id);
    if (!modality) return;

    if (!confirm(`Tem certeza que deseja excluir a modalidade "${modality.name}"?`)) {
      return;
    }

    try {
      await modalityService.deleteModality(id);
      fetchModalities();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir modalidade');
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
        <h1>Gerenciar Modalidades</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingModality(null);
            setShowCreateModal(true);
          }}
        >
          + Nova Modalidade
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-content">
        <div className="modalities-grid">
          {modalities.map((modality) => (
            <div
              key={modality.id}
              className="modality-card"
              style={{
                borderLeft: modality.color ? `4px solid ${modality.color}` : undefined,
              }}
            >
              <div className="modality-header">
                {modality.icon && <span className="modality-icon">{modality.icon}</span>}
                <h3>{modality.name}</h3>
              </div>
              {modality.description && (
                <p className="modality-description">{modality.description}</p>
              )}
              {modality.classes_count !== undefined && (
                <p className="modality-stats">{modality.classes_count} turma(s)</p>
              )}
              {modality.color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>Cor:</span>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: modality.color,
                      border: '1px solid #ddd',
                    }}
                  />
                </div>
              )}
              <div className="modality-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingModality(modality);
                    setShowCreateModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(modality.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <ModalityModal
          modality={editingModality}
          onClose={() => {
            setShowCreateModal(false);
            setEditingModality(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingModality(null);
            fetchModalities();
          }}
        />
      )}
    </div>
  );
}

function ModalityModal({
  modality,
  onClose,
  onSuccess,
}: {
  modality: Modality | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!modality;
  const [formData, setFormData] = useState<CreateModalityRequest | UpdateModalityRequest>({
    name: modality?.name || '',
    description: modality?.description || '',
    icon: modality?.icon || '',
    color: modality?.color || '#2196f3',
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

    setIsSubmitting(true);

    try {
      if (isEditMode && modality) {
        await modalityService.updateModality(modality.id, formData);
      } else {
        await modalityService.createModality(formData as CreateModalityRequest);
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao ${isEditMode ? 'atualizar' : 'criar'} modalidade`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{isEditMode ? 'Editar Modalidade' : 'Criar Nova Modalidade'}</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modality-form">
          <div className="mm-content">
            <div className="mm-field">
              <label htmlFor="name">Nome *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
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
              />
            </div>

            <div className="mm-field-row">
              <div className="mm-field">
                <label htmlFor="icon">Ícone (Emoji)</label>
                <input
                  id="icon"
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="⚽"
                  maxLength={2}
                />
              </div>

              <div className="mm-field">
                <label htmlFor="color">Cor</label>
                <input
                  id="color"
                  type="color"
                  value={formData.color || '#2196f3'}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
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
                : 'Criar Modalidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
