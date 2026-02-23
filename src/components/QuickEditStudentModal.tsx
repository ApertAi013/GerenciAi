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
import type { Student, UpdateStudentRequest } from '../types/studentTypes';
import type { Enrollment, Plan } from '../types/enrollmentTypes';
import type { Invoice, RegisterPaymentRequest } from '../types/financialTypes';
import type { Level } from '../types/levelTypes';
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
  const [activeTab, setActiveTab] = useState<'dados' | 'matricula' | 'financeiro'>('dados');
  const [isSaving, setIsSaving] = useState(false);

  // Student edit
  const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
  const [hasStudentChanges, setHasStudentChanges] = useState(false);

  // Enrollment edit
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState<{ due_day?: number; status?: string; plan_id?: number }>({});

  // Payment inline
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<{ paid_at: string; method: string; amount_cents: number }>({
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix',
    amount_cents: 0,
  });

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
    setEnrollmentForm({
      due_day: enrollment.due_day,
      status: enrollment.status,
      plan_id: enrollment.plan_id,
    });
    // Lazy load plans
    if (plans.length === 0) {
      try {
        const res = await planService.getPlans();
        if (res.plans) setPlans(res.plans);
      } catch { /* ignore */ }
    }
  };

  const handleSaveEnrollment = async () => {
    if (!editingEnrollmentId) return;
    setIsSaving(true);
    try {
      const response = await enrollmentService.updateEnrollment(editingEnrollmentId, {
        due_day: enrollmentForm.due_day,
        status: enrollmentForm.status as any,
        plan_id: enrollmentForm.plan_id,
      });
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Matrícula atualizada!');
        setEditingEnrollmentId(null);
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

  const handleWhatsApp = () => {
    if (!student) return;
    const phone = (student.phone || '').replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const overdueInvoices = invoices.filter((i) => i.status === 'vencida' || (i.status === 'aberta' && new Date(i.due_date) < new Date()));
    const nextInvoice = invoices
      .filter((i) => i.status === 'aberta' && new Date(i.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    const targetInvoice = overdueInvoices[0] || nextInvoice;

    const valorStr = targetInvoice ? formatCurrency(targetInvoice.final_amount_cents) : '';
    const vencStr = targetInvoice ? formatDate(targetInvoice.due_date) : 'em breve';

    const savedTemplate = localStorage.getItem('gerenciai_whatsapp_template');
    let message: string;
    if (savedTemplate) {
      const firstName = student.full_name.split(' ')[0];
      message = savedTemplate
        .replace(/\[Nome\]/g, firstName)
        .replace(/\[NomeCompleto\]/g, student.full_name)
        .replace(/\[Valor\]/g, valorStr)
        .replace(/\[Vencimento\]/g, vencStr);
    } else {
      message = `Olá ${student.full_name.split(' ')[0]}!\n\nPassando para lembrar sobre sua mensalidade${valorStr ? ` de *${valorStr}*` : ''} com vencimento em *${vencStr}*.\n\nQualquer dúvida, estou à disposição!`;
    }
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
                  <button className="qe-btn-icon qe-btn-whatsapp" onClick={handleWhatsApp} title="WhatsApp">
                    <FontAwesomeIcon icon={faWhatsapp} />
                  </button>
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
                                    onChange={(e) => setEnrollmentForm((prev) => ({ ...prev, plan_id: parseInt(e.target.value) }))}
                                  >
                                    {plans.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price_cents)}</option>
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
    </div>
  );
}
