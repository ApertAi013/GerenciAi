import { useState, useEffect } from 'react';
import { levelService } from '../services/levelService';
import type { Level, CreateLevelRequest, UpdateLevelRequest } from '../types/levelTypes';
import '../styles/Settings.css';

export default function Levels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setIsLoading(true);
      const response = await levelService.getLevels();
      if (response.status === 'success') {
        setLevels(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar níveis:', error);
      setError('Erro ao carregar níveis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const level = levels.find((l) => l.id === id);
    if (!level) return;

    if (level.is_default) {
      alert('Não é possível excluir níveis padrão do sistema');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o nível "${level.name}"?`)) {
      return;
    }

    try {
      await levelService.deleteLevel(id);
      fetchLevels();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir nível');
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
        <h1>Gerenciar Níveis</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingLevel(null);
            setShowCreateModal(true);
          }}
        >
          + Novo Nível
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-content">
        <div className="levels-grid">
          {levels.map((level) => (
            <div
              key={level.id}
              className="level-card"
              style={{
                borderLeft: level.color ? `4px solid ${level.color}` : undefined,
              }}
            >
              <div className="level-header">
                <h3>{level.name}</h3>
                {level.is_default && (
                  <span className="badge badge-default">Padrão</span>
                )}
              </div>
              {level.description && <p className="level-description">{level.description}</p>}
              {level.color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>Cor:</span>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: level.color,
                      border: '1px solid #ddd',
                    }}
                  />
                </div>
              )}
              <div className="level-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingLevel(level);
                    setShowCreateModal(true);
                  }}
                >
                  Editar
                </button>
                {!level.is_default && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(level.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <LevelModal
          level={editingLevel}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLevel(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingLevel(null);
            fetchLevels();
          }}
        />
      )}
    </div>
  );
}

function LevelModal({
  level,
  onClose,
  onSuccess,
}: {
  level: Level | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!level;
  const [formData, setFormData] = useState<CreateLevelRequest | UpdateLevelRequest>({
    name: level?.name || '',
    description: level?.description || '',
    color: level?.color || '#2196f3',
    order_index: level?.order_index || 0,
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
      if (isEditMode && level) {
        await levelService.updateLevel(level.id, formData);
      } else {
        await levelService.createLevel(formData as CreateLevelRequest);
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao ${isEditMode ? 'atualizar' : 'criar'} nível`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Nível' : 'Criar Novo Nível'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="level-form">
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="order_index">Ordem</label>
              <input
                id="order_index"
                type="number"
                value={formData.order_index || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value),
                  })
                }
                min="0"
              />
            </div>
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
                : 'Criar Nível'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
