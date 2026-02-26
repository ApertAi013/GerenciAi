import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faXmark,
  faPenToSquare,
  faFloppyDisk,
  faBan,
  faChevronDown,
  faChevronUp,
  faArrowUpRightFromSquare,
  faCheck,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { useQuickEditStore } from '../store/quickEditStore';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import { financialService } from '../services/financialService';
import { levelService } from '../services/levelService';
import { planService } from '../services/planService';
import { classService } from '../services/classService';
import type { Student, UpdateStudentRequest } from '../types/studentTypes';
import type { Enrollment, Plan } from '../types/enrollmentTypes';
import type { Invoice, RegisterPaymentRequest } from '../types/financialTypes';
import type { Level } from '../types/levelTypes';
import type { Class } from '../types/classTypes';
import { getTemplates, applyVariables } from '../utils/whatsappTemplates';
import WhatsAppTemplatePicker from './WhatsAppTemplatePicker';
import '../styles/QuickEditStudentModal.css';

const weekdayMap: Record<string, string> = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua',
  qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatDate = (dateStr: string) =>
  new Date(dateStr.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR');

export default function QuickEditStudentModal() {
  const navigate = useNavigate();
  const { isOpen, studentId, closeQuickEdit } = useQuickEditStore();

  // Core data
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dados' | 'matricula' | 'turmas' | 'financeiro'>('dados');
  const [isSaving, setIsSaving] = useState(false);

  // Student edit
  const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
  const [hasStudentChanges, setHasStudentChanges] = useState(false);

  // Enrollment edit
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState<{ due_day?: number; status?: string; plan_id?: number; class_ids?: number[] }>({});
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [originalPlanId, setOriginalPlanId] = useState<number | null>(null);

  // Enrollment confirmation modals
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);

  // Payment inline
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<{ paid_at: string; method: string; amount_cents: number }>({
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix',
    amount_cents: 0,
  });

  // Turmas tab
  const [turmasEditingId, setTurmasEditingId] = useState<number | null>(null);
  const [turmasClassIds, setTurmasClassIds] = useState<number[]>([]);
  const [isSavingTurmas, setIsSavingTurmas] = useState(false);

  // Financial stats
  const [showFullHistory, setShowFullHistory] = useState(false);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeQuickEdit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeQuickEdit]);

  // Fetch data when opened
  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setActiveTab('dados');
    setEditingEnrollmentId(null);
    setPayingInvoiceId(null);
    setShowFullHistory(false);

    try {
      const [studentRes, enrollmentsRes, invoicesRes, levelsRes] = await Promise.all([
        studentService.getStudentById(studentId),
        enrollmentService.getEnrollments({ student_id: studentId }),
        financialService.getInvoices({ student_id: studentId }),
        levelService.getLevels(),
      ]);

      if (studentRes.status === 'success' && studentRes.data) {
        setStudent(studentRes.data);
        setEditForm({
          full_name: studentRes.data.full_name,
          email: studentRes.data.email,
          phone: studentRes.data.phone || '',
          cpf: studentRes.data.cpf,
          birth_date: studentRes.data.birth_date?.split('T')[0] || '',
          level_id: studentRes.data.level_id || undefined,
          status: studentRes.data.status,
        });
        setHasStudentChanges(false);
      }

      if (enrollmentsRes.status === 'success') {
        const mapped = enrollmentsRes.data.map((enrollment: any) => {
          let classesArray = enrollment.classes;
          if (typeof classesArray === 'string') {
            try { classesArray = JSON.parse(classesArray); } catch { classesArray = null; }
          }
          if (classesArray && Array.isArray(classesArray) && classesArray.length > 0) {
            return {
              ...enrollment,
              class_ids: classesArray.map((c: any) => c.class_id),
              class_names: classesArray.map((c: any) => c.class_name || `Turma ${c.class_id}`),
              class_details: classesArray.map((c: any) => ({
                id: c.class_id,
                name: c.class_name,
                weekday: weekdayMap[c.weekday] || c.weekday,
                time: c.start_time ? c.start_time.slice(0, 5) : '',
              })),
            };
          }
          return enrollment;
        });
        setEnrollments(mapped);
      }

      if (invoicesRes.status === 'success') {
        const inv = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data?.invoices || [];
        setInvoices(inv);
      }

      if (levelsRes.status === 'success') {
        setLevels(levelsRes.data);
      }
    } catch (error) {
      console.error('QuickEdit: erro ao buscar dados', error);
      toast.error('Erro ao carregar dados do aluno');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isOpen && studentId) fetchData();
  }, [isOpen, studentId, fetchData]);

  // -- Handlers --

  const handleEditField = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setHasStudentChanges(true);
  };

  const handleSaveStudent = async () => {
    if (!student || !hasStudentChanges) return;
    setIsSaving(true);
    try {
      const payload: any = { ...editForm };
      const response = await studentService.updateStudent(student.id, payload);
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Dados do aluno atualizados!');
        await fetchData();
      } else {
        toast.error((response as any).message || 'Erro ao salvar');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar dados do aluno');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditEnrollment = async (enrollment: Enrollment) => {
    setEditingEnrollmentId(enrollment.id);
    setOriginalPlanId(enrollment.plan_id);
    setEnrollmentForm({
      due_day: enrollment.due_day,
      status: enrollment.status,
      plan_id: enrollment.plan_id,
      class_ids: enrollment.class_ids || [],
    });
    // Lazy load plans
    if (plans.length === 0) {
      try {
        const res = await planService.getPlans();
        if (res.data) setPlans(res.data);
      } catch { /* ignore */ }
    }
    // Lazy load classes
    if (!classesLoaded) {
      try {
        const res = await classService.getClasses({ status: 'ativa', limit: 1000 });
        if (res.data) setAllClasses(Array.isArray(res.data) ? res.data : res.data.classes || []);
        setClassesLoaded(true);
      } catch { /* ignore */ }
    }
  };

  const handleSaveEnrollment = async () => {
    if (!editingEnrollmentId) return;

    const currentEnrollment = enrollments.find(e => e.id === editingEnrollmentId);
    if (!currentEnrollment) return;

    const planChanged = enrollmentForm.plan_id !== currentEnrollment.plan_id;
    const statusChangedToCancelled = enrollmentForm.status === 'cancelada' && currentEnrollment.status !== 'cancelada';

    // Validate class count matches sessions_per_week when plan changed
    if (planChanged) {
      const selectedPlan = plans.find(p => p.id === enrollmentForm.plan_id);
      if (selectedPlan && (enrollmentForm.class_ids || []).length !== selectedPlan.sessions_per_week) {
        toast.error(`O plano ${selectedPlan.name} requer ${selectedPlan.sessions_per_week} turma(s). Você selecionou ${(enrollmentForm.class_ids || []).length}.`);
        return;
      }
    }

    const payload: any = {
      due_day: enrollmentForm.due_day,
      status: enrollmentForm.status as any,
      plan_id: enrollmentForm.plan_id,
    };

    // Send class_ids when plan changed
    if (planChanged && enrollmentForm.class_ids) {
      payload.class_ids = enrollmentForm.class_ids;
    }

    const statusReactivated = enrollmentForm.status === 'ativa' &&
      (currentEnrollment.status === 'cancelada' || currentEnrollment.status === 'suspensa');

    // Show plan change modal
    if (planChanged) {
      setPendingSavePayload(payload);
      setShowPlanChangeModal(true);
      return;
    }

    // Show cancel modal
    if (statusChangedToCancelled) {
      setPendingSavePayload(payload);
      setShowCancelModal(true);
      return;
    }

    // Show reactivation modal
    if (statusReactivated) {
      setPendingSavePayload(payload);
      setShowReactivationModal(true);
      return;
    }

    await executeSaveEnrollment(payload);
  };

  const closeAllModals = () => {
    setShowPlanChangeModal(false);
    setShowCancelModal(false);
    setShowReactivationModal(false);
    setPendingSavePayload(null);
  };

  const executeSaveEnrollment = async (payload: any, generateInvoice?: 'now' | 'next_month') => {
    setIsSaving(true);
    try {
      const response = await enrollmentService.updateEnrollment(editingEnrollmentId!, payload);
      if ((response as any).status === 'success' || (response as any).success === true) {
        // Generate invoice on reactivation if requested
        if (generateInvoice === 'now') {
          try {
            await enrollmentService.generateFirstInvoice({ enrollment_id: editingEnrollmentId!, invoice_type: 'full' });
            toast.success('Matrícula atualizada e fatura gerada!');
          } catch (invErr: any) {
            const msg = invErr?.response?.data?.message || '';
            if (msg.includes('já existe') || msg.includes('Já existe')) {
              toast.success('Matrícula atualizada! Já existe fatura para este período.');
            } else {
              toast.success('Matrícula atualizada! Erro ao gerar fatura.');
            }
          }
        } else {
          toast.success(generateInvoice === 'next_month' ? 'Matrícula reativada! Cobrança no próximo mês.' : 'Matrícula atualizada!');
        }
        setEditingEnrollmentId(null);
        closeAllModals();
        await fetchData();
      } else {
        toast.error((response as any).message || 'Erro ao salvar matrícula');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar matrícula');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChangeChoice = async (updateInvoices: boolean, refundAndRegenerate: boolean = false) => {
    if (!pendingSavePayload) return;
    const payload = { ...pendingSavePayload, update_open_invoices: updateInvoices, refund_and_regenerate: refundAndRegenerate };

    // Check if also cancelling or reactivating
    const currentEnrollment = enrollments.find(e => e.id === editingEnrollmentId);
    const statusChangedToCancelled = payload.status === 'cancelada' && currentEnrollment?.status !== 'cancelada';
    const statusReactivated = payload.status === 'ativa' &&
      (currentEnrollment?.status === 'cancelada' || currentEnrollment?.status === 'suspensa');

    if (statusChangedToCancelled) {
      setPendingSavePayload(payload);
      setShowPlanChangeModal(false);
      setShowCancelModal(true);
      return;
    }
    if (statusReactivated) {
      setPendingSavePayload(payload);
      setShowPlanChangeModal(false);
      setShowReactivationModal(true);
      return;
    }

    await executeSaveEnrollment(payload);
  };

  const handleCancelChoice = async (cancelInvoices: boolean) => {
    if (!pendingSavePayload) return;
    await executeSaveEnrollment({ ...pendingSavePayload, cancel_invoices: cancelInvoices });
  };

  const handleReactivationChoice = async (invoiceOption: 'now' | 'due_day' | 'next_month') => {
    if (!pendingSavePayload) return;
    await executeSaveEnrollment(pendingSavePayload, invoiceOption === 'next_month' ? 'next_month' : 'now');
  };

  // -- Turmas tab handlers --

  const handleOpenTurmasEdit = async (enrollment: Enrollment) => {
    setTurmasEditingId(enrollment.id);
    setTurmasClassIds(enrollment.class_ids || []);
    // Lazy load classes + plans
    if (!classesLoaded) {
      try {
        const res = await classService.getClasses({ status: 'ativa', limit: 1000 });
        if (res.data) setAllClasses(Array.isArray(res.data) ? res.data : res.data.classes || []);
        setClassesLoaded(true);
      } catch { /* ignore */ }
    }
    if (plans.length === 0) {
      try {
        const res = await planService.getPlans();
        if (res.data) setPlans(res.data);
      } catch { /* ignore */ }
    }
  };

  const handleTurmasClassToggle = (classId: number, sessionsPerWeek: number) => {
    if (turmasClassIds.includes(classId)) {
      setTurmasClassIds(prev => prev.filter(id => id !== classId));
    } else {
      if (turmasClassIds.length >= sessionsPerWeek) {
        toast.error(`O plano permite apenas ${sessionsPerWeek} turma(s)`);
        return;
      }
      setTurmasClassIds(prev => [...prev, classId]);
    }
  };

  const handleSaveTurmas = async () => {
    if (!turmasEditingId) return;
    setIsSavingTurmas(true);
    try {
      const res = await enrollmentService.updateEnrollmentClasses(turmasEditingId, { class_ids: turmasClassIds });
      if ((res as any).status === 'success' || (res as any).success === true) {
        toast.success('Turmas atualizadas!');
        setTurmasEditingId(null);
        await fetchData();
      } else {
        toast.error((res as any).message || 'Erro ao atualizar turmas');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar turmas');
    } finally {
      setIsSavingTurmas(false);
    }
  };

  const getFilteredClassesForEnrollment = (enrollment: Enrollment) => {
    const plan = plans.find(p => p.id === enrollment.plan_id);
    let filtered = allClasses.filter(c => c.status === 'ativa');
    if (plan?.modality_id) {
      filtered = filtered.filter(c => c.modality_id === plan.modality_id);
    }
    const studentLevel = student?.level_name || (student as any)?.level;
    if (studentLevel) {
      filtered = filtered.filter(c => {
        let lvls = c.allowed_levels;
        if (!lvls || lvls.length === 0) return true;
        if (typeof lvls === 'string') {
          try { lvls = JSON.parse(lvls as any); } catch { return true; }
        }
        if (!Array.isArray(lvls) || lvls.length === 0) return true;
        return lvls.includes(studentLevel);
      });
    }
    return filtered;
  };

  const handleStartPayment = (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    setPaymentForm({
      paid_at: new Date().toISOString().split('T')[0],
      method: 'pix',
      amount_cents: invoice.final_amount_cents,
    });
  };

  const handleConfirmPayment = async () => {
    if (!payingInvoiceId) return;
    setIsSaving(true);
    try {
      const payload: RegisterPaymentRequest = {
        invoice_id: payingInvoiceId,
        paid_at: paymentForm.paid_at,
        method: paymentForm.method as any,
        amount_cents: paymentForm.amount_cents,
      };
      const response = await financialService.registerPayment(payload);
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Pagamento registrado!');
        setPayingInvoiceId(null);
        await fetchData();
      } else {
        toast.error((response as any).message || 'Erro ao registrar pagamento');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setIsSaving(false);
    }
  };

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const sendWhatsApp = (message: string) => {
    if (!student) return;
    const phone = (student.phone || '').replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const overdueInvoices = invoices.filter((i) => i.status === 'vencida' || (i.status === 'aberta' && new Date(i.due_date) < new Date()));
    const nextInv = invoices
      .filter((i) => i.status === 'aberta' && new Date(i.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    const targetInvoice = overdueInvoices[0] || nextInv;

    const applied = applyVariables(message, {
      firstName: student.full_name.split(' ')[0],
      fullName: student.full_name,
      amount: targetInvoice ? formatCurrency(targetInvoice.final_amount_cents) : '',
      dueDate: targetInvoice ? formatDate(targetInvoice.due_date) : 'em breve',
      referenceMonth: targetInvoice?.reference_month || '',
    });
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(applied)}`, '_blank');
  };

  const handleWhatsApp = () => {
    if (!student) return;
    const templates = getTemplates();
    if (templates.length === 1) {
      sendWhatsApp(templates[0].message);
    } else {
      setShowTemplatePicker(true);
    }
  };

  const handleGoToFullPage = () => {
    if (studentId) navigate(`/alunos/${studentId}`);
    closeQuickEdit();
  };

  // -- Computed --

  const saldoDevedor = invoices
    .filter((i) => i.status === 'vencida' || (i.status === 'aberta' && new Date(i.due_date) < new Date()))
    .reduce((sum, i) => sum + i.final_amount_cents, 0);

  const nextInvoice = invoices
    .filter((i) => i.status === 'aberta' && new Date(i.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const currentLevel = student && student.level_id
    ? levels.find((l) => l.id === student.level_id)
    : null;

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // Filter classes for enrollment editing
  const getFilteredClasses = () => {
    const selectedPlan = plans.find(p => p.id === enrollmentForm.plan_id);
    let filtered = allClasses.filter(c => c.status === 'ativa');
    // Filter by plan modality
    if (selectedPlan?.modality_id) {
      filtered = filtered.filter(c => c.modality_id === selectedPlan.modality_id);
    }
    // Filter by student level
    const studentLevel = student?.level_name || (student as any)?.level;
    if (studentLevel) {
      filtered = filtered.filter(c => {
        let levels = c.allowed_levels;
        if (!levels || levels.length === 0) return true;
        if (typeof levels === 'string') {
          try { levels = JSON.parse(levels as any); } catch { return true; }
        }
        if (!Array.isArray(levels) || levels.length === 0) return true;
        return levels.includes(studentLevel);
      });
    }
    return filtered;
  };

  const handleClassToggle = (classId: number) => {
    const current = enrollmentForm.class_ids || [];
    const selectedPlan = plans.find(p => p.id === enrollmentForm.plan_id);
    if (current.includes(classId)) {
      setEnrollmentForm(prev => ({ ...prev, class_ids: current.filter(id => id !== classId) }));
    } else {
      if (selectedPlan && current.length >= selectedPlan.sessions_per_week) {
        toast.error(`O plano permite apenas ${selectedPlan.sessions_per_week} turma(s)`);
        return;
      }
      setEnrollmentForm(prev => ({ ...prev, class_ids: [...current, classId] }));
    }
  };

  const weekdayFull: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
    qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
  };

  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );
  const displayInvoices = showFullHistory ? sortedInvoices : sortedInvoices.slice(0, 8);

  // -- Render --

  if (!isOpen || !studentId) return null;

  return (
    <div className="qe-overlay" onClick={closeQuickEdit}>
      <div className="qe-modal" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className="qe-loading">
            <div className="qe-spinner" />
            <p>Carregando...</p>
          </div>
        ) : !student ? (
          <div className="qe-loading">
            <p>Aluno não encontrado</p>
            <button className="qe-btn qe-btn-secondary" onClick={closeQuickEdit}>Fechar</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="qe-header">
              <div className="qe-header-left">
                <div className="qe-avatar">
                  {getInitials(student.full_name)}
                </div>
                <div className="qe-header-info">
                  <h2 className="qe-name">{student.full_name}</h2>
                  <div className="qe-badges">
                    <span className={`qe-badge qe-badge-${student.status}`}>
                      {student.status === 'ativo' ? 'Ativo' : student.status === 'inativo' ? 'Inativo' : 'Pendente'}
                    </span>
                    {currentLevel && (
                      <span className="qe-badge qe-badge-level" style={{ backgroundColor: currentLevel.color }}>
                        {currentLevel.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="qe-header-actions">
                {student.phone && (
                  <div className="wtp-wrapper">
                    <button className="qe-btn-icon qe-btn-whatsapp" onClick={handleWhatsApp} title="WhatsApp">
                      <FontAwesomeIcon icon={faWhatsapp} />
                    </button>
                    {showTemplatePicker && (
                      <WhatsAppTemplatePicker
                        onSelect={(message) => {
                          setShowTemplatePicker(false);
                          sendWhatsApp(message);
                        }}
                        onClose={() => setShowTemplatePicker(false)}
                        position="above"
                      />
                    )}
                  </div>
                )}
                <button className="qe-btn-icon" onClick={handleGoToFullPage} title="Ver página completa">
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                </button>
                <button className="qe-btn-icon qe-btn-close" onClick={closeQuickEdit}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="qe-tabs">
              <button
                className={`qe-tab ${activeTab === 'dados' ? 'qe-tab-active' : ''}`}
                onClick={() => setActiveTab('dados')}
              >
                Dados
              </button>
              <button
                className={`qe-tab ${activeTab === 'matricula' ? 'qe-tab-active' : ''}`}
                onClick={() => setActiveTab('matricula')}
              >
                Matrícula {enrollments.filter((e) => e.status === 'ativa').length > 0 && (
                  <span className="qe-tab-count">{enrollments.filter((e) => e.status === 'ativa').length}</span>
                )}
              </button>
              <button
                className={`qe-tab ${activeTab === 'turmas' ? 'qe-tab-active' : ''}`}
                onClick={() => setActiveTab('turmas')}
              >
                Turmas
              </button>
              <button
                className={`qe-tab ${activeTab === 'financeiro' ? 'qe-tab-active' : ''}`}
                onClick={() => setActiveTab('financeiro')}
              >
                Financeiro {saldoDevedor > 0 && <span className="qe-tab-count qe-tab-count-danger">!</span>}
              </button>
            </div>

            {/* Content */}
            <div className="qe-content">
              {/* TAB: DADOS */}
              {activeTab === 'dados' && (
                <div className="qe-tab-content">
                  <div className="qe-form-grid">
                    <div className="qe-field">
                      <label>Nome completo</label>
                      <input
                        type="text"
                        value={editForm.full_name || ''}
                        onChange={(e) => handleEditField('full_name', e.target.value)}
                      />
                    </div>
                    <div className="qe-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleEditField('email', e.target.value)}
                      />
                    </div>
                    <div className="qe-field">
                      <label>Telefone</label>
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={(e) => handleEditField('phone', e.target.value)}
                      />
                    </div>
                    <div className="qe-field">
                      <label>CPF</label>
                      <input
                        type="text"
                        value={editForm.cpf || ''}
                        onChange={(e) => handleEditField('cpf', e.target.value)}
                      />
                    </div>
                    <div className="qe-field">
                      <label>Data de Nascimento</label>
                      <input
                        type="date"
                        value={editForm.birth_date || ''}
                        onChange={(e) => handleEditField('birth_date', e.target.value)}
                      />
                    </div>
                    <div className="qe-field">
                      <label>Nível</label>
                      <select
                        value={editForm.level_id || ''}
                        onChange={(e) => handleEditField('level_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      >
                        <option value="">Selecione</option>
                        {levels.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="qe-field">
                      <label>Status</label>
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => handleEditField('status', e.target.value)}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="pendente">Pendente</option>
                      </select>
                    </div>
                  </div>

                  {hasStudentChanges && (
                    <div className="qe-save-bar">
                      <button className="qe-btn qe-btn-primary" onClick={handleSaveStudent} disabled={isSaving}>
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        {isSaving ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MATRÍCULA */}
              {activeTab === 'matricula' && (
                <div className="qe-tab-content">
                  {enrollments.length === 0 ? (
                    <div className="qe-empty">Nenhuma matrícula encontrada</div>
                  ) : (
                    <div className="qe-enrollment-list">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className={`qe-enrollment-card ${enrollment.status !== 'ativa' ? 'qe-enrollment-inactive' : ''}`}>
                          {editingEnrollmentId === enrollment.id ? (
                            // Edit mode
                            <div className="qe-enrollment-edit">
                              <div className="qe-form-grid">
                                <div className="qe-field">
                                  <label>Plano</label>
                                  <select
                                    value={enrollmentForm.plan_id || ''}
                                    onChange={(e) => {
                                      const newPlanId = parseInt(e.target.value);
                                      setEnrollmentForm((prev) => ({
                                        ...prev,
                                        plan_id: newPlanId,
                                        class_ids: newPlanId !== originalPlanId ? [] : prev.class_ids,
                                      }));
                                    }}
                                  >
                                    {plans.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price_cents)} ({p.sessions_per_week}x/sem)</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="qe-field">
                                  <label>Dia Vencimento</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={enrollmentForm.due_day || ''}
                                    onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, due_day: parseInt(e.target.value) }))}
                                  />
                                </div>
                                <div className="qe-field">
                                  <label>Status</label>
                                  <select
                                    value={enrollmentForm.status || ''}
                                    onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, status: e.target.value }))}
                                  >
                                    <option value="ativa">Ativa</option>
                                    <option value="suspensa">Suspensa</option>
                                    <option value="cancelada">Cancelada</option>
                                  </select>
                                </div>
                              </div>

                              {/* Class selector - shown when plan changes */}
                              {enrollmentForm.plan_id !== originalPlanId && (() => {
                                const selectedPlan = plans.find(p => p.id === enrollmentForm.plan_id);
                                const filtered = getFilteredClasses();
                                const grouped = filtered.reduce((acc, cls) => {
                                  if (!acc[cls.weekday]) acc[cls.weekday] = [];
                                  acc[cls.weekday].push(cls);
                                  return acc;
                                }, {} as Record<string, Class[]>);
                                const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

                                return (
                                  <div className="qe-class-selector">
                                    <label>
                                      Selecionar Turmas
                                      {selectedPlan && (
                                        <span className="qe-class-count">
                                          {' '}({(enrollmentForm.class_ids || []).length}/{selectedPlan.sessions_per_week})
                                        </span>
                                      )}
                                    </label>
                                    <div className="qe-class-list">
                                      {weekdays.map(day => {
                                        const dayClasses = grouped[day];
                                        if (!dayClasses || dayClasses.length === 0) return null;
                                        return (
                                          <div key={day} className="qe-class-group">
                                            <div className="qe-class-day">{weekdayFull[day]}</div>
                                            {dayClasses.map(cls => {
                                              const isSelected = (enrollmentForm.class_ids || []).includes(cls.id);
                                              const isFull = (cls.enrolled_count || 0) >= cls.capacity;
                                              return (
                                                <div
                                                  key={cls.id}
                                                  className={`qe-class-item ${isSelected ? 'qe-class-item-selected' : ''} ${isFull && !isSelected ? 'qe-class-item-full' : ''}`}
                                                  onClick={() => !isFull || isSelected ? handleClassToggle(cls.id) : null}
                                                >
                                                  <div className="qe-class-item-info">
                                                    <span className="qe-class-item-name">{cls.name || cls.modality_name}</span>
                                                    <span className="qe-class-item-time">
                                                      {cls.start_time?.slice(0, 5)}{cls.end_time ? ` - ${cls.end_time.slice(0, 5)}` : ''}
                                                      {' · '}{cls.enrolled_count || 0}/{cls.capacity}
                                                    </span>
                                                  </div>
                                                  <span className={`qe-class-check ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected ? '✓' : isFull ? 'Lotada' : ''}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="qe-enrollment-actions">
                                <button className="qe-btn qe-btn-primary qe-btn-sm" onClick={handleSaveEnrollment} disabled={isSaving}>
                                  <FontAwesomeIcon icon={faFloppyDisk} /> {isSaving ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button className="qe-btn qe-btn-secondary qe-btn-sm" onClick={() => setEditingEnrollmentId(null)}>
                                  <FontAwesomeIcon icon={faBan} /> Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <>
                              <div className="qe-enrollment-header">
                                <div>
                                  <h4 className="qe-enrollment-plan">{enrollment.plan_name || 'Plano'}</h4>
                                  <span className={`qe-badge qe-badge-${enrollment.status}`}>{enrollment.status}</span>
                                </div>
                                <button
                                  className="qe-btn-icon qe-btn-sm"
                                  onClick={() => handleStartEditEnrollment(enrollment)}
                                  title="Editar matrícula"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                              </div>
                              <div className="qe-enrollment-details">
                                <div className="qe-enrollment-meta">
                                  <span>Vencimento: dia <strong>{enrollment.due_day}</strong></span>
                                  <span>Início: {formatDate(enrollment.start_date)}</span>
                                  {enrollment.discount_type && enrollment.discount_type !== 'none' && (
                                    <span className="qe-discount-badge">
                                      Desconto: {enrollment.discount_type === 'fixed'
                                        ? formatCurrency(enrollment.discount_value || 0)
                                        : `${enrollment.discount_value}%`}
                                    </span>
                                  )}
                                </div>
                                {enrollment.class_details && enrollment.class_details.length > 0 && (
                                  <div className="qe-class-badges">
                                    {enrollment.class_details.map((c: any) => (
                                      <span key={c.id} className="qe-class-badge">{c.weekday} {c.time}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: TURMAS */}
              {activeTab === 'turmas' && (
                <div className="qe-tab-content">
                  {enrollments.filter(e => e.status === 'ativa').length === 0 ? (
                    <div className="qe-empty">Nenhuma matrícula ativa para trocar turmas</div>
                  ) : (
                    <div className="qe-enrollment-list">
                      {enrollments.filter(e => e.status === 'ativa').map((enrollment) => {
                        const isEditing = turmasEditingId === enrollment.id;
                        const plan = plans.find(p => p.id === enrollment.plan_id);
                        const sessionsPerWeek = plan?.sessions_per_week || enrollment.sessions_per_week || 1;

                        return (
                          <div key={enrollment.id} className="qe-enrollment-card">
                            <div className="qe-enrollment-header">
                              <div>
                                <h4 className="qe-enrollment-plan">{enrollment.plan_name || 'Plano'}</h4>
                                <span style={{ fontSize: '12px', color: '#737373' }}>
                                  {sessionsPerWeek}x/semana
                                </span>
                              </div>
                              {!isEditing && (
                                <button
                                  className="qe-btn qe-btn-primary qe-btn-sm"
                                  onClick={() => handleOpenTurmasEdit(enrollment)}
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} /> Trocar Turmas
                                </button>
                              )}
                            </div>

                            {/* Current classes */}
                            {!isEditing && enrollment.class_details && enrollment.class_details.length > 0 && (
                              <div className="qe-class-badges" style={{ marginTop: '10px' }}>
                                {enrollment.class_details.map((c: any) => (
                                  <span key={c.id} className="qe-class-badge">
                                    {c.name ? `${c.name} · ` : ''}{c.weekday} {c.time}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Edit mode */}
                            {isEditing && (() => {
                              const filtered = getFilteredClassesForEnrollment(enrollment);
                              const grouped = filtered.reduce((acc, cls) => {
                                if (!acc[cls.weekday]) acc[cls.weekday] = [];
                                acc[cls.weekday].push(cls);
                                return acc;
                              }, {} as Record<string, Class[]>);
                              const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

                              return (
                                <div style={{ marginTop: '12px' }}>
                                  <div className="qe-class-selector">
                                    <label>
                                      Selecionar Turmas
                                      <span className="qe-class-count">
                                        {' '}({turmasClassIds.length}/{sessionsPerWeek})
                                      </span>
                                    </label>
                                    <div className="qe-class-list">
                                      {weekdays.map(day => {
                                        const dayClasses = grouped[day];
                                        if (!dayClasses || dayClasses.length === 0) return null;
                                        return (
                                          <div key={day} className="qe-class-group">
                                            <div className="qe-class-day">{weekdayFull[day]}</div>
                                            {dayClasses.map(cls => {
                                              const isSelected = turmasClassIds.includes(cls.id);
                                              const isFull = (cls.enrolled_count || 0) >= cls.capacity;
                                              return (
                                                <div
                                                  key={cls.id}
                                                  className={`qe-class-item ${isSelected ? 'qe-class-item-selected' : ''} ${isFull && !isSelected ? 'qe-class-item-full' : ''}`}
                                                  onClick={() => !isFull || isSelected ? handleTurmasClassToggle(cls.id, sessionsPerWeek) : null}
                                                >
                                                  <div className="qe-class-item-info">
                                                    <span className="qe-class-item-name">{cls.name || cls.modality_name}</span>
                                                    <span className="qe-class-item-time">
                                                      {cls.start_time?.slice(0, 5)}{cls.end_time ? ` - ${cls.end_time.slice(0, 5)}` : ''}
                                                      {cls.location ? ` · ${cls.location}` : ''}
                                                      {' · '}{cls.enrolled_count || 0}/{cls.capacity}
                                                    </span>
                                                  </div>
                                                  <span className={`qe-class-check ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected ? '✓' : isFull ? 'Lotada' : ''}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                      {filtered.length === 0 && (
                                        <div className="qe-empty" style={{ padding: '16px' }}>Nenhuma turma disponível</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="qe-enrollment-actions" style={{ marginTop: '12px' }}>
                                    <button
                                      className="qe-btn qe-btn-primary qe-btn-sm"
                                      onClick={handleSaveTurmas}
                                      disabled={isSavingTurmas || turmasClassIds.length !== sessionsPerWeek}
                                    >
                                      <FontAwesomeIcon icon={faFloppyDisk} /> {isSavingTurmas ? 'Salvando...' : 'Salvar Turmas'}
                                    </button>
                                    <button
                                      className="qe-btn qe-btn-secondary qe-btn-sm"
                                      onClick={() => setTurmasEditingId(null)}
                                    >
                                      <FontAwesomeIcon icon={faBan} /> Cancelar
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: FINANCEIRO */}
              {activeTab === 'financeiro' && (
                <div className="qe-tab-content">
                  {/* Stats */}
                  <div className="qe-fin-stats">
                    <div className={`qe-fin-stat ${saldoDevedor > 0 ? 'qe-fin-stat-danger' : 'qe-fin-stat-ok'}`}>
                      <span className="qe-fin-stat-label">Saldo Devedor</span>
                      <span className="qe-fin-stat-value">{formatCurrency(saldoDevedor)}</span>
                    </div>
                    <div className="qe-fin-stat">
                      <span className="qe-fin-stat-label">Próx. Vencimento</span>
                      <span className="qe-fin-stat-value">
                        {nextInvoice ? formatDate(nextInvoice.due_date) : '—'}
                      </span>
                      {nextInvoice && (
                        <span className="qe-fin-stat-sub">{formatCurrency(nextInvoice.final_amount_cents)}</span>
                      )}
                    </div>
                  </div>

                  {/* Invoices */}
                  {invoices.length === 0 ? (
                    <div className="qe-empty">Nenhuma fatura encontrada</div>
                  ) : (
                    <>
                      <div className="qe-invoices">
                        {displayInvoices.map((invoice) => (
                          <div key={invoice.id} className="qe-invoice-row">
                            <div className="qe-invoice-info">
                              <span className="qe-invoice-ref">{invoice.reference_month}</span>
                              <span className="qe-invoice-date">{formatDate(invoice.due_date)}</span>
                              <span className="qe-invoice-amount">{formatCurrency(invoice.final_amount_cents)}</span>
                              <span className={`qe-badge qe-badge-${invoice.status}`}>{invoice.status}</span>
                            </div>
                            {(invoice.status === 'aberta' || invoice.status === 'vencida') && payingInvoiceId !== invoice.id && (
                              <button
                                className="qe-btn qe-btn-success qe-btn-sm"
                                onClick={() => handleStartPayment(invoice)}
                              >
                                <FontAwesomeIcon icon={faMoneyBillWave} /> Dar Baixa
                              </button>
                            )}
                            {payingInvoiceId === invoice.id && (
                              <div className="qe-payment-form">
                                <div className="qe-payment-fields">
                                  <input
                                    type="date"
                                    value={paymentForm.paid_at}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, paid_at: e.target.value }))}
                                  />
                                  <select
                                    value={paymentForm.method}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                                  >
                                    <option value="pix">PIX</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="outro">Outro</option>
                                  </select>
                                </div>
                                <div className="qe-payment-actions">
                                  <button className="qe-btn qe-btn-success qe-btn-sm" onClick={handleConfirmPayment} disabled={isSaving}>
                                    <FontAwesomeIcon icon={faCheck} /> {isSaving ? '...' : 'Confirmar'}
                                  </button>
                                  <button className="qe-btn qe-btn-secondary qe-btn-sm" onClick={() => setPayingInvoiceId(null)}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {sortedInvoices.length > 8 && (
                        <button
                          className="qe-toggle-history"
                          onClick={() => setShowFullHistory(!showFullHistory)}
                        >
                          <FontAwesomeIcon icon={showFullHistory ? faChevronUp : faChevronDown} />
                          {showFullHistory ? 'Mostrar menos' : `Ver histórico completo (${sortedInvoices.length})`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Plan Change Confirmation Modal */}
      {showPlanChangeModal && (
        <div className="qe-confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="qe-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qe-confirm-header">
              <h3>Alterar Plano</h3>
              <button className="qe-btn-icon qe-btn-close" onClick={closeAllModals}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <p className="qe-confirm-text">
              O plano desta matrícula será alterado. O que deseja fazer com as faturas em aberto?
            </p>
            <div className="qe-confirm-options">
              <button className="qe-confirm-btn qe-confirm-btn-primary" onClick={() => handlePlanChangeChoice(true)} disabled={isSaving}>
                <strong>Atualizar faturas em aberto</strong>
                <small>As faturas em aberto serão atualizadas com o novo valor do plano</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-secondary" onClick={() => handlePlanChangeChoice(false)} disabled={isSaving}>
                <strong>Manter faturas com valor antigo</strong>
                <small>As faturas em aberto manterão o valor antigo, apenas novas faturas terão o novo valor</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-danger" onClick={() => handlePlanChangeChoice(false, true)} disabled={isSaving}>
                <strong>Estornar fatura paga e gerar nova</strong>
                <small>A fatura paga do mês será estornada e uma nova será gerada com o novo valor</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-cancel" onClick={closeAllModals}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Enrollment Confirmation Modal */}
      {showCancelModal && (
        <div className="qe-confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="qe-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qe-confirm-header">
              <h3>Cancelar Matrícula</h3>
              <button className="qe-btn-icon qe-btn-close" onClick={closeAllModals}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <p className="qe-confirm-text">
              Você está cancelando esta matrícula. O que deseja fazer com as faturas em aberto?
            </p>
            <div className="qe-confirm-options">
              <button className="qe-confirm-btn qe-confirm-btn-danger" onClick={() => handleCancelChoice(true)} disabled={isSaving}>
                <strong>Cancelar faturas em aberto</strong>
                <small>As faturas em aberto serão canceladas junto com a matrícula</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-secondary" onClick={() => handleCancelChoice(false)} disabled={isSaving}>
                <strong>Manter faturas em aberto</strong>
                <small>As faturas em aberto continuarão ativas para cobrança</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-cancel" onClick={closeAllModals}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivation Confirmation Modal */}
      {showReactivationModal && (
        <div className="qe-confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="qe-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qe-confirm-header">
              <h3>Reativar Matrícula</h3>
              <button className="qe-btn-icon qe-btn-close" onClick={closeAllModals}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <p className="qe-confirm-text">
              A matrícula será reativada. Como deseja lidar com a cobrança?
            </p>
            <div className="qe-confirm-options">
              <button className="qe-confirm-btn qe-confirm-btn-primary" onClick={() => handleReactivationChoice('now')} disabled={isSaving}>
                <strong>Gerar fatura agora</strong>
                <small>Uma fatura será gerada imediatamente com vencimento hoje</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-secondary" onClick={() => handleReactivationChoice('due_day')} disabled={isSaving}>
                <strong>Gerar no dia de vencimento</strong>
                <small>A fatura será gerada com a data de vencimento normal da matrícula</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-secondary" onClick={() => handleReactivationChoice('next_month')} disabled={isSaving}>
                <strong>Cobrar a partir do próximo mês</strong>
                <small>Nenhuma fatura agora, cobrança começa no próximo ciclo</small>
              </button>
              <button className="qe-confirm-btn qe-confirm-btn-cancel" onClick={closeAllModals}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
