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
  const [studentOffset, setStudentOffset] = useState(0);
  const [hasMoreStudents, setHasMoreStudents] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const STUDENTS_PER_PAGE = 50;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentsNeedingEnrollment, setStudentsNeedingEnrollment] = useState<{student: Student, planId: number}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Buscar alunos, planos e detalhes da turma em paralelo
      const [studentsRes, plansRes, classDetailsRes] = await Promise.all([
        studentService.getStudents({ status: 'ativo', limit: STUDENTS_PER_PAGE, offset: 0 }),
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
        setHasMoreStudents(studentsRes.data.length === STUDENTS_PER_PAGE);
        setStudentOffset(STUDENTS_PER_PAGE);
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

  const loadMoreStudents = async () => {
    try {
      setIsLoadingMore(true);
      const studentsRes = await studentService.getStudents({
        status: 'ativo',
        limit: STUDENTS_PER_PAGE,
        offset: studentOffset
      });

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

        setStudents(prev => [...prev, ...filteredStudents]);
        setHasMoreStudents(studentsRes.data.length === STUDENTS_PER_PAGE);
        setStudentOffset(prev => prev + STUDENTS_PER_PAGE);
      }
    } catch (err: any) {
      console.error('Erro ao carregar mais alunos:', err);
    } finally {
      setIsLoadingMore(false);
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

    setIsSubmitting(true);
    setError('');

    try {
      // Buscar matrículas ativas de todos os alunos
      const enrollmentsRes = await enrollmentService.getEnrollments();
      const activeEnrollments = enrollmentsRes.success && enrollmentsRes.data
        ? enrollmentsRes.data.filter((e: any) => e.status === 'ativa')
        : [];

      // Verificar quais alunos não têm matrícula ativa
      const studentsNeedingPlan: {student: Student, planId: number}[] = [];

      for (const studentId of selectedStudentIds) {
        const student = students.find(s => s.id === studentId);
        const studentEnrollment = activeEnrollments.find((e: any) => e.student_id === studentId);

        if (!studentEnrollment && student) {
          // Aluno não tem matrícula ativa
          studentsNeedingPlan.push({
            student,
            planId: selectedPlanId || (plans.length > 0 ? plans[0].id : 0)
          });
        }
      }

      // Se houver alunos sem matrícula, mostrar modal de confirmação
      if (studentsNeedingPlan.length > 0) {
        setStudentsNeedingEnrollment(studentsNeedingPlan);
        setShowConfirmation(true);
        setIsSubmitting(false);
        return;
      }

      // Todos os alunos já têm matrícula, adicionar à turma diretamente
      await executeAddStudents(activeEnrollments);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao verificar alunos');
      setIsSubmitting(false);
    }
  };

  const executeAddStudents = async (activeEnrollments: any[]) => {
    setIsSubmitting(true);
    setError('');

    try {
      let successCount = 0;
      let errorCount = 0;

      // Processar cada aluno selecionado
      for (const studentId of selectedStudentIds) {
        try {
          const studentEnrollment = activeEnrollments.find((e: any) => e.student_id === studentId);

          if (studentEnrollment) {
            // Aluno JÁ tem matrícula ativa: adicionar esta turma à matrícula existente
            const currentClassIds = studentEnrollment.class_ids || [];
            if (!currentClassIds.includes(classData.id)) {
              await enrollmentService.updateEnrollmentClasses(
                studentEnrollment.id,
                { class_ids: [...currentClassIds, classData.id] }
              );
              successCount++;
            } else {
              // Turma já está na matrícula
              successCount++;
            }
          }
        } catch (err) {
          console.error(`Erro ao processar aluno ${studentId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        let message = `${successCount} aluno(s) adicionado(s) à turma com sucesso!`;
        if (errorCount > 0) {
          message += `\n\n❌ ${errorCount} erro(s) ao adicionar alguns alunos.`;
        }
        alert(message);
        onSuccess();
      } else {
        setError('Erro ao adicionar alunos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao adicionar alunos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEnrollments = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      let successCount = 0;
      let errorCount = 0;

      // Criar matrículas para alunos sem matrícula
      for (const {student, planId} of studentsNeedingEnrollment) {
        try {
          await enrollmentService.createEnrollment({
            student_id: student.id,
            plan_id: planId,
            class_ids: [classData.id],
            start_date: today,
            contract_type: 'mensal',
            due_day: 10
          });
          successCount++;
        } catch (err) {
          console.error(`Erro ao criar matrícula para ${student.full_name}:`, err);
          errorCount++;
        }
      }

      // Buscar matrículas atualizadas e adicionar turma aos alunos que já tinham matrícula
      const enrollmentsRes = await enrollmentService.getEnrollments();
      const activeEnrollments = enrollmentsRes.success && enrollmentsRes.data
        ? enrollmentsRes.data.filter((e: any) => e.status === 'ativa')
        : [];

      for (const studentId of selectedStudentIds) {
        // Pular alunos que acabaram de receber matrícula
        if (studentsNeedingEnrollment.some(s => s.student.id === studentId)) continue;

        try {
          const studentEnrollment = activeEnrollments.find((e: any) => e.student_id === studentId);
          if (studentEnrollment) {
            const currentClassIds = studentEnrollment.class_ids || [];
            if (!currentClassIds.includes(classData.id)) {
              await enrollmentService.updateEnrollmentClasses(
                studentEnrollment.id,
                { class_ids: [...currentClassIds, classData.id] }
              );
              successCount++;
            }
          }
        } catch (err) {
          console.error(`Erro ao adicionar turma para aluno ${studentId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        let message = `${successCount} aluno(s) adicionado(s) com sucesso!`;
        if (errorCount > 0) {
          message += `\n\n❌ ${errorCount} erro(s).`;
        }
        alert(message);
        onSuccess();
      } else {
        setError('Erro ao processar alunos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar matrículas');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
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
                        <div className="add-multiple-students-details>
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

            {/* Load More Button */}
            {hasMoreStudents && !searchQuery && (
              <button
                type="button"
                className="load-more-btn"
                onClick={loadMoreStudents}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Carregando...</span>
                  </>
                ) : (
                  <span>Carregar Mais Alunos</span>
                )}
              </button>
            )}

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

      {/* Confirmation Modal for Students Without Enrollment */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h2>⚠️ Alunos sem Matrícula</h2>
              <button type="button" className="modal-close" onClick={() => setShowConfirmation(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="warning-message">
                Os seguintes alunos <strong>NÃO possuem matrícula ativa</strong>.
                Selecione um plano para criar a matrícula de cada um:
              </p>

              <div className="students-enrollment-list">
                {studentsNeedingEnrollment.map(({student, planId}, index) => (
                  <div key={student.id} className="student-enrollment-item">
                    <div className="student-enrollment-info">
                      <div className="student-name">{student.full_name}</div>
                      <div className="add-multiple-students-details">
                        {student.email && <span>{student.email}</span>}
                        {student.level && <span className="level-badge">{student.level}</span>}
                      </div>
                    </div>
                    <div className="plan-select-wrapper">
                      <label htmlFor={`plan-${student.id}`}>Plano:</label>
                      <select
                        id={`plan-${student.id}`}
                        value={planId}
                        onChange={(e) => {
                          const newList = [...studentsNeedingEnrollment];
                          newList[index].planId = Number(e.target.value);
                          setStudentsNeedingEnrollment(newList);
                        }}
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmEnrollments}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Criar Matrículas e Adicionar à Turma</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
