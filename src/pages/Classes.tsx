import { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faVolleyball, faCalendarDays, faClock, faLocationDot, faUsers, faChartSimple, faPlus, faList, faUserGroup, faUserPlus, faExclamationTriangle, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { classService } from '../services/classService';
import type { Class, Modality, ClassStudent } from '../types/classTypes';
import CreateClassModal from '../components/CreateClassModal';
import StudentPreviewModal from '../components/StudentPreviewModal';
import AddMultipleStudentsModal from '../components/AddMultipleStudentsModal';
import { useThemeStore } from '../store/themeStore';
import '../styles/Classes.css';
import '../styles/ModernModal.css';

export default function Classes() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
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
              borderBottom: `2px solid ${isDark ? '#262626' : '#E5E7EB'}`,
            }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ color: isDark ? '#a0a0a0' : '#6B7280' }} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: isDark ? '#f0f0f0' : '#1F2937' }}>
                {label}
              </h2>
              <span style={{ fontSize: '0.8rem', color: isDark ? '#6b6b6b' : '#9CA3AF', fontWeight: 400 }}>
                ({dayClasses.length} turma{dayClasses.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}>
        {dayClasses.map((cls) => {
          const statusColor = cls.status === 'ativa' ? '#10b981' : cls.status === 'suspensa' ? '#f59e0b' : '#ef4444';
          const statusLabel = cls.status === 'ativa' ? 'Ativa' : cls.status === 'suspensa' ? 'Suspensa' : 'Cancelada';
          const enrolledCount = cls.enrolled_count || cls.students?.length || 0;
          const isExpanded = expandedClassId === cls.id;
          const clsColor = cls.color || '#3B82F6';
          const occupancyPct = cls.capacity > 0 ? Math.round((enrolledCount / cls.capacity) * 100) : 0;

          return (
            <div key={cls.id} style={{
              background: isDark ? '#1a1a1a' : 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column' as const,
              opacity: cls.status === 'cancelada' ? 0.6 : 1,
            }}>
              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: clsColor }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: isDark ? `${clsColor}25` : `${clsColor}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FontAwesomeIcon icon={faVolleyball} style={{ fontSize: '20px', color: clsColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0, fontSize: '16px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{cls.name || cls.modality_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: statusColor,
                      background: isDark ? `${statusColor}20` : `${statusColor}15`,
                      padding: '2px 8px', borderRadius: '4px',
                    }}>{statusLabel}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 500, color: isDark ? '#6b6b6b' : '#A3A3A3',
                    }}>{cls.modality_name}</span>
                  </div>
                </div>
              </div>

              {/* Info row */}
              <div style={{
                display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px',
                fontSize: '12px', color: isDark ? '#a0a0a0' : '#6B7280',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                  {cls.start_time.substring(0, 5)}{cls.end_time ? ` - ${cls.end_time.substring(0, 5)}` : ''}
                </span>
                {cls.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '11px' }} />
                    {cls.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FontAwesomeIcon icon={faChartSimple} style={{ fontSize: '11px' }} />
                  {getLevelLabel(cls)}
                </span>
              </div>

              {/* Occupancy bar */}
              <div style={{
                background: isDark ? '#141414' : '#FAFAFA', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#a0a0a0' : '#6B7280' }}>
                    <FontAwesomeIcon icon={faUserGroup} style={{ marginRight: '4px' }} />
                    Ocupação
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>
                    {enrolledCount}/{cls.capacity}
                  </span>
                </div>
                <div style={{
                  height: '6px', borderRadius: '3px',
                  background: isDark ? '#262626' : '#E5E7EB',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${Math.min(occupancyPct, 100)}%`,
                    background: occupancyPct >= 90 ? '#EF4444' : occupancyPct >= 70 ? '#F59E0B' : '#10B981',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                {getMismatchCount(cls) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', color: '#f59e0b' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '10px' }} />
                    {getMismatchCount(cls)} aluno(s) fora do nível
                  </div>
                )}
              </div>

              {/* Students expandable */}
              {enrolledCount > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      background: isDark ? '#141414' : '#F3F4F6', border: 'none',
                      color: isDark ? '#a0a0a0' : '#6B7280', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      fontFamily: 'inherit', transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#1f1f1f' : '#E5E7EB'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#141414' : '#F3F4F6'; }}
                  >
                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: '11px' }} />
                    {isExpanded ? 'Ocultar' : 'Ver'} Alunos ({enrolledCount})
                  </button>
                  {isExpanded && cls.students && cls.students.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {cls.students.map((student: ClassStudent) => (
                        <div
                          key={student.enrollment_id}
                          onClick={() => setSelectedStudentId(student.student_id)}
                          style={{
                            display: 'flex', flexDirection: 'column', padding: '6px 10px',
                            background: isDark ? '#141414' : 'white', borderRadius: '6px',
                            border: `1px solid ${isStudentLevelMismatch(cls, student) ? '#f59e0b' : (isDark ? '#262626' : '#E5E7EB')}`,
                            cursor: 'pointer', fontSize: '12px', transition: 'all 0.15s',
                            ...(isStudentLevelMismatch(cls, student) ? { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' } : {}),
                          }}
                        >
                          <span style={{ fontWeight: 600, color: isDark ? '#f0f0f0' : '#1a1a1a' }}>
                            {isStudentLevelMismatch(cls, student) && (
                              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b', fontSize: '10px', marginRight: '4px' }} />
                            )}
                            {student.student_name}
                          </span>
                          {(student.level_name || student.plan_name) && (
                            <span style={{ fontSize: '11px', color: isStudentLevelMismatch(cls, student) ? '#f59e0b' : (isDark ? '#6b6b6b' : '#9CA3AF') }}>
                              {student.level_name}{student.plan_name ? ` · ${student.plan_name}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setAddStudentsClassId(cls.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? '#262626' : 'white',
                    color: isDark ? '#d0d0d0' : '#404040', border: isDark ? '1px solid #333' : '1px solid #E5E5E5',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#333' : '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#262626' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '11px' }} />
                  Alunos
                </button>
                <button
                  type="button"
                  onClick={() => handleEditClass(cls)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? '#262626' : 'white',
                    color: isDark ? '#d0d0d0' : '#404040', border: isDark ? '1px solid #333' : '1px solid #E5E5E5',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#333' : '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#262626' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '11px' }} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClass(cls.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? 'rgba(239,68,68,0.06)' : 'white',
                    color: isDark ? '#f87171' : '#ef4444', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.06)' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '11px' }} />
                  Excluir
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
