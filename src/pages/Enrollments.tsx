import { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState<CreateEnrollmentRequest>({
    student_id: 0,
    plan_id: 0,
    start_date: new Date().toISOString().split('T')[0],
    due_day: 10,
    class_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

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
      if (studentsRes.status === 'success' && studentsRes.data?.students) {
        setStudents(studentsRes.data.students);
      }
      if (classesRes.status === 'success' && classesRes.data?.classes) {
        setClasses(classesRes.data.classes);
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
        alert('Matrícula criada com sucesso!');
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      console.error('Erro ao criar matrícula:', error);
      alert(error.response?.data?.message || 'Erro ao criar matrícula');
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
                <label htmlFor="student_id">Aluno *</label>
                <select
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Selecione um aluno</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} - {student.cpf}
                    </option>
                  ))}
                </select>
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
                <div className="classes-grid">
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
    </div>
  );
}
