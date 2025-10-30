import { useState, useEffect } from 'react';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import { classService } from '../services/classService';
import { levelService } from '../services/levelService';
import { financialService } from '../services/financialService';
import type { Student, CreateStudentRequest } from '../types/studentTypes';
import type { Plan } from '../types/enrollmentTypes';
import type { Class } from '../types/classTypes';
import type { Level } from '../types/levelTypes';
import './ComprehensiveEnrollmentForm.css';

interface ComprehensiveEnrollmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'student' | 'plan' | 'classes' | 'review';

export default function ComprehensiveEnrollmentForm({
  onClose,
  onSuccess,
}: ComprehensiveEnrollmentFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Student data
  const [studentData, setStudentData] = useState<CreateStudentRequest>({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    sex: undefined,
    level: '',
  });
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);

  // Plans and classes
  const [levels, setLevels] = useState<Level[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  // Enrollment data
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
  const [contractType, setContractType] = useState<'mensal' | 'anual'>('mensal');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [dueDay, setDueDay] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Discount data
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountUntil, setDiscountUntil] = useState<string>('');

  // Payment data
  const [markFirstAsPaid, setMarkFirstAsPaid] = useState<boolean>(false);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('dinheiro');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Filter classes by student level
    if (studentData.level && classes.length > 0) {
      const filtered = classes.filter((cls) => {
        // Show classes that allow this level
        if (cls.allowed_levels && cls.allowed_levels.length > 0) {
          return cls.allowed_levels.includes(studentData.level!);
        }
        // If class has no specific level restrictions, show it
        if (cls.level === 'todos') {
          return true;
        }
        // Match by level field
        return cls.level === studentData.level;
      });
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(classes);
    }
  }, [studentData.level, classes]);

  const fetchInitialData = async () => {
    try {
      const [levelsRes, plansRes, classesRes] = await Promise.all([
        levelService.getLevels(),
        enrollmentService.getPlans(),
        classService.getClasses(),
      ]);

      if (levelsRes.success) setLevels(levelsRes.data);
      if (plansRes.success) setPlans(plansRes.plans);
      if (classesRes.success) setClasses(classesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados iniciais');
    }
  };

  const handleStudentStepNext = async () => {
    setError('');

    // Validate
    if (!studentData.full_name || !studentData.cpf || !studentData.email) {
      setError('Preencha nome, CPF e email');
      return;
    }

    if (!studentData.level) {
      setError('Selecione o nível do aluno');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create student
      const cleanedData = {
        ...studentData,
        cpf: studentData.cpf.replace(/\D/g, ''),
        phone: studentData.phone?.replace(/\D/g, ''),
      };

      const response = await studentService.createStudent(cleanedData);
      if (response.success && response.student) {
        setCreatedStudent(response.student);
        setCurrentStep('plan');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar aluno');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanStepNext = () => {
    setError('');

    if (!selectedPlanId) {
      setError('Selecione um plano');
      return;
    }

    setCurrentStep('classes');
  };

  const handleClassesStepNext = () => {
    setError('');

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) {
      setError('Plano não encontrado');
      return;
    }

    if (selectedClassIds.length !== selectedPlan.sessions_per_week) {
      setError(
        `O plano ${selectedPlan.name} requer ${selectedPlan.sessions_per_week} turma(s). Você selecionou ${selectedClassIds.length}.`
      );
      return;
    }

    setCurrentStep('review');
  };

  const handleFinalSubmit = async () => {
    if (!createdStudent) {
      setError('Aluno não foi criado');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) {
      setError('Plano não encontrado');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create enrollment with discount if applicable
      const enrollmentPayload: any = {
        student_id: createdStudent.id,
        plan_id: selectedPlanId,
        start_date: startDate,
        due_day: dueDay,
        contract_type: contractType,
        class_ids: selectedClassIds,
      };

      // Add discount if applicable
      if (discountType !== 'none') {
        enrollmentPayload.discount_type = discountType;
        enrollmentPayload.discount_value = discountValue;
        if (discountUntil) {
          enrollmentPayload.discount_until = discountUntil;
        }
      }

      const enrollmentResponse = await enrollmentService.createEnrollment(enrollmentPayload);

      // If first payment should be marked as paid
      if (markFirstAsPaid && enrollmentResponse.enrollment) {
        try {
          // Get invoices for this enrollment
          const invoicesResponse = await financialService.getInvoices({
            student_id: createdStudent.id,
            status: 'pendente',
          });

          // Find the first invoice (should be the one just created)
          const firstInvoice = invoicesResponse.data?.invoices?.[0];

          if (firstInvoice) {
            // Calculate payment value (with discount if applicable)
            let paymentValue = selectedPlan.price_cents;

            if (discountType === 'fixed') {
              paymentValue -= discountValue * 100; // Convert to cents
            } else if (discountType === 'percentage') {
              paymentValue -= (paymentValue * discountValue) / 100;
            }

            // Register payment
            await financialService.registerPayment({
              invoice_id: firstInvoice.id,
              amount_cents: Math.max(0, Math.round(paymentValue)),
              method: paymentMethod as 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro',
              paid_at: paymentDate,
            });
          }
        } catch (paymentErr) {
          console.error('Erro ao registrar pagamento:', paymentErr);
          // Don't fail the whole process if payment registration fails
          // Just log it
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar matrícula');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassToggle = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Group classes by weekday for calendar view
  const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const weekdayLabels: Record<typeof weekdays[number], string> = {
    seg: 'Segunda',
    ter: 'Terça',
    qua: 'Quarta',
    qui: 'Quinta',
    sex: 'Sexta',
    sab: 'Sábado',
    dom: 'Domingo',
  };

  const classesByWeekday = weekdays.map((day) => ({
    day,
    label: weekdayLabels[day],
    classes: filteredClasses.filter((cls) => cls.weekday === day),
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content comprehensive-enrollment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Matrícula Completa</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="enrollment-steps">
          <div className={`step ${currentStep === 'student' ? 'active' : ''} ${createdStudent ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Dados do Aluno</span>
          </div>
          <div className={`step ${currentStep === 'plan' ? 'active' : ''} ${selectedPlanId ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Plano & Contrato</span>
          </div>
          <div className={`step ${currentStep === 'classes' ? 'active' : ''} ${selectedClassIds.length > 0 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Turmas</span>
          </div>
          <div className={`step ${currentStep === 'review' ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Revisar</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Student Data */}
        {currentStep === 'student' && (
          <div className="step-content">
            <h3>Informações do Aluno</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleStudentStepNext(); }} className="student-form">
              <div className="form-group">
                <label htmlFor="full_name">Nome Completo *</label>
                <input
                  id="full_name"
                  type="text"
                  value={studentData.full_name}
                  onChange={(e) =>
                    setStudentData({ ...studentData, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cpf">CPF *</label>
                  <input
                    id="cpf"
                    type="text"
                    value={studentData.cpf}
                    onChange={(e) =>
                      setStudentData({ ...studentData, cpf: e.target.value })
                    }
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="birth_date">Data de Nascimento</label>
                  <input
                    id="birth_date"
                    type="date"
                    value={studentData.birth_date}
                    onChange={(e) =>
                      setStudentData({ ...studentData, birth_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={studentData.email}
                  onChange={(e) =>
                    setStudentData({ ...studentData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={studentData.phone}
                    onChange={(e) =>
                      setStudentData({ ...studentData, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sex">Sexo</label>
                  <select
                    id="sex"
                    value={studentData.sex || ''}
                    onChange={(e) =>
                      setStudentData({
                        ...studentData,
                        sex: e.target.value as any,
                      })
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="N/I">Prefiro não informar</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="level">Nível *</label>
                <select
                  id="level"
                  value={studentData.level}
                  onChange={(e) =>
                    setStudentData({ ...studentData, level: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.name}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Próximo: Plano'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {currentStep === 'plan' && (
          <div className="step-content">
            <h3>Selecione o Plano e Tipo de Contrato</h3>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${selectedPlanId === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <h4>{plan.name}</h4>
                  <p className="plan-price">
                    R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="plan-sessions">{plan.sessions_per_week}x por semana</p>
                  {plan.description && <p className="plan-description">{plan.description}</p>}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="contract_type">Tipo de Contrato *</label>
              <select
                id="contract_type"
                value={contractType}
                onChange={(e) => setContractType(e.target.value as 'mensal' | 'anual')}
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                {contractType === 'mensal' ? 'Renovação mensal automática' : 'Compromisso de 12 meses'}
              </small>
            </div>

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label htmlFor="start_date">Data de Início</label>
                <input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="due_day">Dia de Vencimento</label>
                <input
                  id="due_day"
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Discount Section */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Desconto (Opcional)</h4>

              <div className="form-group">
                <label htmlFor="discount_type">Tipo de Desconto</label>
                <select
                  id="discount_type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                >
                  <option value="none">Sem desconto</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                </select>
              </div>

              {discountType !== 'none' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount_value">
                      Valor do Desconto {discountType === 'percentage' ? '(%)' : '(R$)'}
                    </label>
                    <input
                      id="discount_value"
                      type="number"
                      min="0"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      max={discountType === 'percentage' ? '100' : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_until">Desconto válido até</label>
                    <input
                      id="discount_until"
                      type="date"
                      value={discountUntil}
                      onChange={(e) => setDiscountUntil(e.target.value)}
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                      Deixe vazio para desconto permanente
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Pagamento da Primeira Mensalidade</h4>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={markFirstAsPaid}
                    onChange={(e) => setMarkFirstAsPaid(e.target.checked)}
                  />
                  <span>Marcar primeira mensalidade como paga</span>
                </label>
              </div>

              {markFirstAsPaid && (
                <div className="form-row" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="payment_date">Data do Pagamento</label>
                    <input
                      id="payment_date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="payment_method">Forma de Pagamento</label>
                    <select
                      id="payment_method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="transferencia">Transferência</option>
                      <option value="boleto">Boleto</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep('student')}>
                Voltar
              </button>
              <button type="button" className="btn-primary" onClick={handlePlanStepNext}>
                Próximo: Turmas
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Class Selection (Mini Calendar) */}
        {currentStep === 'classes' && (
          <div className="step-content">
            <h3>Selecione as Turmas</h3>
            {selectedPlan && (
              <p className="info-text">
                Selecione {selectedPlan.sessions_per_week} turma(s) compatível(is) com o nível{' '}
                <strong>{studentData.level}</strong>
              </p>
            )}

            <div className="mini-calendar">
              {classesByWeekday.map((dayData) => (
                <div key={dayData.day} className="calendar-day-column">
                  <div className="day-header">{dayData.label}</div>
                  <div className="day-classes">
                    {dayData.classes.length === 0 ? (
                      <div className="no-classes">Sem turmas</div>
                    ) : (
                      dayData.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className={`class-card ${selectedClassIds.includes(cls.id) ? 'selected' : ''}`}
                          onClick={() => handleClassToggle(cls.id)}
                        >
                          <div className="class-time">{cls.start_time}</div>
                          <div className="class-modality">{cls.modality_name}</div>
                          {cls.name && <div className="class-name">{cls.name}</div>}
                          <div className="class-level-badge">{cls.level || 'Todos'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="selected-count">
              Selecionadas: {selectedClassIds.length} /{' '}
              {selectedPlan?.sessions_per_week || 0}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep('plan')}>
                Voltar
              </button>
              <button type="button" className="btn-primary" onClick={handleClassesStepNext}>
                Próximo: Revisar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && createdStudent && selectedPlan && (
          <div className="step-content">
            <h3>Revisar Matrícula</h3>

            <div className="review-section">
              <h4>Aluno</h4>
              <div className="review-item">
                <strong>{createdStudent.full_name}</strong>
                <p>CPF: {createdStudent.cpf}</p>
                <p>Email: {createdStudent.email}</p>
                <p>Nível: {createdStudent.level}</p>
              </div>
            </div>

            <div className="review-section">
              <h4>Plano e Pagamento</h4>
              <div className="review-item">
                <strong>{selectedPlan.name}</strong>
                <p>Valor: R$ {(selectedPlan.price_cents / 100).toFixed(2).replace('.', ',')}</p>
                <p>Tipo de Contrato: {contractType === 'mensal' ? 'Mensal' : 'Anual'}</p>
                <p>Data de Início: {new Date(startDate).toLocaleDateString('pt-BR')}</p>
                <p>Dia de vencimento: {dueDay}</p>

                {discountType !== 'none' && (
                  <>
                    <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#4caf50' }}>
                      Desconto: {discountType === 'percentage'
                        ? `${discountValue}%`
                        : `R$ ${discountValue.toFixed(2).replace('.', ',')}`}
                      {discountUntil && ` (até ${new Date(discountUntil).toLocaleDateString('pt-BR')})`}
                    </p>
                  </>
                )}

                {markFirstAsPaid && (
                  <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#2196f3' }}>
                    ✓ Primeira mensalidade paga em {new Date(paymentDate).toLocaleDateString('pt-BR')} via {paymentMethod.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>

            <div className="review-section">
              <h4>Turmas Selecionadas</h4>
              {selectedClassIds.map((classId) => {
                const cls = classes.find((c) => c.id === classId);
                if (!cls) return null;
                return (
                  <div key={classId} className="review-item">
                    <p>
                      <strong>{weekdayLabels[cls.weekday]}</strong> - {cls.start_time}
                    </p>
                    <p>{cls.modality_name} {cls.name && `- ${cls.name}`}</p>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep('classes')} disabled={isSubmitting}>
                Voltar
              </button>
              <button type="button" className="btn-primary" onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Criando Matrícula...' : 'Finalizar Matrícula'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
