import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faLayerGroup, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { levelService } from '../services/levelService';
import type { Level, CreateLevelRequest, UpdateLevelRequest } from '../types/levelTypes';
import { useThemeStore } from '../store/themeStore';
import '../styles/Settings.css';
import '../styles/ModernModal.css';

export default function Levels() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
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
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
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
    <div style={{ padding: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>Níveis</h1>
          <p style={{ color: isDark ? '#a0a0a0' : '#737373', fontSize: '14px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Gerencie os níveis dos seus alunos. Cada nível pode ter uma cor e ser usado para filtrar turmas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingLevel(null); setShowCreateModal(true); }}
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
          Novo Nível
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px',
      }}>
        {levels.map((level) => (
          <div
            key={level.id}
            style={{
              background: isDark ? '#1a1a1a' : 'white', borderRadius: '16px', padding: '24px',
              boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'box-shadow 0.2s, transform 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Top accent bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: level.color || (isDark ? '#333' : '#E5E5E5'),
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: level.color ? `${level.color}18` : (isDark ? '#262626' : '#F5F5F5'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FontAwesomeIcon
                  icon={faLayerGroup}
                  style={{ fontSize: '20px', color: level.color || (isDark ? '#6b6b6b' : '#A3A3A3') }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    margin: 0, fontSize: '18px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{level.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {level.is_default && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: isDark ? '#a0a0a0' : '#737373',
                      background: isDark ? '#262626' : '#F0F0F0', padding: '2px 8px', borderRadius: '4px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '9px' }} />
                      Padrão
                    </span>
                  )}
                  {level.color && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '4px',
                        backgroundColor: level.color, border: '1px solid rgba(0,0,0,0.08)',
                      }} />
                      <span style={{ fontSize: '11px', color: isDark ? '#6b6b6b' : '#A3A3A3', fontFamily: 'monospace' }}>
                        {level.color}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {level.description && (
              <p style={{
                margin: '0 0 16px 0', fontSize: '13px', color: isDark ? '#a0a0a0' : '#737373', lineHeight: '1.5',
              }}>{level.description}</p>
            )}

            {/* Order info */}
            {level.order_index !== undefined && level.order_index > 0 && (
              <div style={{
                background: isDark ? '#141414' : '#FAFAFA', borderRadius: '10px', padding: '10px 14px',
                marginBottom: '16px', fontSize: '13px', color: isDark ? '#a0a0a0' : '#737373',
              }}>
                Ordem: <strong style={{ color: isDark ? '#f0f0f0' : '#1a1a1a' }}>{level.order_index}</strong>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setEditingLevel(level); setShowCreateModal(true); }}
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
              {!level.is_default && (
                <button
                  type="button"
                  onClick={() => handleDelete(level.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? 'rgba(239, 68, 68, 0.06)' : '#FEF2F2', color: isDark ? '#f87171' : '#EF4444',
                    border: 'none', borderRadius: '10px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.06)' : '#FEF2F2')}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}

        {levels.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px',
            background: isDark ? '#1a1a1a' : 'white', borderRadius: '16px', boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}>
            <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: '40px', color: isDark ? '#333' : '#E5E5E5', marginBottom: '16px' }} />
            <p style={{ color: isDark ? '#a0a0a0' : '#737373', fontSize: '15px', margin: '0 0 8px 0' }}>Nenhum nível cadastrado ainda.</p>
            <p style={{ color: isDark ? '#6b6b6b' : '#A3A3A3', fontSize: '13px', margin: 0 }}>Clique em "Novo Nível" para começar.</p>
          </div>
        )}
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
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{isEditMode ? 'Editar Nível' : 'Criar Novo Nível'}</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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

              <div className="mm-field">
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
                : 'Criar Nível'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
