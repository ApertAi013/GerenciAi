import { useState, useEffect } from 'react';
import { arenaService } from '../services/arenaService';
import { useAuthStore } from '../store/authStore';
import type { Arena } from '../types/authTypes';
import '../styles/Settings.css';

interface ArenaWithCounts extends Arena {
  student_count?: number;
  class_count?: number;
  description?: string;
  created_at?: string;
}

export default function Arenas() {
  const [arenas, setArenas] = useState<ArenaWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArena, setEditingArena] = useState<ArenaWithCounts | null>(null);
  const [error, setError] = useState('');
  const { currentArenaId, setCurrentArena, user, setUser } = useAuthStore();

  useEffect(() => {
    fetchArenas();
  }, []);

  const fetchArenas = async () => {
    try {
      setIsLoading(true);
      const response = await arenaService.getArenas();
      if (response.status === 'success' && response.data) {
        setArenas(response.data as ArenaWithCounts[]);
      }
    } catch (error) {
      console.error('Erro ao buscar arenas:', error);
      setError('Erro ao carregar arenas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    const arena = arenas.find((a) => a.id === id);
    if (!arena) return;

    if (arena.is_default) {
      alert('Nao e possivel desativar a arena padrao');
      return;
    }

    if (!confirm(`Tem certeza que deseja desativar a arena "${arena.name}"? Alunos e turmas desta arena nao serao mais visíveis.`)) {
      return;
    }

    try {
      await arenaService.deleteArena(id);
      fetchArenas();
      // Update user's arenas list
      if (user) {
        const updatedArenas = user.arenas?.filter(a => a.id !== id) || [];
        setUser({ ...user, arenas: updatedArenas });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao desativar arena');
    }
  };

  const handleSwitchToArena = (arenaId: number) => {
    setCurrentArena(arenaId);
    window.location.reload();
  };

  const handleSuccess = () => {
    setShowCreateModal(false);
    setEditingArena(null);
    fetchArenas();
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
        <div>
          <h1>Gerenciar Arenas</h1>
          <p style={{ color: '#737373', fontSize: '14px', marginTop: '4px' }}>
            Gerencie suas arenas. Cada arena possui alunos, turmas e quadras independentes.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingArena(null);
            setShowCreateModal(true);
          }}
        >
          + Nova Arena
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-content">
        <div className="levels-grid">
          {arenas.map((arena) => (
            <div
              key={arena.id}
              className="level-card"
              style={{
                borderLeft: arena.id === currentArenaId
                  ? '4px solid #FF9900'
                  : '4px solid #E5E5E5',
              }}
            >
              <div className="level-header">
                <h3>{arena.name}</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {arena.is_default && (
                    <span className="badge badge-default">Padrao</span>
                  )}
                  {arena.id === currentArenaId && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#FF9900',
                      background: '#FFF3E0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>Ativa</span>
                  )}
                </div>
              </div>

              {arena.description && (
                <p className="level-description">{arena.description}</p>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#737373' }}>
                {arena.student_count !== undefined && (
                  <span>{arena.student_count} aluno{arena.student_count !== 1 ? 's' : ''}</span>
                )}
                {arena.class_count !== undefined && (
                  <span>{arena.class_count} turma{arena.class_count !== 1 ? 's' : ''}</span>
                )}
              </div>

              <div className="level-actions">
                {arena.id !== currentArenaId && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSwitchToArena(arena.id)}
                    style={{ fontSize: '12px' }}
                  >
                    Acessar
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingArena(arena);
                    setShowCreateModal(true);
                  }}
                >
                  Editar
                </button>
                {!arena.is_default && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDeactivate(arena.id)}
                  >
                    Desativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <ArenaModal
          arena={editingArena}
          onClose={() => {
            setShowCreateModal(false);
            setEditingArena(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function ArenaModal({
  arena,
  onClose,
  onSuccess,
}: {
  arena: ArenaWithCounts | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!arena;
  const [formData, setFormData] = useState({
    name: arena?.name || '',
    description: arena?.description || '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome e obrigatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && arena) {
        await arenaService.updateArena(arena.id, formData);
      } else {
        const response = await arenaService.createArena(formData);
        // Update user's arenas list with new arena
        if (user && response.data) {
          const newArena: Arena = {
            id: response.data.id,
            name: response.data.name,
            is_default: false,
            status: 'ativa',
          };
          setUser({ ...user, arenas: [...(user.arenas || []), newArena] });
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao ${isEditMode ? 'atualizar' : 'criar'} arena`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Arena' : 'Criar Nova Arena'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="level-form">
          <div className="form-group">
            <label htmlFor="arena-name">Nome *</label>
            <input
              id="arena-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Arena Norte, Unidade 2"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="arena-description">Descricao</label>
            <textarea
              id="arena-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descricao opcional da arena"
              rows={3}
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
                ? 'Salvar Alteracoes'
                : 'Criar Arena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
