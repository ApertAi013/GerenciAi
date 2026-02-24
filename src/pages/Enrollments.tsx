import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { enrollmentService } from '../services/enrollmentService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { financialService } from '../services/financialService';
import GenerateFirstInvoiceModal from '../components/GenerateFirstInvoiceModal';
import type { Enrollment, Plan, CreateEnrollmentRequest } from '../types/enrollmentTypes';
import type { Student } from '../types/studentTypes';
import type { Class } from '../types/classTypes';
import '../styles/Enrollments.css';
import '../components/ComprehensiveEnrollmentForm.css';

export default function Enrollments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]); // For counting
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ativa' | 'cancelada' | 'suspensa' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'id' | 'student_name' | 'plan_name' | 'start_date' | 'due_day' | 'status'>('student_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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
  const [discountValueDisplay, setDiscountValueDisplay] = useState(''); // For fixed discount display (R$)
  const [discountUntil, setDiscountUntil] = useState('');
  const [willPayNow, setWillPayNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'credito' | 'debito' | 'pix' | 'transferencia'>('pix');

  // First invoice modal state
  const [showFirstInvoiceModal, setShowFirstInvoiceModal] = useState(false);
  const [createdEnrollmentData, setCreatedEnrollmentData] = useState<{
    id: number;
    studentName: string;
    planPrice: number;
    dueDay: number;
    discountType: 'none' | 'fixed' | 'percentage';
    discountValue: number;
  } | null>(null);

  // Format currency input (converts centavos to R$ display)
  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  // Parse currency input (converts R$ display to centavos)
  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/[^\d]/g, '');
    return parseInt(numbers) || 0;
  };

  // Handle discount value change
  const handleDiscountValueChange = (value: string) => {
    if (discountType === 'fixed') {
      // Accept reais input with comma (e.g., "50,00" = R$50) and store as cents
      const val = value.replace(/[^0-9,]/g, '').replace(',', '.');
      const cents = Math.round(parseFloat(val || '0') * 100);
      setDiscountValue(cents);
      setDiscountValueDisplay(value.replace(/[^0-9,]/g, ''));
    } else {
      const val = value.replace(/[^0-9]/g, '');
      setDiscountValue(val ? Math.min(100, Number(val)) : 0);
    }
  };

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort enrollments
  const sortEnrollments = (enrollmentsToSort: Enrollment[]) => {
    return [...enrollmentsToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'student_name':
          aValue = (a.student_name || getStudentName(a.student_id)).toLowerCase();
          bValue = (b.student_name || getStudentName(b.student_id)).toLowerCase();
          break;
        case 'plan_name':
          aValue = (a.plan_name || getPlanName(a.plan_id)).toLowerCase();
          bValue = (b.plan_name || getPlanName(b.plan_id)).toLowerCase();
          break;
        case 'start_date':
          aValue = a.start_date;
          bValue = b.start_date;
          break;
        case 'due_day':
          aValue = a.due_day;
          bValue = b.due_day;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Class filtering state for create modal
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [classesWithDetails, setClassesWithDetails] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Auto-open edit modal if ?edit=enrollment_id is in URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && enrollments.length > 0) {
      const enrollmentToEdit = enrollments.find(e => e.id === Number(editId));
      if (enrollmentToEdit) {
        setEditingEnrollment(enrollmentToEdit);
        setShowEditModal(true);
        // Clear the param so it doesn't reopen on close
        setSearchParams({});
      }
    }
  }, [searchParams, enrollments]);

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
              if (detailsRes.status === 'success' && detailsRes.data) {
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

      // Filter by plan modality (if plan has a specific modality)
      const currentSelectedPlan = plans.find(p => p.id === formData.plan_id);
      if (currentSelectedPlan?.modality_id) {
        filtered = filtered.filter((cls) => cls.modality_id === currentSelectedPlan.modality_id);
      }

      // Filter by student level if student is selected
      const selectedStudent = getSelectedStudent();
      if (selectedStudent && (selectedStudent.level_name || selectedStudent.level)) {
        const studentLevel = selectedStudent.level_name || selectedStudent.level;
        filtered = filtered.filter((cls) => {
          if (cls.allowed_levels && cls.allowed_levels.length > 0) {
            return cls.allowed_levels.includes(studentLevel!);
          }
          return true;
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
  }, [classesWithDetails, searchQuery, showOnlyAvailable, formData.student_id, formData.plan_id, plans]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Always fetch all enrollments for counting
      const allEnrollmentsRes = await enrollmentService.getEnrollments();

      // Fetch filtered enrollments if filter is active
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const enrollmentsRes = statusFilter
        ? await enrollmentService.getEnrollments(params)
        : allEnrollmentsRes;

      const [studentsRes, classesRes, plansRes] = await Promise.all([
        studentService.getStudents({ status: 'ativo' }),
        classService.getClasses({ limit: 1000 }),
        enrollmentService.getPlans(),
      ]);

      if (enrollmentsRes.status === 'success' && enrollmentsRes.data) {
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

      // Set all enrollments for counting
      if (allEnrollmentsRes.status === 'success' && allEnrollmentsRes.data) {
        const allMapped = allEnrollmentsRes.data.map((enrollment: any) => {
          if (enrollment.classes && Array.isArray(enrollment.classes)) {
            return {
              ...enrollment,
              class_ids: enrollment.classes.map((c: any) => c.class_id),
              class_names: enrollment.classes.map((c: any) => c.class_name || `Turma ${c.class_id}`)
            };
          }
          return enrollment;
        });
        setAllEnrollments(allMapped);
      }

      if (studentsRes.status === 'success' && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      if (classesRes.status === 'success' && classesRes.data) {
        setClasses(classesRes.data);
      }
      // Suporta ambos formatos: { success: true, data } e { status: 'success', data/plans }
      const plansSuccess = (plansRes as any).status === 'success' || (plansRes as any).success === true;
      const plansData = (plansRes as any).data || (plansRes as any).plans;
      if (plansSuccess && plansData) {
        setPlans(plansData);
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
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        const enrollmentId = response.data.id;

        // Se o usuário escolheu pagar agora, gerar fatura e registrar pagamento
        if (willPayNow) {
          try {
            // Gerar fatura apenas para esta matrícula
            const invoiceResponse = await enrollmentService.generateFirstInvoice({
              enrollment_id: enrollmentId,
              invoice_type: 'full'
            });

            if (invoiceResponse.success && invoiceResponse.data) {
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
                invoice_id: invoiceResponse.data.id,
                paid_at: new Date().toISOString().split('T')[0],
                method: methodMap[paymentMethod],
                amount_cents: invoiceResponse.data.final_amount_cents,
                notes: `Pagamento registrado na criação da matrícula - ${paymentMethod}`
              });

              toast.success('Matrícula criada e pagamento registrado com sucesso!');
            } else {
              toast.warning('Matrícula criada, mas houve erro ao gerar a fatura para pagamento');
            }
          } catch (paymentError: any) {
            console.error('Erro ao processar pagamento:', paymentError);
            toast.warning('Matrícula criada, mas houve erro ao registrar o pagamento. Você pode registrá-lo na página de Financeiro.');
          }
          setShowModal(false);
          resetForm();
          loadData();
        } else {
          // Mostrar modal para gerar primeira fatura
          const selectedStudent = students.find(s => s.id === formData.student_id);
          const selectedPlan = plans.find(p => p.id === formData.plan_id);

          if (selectedStudent && selectedPlan) {
            toast.success('Matrícula criada com sucesso!');
            const enrollmentData = {
              id: enrollmentId,
              studentName: selectedStudent.full_name,
              planPrice: selectedPlan.price_cents,
              dueDay: formData.due_day,
              discountType: hasDiscount ? discountType : 'none' as const,
              discountValue: hasDiscount ? discountValue : 0,
            };
            setCreatedEnrollmentData(enrollmentData);
            setShowModal(false);
            setShowFirstInvoiceModal(true);
          } else {
            toast.success('Matrícula criada com sucesso!');
            setShowModal(false);
            resetForm();
            loadData();
          }
        }
      } else {
        console.error('Resposta da API não foi sucesso:', response);
        toast.error('Erro ao criar matrícula');
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
    setDiscountValueDisplay('');
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

  // Modal de primeira fatura - renderizar antes do loading check
  if (showFirstInvoiceModal && createdEnrollmentData) {
    return (
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>Gerar Primeira Fatura</h2>
            <button
              className="close-btn"
              onClick={() => {
                setShowFirstInvoiceModal(false);
                setCreatedEnrollmentData(null);
                resetForm();
                loadData();
              }}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: '1rem' }}>
              <strong>{createdEnrollmentData.studentName}</strong> foi matriculado(a) com sucesso!
            </p>
            <p>Como deseja gerar a primeira fatura?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={async () => {
                  try {
                    const response = await enrollmentService.generateFirstInvoice({
                      enrollment_id: createdEnrollmentData.id,
                      invoice_type: 'full'
                    });
                    if (response.success) {
                      toast.success('Fatura cheia gerada com sucesso!');
                    }
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Erro ao gerar fatura');
                  }
                  setShowFirstInvoiceModal(false);
                  setCreatedEnrollmentData(null);
                  resetForm();
                  loadData();
                }}
              >
                Fatura Cheia - Vencimento Hoje
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={async () => {
                  try {
                    const response = await enrollmentService.generateFirstInvoice({
                      enrollment_id: createdEnrollmentData.id,
                      invoice_type: 'proportional'
                    });
                    if (response.success) {
                      toast.success('Fatura proporcional gerada com sucesso!');
                    }
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Erro ao gerar fatura');
                  }
                  setShowFirstInvoiceModal(false);
                  setCreatedEnrollmentData(null);
                  resetForm();
                  loadData();
                }}
              >
                Fatura Proporcional (até dia {createdEnrollmentData.dueDay})
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  toast('Fatura será gerada no fechamento mensal', { icon: '📝' });
                  setShowFirstInvoiceModal(false);
                  setCreatedEnrollmentData(null);
                  resetForm();
                  loadData();
                }}
              >
                Pular (gerar no fechamento)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="enrollment-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={statusFilter === '' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setStatusFilter('')}
        >
          Todas ({allEnrollments.length})
        </button>
        <button
          className={statusFilter === 'ativa' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setStatusFilter('ativa')}
        >
          Ativas ({allEnrollments.filter(e => e.status === 'ativa').length})
        </button>
        <button
          className={statusFilter === 'suspensa' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setStatusFilter('suspensa')}
        >
          Suspensas ({allEnrollments.filter(e => e.status === 'suspensa').length})
        </button>
        <button
          className={statusFilter === 'cancelada' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setStatusFilter('cancelada')}
        >
          Canceladas ({allEnrollments.filter(e => e.status === 'cancelada').length})
        </button>
      </div>

      <div className="enrollments-table-container">
        <table className="enrollments-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                ID {renderSortIndicator('id')}
              </th>
              <th onClick={() => handleSort('student_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Aluno {renderSortIndicator('student_name')}
              </th>
              <th onClick={() => handleSort('plan_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Plano {renderSortIndicator('plan_name')}
              </th>
              <th onClick={() => handleSort('start_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Início {renderSortIndicator('start_date')}
              </th>
              <th onClick={() => handleSort('due_day')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Vencimento {renderSortIndicator('due_day')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {renderSortIndicator('status')}
              </th>
              <th>Desconto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Filter enrollments by search term
              const filteredEnrollments = searchTerm.trim()
                ? enrollments.filter(enrollment =>
                    (enrollment.student_name || getStudentName(enrollment.student_id))
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                : enrollments;

              // Apply sorting
              const sortedEnrollments = sortEnrollments(filteredEnrollments);

              return sortedEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    {searchTerm
                      ? `Nenhuma matrícula encontrada para "${searchTerm}"`
                      : 'Nenhuma matrícula encontrada. Clique em "Nova Matrícula" para começar.'}
                  </td>
                </tr>
              ) : (
                sortedEnrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>#{enrollment.id}</td>
                  <td>
                    <span
                      onClick={() => navigate(`/alunos/${enrollment.student_id}`)}
                      style={{
                        cursor: 'pointer',
                        color: '#007bff',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {enrollment.student_name || getStudentName(enrollment.student_id)}
                    </span>
                  </td>
                  <td>{enrollment.plan_name || getPlanName(enrollment.plan_id)}</td>
                  <td>{new Date(enrollment.start_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
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
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {enrollment.student_phone && (
                        <button
                          type="button"
                          className="btn-icon btn-whatsapp-small"
                          onClick={() => {
                            const phone = enrollment.student_phone?.replace(/\D/g, '') || '';
                            const message = `Olá ${enrollment.student_name}!`;
                            const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          title="Enviar WhatsApp"
                          style={{
                            backgroundColor: '#25D366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FontAwesomeIcon icon={faWhatsapp} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => {
                          setEditingEnrollment(enrollment);
                          setShowEditModal(true);
                        }}
                        title="Editar matrícula"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              );
            })()}
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
                    {discountType === 'fixed' ? (
                      <input
                        type="text"
                        id="discount_value"
                        value={discountValueDisplay}
                        onChange={(e) => handleDiscountValueChange(e.target.value)}
                        placeholder="0,00"
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        id="discount_value"
                        value={discountValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setDiscountValue(val ? Math.min(100, Number(val)) : 0);
                        }}
                        placeholder="0"
                        required
                      />
                    )}
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
                                  style={{
                                    borderLeft: `6px solid ${cls.color || '#3B82F6'}`,
                                    position: 'relative'
                                  }}
                                >
                                  {/* Color indicator dot */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: cls.color || '#3B82F6',
                                    border: '2px solid white',
                                    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                                    zIndex: 1
                                  }} />

                                  {isSelected && (
                                    <div className="selection-indicator">✓ SELECIONADA</div>
                                  )}

                                  <div className="class-time-badge" style={{
                                    backgroundColor: cls.color || '#3B82F6',
                                    color: 'white'
                                  }}>
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
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [updateOpenInvoices, setUpdateOpenInvoices] = useState(false);
  const [refundAndRegenerate, setRefundAndRegenerate] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [cancelInvoices, setCancelInvoices] = useState(false);
  const [applyDiscountToInvoices, setApplyDiscountToInvoices] = useState(false);

  // Reactivation flow state
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [reactivationInvoiceOption, setReactivationInvoiceOption] = useState<'now' | 'due_day' | 'next_month'>('due_day');
  const [classAvailability, setClassAvailability] = useState<{
    available: boolean;
    originalClassesAvailable: boolean;
    unavailableClasses: Array<{ id: number; name: string; enrolled: number; capacity: number }>;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [openInvoicesCount, setOpenInvoicesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [classesWithDetails, setClassesWithDetails] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  // Fetch open invoices count
  useEffect(() => {
    const fetchOpenInvoices = async () => {
      try {
        const response = await enrollmentService.getOpenInvoices(enrollment.id);
        if (response.success || (response as any).status === 'success') {
          setOpenInvoicesCount(response.data.length);
        }
      } catch (error) {
        console.error('Erro ao buscar faturas abertas:', error);
      }
    };
    fetchOpenInvoices();
  }, [enrollment.id]);

  // Fetch student data and classes with enrolled counts
  useEffect(() => {
    const fetchStudentAndClasses = async () => {
      try {
        // Fetch student data
        const studentRes = await studentService.getStudentById(enrollment.student_id);
        if (studentRes.status === 'success') {
          setStudentData(studentRes.data);
        }

        // Fetch enrolled_count for each class
        const classesWithCounts = await Promise.all(
          classes.map(async (cls) => {
            try {
              const detailsRes = await classService.getClassById(cls.id);
              if (detailsRes.status === 'success' && detailsRes.data) {
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

  // Filter classes based on plan modality, student level, availability, and search
  useEffect(() => {
    if (classesWithDetails.length > 0) {
      let filtered = classesWithDetails;

      // Filter by plan modality (if plan has a specific modality)
      const currentPlan = plans.find((p) => p.id === formData.plan_id);
      if (currentPlan?.modality_id) {
        filtered = filtered.filter((cls) => cls.modality_id === currentPlan.modality_id);
      }

      // Filter by student level
      if (studentData && (studentData.level_name || studentData.level)) {
        const studentLevel = studentData.level_name || studentData.level;
        filtered = filtered.filter((cls) => {
          let levels = cls.allowed_levels;
          if (!levels || levels.length === 0) return true;
          // Parse JSON string if needed
          if (typeof levels === 'string') {
            try { levels = JSON.parse(levels); } catch { return true; }
          }
          if (!Array.isArray(levels) || levels.length === 0) return true;
          return levels.includes(studentLevel!);
        });
      }

      // Filter by availability (mas sempre mostra turmas onde o aluno já está)
      if (showOnlyAvailable) {
        filtered = filtered.filter((cls) => {
          const enrolled = cls.enrolled_count || 0;
          const capacity = cls.capacity || 0;
          const isOriginalClass = enrollment.class_ids?.includes(cls.id) || false;
          // Mostra se tem vaga OU se o aluno já está nesta turma
          return enrolled < capacity || isOriginalClass;
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
  }, [studentData, classesWithDetails, searchQuery, showOnlyAvailable, enrollment.class_ids, formData.plan_id, plans]);

  const selectedPlan = plans.find((p) => p.id === formData.plan_id);

  const handleClassToggle = (classId: number) => {
    setFormData((prev) => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter((id) => id !== classId)
        : [...prev.class_ids, classId],
    }));
  };

  const handlePlanChange = (newPlanId: number) => {
    // If plan is changing, show confirmation modal
    if (newPlanId !== enrollment.plan_id) {
      setPendingPlanId(newPlanId);
      setShowPlanChangeConfirm(true);
    } else {
      setFormData({ ...formData, plan_id: newPlanId, class_ids: [] });
    }
  };

  const confirmPlanChange = (shouldUpdateInvoices: boolean, shouldRefundAndRegenerate: boolean = false) => {
    if (pendingPlanId !== null) {
      setFormData({ ...formData, plan_id: pendingPlanId, class_ids: [] });
      setUpdateOpenInvoices(shouldUpdateInvoices);
      setRefundAndRegenerate(shouldRefundAndRegenerate);
      setShowPlanChangeConfirm(false);
      setPendingPlanId(null);
    }
  };

  const cancelPlanChange = () => {
    setShowPlanChangeConfirm(false);
    setPendingPlanId(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    // If changing to cancelled, show confirmation modal
    if (newStatus === 'cancelada' && enrollment.status !== 'cancelada') {
      setPendingStatus(newStatus);
      setShowCancelConfirm(true);
    }
    // If reactivating from cancelled or suspended, show reactivation modal
    else if (newStatus === 'ativa' && (enrollment.status === 'cancelada' || enrollment.status === 'suspensa')) {
      setPendingStatus(newStatus);
      setIsCheckingAvailability(true);
      setShowReactivationModal(true);

      // Check availability of original classes
      try {
        const originalClassIds = enrollment.class_ids || [];
        const unavailable: Array<{ id: number; name: string; enrolled: number; capacity: number }> = [];

        for (const classId of originalClassIds) {
          const cls = classesWithDetails.find(c => c.id === classId);
          if (cls) {
            const enrolled = cls.enrolled_count || 0;
            const capacity = cls.capacity || 0;
            if (enrolled >= capacity) {
              unavailable.push({
                id: cls.id,
                name: cls.name || cls.modality_name || `Turma ${cls.id}`,
                enrolled,
                capacity
              });
            }
          }
        }

        setClassAvailability({
          available: unavailable.length === 0,
          originalClassesAvailable: unavailable.length === 0,
          unavailableClasses: unavailable
        });
      } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        setClassAvailability({
          available: false,
          originalClassesAvailable: false,
          unavailableClasses: []
        });
      } finally {
        setIsCheckingAvailability(false);
      }
    } else {
      setFormData({ ...formData, status: newStatus as any });
    }
  };

  const confirmStatusChange = (shouldCancelInvoices: boolean) => {
    if (pendingStatus) {
      setFormData({ ...formData, status: pendingStatus as any });
      setCancelInvoices(shouldCancelInvoices);
      setShowCancelConfirm(false);
      setPendingStatus(null);
    }
  };

  const cancelStatusChange = () => {
    setShowCancelConfirm(false);
    setPendingStatus(null);
  };

  const confirmReactivation = async (keepOriginalClasses: boolean) => {
    if (pendingStatus) {
      if (keepOriginalClasses) {
        // Keep original classes - save immediately
        setShowReactivationModal(false);
        setIsSubmitting(true);

        try {
          // Update enrollment status to active
          const payload: any = {
            plan_id: formData.plan_id,
            contract_type: formData.contract_type,
            due_day: formData.due_day,
            status: 'ativa',
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
            payload.discount_value = 0;
          }

          console.log('🔵 REATIVANDO MATRÍCULA:', { enrollmentId: enrollment.id, payload });

          const response = await enrollmentService.updateEnrollment(enrollment.id, payload);

          if (!((response as any).status === 'success' || (response as any).success === true)) {
            toast.error(response.message || 'Erro ao reativar matrícula');
            return;
          }

          // Update classes (keep original)
          const classesResponse = await enrollmentService.updateEnrollmentClasses(
            enrollment.id,
            { class_ids: formData.class_ids }
          );

          if (classesResponse.status !== 'success') {
            toast.error(classesResponse.message || 'Erro ao atualizar turmas');
            return;
          }

          // Generate invoice if selected
          if (reactivationInvoiceOption !== 'next_month') {
            try {
              console.log('🔵 Gerando fatura de reativação...', { reactivationInvoiceOption });
              const invoiceResponse = await enrollmentService.generateFirstInvoice({
                enrollment_id: enrollment.id,
                invoice_type: 'full'
              });

              console.log('🟢 Resposta geração fatura:', invoiceResponse);

              if (invoiceResponse.success || (invoiceResponse as any).status === 'success') {
                toast.success('Matrícula reativada e fatura gerada com sucesso!');
              } else {
                toast.success('Matrícula reativada! Fatura será gerada no próximo fechamento.');
              }
            } catch (invoiceError: any) {
              console.error('❌ Erro ao gerar fatura:', invoiceError);
              console.error('❌ Response data:', invoiceError.response?.data);
              const errorMessage = invoiceError.response?.data?.message || '';
              if (errorMessage.includes('já existe') || errorMessage.includes('Já existe')) {
                toast.success('Matrícula reativada! Já existe fatura para este período.');
              } else {
                // Mostra o erro real para debug
                console.error('Mensagem de erro:', errorMessage);
                toast.error(`Matrícula reativada, mas erro na fatura: ${errorMessage || 'erro desconhecido'}`);
              }
            }
          } else {
            toast.success('Matrícula reativada! Cobrança iniciará no próximo mês.');
          }

          onSuccess();
        } catch (err: any) {
          console.error('Erro ao reativar:', err);
          toast.error(err.response?.data?.message || 'Erro ao reativar matrícula');
        } finally {
          setIsSubmitting(false);
          setPendingStatus(null);
        }
      } else {
        // User will select new classes - just update status, classes selection will happen in the form
        setFormData({ ...formData, status: pendingStatus as any, class_ids: [] });
        setShowReactivationModal(false);
        setPendingStatus(null);
      }
    }
  };

  const cancelReactivation = () => {
    setShowReactivationModal(false);
    setPendingStatus(null);
    setClassAvailability(null);
    setReactivationInvoiceOption('due_day');
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
        payload.discount_value = 0;
      }

      // Add apply_discount_to_open_invoices flag if discount changed
      const discountChanged = formData.discount_type !== enrollment.discount_type ||
                             formData.discount_value !== enrollment.discount_value;
      if (discountChanged && applyDiscountToInvoices) {
        payload.apply_discount_to_open_invoices = true;
      }

      // Add update_open_invoices flag if plan changed
      if (formData.plan_id !== enrollment.plan_id) {
        payload.update_open_invoices = updateOpenInvoices;
        payload.refund_and_regenerate = refundAndRegenerate;
      }

      // Add cancel_invoices flag if status changed to cancelada
      if (formData.status === 'cancelada' && enrollment.status !== 'cancelada') {
        payload.cancel_invoices = cancelInvoices;
      }

      // Check if this is a reactivation
      const isReactivation = formData.status === 'ativa' &&
        (enrollment.status === 'cancelada' || enrollment.status === 'suspensa');

      console.log('🔵 ATUALIZANDO MATRÍCULA (dados gerais):', {
        enrollmentId: enrollment.id,
        payload,
        isReactivation
      });

      const response = await enrollmentService.updateEnrollment(enrollment.id, payload);

      console.log('🟢 RESPOSTA (dados gerais):', response);

      if (!((response as any).status === 'success' || (response as any).success === true)) {
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

      if (classesResponse.status === 'success') {
        // Handle invoice generation for reactivation
        if (isReactivation && reactivationInvoiceOption !== 'next_month') {
          try {
            console.log('🔵 Gerando fatura de reativação...', { reactivationInvoiceOption });

            const invoiceType = reactivationInvoiceOption === 'now' ? 'full' : 'full';
            const invoiceResponse = await enrollmentService.generateFirstInvoice({
              enrollment_id: enrollment.id,
              invoice_type: invoiceType
            });

            if (invoiceResponse.success) {
              toast.success('Matrícula reativada e fatura gerada com sucesso!');
            } else {
              toast.success('Matrícula reativada! Fatura será gerada no próximo fechamento.');
            }
          } catch (invoiceError: any) {
            console.error('Erro ao gerar fatura de reativação:', invoiceError);
            // Check if invoice already exists
            if (invoiceError.response?.data?.message?.includes('já existe')) {
              toast.success('Matrícula reativada! Já existe fatura para este período.');
            } else {
              toast.success('Matrícula reativada! Gere a fatura manualmente em Financeiro.');
            }
          }
        } else if (isReactivation) {
          toast.success('Matrícula reativada! Cobrança iniciará no próximo mês.');
        } else {
          toast.success('Matrícula e turmas atualizadas com sucesso!');
        }
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
              onChange={(e) => handlePlanChange(Number(e.target.value))}
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
                          const isSelected = formData.class_ids.includes(cls.id);
                          // Se o aluno já está na turma (turma original), não conta ele na ocupação
                          const isOriginalClass = enrollment.class_ids?.includes(cls.id) || false;
                          const effectiveEnrolled = isOriginalClass ? enrolled - 1 : enrolled;
                          const available = capacity - effectiveEnrolled;
                          // Turma está cheia apenas se não há vagas E o aluno não está nela originalmente
                          const isFull = effectiveEnrolled >= capacity;
                          // Permite clicar se está selecionada (para desmarcar) ou se tem vaga
                          const canClick = isSelected || !isFull;

                          return (
                            <div
                              key={cls.id}
                              className={`class-card-modern ${isSelected ? 'selected' : ''} ${isFull && !isSelected ? 'full' : ''}`}
                              onClick={() => canClick && handleClassToggle(cls.id)}
                              style={{
                                borderLeft: `6px solid ${cls.color || '#3B82F6'}`,
                                position: 'relative',
                                cursor: canClick ? 'pointer' : 'not-allowed'
                              }}
                            >
                              {/* Color indicator dot */}
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: cls.color || '#3B82F6',
                                border: '2px solid white',
                                boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                                zIndex: 1
                              }} />

                              {isSelected && (
                                <div className="selection-indicator">✓ SELECIONADA</div>
                              )}

                              <div className="class-time-badge" style={{
                                backgroundColor: cls.color || '#3B82F6',
                                color: 'white'
                              }}>
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
                                  isFull && !isSelected ? 'full' : available <= 3 ? 'low' : 'available'
                                }`}
                              >
                                {isFull && !isSelected ? (
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
                  type="text"
                  id="discount_value"
                  value={formData.discount_type === 'fixed'
                    ? (formData.discount_value / 100).toFixed(2).replace('.', ',')
                    : formData.discount_value}
                  onChange={(e) => {
                    if (formData.discount_type === 'fixed') {
                      const val = e.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                      const cents = Math.round(parseFloat(val || '0') * 100);
                      setFormData({ ...formData, discount_value: cents });
                    } else {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, discount_value: val ? Math.min(100, Number(val)) : 0 });
                    }
                  }}
                  placeholder={formData.discount_type === 'fixed' ? '0,00' : '0'}
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

          {/* Checkbox para aplicar desconto em faturas abertas */}
          {openInvoicesCount > 0 && (formData.discount_type !== enrollment.discount_type || formData.discount_value !== enrollment.discount_value) && (
            <div className="form-group" style={{ marginTop: '12px', padding: '12px', backgroundColor: formData.discount_type === 'none' ? '#f8d7da' : '#fff3cd', borderRadius: '8px', border: `1px solid ${formData.discount_type === 'none' ? '#f5c6cb' : '#ffc107'}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                <input
                  type="checkbox"
                  checked={applyDiscountToInvoices}
                  onChange={(e) => setApplyDiscountToInvoices(e.target.checked)}
                />
                <span>
                  {formData.discount_type === 'none' ? (
                    <>Remover desconto das <strong>{openInvoicesCount} fatura(s) aberta(s)</strong> existente(s) (voltarão ao valor cheio)</>
                  ) : (
                    <>Aplicar novo desconto nas <strong>{openInvoicesCount} fatura(s) aberta(s)</strong> existente(s)</>
                  )}
                </span>
              </label>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
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

      {/* Plan Change Confirmation Modal */}
      {showPlanChangeConfirm && pendingPlanId && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Alterar Plano</h2>
              <button type="button" className="modal-close" onClick={cancelPlanChange}>×</button>
            </div>
            <div style={{ padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>
                O plano desta matrícula será alterado. O que deseja fazer com as faturas em aberto?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => confirmPlanChange(true)}
                  style={{ width: '100%', textAlign: 'left', padding: '1rem' }}
                >
                  <strong>Atualizar faturas em aberto</strong>
                  <br />
                  <small style={{ opacity: 0.9 }}>As faturas em aberto serão atualizadas com o novo valor do plano</small>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => confirmPlanChange(false)}
                  style={{ width: '100%', textAlign: 'left', padding: '1rem' }}
                >
                  <strong>Manter faturas com valor antigo</strong>
                  <br />
                  <small style={{ opacity: 0.9 }}>As faturas em aberto manterão o valor antigo, apenas novas faturas terão o novo valor</small>
                </button>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => confirmPlanChange(false, true)}
                >
                  <strong>Estornar fatura paga e gerar nova</strong>
                  <br />
                  <small style={{ opacity: 0.9 }}>A fatura paga do mês será estornada e uma nova será gerada com o novo valor</small>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelPlanChange}
                  style={{ width: '100%' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Enrollment Confirmation Modal */}
      {showCancelConfirm && pendingStatus && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancelar Matrícula</h2>
              <button type="button" className="modal-close" onClick={cancelStatusChange}>×</button>
            </div>
            <div style={{ padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>
                Você está cancelando esta matrícula. O que deseja fazer com as faturas em aberto?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => confirmStatusChange(true)}
                  style={{ width: '100%', textAlign: 'left', padding: '1rem', background: '#e74c3c', borderColor: '#e74c3c' }}
                >
                  <strong>Cancelar faturas em aberto</strong>
                  <br />
                  <small style={{ opacity: 0.9 }}>As faturas em aberto serão canceladas junto com a matrícula</small>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => confirmStatusChange(false)}
                  style={{ width: '100%', textAlign: 'left', padding: '1rem' }}
                >
                  <strong>Manter faturas em aberto</strong>
                  <br />
                  <small style={{ opacity: 0.9 }}>As faturas em aberto continuarão ativas para cobrança</small>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelStatusChange}
                  style={{ width: '100%' }}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivation Modal */}
      {showReactivationModal && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reativar Matrícula</h2>
              <button type="button" className="modal-close" onClick={cancelReactivation}>×</button>
            </div>
            <div style={{ padding: '2rem' }}>
              {isCheckingAvailability ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p>Verificando disponibilidade das turmas...</p>
                </div>
              ) : classAvailability ? (
                <>
                  {/* Class Availability Section */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#2c3e50' }}>
                      Turmas do Aluno
                    </h3>

                    {classAvailability.originalClassesAvailable ? (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#d4edda',
                        borderRadius: '8px',
                        border: '1px solid #28a745',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: 0, color: '#155724', fontWeight: 500 }}>
                          ✓ As turmas originais possuem vagas disponíveis!
                        </p>
                        <p style={{ margin: '0.5rem 0 0', color: '#155724', fontSize: '0.9rem' }}>
                          O aluno será reinserido nas mesmas turmas de antes.
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffc107',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: 0, color: '#856404', fontWeight: 500 }}>
                          ⚠️ Algumas turmas não possuem vagas:
                        </p>
                        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', color: '#856404' }}>
                          {classAvailability.unavailableClasses.map((cls) => (
                            <li key={cls.id} style={{ fontSize: '0.9rem' }}>
                              {cls.name} ({cls.enrolled}/{cls.capacity} alunos)
                            </li>
                          ))}
                        </ul>
                        <p style={{ margin: '0.75rem 0 0', color: '#856404', fontSize: '0.9rem' }}>
                          Você precisará escolher novas turmas para este aluno.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Invoice Generation Options */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#2c3e50' }}>
                      Geração de Fatura
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                      Como deseja gerar a fatura para esta reativação?
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '1rem',
                          border: reactivationInvoiceOption === 'now' ? '2px solid #3498db' : '1px solid #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: reactivationInvoiceOption === 'now' ? '#ebf5fb' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="invoiceOption"
                          checked={reactivationInvoiceOption === 'now'}
                          onChange={() => setReactivationInvoiceOption('now')}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <strong>Gerar fatura agora</strong>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                            Uma fatura será gerada imediatamente com vencimento para hoje
                          </p>
                        </div>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '1rem',
                          border: reactivationInvoiceOption === 'due_day' ? '2px solid #3498db' : '1px solid #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: reactivationInvoiceOption === 'due_day' ? '#ebf5fb' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="invoiceOption"
                          checked={reactivationInvoiceOption === 'due_day'}
                          onChange={() => setReactivationInvoiceOption('due_day')}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <strong>Gerar no dia de vencimento</strong>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                            A fatura será gerada com vencimento no dia {enrollment.due_day} deste mês
                          </p>
                        </div>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '1rem',
                          border: reactivationInvoiceOption === 'next_month' ? '2px solid #3498db' : '1px solid #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: reactivationInvoiceOption === 'next_month' ? '#ebf5fb' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="invoiceOption"
                          checked={reactivationInvoiceOption === 'next_month'}
                          onChange={() => setReactivationInvoiceOption('next_month')}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <strong>Cobrar a partir do próximo mês</strong>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                            Não será gerada fatura agora. A cobrança começará no próximo ciclo
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {classAvailability.originalClassesAvailable ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => confirmReactivation(true)}
                        style={{ width: '100%', padding: '1rem' }}
                      >
                        <strong>Reativar nas turmas originais</strong>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => confirmReactivation(false)}
                        style={{ width: '100%', padding: '1rem' }}
                      >
                        <strong>Continuar e escolher novas turmas</strong>
                      </button>
                    )}

                    {classAvailability.originalClassesAvailable && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => confirmReactivation(false)}
                        style={{ width: '100%', padding: '1rem' }}
                      >
                        Escolher outras turmas
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={cancelReactivation}
                      style={{ width: '100%' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: '#e74c3c' }}>
                  Erro ao verificar disponibilidade. Tente novamente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
