import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faCreditCard,
  faCoins,
  faCalendarDays,
  faPenToSquare,
  faArrowLeft,
  faXmark,
  faCheckCircle,
  faBan,
  faEye,
  faUserPlus,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import { financialService } from '../services/financialService';
import { levelService } from '../services/levelService';
import { classService } from '../services/classService';
import { useQuickEditStore } from '../store/quickEditStore';
import type { Student } from '../types/studentTypes';
import type { Enrollment } from '../types/enrollmentTypes';
import type { Invoice } from '../types/financialTypes';
import type { Level } from '../types/levelTypes';
import type { Class } from '../types/classTypes';
import MakeupCreditsManager from '../components/MakeupCreditsManager';
import { getTemplates, applyVariables } from '../utils/whatsappTemplates';
import WhatsAppTemplatePicker from '../components/WhatsAppTemplatePicker';
import '../styles/StudentDetails.css';

const translatePaymentMethod = (method?: string): string => {
  const map: Record<string, string> = {
    pix: 'PIX',
    cartao: 'Cartão',
    dinheiro: 'Dinheiro',
    boleto: 'Boleto',
    outro: 'Outro',
  };
  return method ? map[method] || method : '--';
};

const translateStatus = (status: string): string => {
  const map: Record<string, string> = {
    aberta: 'Aberta',
    paga: 'Paga',
    vencida: 'Vencida',
    cancelada: 'Cancelada',
    estornada: 'Estornada',
  };
  return map[status] || status;
};

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openQuickEdit, isOpen: quickEditOpen } = useQuickEditStore();

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para adicionar aluno a turma
  const [showAddToClassModal, setShowAddToClassModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Registrar Pagamento
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix' as string,
    amount_cents: 0,
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Adiantar Pagamento
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceEnrollmentId, setAdvanceEnrollmentId] = useState<number | null>(null);
  const [advanceForm, setAdvanceForm] = useState({
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix' as string,
    amount_cents: 0,
  });
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Financial stats
  const [financialStats, setFinancialStats] = useState({
    saldo_devedor: 0,
    creditos: 0,
    proximo_vencimento: null as Date | null,
    valor_proximo_vencimento: 0,
  });

  // Refresh data when QuickEdit modal closes
  const wasQuickEditOpen = useRef(false);
  useEffect(() => {
    if (wasQuickEditOpen.current && !quickEditOpen) {
      fetchStudentData();
    }
    wasQuickEditOpen.current = quickEditOpen;
  }, [quickEditOpen]);

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);

      const [studentRes, enrollmentsRes, invoicesRes, levelsRes] = await Promise.all([
        studentService.getStudentById(parseInt(id!)),
        enrollmentService.getEnrollments({ student_id: parseInt(id!) }),
        financialService.getInvoices({ student_id: parseInt(id!) }),
        levelService.getLevels(),
      ]);

      if (studentRes.status === 'success' && studentRes.data) {
        setStudent(studentRes.data);
      }

      if (enrollmentsRes.status === 'success') {
        const enrollmentsWithMappedClasses = enrollmentsRes.data.map((enrollment: any) => {
          let classesArray = enrollment.classes;
          if (typeof classesArray === 'string') {
            try { classesArray = JSON.parse(classesArray); } catch { classesArray = null; }
          }
          if (classesArray && Array.isArray(classesArray) && classesArray.length > 0) {
            const weekdayMap: Record<string, string> = {
              'seg': 'Segunda', 'ter': 'Terça', 'qua': 'Quarta',
              'qui': 'Quinta', 'sex': 'Sexta', 'sab': 'Sábado', 'dom': 'Domingo'
            };
            return {
              ...enrollment,
              class_ids: classesArray.map((c: any) => c.class_id),
              class_names: classesArray.map((c: any) => c.class_name || `Turma ${c.class_id}`),
              class_details: classesArray.map((c: any) => ({
                id: c.class_id,
                name: c.class_name,
                weekday: weekdayMap[c.weekday] || c.weekday,
                time: c.start_time ? c.start_time.slice(0, 5) : '',
                modality: c.modality
              }))
            };
          }
          return enrollment;
        });
        setEnrollments(enrollmentsWithMappedClasses);
      }

      if (invoicesRes.status === 'success') {
        const inv = Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : (invoicesRes.data as any)?.invoices || [];
        setInvoices(inv);
        calculateFinancialStats(inv);
      }

      if (levelsRes.status === 'success') {
        setLevels(levelsRes.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do aluno:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinancialStats = (invoicesList: Invoice[]) => {
    const overdue = invoicesList.filter(
      (inv) => inv.status === 'vencida' || (inv.status === 'aberta' && new Date(inv.due_date) < new Date())
    );
    const saldo_devedor = overdue.reduce((sum, inv) => sum + inv.final_amount_cents, 0);

    const upcoming = invoicesList
      .filter((inv) => inv.status === 'aberta' && new Date(inv.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    setFinancialStats({
      saldo_devedor,
      creditos: 0,
      proximo_vencimento: upcoming ? new Date(upcoming.due_date) : null,
      valor_proximo_vencimento: upcoming?.final_amount_cents || 0,
    });
  };

  // --- Add to class handlers ---

  const handleOpenAddToClassModal = async () => {
    const activeEnrollment = enrollments.find(e => e.status === 'ativa');
    if (!activeEnrollment) {
      toast.error('Este aluno não possui matrícula ativa. Crie uma matrícula primeiro.');
      return;
    }

    try {
      setIsLoadingClasses(true);
      setShowAddToClassModal(true);
      const classesRes = await classService.getClasses({ status: 'ativa' });
      if (classesRes.status === 'success') {
        const currentClassIds = activeEnrollment.class_ids || [];
        const available = classesRes.data.filter(
          (cls) => !currentClassIds.includes(cls.id)
        );
        setAvailableClasses(available);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast.error('Erro ao buscar turmas disponíveis');
      setShowAddToClassModal(false);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleAddToClasses = async () => {
    if (selectedClasses.length === 0) {
      toast.error('Selecione pelo menos uma turma');
      return;
    }
    const activeEnrollment = enrollments.find(e => e.status === 'ativa');
    if (!activeEnrollment) {
      toast.error('Matrícula ativa não encontrada');
      return;
    }

    try {
      const currentClassIds = activeEnrollment.class_ids || [];
      const updatedClassIds = [...currentClassIds, ...selectedClasses];
      const response = await enrollmentService.updateEnrollmentClasses(
        activeEnrollment.id,
        { class_ids: updatedClassIds }
      );
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(`Aluno adicionado a ${selectedClasses.length} turma(s) com sucesso!`);
        setShowAddToClassModal(false);
        setSelectedClasses([]);
        fetchStudentData();
      } else {
        toast.error(response.message || 'Erro ao adicionar aluno às turmas');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar às turmas:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao adicionar aluno às turmas');
    }
  };

  const handleToggleClass = (classId: number) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((cid) => cid !== classId) : [...prev, classId]
    );
  };

  // --- Register payment handlers ---

  const handleStartPayment = (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    setPaymentForm({
      paid_at: new Date().toISOString().split('T')[0],
      method: 'pix',
      amount_cents: invoice.final_amount_cents - (invoice.paid_amount_cents || 0),
    });
  };

  const handleConfirmPayment = async () => {
    if (!payingInvoiceId) return;
    setIsSavingPayment(true);
    try {
      const response = await financialService.registerPayment({
        invoice_id: payingInvoiceId,
        paid_at: paymentForm.paid_at,
        method: paymentForm.method as any,
        amount_cents: paymentForm.amount_cents,
      });
      if (response.status === 'success') {
        toast.success('Pagamento registrado!');
        setPayingInvoiceId(null);
        fetchStudentData();
      } else {
        toast.error(response.message || 'Erro ao registrar pagamento');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // --- Cancel invoice handler ---

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) return;
    try {
      const response = await financialService.cancelInvoice(invoiceId);
      if (response.status === 'success') {
        toast.success('Fatura cancelada!');
        fetchStudentData();
      } else {
        toast.error(response.message || 'Erro ao cancelar fatura');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao cancelar fatura');
    }
  };

  // --- Advance payment handlers ---

  const getNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  };

  const getNextMonthLabel = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleOpenAdvanceModal = () => {
    const active = enrollments.filter(e => e.status === 'ativa');
    if (active.length === 0) {
      toast.error('Nenhuma matrícula ativa encontrada');
      return;
    }
    const first = active[0];
    setAdvanceEnrollmentId(first.id);
    setAdvanceForm({
      paid_at: new Date().toISOString().split('T')[0],
      method: 'pix',
      amount_cents: first.plan_price_cents || 0,
    });
    setShowAdvanceModal(true);
  };

  const handleAdvanceEnrollmentChange = (enrollmentId: number) => {
    setAdvanceEnrollmentId(enrollmentId);
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (enrollment) {
      setAdvanceForm(prev => ({
        ...prev,
        amount_cents: enrollment.plan_price_cents || 0,
      }));
    }
  };

  const handleConfirmAdvance = async () => {
    if (!advanceEnrollmentId) return;
    setIsAdvancing(true);
    const referenceMonth = getNextMonth();

    try {
      // 1. Generate invoices for next month
      try {
        await financialService.generateInvoices({ reference_month: referenceMonth });
      } catch (err: any) {
        // Ignore - invoice may already exist
        console.log('Generate invoices:', err?.response?.data?.message || 'OK');
      }

      // 2. Re-fetch invoices to find the generated one
      const invoicesRes = await financialService.getInvoices({ student_id: parseInt(id!) });
      let allInvoices: Invoice[] = [];
      if (invoicesRes.status === 'success') {
        allInvoices = Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : (invoicesRes.data as any)?.invoices || [];
      }

      // 3. Find invoice for this enrollment + next month
      const targetInvoice = allInvoices.find(
        inv => inv.enrollment_id === advanceEnrollmentId && inv.reference_month === referenceMonth
      );

      if (!targetInvoice) {
        toast.error('Não foi possível encontrar a fatura do próximo mês');
        setIsAdvancing(false);
        return;
      }

      if (targetInvoice.status === 'paga') {
        toast.error('A fatura do próximo mês já está paga');
        setIsAdvancing(false);
        return;
      }

      // 4. Register payment
      const payResponse = await financialService.registerPayment({
        invoice_id: targetInvoice.id,
        paid_at: advanceForm.paid_at,
        method: advanceForm.method as any,
        amount_cents: advanceForm.amount_cents,
      });

      if (payResponse.status === 'success') {
        toast.success('Pagamento adiantado registrado com sucesso!');
        setShowAdvanceModal(false);
        fetchStudentData();
      } else {
        toast.error(payResponse.message || 'Erro ao registrar pagamento');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao processar adiantamento');
    } finally {
      setIsAdvancing(false);
    }
  };

  // --- WhatsApp handlers ---

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const sendWhatsApp = (message: string) => {
    if (!student) return;
    const phone = student.phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const valorMensalidade = formatCurrency(financialStats.valor_proximo_vencimento);
    const vencimento = financialStats.proximo_vencimento?.toLocaleDateString('pt-BR') || 'em breve';
    const refMonth = financialStats.proximo_vencimento
      ? financialStats.proximo_vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : '';

    const applied = applyVariables(message, {
      firstName: student.full_name.split(' ')[0],
      fullName: student.full_name,
      amount: valorMensalidade,
      dueDate: vencimento,
      referenceMonth: refMonth,
    });

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(applied)}`, '_blank');
  };

  const handleWhatsAppClick = () => {
    if (!student) return;
    const templates = getTemplates();
    if (templates.length === 1) {
      sendWhatsApp(templates[0].message);
    } else {
      setShowTemplatePicker(true);
    }
  };

  // --- Helpers ---

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <p>Aluno não encontrado</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/alunos')}>
          Voltar para alunos
        </button>
      </div>
    );
  }

  const currentLevel = student.level_id
    ? levels.find((l) => l.id === student.level_id)
    : null;

  const activeEnrollments = enrollments.filter(e => e.status === 'ativa');

  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  return (
    <div className="student-details">
      {/* Header */}
      <div className="student-header">
        <button type="button" className="btn-back" onClick={() => navigate('/alunos')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>

        <div className="student-header-content">
          <div className="student-avatar-section">
            <div className="student-avatar-large">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="student-info">
              <h1>{student.full_name}</h1>
              <div className="student-meta">
                <span className={`status-badge status-${student.status}`}>
                  {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                {currentLevel && (
                  <span className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                    {currentLevel.name}
                  </span>
                )}
              </div>
              <p className="student-subtitle">
                {student.birth_date && `${calculateAge(student.birth_date)} anos`}
                {student.gender && ` | ${student.gender === 'M' ? 'Masculino' : student.gender === 'F' ? 'Feminino' : 'Outro'}`}
                {student.responsible_name && ` | Responsável: ${student.responsible_name}`}
              </p>
            </div>
          </div>

          <div className="student-header-actions">
            <div className="wtp-wrapper">
              <button
                type="button"
                className="btn-whatsapp"
                onClick={handleWhatsAppClick}
                title="Enviar mensagem de cobrança"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="whatsapp-icon" />
                WHATSAPP
              </button>
              {showTemplatePicker && (
                <WhatsAppTemplatePicker
                  onSelect={(message) => {
                    setShowTemplatePicker(false);
                    sendWhatsApp(message);
                  }}
                  onClose={() => setShowTemplatePicker(false)}
                />
              )}
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openQuickEdit(student.id)}
            >
              <FontAwesomeIcon icon={faPenToSquare} /> EDITAR
            </button>
          </div>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="financial-cards">
        <div className="financial-card financial-card-danger">
          <div className="financial-card-icon">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <div className="financial-card-content">
            <p className="financial-card-label">Saldo devedor</p>
            <h2 className="financial-card-value">{formatCurrency(financialStats.saldo_devedor)}</h2>
          </div>
        </div>

        <div className="financial-card financial-card-success">
          <div className="financial-card-icon">
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <div className="financial-card-content">
            <p className="financial-card-label">Créditos</p>
            <h2 className="financial-card-value">{formatCurrency(financialStats.creditos)}</h2>
          </div>
        </div>

        <div className="financial-card financial-card-warning">
          <div className="financial-card-icon">
            <FontAwesomeIcon icon={faCalendarDays} />
          </div>
          <div className="financial-card-content">
            <p className="financial-card-label">Próx. vencimento</p>
            <h2 className="financial-card-value">
              {financialStats.proximo_vencimento?.toLocaleDateString('pt-BR') || '--'}
            </h2>
            {financialStats.valor_proximo_vencimento > 0 && (
              <p className="financial-card-subtitle">
                {formatCurrency(financialStats.valor_proximo_vencimento)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="student-content-grid">
        {/* Enrollments Section */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Matrículas</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-sm btn-card-action"
                onClick={handleOpenAddToClassModal}
                title="Adicionar aluno a uma turma"
              >
                <FontAwesomeIcon icon={faUserPlus} /> Turma
              </button>
              <button
                type="button"
                className="btn-sm btn-card-action"
                onClick={() => navigate('/matriculas')}
                title="Ver todas as matrículas"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Ver todas
              </button>
            </div>
          </div>
          <div className="content-card-body">
            {enrollments.length === 0 ? (
              <p className="empty-state">Nenhuma matrícula encontrada</p>
            ) : (
              <div className="enrollments-list">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="enrollment-item">
                    <div className="enrollment-header">
                      <h4>{enrollment.plan_name}</h4>
                      <span className={`status-badge status-${enrollment.status}`}>
                        {enrollment.status}
                      </span>
                    </div>
                    <div className="enrollment-details">
                      <p>
                        <strong>Início:</strong> {new Date(enrollment.start_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                      {enrollment.end_date && (
                        <p>
                          <strong>Fim:</strong> {new Date(enrollment.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <p>
                        <strong>Vencimento:</strong> Dia {enrollment.due_day}
                      </p>
                      {enrollment.class_details && enrollment.class_details.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <strong>Turmas:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                            {enrollment.class_details.map((c: any) => (
                              <span
                                key={c.id}
                                style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}
                              >
                                {c.weekday} {c.time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-sm btn-secondary"
                      onClick={() => navigate(`/matriculas?student=${student.id}`)}
                    >
                      Editar matrícula
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Info Section */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Informações Pessoais</h3>
          </div>
          <div className="content-card-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{student.email || '--'}</p>
              </div>
              <div className="info-item">
                <label>Telefone</label>
                <p>{student.phone || '--'}</p>
              </div>
              <div className="info-item">
                <label>CPF</label>
                <p>{student.cpf || '--'}</p>
              </div>
              <div className="info-item">
                <label>Data de Nascimento</label>
                <p>{student.birth_date ? new Date(student.birth_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</p>
              </div>
              <div className="info-item">
                <label>Endereço</label>
                <p>{student.address || '--'}</p>
              </div>
              <div className="info-item">
                <label>Nível Atual</label>
                <p>
                  {currentLevel ? (
                    <span className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                      {currentLevel.name}
                    </span>
                  ) : (
                    '--'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Makeup Credits Section */}
        <div className="content-card content-card-full">
          <MakeupCreditsManager studentId={parseInt(id!)} studentName={student.full_name} />
        </div>

        {/* Invoices Section - Expanded */}
        <div className="content-card content-card-full">
          <div className="content-card-header">
            <h3>Histórico Financeiro</h3>
            <div className="financial-header-actions">
              <button
                type="button"
                className="btn-sm btn-advance"
                onClick={handleOpenAdvanceModal}
              >
                Adiantar Pagamento
              </button>
              <button
                type="button"
                className="btn-sm btn-primary"
                onClick={() => navigate(`/financeiro?student_id=${student.id}`)}
              >
                Ver completo
              </button>
            </div>
          </div>
          <div className="content-card-body">
            {invoices.length === 0 ? (
              <p className="empty-state">Nenhuma fatura encontrada</p>
            ) : (
              <div className="invoices-table-container">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Referência</th>
                      <th>Plano</th>
                      <th>Vencimento</th>
                      <th>Valor Bruto</th>
                      <th>Desconto</th>
                      <th>Valor Final</th>
                      <th>Pago</th>
                      <th>Método</th>
                      <th>Pago em</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.reference_month}</td>
                        <td>{invoice.plan_name || '--'}</td>
                        <td>{new Date(invoice.due_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td>{formatCurrency(invoice.amount_cents)}</td>
                        <td>{invoice.discount_cents ? formatCurrency(invoice.discount_cents) : '--'}</td>
                        <td><strong>{formatCurrency(invoice.final_amount_cents)}</strong></td>
                        <td>{invoice.paid_amount_cents ? formatCurrency(invoice.paid_amount_cents) : '--'}</td>
                        <td>{translatePaymentMethod(invoice.payment_method)}</td>
                        <td>{invoice.paid_at ? new Date(invoice.paid_at.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}</td>
                        <td>
                          <span className={`status-badge status-${invoice.status}`}>
                            {translateStatus(invoice.status)}
                          </span>
                        </td>
                        <td>
                          <div className="invoice-actions">
                            {(invoice.status === 'aberta' || invoice.status === 'vencida') && (
                              <>
                                <button
                                  type="button"
                                  className="btn-sm btn-success"
                                  onClick={() => handleStartPayment(invoice)}
                                  title="Registrar pagamento"
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} /> Pagar
                                </button>
                                <button
                                  type="button"
                                  className="btn-sm btn-danger"
                                  onClick={() => handleCancelInvoice(invoice.id)}
                                  title="Cancelar fatura"
                                >
                                  <FontAwesomeIcon icon={faBan} /> Cancelar
                                </button>
                              </>
                            )}
                            {invoice.status === 'paga' && (
                              <button
                                type="button"
                                className="btn-sm btn-primary"
                                onClick={() => navigate(`/financeiro?student_id=${student.id}`)}
                                title="Ver no financeiro"
                              >
                                <FontAwesomeIcon icon={faEye} /> Ver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Payment Modal */}
      {payingInvoiceId && (
        <div className="modal-overlay" onClick={() => setPayingInvoiceId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setPayingInvoiceId(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(paymentForm.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setPaymentForm(prev => ({
                    ...prev,
                    amount_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                  }))}
                />
              </div>
              <div className="form-group">
                <label>Data do Pagamento</label>
                <input
                  type="date"
                  value={paymentForm.paid_at}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paid_at: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Método</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setPayingInvoiceId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmPayment} disabled={isSavingPayment}>
                {isSavingPayment ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      {showAdvanceModal && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adiantar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowAdvanceModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              {activeEnrollments.length > 1 && (
                <div className="form-group">
                  <label>Matrícula</label>
                  <select
                    value={advanceEnrollmentId || ''}
                    onChange={(e) => handleAdvanceEnrollmentChange(parseInt(e.target.value))}
                  >
                    {activeEnrollments.map(enr => (
                      <option key={enr.id} value={enr.id}>
                        {enr.plan_name} — {formatCurrency(enr.plan_price_cents || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeEnrollments.length === 1 && (
                <div className="advance-info-box">
                  <p><strong>Plano:</strong> {activeEnrollments[0].plan_name}</p>
                  <p><strong>Valor do plano:</strong> {formatCurrency(activeEnrollments[0].plan_price_cents || 0)}</p>
                </div>
              )}

              <div className="advance-info-box advance-info-highlight">
                <p><strong>Mês de referência:</strong> {getNextMonthLabel()}</p>
              </div>

              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(advanceForm.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setAdvanceForm(prev => ({
                    ...prev,
                    amount_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                  }))}
                />
              </div>
              <div className="form-group">
                <label>Data do Pagamento</label>
                <input
                  type="date"
                  value={advanceForm.paid_at}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, paid_at: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Método</label>
                <select
                  value={advanceForm.method}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, method: e.target.value }))}
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAdvanceModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmAdvance} disabled={isAdvancing}>
                {isAdvancing ? 'Processando...' : 'Gerar e Registrar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Class Modal */}
      {showAddToClassModal && (
        <div className="modal-overlay" onClick={() => setShowAddToClassModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Adicionar Aluno a Turmas</h2>
              <button type="button" className="modal-close" onClick={() => setShowAddToClassModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              {isLoadingClasses ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Carregando turmas disponíveis...</p>
                </div>
              ) : availableClasses.length === 0 ? (
                <p className="empty-state">
                  Nenhuma turma disponível. O aluno já está matriculado em todas as turmas ativas.
                </p>
              ) : (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#666' }}>
                    Selecione as turmas para adicionar o aluno:
                  </p>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {availableClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        style={{
                          padding: '1rem',
                          marginBottom: '0.5rem',
                          border: selectedClasses.includes(cls.id) ? '2px solid #4CAF50' : '1px solid #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedClasses.includes(cls.id) ? '#f0f8f0' : '#fff',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                              {cls.name || `${cls.modality_name} - ${cls.weekday}`}
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                              <p style={{ margin: '0.25rem 0' }}>
                                <strong>Modalidade:</strong> {cls.modality_name}
                              </p>
                              <p style={{ margin: '0.25rem 0' }}>
                                <strong>Horário:</strong> {getWeekdayName(cls.weekday)} às {cls.start_time}
                                {cls.end_time && ` - ${cls.end_time}`}
                              </p>
                              {cls.location && (
                                <p style={{ margin: '0.25rem 0' }}>
                                  <strong>Local:</strong> {cls.location}
                                </p>
                              )}
                              {cls.allowed_levels && cls.allowed_levels.length > 0 && (
                                <p style={{ margin: '0.25rem 0' }}>
                                  <strong>Nível:</strong> {cls.allowed_levels.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={{ marginLeft: '1rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedClasses.includes(cls.id)}
                              onChange={() => handleToggleClass(cls.id)}
                              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddToClassModal(false);
                  setSelectedClasses([]);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddToClasses}
                disabled={selectedClasses.length === 0 || isLoadingClasses}
              >
                Adicionar ({selectedClasses.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeekdayName(weekday: string): string {
  const weekdays: { [key: string]: string } = {
    seg: 'Segunda',
    ter: 'Terça',
    qua: 'Quarta',
    qui: 'Quinta',
    sex: 'Sexta',
    sab: 'Sábado',
    dom: 'Domingo',
  };
  return weekdays[weekday] || weekday;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
