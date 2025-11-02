import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { enrollmentService } from '../services/enrollmentService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import type { Enrollment, Plan, CreateEnrollmentRequest } from '../types/enrollmentTypes';
import type { Student } from '../types/studentTypes';
import type { Class } from '../types/classTypes';
import '../styles/Enrollments.css';

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [formData, setFormData] = useState<CreateEnrollmentRequest>({
    student_id: 0,
    plan_id: 0,
    start_date: new Date().toISOString().split('T')[0],
    due_day: 10,
    class_ids: [],
  });

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter students based on search
    if (studentSearch.trim() === '') {
      setFilteredStudents(students);
    } else {
      const searchLower = studentSearch.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchLower) ||
          student.cpf.includes(searchLower) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearch, students]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, studentsRes, classesRes, plansRes] = await Promise.all([
        enrollmentService.getEnrollments(),
        studentService.getStudents({ status: 'ativo' }),
        classService.getClasses(),
        enrollmentService.getPlans(),
      ]);

      if (enrollmentsRes.success && enrollmentsRes.data) {
        setEnrollments(enrollmentsRes.data);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
      }
      if (plansRes.success && plansRes.plans) {
        setPlans(plansRes.plans);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar seleção de plano
    const selectedPlan = plans.find(p => p.id === formData.plan_id);
    if (!selectedPlan) {
      alert('Selecione um plano válido');
      return;
    }

    // Validar número de turmas
    if (formData.class_ids.length !== selectedPlan.sessions_per_week) {
      alert(`O plano ${selectedPlan.name} requer ${selectedPlan.sessions_per_week} turma(s). Você selecionou ${formData.class_ids.length}.`);
      return;
    }

    try {
      const response = await enrollmentService.createEnrollment(formData);
      if (response.success) {
        toast.success('Matrícula criada com sucesso!');
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      console.error('Erro ao criar matrícula:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar matrícula');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: 0,
      plan_id: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_day: 10,
      class_ids: [],
    });
    setStudentSearch('');
    setShowStudentDropdown(false);
  };

  const handleSelectStudent = (student: Student) => {
    setFormData({ ...formData, student_id: student.id });
    setStudentSearch(student.full_name);
    setShowStudentDropdown(false);
  };

  const getSelectedStudent = () => {
    return students.find((s) => s.id === formData.student_id);
  };

  const handleClassToggle = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId]
    }));
  };

  const getStudentName = (studentId: number) => {
    return students.find(s => s.id === studentId)?.full_name || 'Desconhecido';
  };

  const getPlanName = (planId: number) => {
    return plans.find(p => p.id === planId)?.name || 'Desconhecido';
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      ativa: { label: 'Ativa', class: 'status-active' },
      suspensa: { label: 'Suspensa', class: 'status-suspended' },
      cancelada: { label: 'Cancelada', class: 'status-cancelled' },
      concluida: { label: 'Concluída', class: 'status-completed' },
    };
    const info = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  if (loading) {
    return <div className="loading">Carregando matrículas...</div>;
  }

  return (
    <div className="enrollments-container">
      <div className="page-header">
        <h1>Matrículas</h1>
        <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
          + Nova Matrícula
        </button>
      </div>

      <div className="enrollments-stats">
        <div className="stat-card">
          <h3>Total de Matrículas</h3>
          <p className="stat-value">{enrollments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Matrículas Ativas</h3>
          <p className="stat-value">
            {enrollments.filter(e => e.status === 'ativa').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Planos Disponíveis</h3>
          <p className="stat-value">{plans.length}</p>
        </div>
      </div>

      <div className="enrollments-table-container">
        <table className="enrollments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Aluno</th>
              <th>Plano</th>
              <th>Início</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Desconto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  Nenhuma matrícula encontrada. Clique em "Nova Matrícula" para começar.
                </td>
              </tr>
            ) : (
              enrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>#{enrollment.id}</td>
                  <td>{enrollment.student_name || getStudentName(enrollment.student_id)}</td>
                  <td>{enrollment.plan_name || getPlanName(enrollment.plan_id)}</td>
                  <td>{new Date(enrollment.start_date).toLocaleDateString('pt-BR')}</td>
                  <td>Dia {enrollment.due_day}</td>
                  <td>{getStatusBadge(enrollment.status)}</td>
                  <td>
                    {enrollment.discount_value ? (
                      enrollment.discount_type === 'percentage'
                        ? `${enrollment.discount_value}%`
                        : formatPrice(enrollment.discount_value)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => {
                        setEditingEnrollment(enrollment);
                        setShowEditModal(true);
                      }}
                      title="Editar matrícula"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Matrícula</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="enrollment-form">
              <div className="form-group">
                <label htmlFor="student_search">Aluno *</label>
                <div className="student-autocomplete">
                  <input
                    id="student_search"
                    type="text"
                    placeholder="Digite o nome, CPF ou email do aluno..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, student_id: 0 });
                      }
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    className="student-search-input"
                    autoComplete="off"
                    required={!formData.student_id}
                  />
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="student-dropdown">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <div
                          key={student.id}
                          className="student-dropdown-item"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="student-dropdown-name">{student.full_name}</div>
                          <div className="student-dropdown-info">
                            CPF: {student.cpf} {student.email && `| ${student.email}`}
                          </div>
                        </div>
                      ))}
                      {filteredStudents.length > 10 && (
                        <div className="student-dropdown-more">
                          +{filteredStudents.length - 10} aluno(s)... Continue digitando para refinar
                        </div>
                      )}
                    </div>
                  )}
                  {showStudentDropdown && studentSearch && filteredStudents.length === 0 && (
                    <div className="student-dropdown">
                      <div className="student-dropdown-empty">Nenhum aluno encontrado</div>
                    </div>
                  )}
                </div>
                {getSelectedStudent() && (
                  <div className="selected-student-badge">
                    ✓ Aluno selecionado: <strong>{getSelectedStudent()?.full_name}</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="plan_id">Plano *</label>
                <select
                  id="plan_id"
                  value={formData.plan_id}
                  onChange={(e) => setFormData({ ...formData, plan_id: Number(e.target.value), class_ids: [] })}
                  required
                >
                  <option value={0}>Selecione um plano</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.sessions_per_week}x/semana - {formatPrice(plan.price_cents)}
                    </option>
                  ))}
                </select>
                {selectedPlan && (
                  <small className="form-help">
                    Selecione {selectedPlan.sessions_per_week} turma(s) abaixo
                  </small>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Data de Início *</label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="due_day">Dia de Vencimento *</label>
                  <input
                    type="number"
                    id="due_day"
                    min="1"
                    max="28"
                    value={formData.due_day}
                    onChange={(e) => setFormData({ ...formData, due_day: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Turmas *
                  {selectedPlan && (
                    <span className="selected-count">
                      {formData.class_ids.length}/{selectedPlan.sessions_per_week} selecionada(s)
                    </span>
                  )}
                </label>
                <div className="enrollment-classes-grid">
                  {classes.map(classItem => (
                    <div
                      key={classItem.id}
                      className={`class-card ${formData.class_ids.includes(classItem.id) ? 'selected' : ''}`}
                      onClick={() => handleClassToggle(classItem.id)}
                    >
                      <h4>{classItem.name}</h4>
                      <p>{classItem.weekday} - {classItem.start_time}</p>
                      <p className="class-level">{classItem.level}</p>
                      <input
                        type="checkbox"
                        checked={formData.class_ids.includes(classItem.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {showEditModal && editingEnrollment && (
        <EditEnrollmentModal
          enrollment={editingEnrollment}
          plans={plans}
          classes={classes}
          onClose={() => {
            setShowEditModal(false);
            setEditingEnrollment(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingEnrollment(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Edit Enrollment Modal Component
function EditEnrollmentModal({
  enrollment,
  plans,
  classes,
  onClose,
  onSuccess,
}: {
  enrollment: Enrollment;
  plans: Plan[];
  classes: Class[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    plan_id: enrollment.plan_id,
    contract_type: (enrollment.contract_type || 'mensal') as 'mensal' | 'anual',
    due_day: enrollment.due_day,
    class_ids: enrollment.class_ids || [],
    discount_type: (enrollment.discount_type || 'none') as 'none' | 'fixed' | 'percentage',
    discount_value: enrollment.discount_value || 0,
    discount_until: enrollment.discount_until || '',
    status: enrollment.status,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = plans.find((p) => p.id === formData.plan_id);

  const handleClassToggle = (classId: number) => {
    setFormData((prev) => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter((id) => id !== classId)
        : [...prev.class_ids, classId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (selectedPlan && formData.class_ids.length !== selectedPlan.sessions_per_week) {
      setError(
        `O plano ${selectedPlan.name} requer ${selectedPlan.sessions_per_week} turma(s). Você selecionou ${formData.class_ids.length}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        plan_id: formData.plan_id,
        contract_type: formData.contract_type,
        due_day: formData.due_day,
        class_ids: formData.class_ids,
        status: formData.status,
      };

      // Add discount if applicable
      if (formData.discount_type !== 'none') {
        payload.discount_type = formData.discount_type;
        payload.discount_value = formData.discount_value;
        if (formData.discount_until) {
          payload.discount_until = formData.discount_until;
        }
      } else {
        payload.discount_type = 'none';
      }

      const response = await enrollmentService.updateEnrollment(enrollment.id, payload);
      if (response.success) {
        toast.success('Matrícula atualizada com sucesso!');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar matrícula');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Matrícula #{enrollment.id}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="enrollment-form">
          <div className="form-info">
            <p>
              <strong>Aluno:</strong> {enrollment.student_name}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="plan_id">Plano *</label>
            <select
              id="plan_id"
              value={formData.plan_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  plan_id: Number(e.target.value),
                  class_ids: [],
                })
              }
              required
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.sessions_per_week}x/semana - R${' '}
                  {(plan.price_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
            {selectedPlan && (
              <small className="form-help">
                Selecione {selectedPlan.sessions_per_week} turma(s) abaixo
              </small>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contract_type">Tipo de Contrato</label>
              <select
                id="contract_type"
                value={formData.contract_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contract_type: e.target.value as 'mensal' | 'anual',
                  })
                }
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="due_day">Dia de Vencimento *</label>
              <input
                type="number"
                id="due_day"
                min="1"
                max="28"
                value={formData.due_day}
                onChange={(e) =>
                  setFormData({ ...formData, due_day: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Turmas *
              {selectedPlan && (
                <span className="selected-count">
                  {formData.class_ids.length}/{selectedPlan.sessions_per_week}{' '}
                  selecionada(s)
                </span>
              )}
            </label>
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className={`class-card ${
                    formData.class_ids.includes(classItem.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleClassToggle(classItem.id)}
                >
                  <h4>{classItem.modality_name}</h4>
                  {classItem.name && <p>{classItem.name}</p>}
                  <p>
                    {classItem.weekday} - {classItem.start_time}
                  </p>
                  <input
                    type="checkbox"
                    checked={formData.class_ids.includes(classItem.id)}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="discount_type">Tipo de Desconto</label>
            <select
              id="discount_type"
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_type: e.target.value as any,
                })
              }
            >
              <option value="none">Sem desconto</option>
              <option value="fixed">Valor Fixo</option>
              <option value="percentage">Percentual</option>
            </select>
          </div>

          {formData.discount_type !== 'none' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="discount_value">
                  Valor do Desconto{' '}
                  {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                </label>
                <input
                  type="number"
                  id="discount_value"
                  min="0"
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="discount_until">Desconto até</label>
                <input
                  type="date"
                  id="discount_until"
                  value={formData.discount_until}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_until: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as any,
                })
              }
            >
              <option value="ativa">Ativa</option>
              <option value="suspensa">Suspensa</option>
              <option value="cancelada">Cancelada</option>
              <option value="concluida">Concluída</option>
            </select>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
