import { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faVolleyball, faCalendarDays, faClock, faLocationDot, faUsers, faChartSimple, faPlus, faList, faUserGroup, faUserPlus, faExclamationTriangle, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { classService } from '../services/classService';
import type { Class, Modality, ClassStudent } from '../types/classTypes';
import CreateClassModal from '../components/CreateClassModal';
import StudentPreviewModal from '../components/StudentPreviewModal';
import AddMultipleStudentsModal from '../components/AddMultipleStudentsModal';
import '../styles/Classes.css';
import '../styles/ModernModal.css';

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModalitiesModal, setShowModalitiesModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>(undefined);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [addStudentsClassId, setAddStudentsClassId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

      // Buscar turmas (limit alto para garantir que todas sejam retornadas)
      try {
        console.log('Buscando turmas...');
        const classesRes = await classService.getClasses({ limit: 1000 });
        console.log('Turmas OK:', classesRes);

        // Buscar detalhes de cada turma com alunos
        const classesWithDetails = await Promise.all(
          (classesRes.data || []).map(async (cls) => {
            try {
              const detailsRes = await classService.getClassById(cls.id);
              if (detailsRes.status === 'success' && detailsRes.data) {
                return {
                  ...cls,
                  students: detailsRes.data.students || [],
                  enrolled_count: detailsRes.data.enrolled_count || 0
                };
              }
              return cls;
            } catch (error) {
              console.error(`Erro ao buscar detalhes da turma ${cls.id}:`, error);
              return cls;
            }
          })
        );

        setClasses(classesWithDetails);
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

  const getLevelLabel = (cls: Class) => {
    if (cls.allowed_levels && cls.allowed_levels.length > 0) {
      return cls.allowed_levels.join(', ');
    }
    return 'Todos os níveis';
  };

  // Check if a student's level is incompatible with the class
  const isStudentLevelMismatch = (cls: Class, student: ClassStudent) => {
    if (!cls.allowed_levels || cls.allowed_levels.length === 0) return false; // all levels allowed
    if (!student.level_name) return false; // no level assigned, don't warn
    return !cls.allowed_levels.includes(student.level_name);
  };

  // Count mismatched students in a class
  const getMismatchCount = (cls: Class) => {
    if (!cls.students || !cls.allowed_levels || cls.allowed_levels.length === 0) return 0;
    return cls.students.filter(s => s.level_name && !cls.allowed_levels!.includes(s.level_name)).length;
  };

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const term = searchTerm.trim().toLowerCase();
    return classes.filter(cls =>
      (cls.name || '').toLowerCase().includes(term) ||
      (cls.modality_name || '').toLowerCase().includes(term)
    );
  }, [classes, searchTerm]);

  const WEEKDAY_ORDER = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const WEEKDAY_FULL: Record<string, string> = {
    seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira',
    qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo',
  };

  const classesGroupedByDay = useMemo(() => {
    const groups: Record<string, Class[]> = {};
    for (const cls of filteredClasses) {
      const day = cls.weekday || 'sem_dia';
      if (!groups[day]) groups[day] = [];
      groups[day].push(cls);
    }
    // Sort classes within each group by start_time
    for (const day of Object.keys(groups)) {
      groups[day].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }
    return WEEKDAY_ORDER
      .filter(day => groups[day]?.length > 0)
      .map(day => ({ day, label: WEEKDAY_FULL[day] || day, classes: groups[day] }));
  }, [filteredClasses]);

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

      if ((response as any).status === 'success' || (response as any).success === true) {
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
        <div className="classes-search">
          <FontAwesomeIcon icon={faSearch} className="classes-search-icon" />
          <input
            type="text"
            placeholder="Buscar turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="classes-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="classes-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
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

      {/* Classes Grid - Grouped by Weekday */}
      <div>
        {classesGroupedByDay.map(({ day, label, classes: dayClasses }) => (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '1rem', paddingBottom: '0.5rem',
              borderBottom: '2px solid #E5E7EB',
            }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#6B7280' }} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1F2937' }}>
                {label}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 400 }}>
                ({dayClasses.length} turma{dayClasses.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="classes-grid-modern">
        {dayClasses.map((cls) => {
          const statusColor = cls.status === 'ativa' ? '#10b981' : cls.status === 'suspensa' ? '#f59e0b' : '#ef4444';
          const statusLabel = cls.status === 'ativa' ? 'OPERANDO' : cls.status === 'suspensa' ? 'SUSPENSA' : 'CANCELADA';
          const enrolledCount = cls.enrolled_count || cls.students?.length || 0;
          const isExpanded = expandedClassId === cls.id;

          return (
            <div key={cls.id} className="class-card-modern" style={{ borderTop: `4px solid ${cls.color || '#3B82F6'}` }}>
              {/* Color Bar */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                backgroundColor: cls.color || '#3B82F6',
                borderRadius: '8px 0 0 8px'
              }} />

              {/* Status Header */}
              <div className="class-status-header" style={{ backgroundColor: statusColor }}>
                <h3>{cls.name || cls.modality_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: cls.color || '#3B82F6',
                    border: '2px solid white',
                    boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                  }} title={`Cor: ${cls.color || '#3B82F6'}`} />
                  <span className="status-label">{statusLabel}</span>
                </div>
              </div>

              {/* Class Info Grid */}
              <div className="class-info-grid">
                <div className="info-column">
                  <div className="info-item">
                    <span className="info-label">Modalidade:</span>
                    <span className="info-value">{cls.modality_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dia:</span>
                    <span className="info-value">{getWeekdayLabel(cls.weekday)}</span>
                  </div>
                  {cls.location && (
                    <div className="info-item">
                      <span className="info-label">Local:</span>
                      <span className="info-value">{cls.location}</span>
                    </div>
                  )}
                </div>

                <div className="info-column">
                  <div className="info-item">
                    <span className="info-label">Horário Início:</span>
                    <span className="info-value">{cls.start_time.substring(0, 5)}</span>
                  </div>
                  {cls.end_time && (
                    <div className="info-item">
                      <span className="info-label">Horário Fim:</span>
                      <span className="info-value">{cls.end_time.substring(0, 5)}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Nível:</span>
                    <span className="info-value">{getLevelLabel(cls)}</span>
                  </div>
                  {getMismatchCount(cls) > 0 && (
                    <div className="info-item" style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '2px' }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '4px' }} />
                      <span>{getMismatchCount(cls)} aluno(s) fora do nível</span>
                    </div>
                  )}
                </div>

                <div className="info-column">
                  <div className="info-item">
                    <span className="info-label">Capacidade:</span>
                    <span className="info-value">{cls.capacity} alunos</span>
                  </div>
                  <div className="info-item highlight">
                    <span className="info-label">
                      <FontAwesomeIcon icon={faUserGroup} style={{ marginRight: '4px' }} />
                      Alunos Matriculados:
                    </span>
                    <span className="info-value-highlight">{enrolledCount}</span>
                  </div>
                </div>
              </div>

              {/* Students Section */}
              {enrolledCount > 0 && (
                <div className="students-section">
                  <button
                    className="students-toggle"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                  >
                    <FontAwesomeIcon icon={faUsers} />
                    <span>{isExpanded ? 'Ocultar' : 'Ver'} Alunos ({enrolledCount})</span>
                  </button>

                  {isExpanded && cls.students && cls.students.length > 0 && (
                    <div className="students-list">
                      {cls.students.map((student: ClassStudent) => (
                        <div
                          key={student.enrollment_id}
                          className="student-chip"
                          onClick={() => setSelectedStudentId(student.student_id)}
                          style={{
                            cursor: 'pointer',
                            ...(isStudentLevelMismatch(cls, student) ? { borderColor: '#f59e0b', backgroundColor: '#fffbeb' } : {})
                          }}
                        >
                          {isStudentLevelMismatch(cls, student) && (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              style={{ color: '#f59e0b', fontSize: '0.75rem', marginRight: '4px' }}
                              title={`Nível do aluno (${student.level_name}) não corresponde aos níveis da turma (${cls.allowed_levels?.join(', ')})`}
                            />
                          )}
                          <span className="student-name">{student.student_name}</span>
                          {student.level_name && (
                            <span className="student-plan" style={isStudentLevelMismatch(cls, student) ? { color: '#f59e0b' } : {}}>
                              {student.level_name}
                            </span>
                          )}
                          {student.plan_name && (
                            <span className="student-plan">{student.plan_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="class-card-actions-modern">
                <button
                  type="button"
                  className="btn-action add-students"
                  onClick={() => setAddStudentsClassId(cls.id)}
                  title="Adicionar vários alunos"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Adicionar Alunos</span>
                </button>
                <button
                  type="button"
                  className="btn-action edit"
                  onClick={() => handleEditClass(cls)}
                  title="Editar turma"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  className="btn-action delete"
                  onClick={() => handleDeleteClass(cls.id)}
                  title="Excluir turma"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          );
        })}

            </div>
          </div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="empty-state">
            <p>{searchTerm ? 'Nenhuma turma encontrada.' : 'Nenhuma turma cadastrada ainda.'}</p>
            {!searchTerm && (
              <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
                + CRIAR PRIMEIRA TURMA
              </button>
            )}
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

      {/* Student Preview Modal */}
      {selectedStudentId && (
        <StudentPreviewModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Add Multiple Students Modal */}
      {addStudentsClassId && (
        <AddMultipleStudentsModal
          classData={classes.find(c => c.id === addStudentsClassId)!}
          onClose={() => setAddStudentsClassId(null)}
          onSuccess={() => {
            setAddStudentsClassId(null);
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
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Gerenciar Modalidades</h2>
          <button type="button" className="mm-close" onClick={onClose}>×</button>
        </div>

        <div className="mm-content">
          {!showCreateForm && (
            <button
              className="mm-btn mm-btn-primary"
              onClick={() => setShowCreateForm(true)}
              style={{ marginBottom: '1.5rem' }}
            >
              + NOVA MODALIDADE
            </button>
          )}

          {showCreateForm && (
            <div className="create-modality-form">
              {error && <div className="mm-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mm-field">
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

                <div className="mm-field">
                  <label htmlFor="modality_description">Descrição</label>
                  <textarea
                    id="modality_description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da modalidade (opcional)"
                    rows={3}
                  />
                </div>

                <div className="mm-footer">
                  <button
                    type="button"
                    className="mm-btn mm-btn-secondary"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="mm-btn mm-btn-primary" disabled={isSubmitting}>
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
