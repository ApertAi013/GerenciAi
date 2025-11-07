import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { enrollmentService } from '../services/enrollmentService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { financialService } from '../services/financialService';
import type { Enrollment, Plan, CreateEnrollmentRequest } from '../types/enrollmentTypes';
import type { Student } from '../types/studentTypes';
import type { Class } from '../types/classTypes';
import '../styles/Enrollments.css';
import '../components/ComprehensiveEnrollmentForm.css';

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

  // Payment flow state
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountUntil, setDiscountUntil] = useState('');
  const [willPayNow, setWillPayNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'credito' | 'debito' | 'pix' | 'transferencia'>('pix');

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Class filtering state for create modal
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [classesWithDetails, setClassesWithDetails] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

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

  // Fetch class details with enrolled counts
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (classes.length > 0) {
        const classesWithCounts = await Promise.all(
          classes.map(async (cls) => {
            try {
              const detailsRes = await classService.getClassById(cls.id);
              if (detailsRes.success && detailsRes.data) {
                return {
                  ...cls,
                  enrolled_count: detailsRes.data.enrolled_count || 0
                };
              }
              return cls;
            } catch (error) {
              return cls;
            }
          })
        );
        setClassesWithDetails(classesWithCounts);
      }
    };

    fetchClassDetails();
  }, [classes]);

  // Filter classes based on student level, availability, and search
  useEffect(() => {
    if (classesWithDetails.length > 0) {
      let filtered = classesWithDetails;

      // Filter by student level if student is selected
      const selectedStudent = getSelectedStudent();
      if (selectedStudent && selectedStudent.level) {
        filtered = filtered.filter((cls) => {
          if (cls.allowed_levels && cls.allowed_levels.length > 0) {
            return cls.allowed_levels.includes(selectedStudent.level!);
          }
          if (cls.level === 'todos') return true;
          return cls.level === selectedStudent.level;
        });
      }

      // Filter by availability
      if (showOnlyAvailable) {
        filtered = filtered.filter((cls) => {
          const enrolled = cls.enrolled_count || 0;
          const capacity = cls.capacity || 0;
          return enrolled < capacity;
        });
      }

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((cls) =>
          cls.modality_name?.toLowerCase().includes(query) ||
          cls.name?.toLowerCase().includes(query) ||
          cls.location?.toLowerCase().includes(query)
        );
      }

      setFilteredClasses(filtered);
    }
  }, [classesWithDetails, searchQuery, showOnlyAvailable, formData.student_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, studentsRes, classesRes, plansRes] = await Promise.all([
        enrollmentService.getEnrollments(),
        studentService.getStudents({ status: 'ativo' }),
        classService.getClasses({ limit: 1000 }),
        enrollmentService.getPlans(),
      ]);

      if (enrollmentsRes.success && enrollmentsRes.data) {
        console.log('📋 Matrículas carregadas (raw):', enrollmentsRes.data);

        // Mapear o array 'classes' retornado pelo backend para os campos esperados pelo frontend
        const enrollmentsWithMappedClasses = enrollmentsRes.data.map((enrollment: any) => {
          // Se o backend retornou um array 'classes', extrair class_ids e class_names
          if (enrollment.classes && Array.isArray(enrollment.classes)) {
            return {
              ...enrollment,
              class_ids: enrollment.classes.map((c: any) => c.class_id),
              class_names: enrollment.classes.map((c: any) => c.class_name || `Turma ${c.class_id}`)
            };
          }
          return enrollment;
        });

        console.log('📋 Matrículas após mapeamento:', enrollmentsWithMappedClasses);

        // Log específico para Claudete (se existir)
        const claudeteEnrollment = enrollmentsWithMappedClasses.find((e: any) =>
          e.student_name?.toLowerCase().includes('claudete')
        );
        if (claudeteEnrollment) {
          console.log('👤 Matrícula da Claudete:', {
            id: claudeteEnrollment.id,
            student_name: claudeteEnrollment.student_name,
            classes: claudeteEnrollment.classes,
            class_ids: claudeteEnrollment.class_ids,
            class_names: claudeteEnrollment.class_names,
            plan_name: claudeteEnrollment.plan_name
          });
        }

        setEnrollments(enrollmentsWithMappedClasses);
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
      // Preparar dados da matrícula
      const enrollmentData: any = {
        ...formData,
      };

      // Adicionar desconto se aplicável
      if (hasDiscount && discountValue > 0) {
        enrollmentData.discount_type = discountType;
        enrollmentData.discount_value = discountValue;
        if (discountUntil) {
          enrollmentData.discount_until = discountUntil;
        }
      }

      // Criar matrícula
      const response = await enrollmentService.createEnrollment(enrollmentData);
      if (response.success) {
        const enrollmentId = response.data.id;

        // Se o usuário escolheu pagar agora, gerar fatura e registrar pagamento
        if (willPayNow) {
          try {
            // Gerar fatura para o mês atual
            const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
            const invoiceGenResponse = await financialService.generateInvoices({
              reference_month: currentMonth
            });

            if (invoiceGenResponse.status === 'success') {
              // Buscar a fatura gerada para esta matrícula
              const invoicesResponse = await financialService.getInvoices({
                reference_month: currentMonth,
                student_id: formData.student_id,
                status: 'aberta'
              });

              // Encontrar a fatura da matrícula recém-criada
              const invoice = invoicesResponse.data.invoices.find(
                inv => inv.enrollment_id === enrollmentId
              );

              if (invoice) {
                // Mapear payment method para o formato esperado pela API
                const methodMap: Record<string, 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro'> = {
                  pix: 'pix',
                  dinheiro: 'dinheiro',
                  credito: 'cartao',
                  debito: 'cartao',
                  transferencia: 'outro'
                };

                // Registrar pagamento
                await financialService.registerPayment({
                  invoice_id: invoice.id,
                  paid_at: new Date().toISOString().split('T')[0],
                  method: methodMap[paymentMethod],
                  amount_cents: invoice.final_amount_cents,
                  notes: `Pagamento registrado na criação da matrícula - ${paymentMethod}`
                });

                toast.success('Matrícula criada e pagamento registrado com sucesso!');
              } else {
                toast.warning('Matrícula criada, mas não foi possível encontrar a fatura para registrar o pagamento');
              }
            } else {
              toast.warning('Matrícula criada, mas houve erro ao gerar a fatura para pagamento');
            }
          } catch (paymentError: any) {
            console.error('Erro ao processar pagamento:', paymentError);
            toast.warning('Matrícula criada, mas houve erro ao registrar o pagamento. Você pode registrá-lo na página de Financeiro.');
          }
        } else {
          toast.success('Matrícula criada com sucesso!');
        }

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
    setHasDiscount(false);
    setDiscountType('percentage');
    setDiscountValue(0);
    setDiscountUntil('');
    setWillPayNow(false);
    setPaymentMethod('pix');
    setSearchQuery('');
    setShowOnlyAvailable(false);
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

              {/* Discount Section */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => {
                      setHasDiscount(e.target.checked);
                      if (!e.target.checked) {
                        setDiscountValue(0);
                        setDiscountUntil('');
                      }
                    }}
                  />
                  <span>Aplicar Desconto?</span>
                </label>
              </div>

              {hasDiscount && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount_type">Tipo de Desconto</label>
                    <select
                      id="discount_type"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                    >
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_value">
                      Valor do Desconto {discountType === 'percentage' ? '(%)' : '(R$)'}
                    </label>
                    <input
                      type="number"
                      id="discount_value"
                      min="0"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_until">Válido até (opcional)</label>
                    <input
                      type="date"
                      id="discount_until"
                      value={discountUntil}
                      onChange={(e) => setDiscountUntil(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={willPayNow}
                    onChange={(e) => setWillPayNow(e.target.checked)}
                  />
                  <span>Vai pagar agora?</span>
                </label>
              </div>

              {willPayNow && (
                <div className="form-group">
                  <label htmlFor="payment_method">Forma de Pagamento</label>
                  <select
                    id="payment_method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    required
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência Bancária</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>
                  Turmas *
                  {selectedPlan && (
                    <span className="selected-count">
                      {formData.class_ids.length}/{selectedPlan.sessions_per_week} selecionada(s)
                    </span>
                  )}
                </label>

                {/* Search and Filters */}
                <div className="classes-filters">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Buscar turma por nome, modalidade ou local..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <label className="checkbox-filter">
                    <input
                      type="checkbox"
                      checked={showOnlyAvailable}
                      onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    />
                    <span>Apenas com vagas</span>
                  </label>
                </div>

                {/* Mini Calendar */}
                <div className="mini-calendar-modern">
                  {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
                    const dayClasses = filteredClasses.filter((cls) => cls.weekday === day);
                    const dayLabels: Record<string, string> = {
                      seg: 'Segunda',
                      ter: 'Terça',
                      qua: 'Quarta',
                      qui: 'Quinta',
                      sex: 'Sexta',
                      sab: 'Sábado',
                      dom: 'Domingo',
                    };

                    return (
                      <div key={day} className="calendar-day-column-modern">
                        <div className="day-header-modern">{dayLabels[day]}</div>
                        <div className="day-classes-modern">
                          {dayClasses.length === 0 ? (
                            <div className="no-classes-modern">Sem turmas</div>
                          ) : (
                            dayClasses.map((cls) => {
                              const enrolled = cls.enrolled_count || 0;
                              const capacity = cls.capacity || 0;
                              const available = capacity - enrolled;
                              const isFull = enrolled >= capacity;
                              const isSelected = formData.class_ids.includes(cls.id);

                              return (
                                <div
                                  key={cls.id}
                                  className={`class-card-modern ${isSelected ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                                  onClick={() => !isFull && handleClassToggle(cls.id)}
                                >
                                  {isSelected && (
                                    <div className="selection-indicator">✓ SELECIONADA</div>
                                  )}

                                  <div className="class-time-badge">
                                    {cls.start_time.substring(0, 5)}
                                  </div>

                                  <div className="class-info-section">
                                    <div className="class-modality-name">
                                      {cls.modality_name}
                                    </div>
                                    {cls.name && (
                                      <div className="class-custom-name">{cls.name}</div>
                                    )}
                                    {cls.location && (
                                      <div className="class-location">📍 {cls.location}</div>
                                    )}
                                  </div>

                                  <div
                                    className={`availability-badge ${
                                      isFull ? 'full' : available <= 3 ? 'low' : 'available'
                                    }`}
                                  >
                                    {isFull ? (
                                      'LOTADA'
                                    ) : (
                                      <>
                                        <span className="available-count">{available}</span>
                                        <span className="available-label">
                                          {available === 1 ? 'vaga' : 'vagas'}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredClasses.length === 0 && (
                  <div className="no-results">
                    <p>Nenhuma turma encontrada com os filtros aplicados.</p>
                  </div>
                )}

                {selectedPlan && (
                  <div className="selected-count-modern">
                    <strong>{formData.class_ids.length}</strong> de{' '}
                    <strong>{selectedPlan.sessions_per_week}</strong> turma(s) selecionada(s)
                  </div>
                )}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [classesWithDetails, setClassesWithDetails] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  // Fetch student data and classes with enrolled counts
  useEffect(() => {
    const fetchStudentAndClasses = async () => {
      try {
        // Fetch student data
        const studentRes = await studentService.getStudentById(enrollment.student_id);
        if (studentRes.success) {
          setStudentData(studentRes.data);
        }

        // Fetch enrolled_count for each class
        const classesWithCounts = await Promise.all(
          classes.map(async (cls) => {
            try {
              const detailsRes = await classService.getClassById(cls.id);
              if (detailsRes.success && detailsRes.data) {
                return {
                  ...cls,
                  enrolled_count: detailsRes.data.enrolled_count || 0
                };
              }
              return cls;
            } catch (error) {
              return cls;
            }
          })
        );
        setClassesWithDetails(classesWithCounts);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchStudentAndClasses();
  }, [enrollment.student_id, classes]);

  // Filter classes based on student level, availability, and search
  useEffect(() => {
    if (classesWithDetails.length > 0) {
      let filtered = classesWithDetails;

      // Filter by student level
      if (studentData && studentData.level) {
        filtered = filtered.filter((cls) => {
          if (cls.allowed_levels && cls.allowed_levels.length > 0) {
            return cls.allowed_levels.includes(studentData.level!);
          }
          if (cls.level === 'todos') return true;
          return cls.level === studentData.level;
        });
      }

      // Filter by availability
      if (showOnlyAvailable) {
        filtered = filtered.filter((cls) => {
          const enrolled = cls.enrolled_count || 0;
          const capacity = cls.capacity || 0;
          return enrolled < capacity;
        });
      }

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((cls) =>
          cls.modality_name?.toLowerCase().includes(query) ||
          cls.name?.toLowerCase().includes(query) ||
          cls.location?.toLowerCase().includes(query)
        );
      }

      setFilteredClasses(filtered);
    }
  }, [studentData, classesWithDetails, searchQuery, showOnlyAvailable]);

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
      // Primeiro, atualiza os dados gerais da matrícula (SEM class_ids)
      const payload: any = {
        plan_id: formData.plan_id,
        contract_type: formData.contract_type,
        due_day: formData.due_day,
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

      console.log('🔵 ATUALIZANDO MATRÍCULA (dados gerais):', {
        enrollmentId: enrollment.id,
        payload
      });

      const response = await enrollmentService.updateEnrollment(enrollment.id, payload);

      console.log('🟢 RESPOSTA (dados gerais):', response);

      if (!response.success) {
        console.error('❌ Erro ao atualizar dados gerais:', response);
        toast.error(response.message || 'Erro ao atualizar matrícula');
        return;
      }

      // Segundo, atualiza as TURMAS usando o endpoint específico
      console.log('🔵 ATUALIZANDO TURMAS:', {
        enrollmentId: enrollment.id,
        class_ids: formData.class_ids
      });

      const classesResponse = await enrollmentService.updateEnrollmentClasses(
        enrollment.id,
        { class_ids: formData.class_ids }
      );

      console.log('🟢 RESPOSTA (turmas):', classesResponse);

      if (classesResponse.success) {
        toast.success('Matrícula e turmas atualizadas com sucesso!');
      } else {
        console.error('❌ Erro ao atualizar turmas:', classesResponse);
        toast.error(classesResponse.message || 'Erro ao atualizar turmas');
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

            {/* Search and Filters */}
            <div className="classes-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar turma por nome, modalidade ou local..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                />
                <span>Apenas com vagas</span>
              </label>
            </div>

            {/* Mini Calendar */}
            <div className="mini-calendar-modern">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
                const dayClasses = filteredClasses.filter((cls) => cls.weekday === day);
                const dayLabels: Record<string, string> = {
                  seg: 'Segunda',
                  ter: 'Terça',
                  qua: 'Quarta',
                  qui: 'Quinta',
                  sex: 'Sexta',
                  sab: 'Sábado',
                  dom: 'Domingo',
                };

                return (
                  <div key={day} className="calendar-day-column-modern">
                    <div className="day-header-modern">{dayLabels[day]}</div>
                    <div className="day-classes-modern">
                      {dayClasses.length === 0 ? (
                        <div className="no-classes-modern">Sem turmas</div>
                      ) : (
                        dayClasses.map((cls) => {
                          const enrolled = cls.enrolled_count || 0;
                          const capacity = cls.capacity || 0;
                          const available = capacity - enrolled;
                          const isFull = enrolled >= capacity;
                          const isSelected = formData.class_ids.includes(cls.id);

                          return (
                            <div
                              key={cls.id}
                              className={`class-card-modern ${isSelected ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                              onClick={() => !isFull && handleClassToggle(cls.id)}
                            >
                              {isSelected && (
                                <div className="selection-indicator">✓ SELECIONADA</div>
                              )}

                              <div className="class-time-badge">
                                {cls.start_time.substring(0, 5)}
                              </div>

                              <div className="class-info-section">
                                <div className="class-modality-name">
                                  {cls.modality_name}
                                </div>
                                {cls.name && (
                                  <div className="class-custom-name">{cls.name}</div>
                                )}
                                {cls.location && (
                                  <div className="class-location">📍 {cls.location}</div>
                                )}
                              </div>

                              <div
                                className={`availability-badge ${
                                  isFull ? 'full' : available <= 3 ? 'low' : 'available'
                                }`}
                              >
                                {isFull ? (
                                  'LOTADA'
                                ) : (
                                  <>
                                    <span className="available-count">{available}</span>
                                    <span className="available-label">
                                      {available === 1 ? 'vaga' : 'vagas'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredClasses.length === 0 && (
              <div className="no-results">
                <p>Nenhuma turma encontrada com os filtros aplicados.</p>
              </div>
            )}

            {selectedPlan && (
              <div className="selected-count-modern">
                <strong>{formData.class_ids.length}</strong> de{' '}
                <strong>{selectedPlan.sessions_per_week}</strong> turma(s) selecionada(s)
              </div>
            )}
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
