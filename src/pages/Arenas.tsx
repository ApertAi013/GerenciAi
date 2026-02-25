import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUsers, faUserGroup, faPen, faPowerOff, faArrowRightToBracket, faPlus, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { arenaService } from '../services/arenaService';
import { useAuthStore } from '../store/authStore';
import type { Arena } from '../types/authTypes';

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

    if (!confirm(`Tem certeza que deseja desativar a arena "${arena.name}"? Alunos e turmas desta arena nao serao mais visiveis.`)) {
      return;
    }

    try {
      await arenaService.deleteArena(id);
      fetchArenas();
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
    <div style={{ padding: '0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>Arenas</h1>
          <p style={{ color: '#737373', fontSize: '14px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Gerencie suas arenas. Cada arena possui alunos, turmas e quadras independentes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingArena(null); setShowCreateModal(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#FF9900',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e68a00')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FF9900')}
        >
          <FontAwesomeIcon icon={faPlus} />
          Nova Arena
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {arenas.map((arena) => {
          const isActive = arena.id === currentArenaId;
          return (
            <div
              key={arena.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: isActive
                  ? '0 0 0 2px #FF9900, 0 4px 16px rgba(255, 153, 0, 0.15)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isActive ? '#FF9900' : '#E5E5E5',
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isActive ? '#FFF3E0' : '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FontAwesomeIcon
                    icon={faBuilding}
                    style={{ fontSize: '20px', color: isActive ? '#FF9900' : '#A3A3A3' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{arena.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {arena.is_default && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#737373',
                        background: '#F0F0F0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>Padrao</span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#16a34a',
                        background: '#f0fdf4',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
                        Selecionada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {arena.description && (
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: '#737373',
                  lineHeight: '1.5',
                }}>{arena.description}</p>
              )}

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  flex: 1,
                  background: '#FAFAFA',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faUsers} style={{ color: '#667eea', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                      {arena.student_count ?? 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A3A3A3', fontWeight: 500 }}>Alunos</div>
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  background: '#FAFAFA',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faUserGroup} style={{ color: '#f59e0b', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                      {arena.class_count ?? 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A3A3A3', fontWeight: 500 }}>Turmas</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => handleSwitchToArena(arena.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#FF9900',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#e68a00')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FF9900')}
                  >
                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                    Acessar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingArena(arena); setShowCreateModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: 'white',
                    color: '#404040',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: '11px' }} />
                  Editar
                </button>
                {!arena.is_default && (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(arena.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: 'white',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <FontAwesomeIcon icon={faPowerOff} style={{ fontSize: '11px' }} />
                    Desativar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <ArenaModal
          arena={editingArena}
          onClose={() => { setShowCreateModal(false); setEditingArena(null); }}
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
            {isEditMode ? 'Editar Arena' : 'Criar Nova Arena'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#A3A3A3',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="arena-name" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#404040',
              marginBottom: '6px',
            }}>Nome *</label>
            <input
              id="arena-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Arena Norte, Unidade Centro"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D4D4D4',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="arena-description" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#404040',
              marginBottom: '6px',
            }}>Descricao</label>
            <textarea
              id="arena-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descricao opcional da arena"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D4D4D4',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#404040',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                background: '#FF9900',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? isEditMode ? 'Salvando...' : 'Criando...'
                : isEditMode ? 'Salvar' : 'Criar Arena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
