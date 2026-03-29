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
  faCamera,
  faFutbol,
  faIdCard,
  faSpinner,
  faUser,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import { financialService } from '../services/financialService';
import { levelService } from '../services/levelService';
import { classService } from '../services/classService';
import { useQuickEditStore } from '../store/quickEditStore';
import type { Student } from '../types/studentTypes';
import type { Enrollment, Plan } from '../types/enrollmentTypes';
import type { Invoice } from '../types/financialTypes';
import type { Level } from '../types/levelTypes';
import type { Class } from '../types/classTypes';
import MakeupCreditsManager from '../components/MakeupCreditsManager';
import { EditEnrollmentModal } from './Enrollments';
import { getTemplates, applyVariables } from '../utils/whatsappTemplates';
import WhatsAppTemplatePicker from '../components/WhatsAppTemplatePicker';
import { tournamentService } from '../services/tournamentService';
import '../styles/StudentDetails.css';
import '../styles/ModernModal.css';
import '../components/ComprehensiveEnrollmentForm.css';

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

  // Edit enrollment modal
  const [showEditEnrollmentModal, setShowEditEnrollmentModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [editPlans, setEditPlans] = useState<Plan[]>([]);
  const [editClasses, setEditClasses] = useState<Class[]>([]);

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

  // FUT Card
  const [studentCard, setStudentCard] = useState<any>(null);
  const [showCardEditor, setShowCardEditor] = useState(false);
  const [cardForm, setCardForm] = useState({ player_name: '', position: 'JOG', overall: 70, stat_atk: 50, stat_def: 50, stat_saq: 50, stat_rec: 50, stat_blq: 50, stat_fin: 50, card_type: 'gold', photo: null as File | null });
  const [savingCard, setSavingCard] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [cardPhotoPreview, setCardPhotoPreview] = useState<string | null>(null);
  const cardPhotoRef = useRef<HTMLInputElement>(null);

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

      // Load FUT card
      tournamentService.getStudentCard(parseInt(id!)).then(res => {
        const card = res.data || null;
        setStudentCard(card);
        if (card) {
          setCardForm({
            player_name: card.player_name, position: card.position || 'JOG', overall: card.overall ?? 70,
            stat_atk: card.stat_atk ?? 50, stat_def: card.stat_def ?? 50, stat_saq: card.stat_saq ?? 50,
            stat_rec: card.stat_rec ?? 50, stat_blq: card.stat_blq ?? 50, stat_fin: card.stat_fin ?? 50,
            card_type: card.card_type || 'gold', photo: null,
          });
        }
      }).catch(() => setStudentCard(null));

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

  // --- Edit enrollment handler ---

  const handleOpenEditEnrollment = async (enrollment: Enrollment) => {
    try {
      const [plansRes, classesRes] = await Promise.all([
        enrollmentService.getPlans(),
        classService.getClasses({ status: 'ativa' }),
      ]);
      const plansSuccess = (plansRes as any).status === 'success' || (plansRes as any).success === true;
      const plansData = (plansRes as any).data || (plansRes as any).plans;
      if (plansSuccess && plansData) setEditPlans(plansData);
      if (classesRes.status === 'success') setEditClasses(classesRes.data);
      setEditingEnrollment(enrollment);
      setShowEditEnrollmentModal(true);
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
      toast.error('Erro ao abrir edição de matrícula');
    }
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

  const CARD_BG_MAP: Record<string, string> = {
    gold: '/fut-cards/large-rare-gold.png', silver: '/fut-cards/large-rare-silver.png',
    bronze: '/fut-cards/large-rare-bronze.png', toty: '/fut-cards/large-toty.png',
    legend: '/fut-cards/large-legend.png', hero: '/fut-cards/large-hero.png',
  };
  const CARD_TEXT_MAP: Record<string, string> = {
    gold: '#4a3b10', silver: '#3a3a3a', bronze: '#3e2415', toty: '#d4af37', legend: '#B39428', hero: '#fff',
  };

  const handleCardPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show original immediately
    setCardPhotoPreview(URL.createObjectURL(file));
    setCardForm(f => ({ ...f, photo: file }));

    // Remove background with AI
    setRemovingBg(true);
    try {
      const mod = await import(/* @vite-ignore */ 'https://esm.sh/@imgly/background-removal@1.5.5');
      const removeBg = mod.removeBackground || mod.default;
      if (removeBg) {
        const blob = await removeBg(file, { output: { format: 'image/png' } });
        const noBgFile = new File([blob], 'card-no-bg.png', { type: 'image/png' });
        setCardPhotoPreview(URL.createObjectURL(blob));
        setCardForm(f => ({ ...f, photo: noBgFile }));
        toast.success('Fundo removido!');
      }
    } catch (err) {
      console.error('Erro ao remover fundo:', err);
      toast.error('Nao foi possivel remover o fundo. Usando foto original.');
    }
    setRemovingBg(false);
  };

  const handleSaveCard = async () => {
    if (!cardForm.player_name.trim()) { toast.error('Nome obrigatorio'); return; }
    setSavingCard(true);
    try {
      const fd = new FormData();
      fd.append('player_name', cardForm.player_name.trim());
      fd.append('position', cardForm.position);
      fd.append('overall', String(cardForm.overall));
      fd.append('stat_atk', String(cardForm.stat_atk));
      fd.append('stat_def', String(cardForm.stat_def));
      fd.append('stat_saq', String(cardForm.stat_saq));
      fd.append('stat_rec', String(cardForm.stat_rec));
      fd.append('stat_blq', String(cardForm.stat_blq));
      fd.append('stat_fin', String(cardForm.stat_fin));
      fd.append('card_type', cardForm.card_type);
      if (cardForm.photo) fd.append('photo', cardForm.photo);
      const res = await tournamentService.upsertStudentCard(parseInt(id!), fd);
      setStudentCard(res.data);
      setShowCardEditor(false);
      toast.success(studentCard ? 'Card atualizado!' : 'Card criado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar card');
    } finally { setSavingCard(false); }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Remover card deste aluno?')) return;
    try {
      await tournamentService.deleteStudentCard(parseInt(id!));
      setStudentCard(null);
      toast.success('Card removido');
    } catch { toast.error('Erro ao remover card'); }
  };

  const renderFutCardPreview = (card: any, size = 200) => {
    const bg = CARD_BG_MAP[card.card_type] || CARD_BG_MAP.gold;
    const c = CARD_TEXT_MAP[card.card_type] || CARD_TEXT_MAP.gold;
    const h = size * 1.5;
    const scale = size / 200;
    return (
      <div style={{ width: size, height: h, position: 'relative', backgroundImage: `url(${bg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', fontFamily: "'Titillium Web', sans-serif" }}>
        <div style={{ position: 'absolute', top: 52*scale, left: 32*scale, fontSize: `${1.6*scale}rem`, fontWeight: 900, color: c, lineHeight: 1 }}>{card.overall}</div>
        <div style={{ position: 'absolute', top: 82*scale, left: 32*scale, fontSize: `${0.65*scale}rem`, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: 1, width: 30*scale, textAlign: 'center' }}>{card.position}</div>
        <div style={{ position: 'absolute', top: 40*scale, left: '50%', transform: 'translateX(-50%)', width: 100*scale, height: 100*scale, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {card.photo_url ? <img src={card.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : <FontAwesomeIcon icon={faUser} style={{ fontSize: `${2*scale}rem`, color: `${c}44`, marginBottom: 10*scale }} />}
        </div>
        <div style={{ position: 'absolute', top: 152*scale, left: 0, right: 0, fontSize: `${0.78*scale}rem`, fontWeight: 800, textTransform: 'uppercase', color: c, textAlign: 'center', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: `0 ${20*scale}px` }}>{card.player_name}</div>
        <div style={{ position: 'absolute', top: 172*scale, left: 30*scale, right: 30*scale, height: 1, background: `${c}44` }} />
        <div style={{ position: 'absolute', top: 178*scale, left: 25*scale, right: 25*scale, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 0' }}>
          {[{l:'ATK',v:card.stat_atk},{l:'DEF',v:card.stat_def},{l:'SAQ',v:card.stat_saq},{l:'REC',v:card.stat_rec},{l:'BLQ',v:card.stat_blq},{l:'FIN',v:card.stat_fin}].map(s => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 3*scale, justifyContent: 'center', padding: `${2*scale}px 0` }}>
              <span style={{ fontSize: `${0.85*scale}rem`, fontWeight: 800, color: c }}>{s.v}</span>
              <span style={{ fontSize: `${0.55*scale}rem`, fontWeight: 600, color: `${c}99`, textTransform: 'uppercase' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

          {/* FUT Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {studentCard ? (
              <div style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => { setShowCardEditor(true); }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                {renderFutCardPreview(studentCard, 140)}
              </div>
            ) : (
              <button onClick={() => { setCardForm({ ...cardForm, player_name: student.full_name }); setCardPhotoPreview(null); setShowCardEditor(true); }} style={{ padding: '8px 14px', borderRadius: 10, border: '2px dashed var(--border-color, #334155)', background: 'none', color: 'var(--text-muted, #64748b)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faIdCard} /> Criar Card
              </button>
            )}
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
                      onClick={() => handleOpenEditEnrollment(enrollment)}
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
        <div className="mm-overlay" onClick={() => setPayingInvoiceId(null)}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="mm-close" onClick={() => setPayingInvoiceId(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              <div className="mm-field">
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
              <div className="mm-field">
                <label>Data do Pagamento</label>
                <input
                  type="date"
                  value={paymentForm.paid_at}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paid_at: e.target.value }))}
                />
              </div>
              <div className="mm-field">
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
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setPayingInvoiceId(null)}>
                Cancelar
              </button>
              <button type="button" className="mm-btn mm-btn-primary" onClick={handleConfirmPayment} disabled={isSavingPayment}>
                {isSavingPayment ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      {showAdvanceModal && (
        <div className="mm-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Adiantar Pagamento</h2>
              <button type="button" className="mm-close" onClick={() => setShowAdvanceModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              {activeEnrollments.length > 1 && (
                <div className="mm-field">
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

              <div className="mm-field">
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
              <div className="mm-field">
                <label>Data do Pagamento</label>
                <input
                  type="date"
                  value={advanceForm.paid_at}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, paid_at: e.target.value }))}
                />
              </div>
              <div className="mm-field">
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
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowAdvanceModal(false)}>
                Cancelar
              </button>
              <button type="button" className="mm-btn mm-btn-primary" onClick={handleConfirmAdvance} disabled={isAdvancing}>
                {isAdvancing ? 'Processando...' : 'Gerar e Registrar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Class Modal */}
      {showAddToClassModal && (
        <div className="mm-overlay" onClick={() => setShowAddToClassModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Adicionar Aluno a Turmas</h2>
              <button type="button" className="mm-close" onClick={() => setShowAddToClassModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
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
            <div className="mm-footer">
              <button
                type="button"
                className="mm-btn mm-btn-secondary"
                onClick={() => {
                  setShowAddToClassModal(false);
                  setSelectedClasses([]);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mm-btn mm-btn-primary"
                onClick={handleAddToClasses}
                disabled={selectedClasses.length === 0 || isLoadingClasses}
              >
                Adicionar ({selectedClasses.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FUT Card Editor Modal */}
      {showCardEditor && (
        <div className="mm-overlay" onClick={() => setShowCardEditor(false)}>
          <div className="mm-modal mm-modal-md" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className="mm-header">
              <h3>{studentCard ? 'Editar Card' : 'Criar Card'}</h3>
              <button className="mm-close" onClick={() => setShowCardEditor(false)}>&times;</button>
            </div>
            <div className="mm-content" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {renderFutCardPreview({ ...cardForm, photo_url: cardPhotoPreview || studentCard?.photo_url }, 180)}
                <input type="file" ref={cardPhotoRef} accept="image/*" style={{ display: 'none' }} onChange={handleCardPhotoChange} />
                <button onClick={() => cardPhotoRef.current?.click()} disabled={removingBg} style={{ padding: '6px 14px', borderRadius: 8, border: '1px dashed var(--border-color, #334155)', background: 'none', color: '#F58A25', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', opacity: removingBg ? 0.5 : 1 }}>
                  <FontAwesomeIcon icon={faCamera} /> Foto
                </button>
                {removingBg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#F58A25', fontWeight: 600 }}>
                    <FontAwesomeIcon icon={faSpinner} spin /> Removendo fundo...
                  </div>
                )}
              </div>

              {/* Form */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="mm-field"><label>Nome</label><input value={cardForm.player_name} onChange={e => setCardForm(f => ({ ...f, player_name: e.target.value }))} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="mm-field" style={{ flex: 1 }}><label>Posicao</label><input value={cardForm.position} onChange={e => setCardForm(f => ({ ...f, position: e.target.value }))} maxLength={3} /></div>
                  <div className="mm-field" style={{ flex: 1 }}><label>Overall</label><input type="number" min={1} max={99} value={cardForm.overall} onChange={e => setCardForm(f => ({ ...f, overall: Number(e.target.value) }))} /></div>
                </div>

                <div className="mm-field"><label>Tipo</label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['gold','silver','bronze','toty','legend','hero'].map(t => (
                      <button key={t} onClick={() => setCardForm(f => ({ ...f, card_type: t }))} style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${cardForm.card_type === t ? '#F58A25' : 'var(--border-color, #334155)'}`, background: cardForm.card_type === t ? 'rgba(245,138,37,0.1)' : 'none', color: cardForm.card_type === t ? '#F58A25' : 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', fontFamily: 'inherit' }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="mm-field"><label>Atributos</label>
                  {[{k:'stat_atk',l:'ATK'},{k:'stat_def',l:'DEF'},{k:'stat_saq',l:'SAQ'},{k:'stat_rec',l:'REC'},{k:'stat_blq',l:'BLQ'},{k:'stat_fin',l:'FIN'}].map(s => (
                    <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 32, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{s.l}</span>
                      <input type="range" min={1} max={99} value={(cardForm as any)[s.k]} onChange={e => setCardForm(f => ({ ...f, [s.k]: Number(e.target.value) }))} style={{ flex: 1, accentColor: '#F58A25' }} />
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#F58A25' }}>{(cardForm as any)[s.k]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mm-footer">
              {studentCard && (
                <button className="mm-btn mm-btn-danger" onClick={handleDeleteCard} style={{ marginRight: 'auto' }}><FontAwesomeIcon icon={faTrash} /> Remover Card</button>
              )}
              <button className="mm-btn mm-btn-secondary" onClick={() => setShowCardEditor(false)}>Cancelar</button>
              <button className="mm-btn mm-btn-primary" onClick={handleSaveCard} disabled={savingCard || removingBg || !cardForm.player_name.trim()}>
                {savingCard ? 'Salvando...' : removingBg ? 'Aguarde a remocao do fundo...' : studentCard ? 'Salvar' : 'Criar Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {showEditEnrollmentModal && editingEnrollment && (
        <EditEnrollmentModal
          enrollment={editingEnrollment}
          plans={editPlans}
          classes={editClasses}
          onClose={() => {
            setShowEditEnrollmentModal(false);
            setEditingEnrollment(null);
          }}
          onSuccess={() => {
            setShowEditEnrollmentModal(false);
            setEditingEnrollment(null);
            fetchStudentData();
          }}
        />
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
