import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faVolleyball, faCalendarDays, faClock, faLocationDot, faUsers, faChartSimple, faPlus, faList } from '@fortawesome/free-solid-svg-icons';
import { classService } from '../services/classService';
import type { Class, Modality } from '../types/classTypes';
import CreateClassModal from '../components/CreateClassModal';
import '../styles/Classes.css';

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModalitiesModal, setShowModalitiesModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Buscar modalidades primeiro
      try {
        console.log('Buscando modalidades...');
        const modalitiesRes = await classService.getModalities();
        console.log('Modalidades OK:', modalitiesRes);
        setModalities(modalitiesRes.data || []);
      } catch (err) {
        console.error('Erro ao buscar modalidades:', err);
        setModalities([]);
      }

      // Buscar turmas
      try {
        console.log('Buscando turmas...');
        const classesRes = await classService.getClasses({});
        console.log('Turmas OK:', classesRes);
        setClasses(classesRes.data || []);
      } catch (err: any) {
        console.error('Erro ao buscar turmas:', err);
        console.error('Erro detalhado:', err.response?.data);
        console.error('Status:', err.response?.status);
        // Por enquanto, deixa vazio se der erro
        setClasses([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekdayLabel = (weekday: string) => {
    const days: Record<string, string> = {
      seg: 'Segunda',
      ter: 'Terça',
      qua: 'Quarta',
      qui: 'Quinta',
      sex: 'Sexta',
      sab: 'Sábado',
      dom: 'Domingo',
    };
    return days[weekday] || weekday;
  };

  const getLevelLabel = (level?: string) => {
    const levels: Record<string, string> = {
      iniciante: 'Iniciante',
      intermediario: 'Intermediário',
      avancado: 'Avançado',
      todos: 'Todos',
    };
    return level ? levels[level] || level : '-';
  };

  const handleEditClass = (classData: Class) => {
    setEditingClass(classData);
    setShowCreateModal(true);
  };

  const handleDeleteClass = async (classId: number) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;

    const confirmMessage = `Tem certeza que deseja excluir a turma "${classToDelete.name || classToDelete.modality_name}"?\n\nEsta ação não pode ser desfeita.`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await classService.deleteClass(classId);

      if (response.success) {
        alert('Turma excluída com sucesso!');
        // Atualizar lista removendo a turma deletada
        setClasses(classes.filter(c => c.id !== classId));
      }
    } catch (error: any) {
      console.error('Erro ao excluir turma:', error);
      alert(error.response?.data?.message || 'Erro ao excluir turma. Tente novamente.');
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
    <div className="classes-page">
      {/* Header */}
      <div className="classes-header">
        <h1>Turmas</h1>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowModalitiesModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faList} />
            MODALIDADES
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faPlus} />
            TURMA
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="classes-grid">
        {classes.map((cls) => (
          <div key={cls.id} className="class-card">
            <div className="class-card-header">
              <h3>{cls.name || `${cls.modality_name} - ${getWeekdayLabel(cls.weekday)}`}</h3>
              <span className={`status-badge status-${cls.status}`}>
                {cls.status === 'ativa' ? 'Ativa' : cls.status === 'suspensa' ? 'Suspensa' : 'Cancelada'}
              </span>
            </div>

            <div className="class-card-body">
              <div className="class-info-row">
                <span className="label">
                  <FontAwesomeIcon icon={faVolleyball} style={{ marginRight: '6px', fontSize: '14px' }} />
                  Modalidade:
                </span>
                <span className="value">{cls.modality_name}</span>
              </div>

              <div className="class-info-row">
                <span className="label">
                  <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: '6px', fontSize: '14px' }} />
                  Dia:
                </span>
                <span className="value">{getWeekdayLabel(cls.weekday)}</span>
              </div>

              <div className="class-info-row">
                <span className="label">
                  <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px', fontSize: '14px' }} />
                  Horário:
                </span>
                <span className="value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span>{cls.start_time.substring(0, 5)}</span>
                  {cls.end_time && <span>{cls.end_time.substring(0, 5)}</span>}
                </span>
              </div>

              {cls.location && (
                <div className="class-info-row">
                  <span className="label">
                    <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '6px', fontSize: '14px' }} />
                    Local:
                  </span>
                  <span className="value">{cls.location}</span>
                </div>
              )}

              <div className="class-info-row">
                <span className="label">
                  <FontAwesomeIcon icon={faUsers} style={{ marginRight: '6px', fontSize: '14px' }} />
                  Capacidade:
                </span>
                <span className="value">{cls.capacity} alunos</span>
              </div>

              <div className="class-info-row">
                <span className="label">
                  <FontAwesomeIcon icon={faChartSimple} style={{ marginRight: '6px', fontSize: '14px' }} />
                  Nível:
                </span>
                <span className="value">{getLevelLabel(cls.level)}</span>
              </div>
            </div>

            <div className="class-card-actions">
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleEditClass(cls)}
                title="Editar turma"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleDeleteClass(cls.id)}
                title="Excluir turma"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma turma cadastrada ainda.</p>
            <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
              + CRIAR PRIMEIRA TURMA
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          modalities={modalities}
          editClass={editingClass}
          onClose={() => {
            setShowCreateModal(false);
            setEditingClass(undefined);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingClass(undefined);
            fetchData();
          }}
        />
      )}

      {/* Modalities Management Modal */}
      {showModalitiesModal && (
        <ModalitiesModal
          modalities={modalities}
          onClose={() => setShowModalitiesModal(false)}
          onUpdate={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Modalities Management Modal Component
function ModalitiesModal({
  modalities,
  onClose,
  onUpdate,
}: {
  modalities: Modality[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModality, setEditingModality] = useState<Modality | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        setError('Nome da modalidade é obrigatório');
        setIsSubmitting(false);
        return;
      }

      if (editingModality) {
        await classService.updateModality(editingModality.id, formData);
      } else {
        await classService.createModality(formData);
      }

      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setEditingModality(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar modalidade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (modality: Modality) => {
    setEditingModality(modality);
    setFormData({ name: modality.name, description: modality.description || '' });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta modalidade?')) return;

    try {
      await classService.deleteModality(id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir modalidade');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingModality(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modalities-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gerenciar Modalidades</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modalities-content">
          {!showCreateForm && (
            <button
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
              style={{ marginBottom: '1.5rem' }}
            >
              + NOVA MODALIDADE
            </button>
          )}

          {showCreateForm && (
            <div className="create-modality-form">
              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="modality_name">Nome da Modalidade *</label>
                  <input
                    id="modality_name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Futevôlei"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modality_description">Descrição</label>
                  <textarea
                    id="modality_description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da modalidade (opcional)"
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : editingModality ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="modalities-list">
            <h3>Modalidades Cadastradas</h3>
            {modalities.length === 0 ? (
              <p className="empty-message">Nenhuma modalidade cadastrada ainda.</p>
            ) : (
              <div className="modalities-grid">
                {modalities.map((modality) => (
                  <div key={modality.id} className="modality-item">
                    <div className="modality-info">
                      <h4>{modality.name}</h4>
                      {modality.description && <p>{modality.description}</p>}
                    </div>
                    <div className="modality-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(modality)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(modality.id)}
                        title="Excluir"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
