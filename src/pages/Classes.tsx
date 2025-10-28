import { useEffect, useState } from 'react';
import { classService } from '../services/classService';
import type { Class, Modality } from '../types/classTypes';
import '../styles/Classes.css';

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModalitiesModal, setShowModalitiesModal] = useState(false);

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
          <button className="btn-secondary" onClick={() => setShowModalitiesModal(true)}>
            MODALIDADES
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + TURMA
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
                <span className="label">🏐 Modalidade:</span>
                <span className="value">{cls.modality_name}</span>
              </div>

              <div className="class-info-row">
                <span className="label">📅 Dia:</span>
                <span className="value">{getWeekdayLabel(cls.weekday)}</span>
              </div>

              <div className="class-info-row">
                <span className="label">⏰ Horário:</span>
                <span className="value">
                  {cls.start_time} {cls.end_time && `- ${cls.end_time}`}
                </span>
              </div>

              {cls.location && (
                <div className="class-info-row">
                  <span className="label">📍 Local:</span>
                  <span className="value">{cls.location}</span>
                </div>
              )}

              <div className="class-info-row">
                <span className="label">👥 Capacidade:</span>
                <span className="value">{cls.capacity} alunos</span>
              </div>

              <div className="class-info-row">
                <span className="label">📊 Nível:</span>
                <span className="value">{getLevelLabel(cls.level)}</span>
              </div>
            </div>

            <div className="class-card-actions">
              <button className="btn-icon">📝</button>
              <button className="btn-icon">🗑️</button>
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma turma cadastrada ainda.</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              + CRIAR PRIMEIRA TURMA
            </button>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          modalities={modalities}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
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

// Create Class Modal Component
function CreateClassModal({
  modalities,
  onClose,
  onSuccess,
}: {
  modalities: Modality[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    modality_id: '',
    name: '',
    weekday: '' as '' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
    start_time: '',
    end_time: '',
    location: '',
    capacity: '20',
    level: '' as '' | 'iniciante' | 'intermediario' | 'avancado' | 'todos',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.modality_id || !formData.weekday || !formData.start_time) {
        setError('Modalidade, dia e horário de início são obrigatórios');
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        modality_id: parseInt(formData.modality_id),
        weekday: formData.weekday,
        start_time: formData.start_time,
        capacity: parseInt(formData.capacity),
      };

      if (formData.name) payload.name = formData.name;
      if (formData.end_time) payload.end_time = formData.end_time;
      if (formData.location) payload.location = formData.location;
      if (formData.level) payload.level = formData.level;

      await classService.createClass(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar turma');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Nova Turma</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="class-form">
          <div className="form-group">
            <label htmlFor="modality_id">Modalidade *</label>
            <select
              id="modality_id"
              value={formData.modality_id}
              onChange={(e) => setFormData({ ...formData, modality_id: e.target.value })}
              required
            >
              <option value="">Selecione uma modalidade...</option>
              {modalities.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nome da Turma (opcional)</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Futevôlei Iniciante - Segunda"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weekday">Dia da Semana *</label>
              <select
                id="weekday"
                value={formData.weekday}
                onChange={(e) => setFormData({ ...formData, weekday: e.target.value as any })}
                required
              >
                <option value="">Selecione...</option>
                <option value="seg">Segunda-feira</option>
                <option value="ter">Terça-feira</option>
                <option value="qua">Quarta-feira</option>
                <option value="qui">Quinta-feira</option>
                <option value="sex">Sexta-feira</option>
                <option value="sab">Sábado</option>
                <option value="dom">Domingo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="level">Nível</label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              >
                <option value="">Selecione...</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">Horário Início *</label>
              <input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time">Horário Fim</label>
              <input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Local</label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Quadra 1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Capacidade</label>
              <input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Turma'}
            </button>
          </div>
        </form>
      </div>
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
          <button className="modal-close" onClick={onClose}>✕</button>
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
                        ✏️
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(modality.id)}
                        title="Excluir"
                      >
                        🗑️
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
