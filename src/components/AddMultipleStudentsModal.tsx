import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faCheckCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import type { Student } from '../types/studentTypes';
import type { Class } from '../types/classTypes';
import type { Plan } from '../types/enrollmentTypes';
import '../styles/AddMultipleStudentsModal.css';

interface AddMultipleStudentsModalProps {
  classData: Class;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMultipleStudentsModal({
  classData,
  onClose,
  onSuccess
}: AddMultipleStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Buscar alunos, planos e detalhes da turma em paralelo
      const [studentsRes, plansRes, classDetailsRes] = await Promise.all([
        studentService.getStudents({ status: 'ativo', limit: 1000 }),
        enrollmentService.getPlans(),
        fetch(`${import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app'}/api/classes/${classData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(r => r.json())
      ]);

      if (studentsRes.success) {
        // Filtrar alunos compatíveis com o nível da turma
        let filteredStudents = studentsRes.data;

        if (classData.allowed_levels && classData.allowed_levels.length > 0) {
          filteredStudents = filteredStudents.filter((student) =>
            classData.allowed_levels!.includes(student.level || '')
          );
        } else if (classData.level && classData.level !== 'todos') {
          filteredStudents = filteredStudents.filter(
            (student) => student.level === classData.level
          );
        }

        setStudents(filteredStudents);
      }

      if (plansRes.success) {
        setPlans(plansRes.plans);
        // Selecionar primeiro plano por padrão
        if (plansRes.plans.length > 0) {
          setSelectedPlanId(plansRes.plans[0].id);
        }
      }

      // Extrair IDs dos alunos já matriculados
      if (classDetailsRes.success && classDetailsRes.data.students) {
        const enrolledIds = classDetailsRes.data.students.map((s: any) => s.student_id);
        setEnrolledStudentIds(enrolledIds);
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const availableStudents = filteredStudents.filter(
      (s) => !enrolledStudentIds.includes(s.id)
    );

    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((s) => s.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      setError('Selecione pelo menos um aluno');
      return;
    }

    if (!selectedPlanId) {
      setError('Selecione um plano');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      let successCount = 0;
      let errorCount = 0;

      // Criar matrícula para cada aluno selecionado
      for (const studentId of selectedStudentIds) {
        try {
          await enrollmentService.createEnrollment({
            student_id: studentId,
            plan_id: selectedPlanId,
            class_ids: [classData.id],
            start_date: today,
            contract_type: 'mensal',
            due_day: 10
          });
          successCount++;
        } catch (err) {
          console.error(`Erro ao matricular aluno ${studentId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} aluno(s) matriculado(s) com sucesso!${errorCount > 0 ? ` (${errorCount} erro(s))` : ''}`);
        onSuccess();
      } else {
        setError('Erro ao matricular alunos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao matricular alunos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.cpf.includes(query)
    );
  });

  const availableStudents = filteredStudents.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="add-students-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Adicionar Alunos à Turma</h2>
            <p className="class-info">
              {classData.name || classData.modality_name} - {classData.start_time?.substring(0, 5)}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Carregando alunos...</p>
          </div>
        ) : (
          <div className="modal-body">
            {/* Plan Selection */}
            <div className="plan-selection">
              <label htmlFor="plan-select">Plano para Matrícula *</label>
              <select
                id="plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                required
              >
                <option value={0}>Selecione um plano...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Select All */}
            {availableStudents.length > 0 && (
              <div className="select-all-row">
                <label className="student-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudentIds.length === availableStudents.length &&
                      availableStudents.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                  <span>
                    Selecionar Todos ({availableStudents.length} disponíveis)
                  </span>
                </label>
              </div>
            )}

            {/* Students List */}
            <div className="students-list">
              {availableStudents.length === 0 ? (
                <div className="no-students">
                  {searchQuery ? (
                    <p>Nenhum aluno encontrado com "{searchQuery}"</p>
                  ) : (
                    <p>Nenhum aluno disponível para esta turma</p>
                  )}
                </div>
              ) : (
                availableStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <label
                      key={student.id}
                      className={`student-item ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleStudentToggle(student.id)}
                      />
                      <div className="student-info">
                        <div className="student-name">{student.full_name}</div>
                        <div className="student-details">
                          <span>{student.email}</span>
                          {student.level && <span className="level-badge">{student.level}</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="check-icon"
                        />
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* Already Enrolled */}
            {enrolledStudentIds.length > 0 && (
              <div className="enrolled-info">
                <strong>Alunos já matriculados:</strong> {enrolledStudentIds.length}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <div className="selected-count">
            {selectedStudentIds.length} aluno(s) selecionado(s)
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
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedStudentIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Matriculando...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Matricular {selectedStudentIds.length} Aluno(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
