import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserPlus,
  faUserMinus,
  faMoneyBillWave,
  faReceipt,
  faCalendarCheck,
  faClock,
  faExclamationTriangle,
  faDollarSign,
  faChartLine,
  faArrowRight,
  faDumbbell,
  faUserGraduate,
  faCalendarDay,
  faMapMarkerAlt,
  faChevronDown,
  faChevronUp,
  faBullhorn,
  faPaperPlane,
  faTableTennis,
  faFilter,
  faTimes,
  faGift,
  faChevronLeft,
  faChevronRight as faChevronRightSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { financialService } from '../services/financialService';
import { classService } from '../services/classService';
import { enrollmentService } from '../services/enrollmentService';
import { studentService } from '../services/studentService';
import { levelService } from '../services/levelService';
import { rentalService } from '../services/rentalService';
import { announcementService } from '../services/announcementService';
import type { Announcement } from '../services/announcementService';
import { referralService } from '../services/referralService';
import ReferralModal from '../components/ReferralModal';
import type { Invoice } from '../types/financialTypes';
import type { Class, Modality } from '../types/classTypes';
import type { Enrollment } from '../types/enrollmentTypes';
import type { Level } from '../types/levelTypes';
import type { CourtRental } from '../types/rentalTypes';
import DashboardOnboardingTour from '../components/dashboard/DashboardOnboardingTour';
import '../styles/Dashboard.css';
import '../styles/ModernModal.css';

const DASHBOARD_ONBOARDING_KEY = 'dashboard_onboarding_completed';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatReais = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getLastMonths = (n: number) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    });
  }
  return months;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getProgressColor = (pct: number) => {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#10B981';
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getTodayWeekday = () => {
  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return days[new Date().getDay()];
};

const weekdayShort: Record<string, string> = {
  dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb',
};

interface StudentData {
  id: number;
  level_name?: string;
  level_id?: number;
  level?: string;
  status: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [rentals, setRentals] = useState<CourtRental[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Onboarding tour
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Filter state
  const [selectedModality, setSelectedModality] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Period filter helper
  const selectedMonths = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'previous': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return [`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`];
      }
      case '3m': return getLastMonths(3).map(m => m.key);
      case '6m': return getLastMonths(6).map(m => m.key);
      case '12m': return getLastMonths(12).map(m => m.key);
      case 'custom': {
        if (!customRange.start || !customRange.end) return [getCurrentMonth()];
        const months: string[] = [];
        const [sy, sm] = customRange.start.split('-').map(Number);
        const [ey, em] = customRange.end.split('-').map(Number);
        let d = new Date(sy, sm - 1, 1);
        const end = new Date(ey, em - 1, 1);
        while (d <= end) {
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
          d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        }
        return months.length > 0 ? months : [getCurrentMonth()];
      }
      default: return [getCurrentMonth()]; // 'current'
    }
  }, [selectedPeriod, customRange]);

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'previous': return 'Mês anterior';
      case '3m': return 'Últimos 3 meses';
      case '6m': return 'Últimos 6 meses';
      case '12m': return 'Últimos 12 meses';
      case 'custom': return customRange.start && customRange.end ? `${customRange.start} a ${customRange.end}` : 'Personalizado';
      default: {
        const now = new Date();
        return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
    }
  }, [selectedPeriod, customRange]);

  // Expand/collapse states
  const [vagasExpanded, setVagasExpanded] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [levelsExpanded, setLevelsExpanded] = useState(false);
  const [agendaExpanded, setAgendaExpanded] = useState(false);

  // Quick announcement form
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickType, setQuickType] = useState<'info' | 'warning' | 'urgent' | 'event'>('info');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announceSent, setAnnounceSent] = useState(false);
  const [announceError, setAnnounceError] = useState('');

  // Class students popup
  const [studentsPopup, setStudentsPopup] = useState<{
    className: string;
    schedule: string;
    students: { student_id: number; student_name: string; level_name?: string }[];
    loading: boolean;
  } | null>(null);

  // Referral carousel
  const [carouselSlide, setCarouselSlide] = useState(0);
  const [referralStats, setReferralStats] = useState({ clicks: 0, signups: 0, conversions: 0 });
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [carouselHovered, setCarouselHovered] = useState(false);

  // Redirect admin to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/monitoring', { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = getTodayKey();
      const [invoicesRes, classesRes, enrollmentsRes, modalitiesRes, studentsRes, levelsRes, rentalsRes] =
        await Promise.all([
          financialService.getInvoices(),
          classService.getClasses({ limit: 1000 }),
          enrollmentService.getEnrollments({}),
          classService.getModalities(),
          studentService.getStudents({ limit: 1000 }),
          levelService.getLevels(),
          rentalService.getRentals({ start_date: today, end_date: today }),
        ]);

      setInvoices(invoicesRes.data?.invoices || invoicesRes.data || []);
      setClasses(classesRes.data || []);
      setEnrollments(enrollmentsRes.data || []);
      setModalities(modalitiesRes.data || []);
      setStudents(studentsRes.data || []);
      setLevels(levelsRes.data || []);
      setRentals(rentalsRes.data || []);

      // Fetch de avisos separado para não quebrar o resto se falhar
      try {
        const announcementsRes = await announcementService.getAnnouncements(1, 5, true);
        setAnnouncements(announcementsRes.data?.announcements || []);
      } catch (e) {
        console.warn('Erro ao buscar avisos:', e);
      }

      // Fetch referral stats
      try {
        const refData = await referralService.getMyReferralCode();
        setReferralStats({ clicks: refData.clicks, signups: refData.signups, conversions: refData.conversions });
      } catch (e) {
        console.warn('Erro ao buscar dados de indicação:', e);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Carousel auto-slide (boas-vindas 2s, promos 8s) ──
  useEffect(() => {
    if (carouselHovered) return;
    const delay = carouselSlide === 0 ? 2000 : 8000;
    const timeout = setTimeout(() => {
      setCarouselSlide(prev => (prev + 1) % 3);
    }, delay);
    return () => clearTimeout(timeout);
  }, [carouselHovered, carouselSlide]);

  // ── Dashboard onboarding tour (first visit after onboarding) ──
  useEffect(() => {
    if (!isLoading) {
      const hasSeenOnboarding = localStorage.getItem(DASHBOARD_ONBOARDING_KEY);
      if (!hasSeenOnboarding) {
        const timer = setTimeout(() => setShowOnboarding(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading]);

  const handleOnboardingFinish = () => {
    localStorage.setItem(DASHBOARD_ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // ── Class IDs for selected modality ──
  const modalityClassIds = useMemo(() => {
    if (!selectedModality) return null;
    return new Set(classes.filter(c => c.modality_id === selectedModality).map(c => c.id));
  }, [classes, selectedModality]);

  // ── Filter enrollments by modality ──
  const filteredEnrollments = useMemo(() => {
    if (!modalityClassIds) return enrollments;
    return enrollments.filter(e => {
      // Check class_ids array if available
      const eClassIds = e.class_ids || [];
      if (eClassIds.length > 0) {
        return eClassIds.some(id => modalityClassIds.has(id));
      }
      // Fallback: check classes array (from backend JSON_ARRAYAGG)
      const eClasses = (e as any).classes;
      if (Array.isArray(eClasses)) {
        return eClasses.some((c: any) => modalityClassIds.has(c.class_id));
      }
      // Try parsing if it's a JSON string
      if (typeof eClasses === 'string') {
        try {
          const parsed = JSON.parse(eClasses);
          if (Array.isArray(parsed)) {
            return parsed.some((c: any) => modalityClassIds.has(c.class_id));
          }
        } catch { /* ignore */ }
      }
      return false;
    });
  }, [enrollments, modalityClassIds]);

  // ── Filter invoices by modality (via enrollment) ──
  const filteredInvoices = useMemo(() => {
    if (!modalityClassIds) return invoices;
    const filteredEnrollmentIds = new Set(filteredEnrollments.map(e => e.id));
    return invoices.filter(inv => {
      const eid = (inv as any).enrollment_id;
      return eid ? filteredEnrollmentIds.has(eid) : false;
    });
  }, [invoices, filteredEnrollments, modalityClassIds]);

  // ── Enrollment Stats ──
  const enrollmentStats = useMemo(() => {
    const ativas = filteredEnrollments.filter(e => e.status === 'ativa').length;
    const canceladas = filteredEnrollments.filter(e => {
      if (e.status !== 'cancelada') return false;
      const date = (e as any).updated_at || e.created_at || e.start_date;
      return date && selectedMonths.includes(date.substring(0, 7));
    }).length;
    const novas = filteredEnrollments.filter(e => {
      const date = e.created_at || e.start_date;
      return date && selectedMonths.includes(date.substring(0, 7));
    }).length;
    return { ativas, canceladas, novas };
  }, [filteredEnrollments, selectedMonths]);

  // ── Financial Stats (selected period) ──
  const financialStats = useMemo(() => {
    const srcInvoices = selectedModality ? filteredInvoices : invoices;
    const monthInvoices = srcInvoices.filter(inv => selectedMonths.includes(inv.reference_month) && inv.status !== 'cancelada' && inv.status !== 'estornada');

    const total = monthInvoices.reduce((s, inv) => {
      if (inv.status === 'paga') return s + Number(inv.paid_amount_cents || 0);
      return s + Number(inv.final_amount_cents || 0);
    }, 0);
    const totalCount = monthInvoices.length;

    const paid = monthInvoices.filter(inv => inv.status === 'paga');
    const paidTotal = paid.reduce((s, inv) => s + Number(inv.paid_amount_cents || inv.final_amount_cents || 0), 0);
    const paidCount = paid.length;

    const pending = monthInvoices.filter(inv => inv.status === 'aberta');
    const pendingTotal = pending.reduce((s, inv) => s + Number(inv.final_amount_cents || 0), 0);
    const pendingCount = pending.length;

    const overdue = monthInvoices.filter(inv => inv.status === 'vencida');
    const overdueTotal = overdue.reduce((s, inv) => s + Number(inv.final_amount_cents || 0), 0);
    const overdueCount = overdue.length;

    return {
      total, totalCount,
      paidTotal, paidCount,
      pendingTotal, pendingCount,
      overdueTotal, overdueCount,
      toReceive: pendingTotal + overdueTotal,
      toReceiveCount: pendingCount + overdueCount,
    };
  }, [invoices, filteredInvoices, selectedModality, selectedMonths]);

  // ── Chart Data (last 6 months) ──
  const chartData = useMemo(() => {
    const months = getLastMonths(6);
    const srcInvoices = selectedModality ? filteredInvoices : invoices;
    const srcEnrollments = selectedModality ? filteredEnrollments : enrollments;
    return months.map(({ key, label }) => {
      const mi = srcInvoices.filter(inv => inv.reference_month === key && inv.status !== 'cancelada' && inv.status !== 'estornada');
      const faturado = mi.reduce((s, inv) => {
        if (inv.status === 'paga') return s + Number(inv.paid_amount_cents || 0);
        return s + Number(inv.final_amount_cents || 0);
      }, 0) / 100;
      const recebido = mi
        .filter(inv => inv.status === 'paga')
        .reduce((s, inv) => s + Number(inv.paid_amount_cents || inv.final_amount_cents || 0), 0) / 100;
      const matriculas = srcEnrollments.filter(e => {
        const d = e.created_at || e.start_date;
        return d && d.substring(0, 7) === key;
      }).length;
      return {
        month: label.charAt(0).toUpperCase() + label.slice(1),
        faturado,
        recebido,
        matriculas,
      };
    });
  }, [invoices, enrollments, filteredInvoices, filteredEnrollments, selectedModality]);

  // ── Vagas Data (per turma, grouped by level) ──
  const vagasData = useMemo(() => {
    const activeClasses = classes
      .filter(c => c.status === 'ativa' && (c.capacity || 0) > 0)
      .filter(c => !selectedModality || c.modality_id === selectedModality)
      .map(c => ({
        id: c.id,
        name: c.name || c.modality_name || 'Turma',
        capacity: c.capacity || 0,
        enrolled: c.enrolled_count || 0,
        pct: (c.capacity || 0) > 0
          ? Math.round(((c.enrolled_count || 0) / (c.capacity || 0)) * 100)
          : 0,
        allowedLevels: c.allowed_levels || [],
        color: c.color,
        weekday: c.weekday,
        startTime: c.start_time?.substring(0, 5) || '',
        endTime: c.end_time?.substring(0, 5) || '',
      }))
      .sort((a, b) => b.pct - a.pct);

    const totalCap = activeClasses.reduce((s, c) => s + c.capacity, 0);
    const totalEnr = activeClasses.reduce((s, c) => s + c.enrolled, 0);
    const totalPct = totalCap > 0 ? Math.round((totalEnr / totalCap) * 100) : 0;

    // Group by primary level (each class in one group only)
    const groupMap = new Map<string, typeof activeClasses>();
    activeClasses.forEach(c => {
      const lvls = c.allowedLevels.length > 0 ? c.allowedLevels : ['Sem nível'];
      // Primary level: match class name to a level, or use first allowed level
      const primaryLevel = lvls.find(lvl => c.name.toLowerCase().includes(lvl.toLowerCase())) || lvls[0];
      if (!groupMap.has(primaryLevel)) groupMap.set(primaryLevel, []);
      groupMap.get(primaryLevel)!.push(c);
    });

    // Sort groups by level order
    const groups = Array.from(groupMap.entries())
      .map(([levelName, turmas]) => {
        const lvl = levels.find(l => l.name === levelName);
        const cap = turmas.reduce((s, t) => s + t.capacity, 0);
        const enr = turmas.reduce((s, t) => s + t.enrolled, 0);
        return {
          levelName,
          color: lvl?.color || '#6B7280',
          order: lvl?.order_index ?? 999,
          turmas,
          totalCap: cap,
          totalEnr: enr,
          pct: cap > 0 ? Math.round((enr / cap) * 100) : 0,
        };
      })
      .sort((a, b) => a.order - b.order);

    return { turmas: activeClasses, groups, totalCap, totalEnr, totalPct };
  }, [classes, levels, selectedModality]);

  // ── Alunos por Nível ──
  const levelsData = useMemo(() => {
    // When modality is filtered, only count students with active enrollments in that modality
    let relevantStudentIds: Set<number> | null = null;
    if (selectedModality && modalityClassIds) {
      relevantStudentIds = new Set<number>();
      filteredEnrollments
        .filter(e => e.status === 'ativa')
        .forEach(e => {
          if ((e as any).student_id) relevantStudentIds!.add((e as any).student_id);
        });
    }

    const activeStudents = students.filter((s: any) => {
      if (s.status !== 'ativo') return false;
      if (relevantStudentIds) return relevantStudentIds.has(s.id);
      return true;
    });

    const countByLevel = new Map<string, { count: number; color?: string }>();

    levels.forEach(lvl => {
      countByLevel.set(lvl.name, { count: 0, color: lvl.color || undefined });
    });

    activeStudents.forEach((s: any) => {
      const levelName = s.level_name || s.level || 'Sem nível';
      const existing = countByLevel.get(levelName);
      if (existing) {
        existing.count++;
      } else {
        countByLevel.set(levelName, { count: 1 });
      }
    });

    return Array.from(countByLevel.entries())
      .map(([name, { count, color }]) => {
        const lvl = levels.find(l => l.name === name);
        return {
          name,
          count,
          color: color || lvl?.color || '#6B7280',
          order: lvl?.order_index ?? 999,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [students, levels, selectedModality, modalityClassIds, filteredEnrollments]);

  // ── Mini Agenda (today) ──
  const todaySchedule = useMemo(() => {
    const weekday = getTodayWeekday();

    const todayClasses = classes
      .filter(c => c.weekday === weekday && c.status === 'ativa')
      .filter(c => !selectedModality || c.modality_id === selectedModality)
      .map(c => ({
        id: `class-${c.id}`,
        time: c.start_time.substring(0, 5),
        endTime: c.end_time?.substring(0, 5),
        title: c.name || c.modality_name || 'Turma',
        subtitle: c.location || '',
        type: 'turma' as const,
        capacity: `${c.enrolled_count || 0}/${c.capacity || 0}`,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    const todayRentals = rentals
      .filter(r => r.rental_date === getTodayKey())
      .map(r => ({
        id: `rental-${r.id}`,
        time: r.start_time.substring(0, 5),
        endTime: r.end_time.substring(0, 5),
        title: r.court_name,
        subtitle: r.renter_name,
        type: 'locacao' as const,
        capacity: '',
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return [...todayClasses, ...todayRentals].sort((a, b) => a.time.localeCompare(b.time));
  }, [classes, rentals, selectedModality]);

  // ── Overdue Invoices ──
  const overdueInvoices = useMemo(() =>
    invoices.filter(inv => inv.status === 'vencida'), [invoices]);

  const overdueDisplay = useMemo(() =>
    overdueInvoices
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5),
    [overdueInvoices]);

  const handleWhatsApp = (phone: string | undefined, name: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const formatted = clean.startsWith('55') ? clean : `55${clean}`;
    const tpl = localStorage.getItem('gerenciai_whatsapp_template')
      || 'Olá [Nome], tudo bem? Identificamos uma pendência financeira em seu cadastro. Por favor, entre em contato conosco para regularizar.';
    const first = name.split(' ')[0];
    const msg = tpl.replace(/\[Nome\]/g, first).replace(/\[NomeCompleto\]/g, name);
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleQuickAnnouncement = async () => {
    if (!quickTitle.trim() || !quickContent.trim()) return;
    setSendingAnnouncement(true);
    setAnnounceError('');
    setAnnounceSent(false);
    try {
      await announcementService.createAnnouncement({
        title: quickTitle.trim(),
        content: quickContent.trim(),
        type: quickType,
        target_type: 'all',
        starts_at: new Date().toISOString().slice(0, 16),
      });
      setQuickTitle('');
      setQuickContent('');
      setQuickType('info');
      setAnnounceSent(true);
      setTimeout(() => setAnnounceSent(false), 3000);
      // Recarregar avisos
      const res = await announcementService.getAnnouncements(1, 5, true);
      setAnnouncements(res.data?.announcements || []);
    } catch (error: any) {
      console.error('Erro ao enviar aviso:', error);
      setAnnounceError(error.response?.data?.message || 'Erro ao enviar aviso. Tente novamente.');
      setTimeout(() => setAnnounceError(''), 5000);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="dash-chart-tooltip">
        <p className="dash-chart-tooltip-title">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="dash-chart-tooltip-row" style={{ color: entry.color }}>
            <span className="dash-chart-tooltip-dot" style={{ background: entry.color }} />
            {entry.name}:{' '}
            <strong>
              {entry.name === 'Matrículas' ? entry.value : formatReais(entry.value)}
            </strong>
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Carregando seu painel...</p>
      </div>
    );
  }

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const weekdayLabel: Record<string, string> = {
    dom: 'Domingo', seg: 'Segunda-feira', ter: 'Terça-feira',
    qua: 'Quarta-feira', qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado',
  };

  const VAGAS_COLLAPSED_COUNT = 5;
  const LEVELS_COLLAPSED_COUNT = 5;
  const AGENDA_COLLAPSED_COUNT = 4;

  return (
    <div className="dash">
      <DashboardOnboardingTour run={showOnboarding} onFinish={handleOnboardingFinish} />
      {/* ── Header Carousel ── */}
      <header
        className="dash-header"
        onMouseEnter={() => setCarouselHovered(true)}
        onMouseLeave={() => setCarouselHovered(false)}
      >
        <div className="dash-carousel">
          <div
            className="dash-carousel-track"
            style={{ transform: `translateX(-${carouselSlide * 100}%)` }}
          >
            {/* Slide 1: Boas-vindas */}
            <div className="dash-carousel-slide">
              <div className="dash-header-inner">
                <div>
                  <h1 className="dash-greeting">
                    {getGreeting()},{' '}
                    <span className="dash-name">{user?.full_name?.split(' ')[0]}</span>
                  </h1>
                  <p className="dash-subtitle">
                    Resumo geral do sistema &bull;{' '}
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="dash-date">
                  <span className="dash-date-num">{new Date().getDate()}</span>
                  <span className="dash-date-month">
                    {new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Slide 2: Indique e Ganhe */}
            <div className="dash-carousel-slide">
              <div className="dash-referral-content">
                <div className="dash-referral-text">
                  <div className="dash-referral-badge">
                    <FontAwesomeIcon icon={faGift} /> Indique e Ganhe
                  </div>
                  <h2 className="dash-referral-title">
                    Ganhe <span className="dash-name">1 mês grátis</span> por indicação!
                  </h2>
                  <p className="dash-referral-desc">
                    Indique outros gestores de quadras e ganhe desconto na sua próxima fatura
                  </p>
                  <div className="dash-referral-stats">
                    <span>{referralStats.clicks} cliques</span>
                    <span>{referralStats.signups} cadastros</span>
                    <span>{referralStats.conversions} conversões</span>
                  </div>
                </div>
                <button className="dash-referral-btn" onClick={() => setShowReferralModal(true)}>
                  <FontAwesomeIcon icon={faGift} /> Compartilhar meu link
                </button>
              </div>
            </div>

            {/* Slide 3: Promoção ApertAi */}
            <div className="dash-carousel-slide">
              <div className="dash-promo-content">
                <div className="dash-promo-text">
                  <div className="dash-promo-badge">
                    <FontAwesomeIcon icon={faBullhorn} /> Promoção Exclusiva
                  </div>
                  <h2 className="dash-promo-title">
                    Contrate o <span className="dash-promo-highlight">ApertAi</span> e ganhe!
                  </h2>
                  <div className="dash-promo-benefits">
                    <div className="dash-promo-benefit">
                      <FontAwesomeIcon icon={faGift} />
                      <span><strong>1 mês grátis</strong> do ApertAi</span>
                    </div>
                    <div className="dash-promo-benefit">
                      <FontAwesomeIcon icon={faDollarSign} />
                      <span><strong>Desconto especial</strong> no ArenaAi</span>
                    </div>
                  </div>
                </div>
                <a className="dash-promo-btn" href="/apertai">
                  <FontAwesomeIcon icon={faBullhorn} /> Saiba mais
                </a>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            className="dash-carousel-arrow dash-carousel-arrow-left"
            onClick={() => setCarouselSlide(prev => (prev - 1 + 3) % 3)}
            style={{ opacity: carouselSlide === 0 ? 0 : 1 }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            className="dash-carousel-arrow dash-carousel-arrow-right"
            onClick={() => setCarouselSlide(prev => (prev + 1) % 3)}
            style={{ opacity: carouselSlide === 2 ? 0 : 1 }}
          >
            <FontAwesomeIcon icon={faChevronRightSolid} />
          </button>

          {/* Dots */}
          <div className="dash-carousel-dots">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`dash-carousel-dot ${carouselSlide === i ? 'active' : ''}`}
                onClick={() => setCarouselSlide(i)}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Referral Modal */}
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} />

      {/* Class Students Popup */}
      {studentsPopup && (
        <div className="mm-overlay" onClick={() => setStudentsPopup(null)}>
          <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <div>
                <h2>{studentsPopup.className}</h2>
                <span className="dash-students-popup-schedule">{studentsPopup.schedule}</span>
              </div>
              <button type="button" className="mm-close" onClick={() => setStudentsPopup(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mm-content">
              {studentsPopup.loading ? (
                <div className="dash-students-popup-loading">
                  <div className="loading-spinner" />
                </div>
              ) : studentsPopup.students.length === 0 ? (
                <p className="dash-students-popup-empty">Nenhum aluno matriculado</p>
              ) : (
                <>
                  <div className="dash-students-popup-count">
                    {studentsPopup.students.length} aluno{studentsPopup.students.length !== 1 ? 's' : ''}
                  </div>
                  <div className="dash-students-popup-list">
                    {studentsPopup.students.map((s, i) => (
                      <div
                        key={s.student_id}
                        className="dash-students-popup-item"
                        onClick={() => { setStudentsPopup(null); navigate(`/alunos/${s.student_id}`); }}
                      >
                        <div className="dash-students-popup-avatar">
                          {s.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="dash-students-popup-info">
                          <span className="dash-students-popup-name">{s.student_name}</span>
                          {s.level_name && <span className="dash-students-popup-level">{s.level_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="dash-filter-bar">
        <div className="dash-filter-chips">
          {selectedPeriod !== 'current' && (
            <span className="dash-filter-chip active">
              {periodLabel}
              <button className="dash-filter-chip-x" onClick={() => setSelectedPeriod('current')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </span>
          )}
          {selectedModality && (
            <span className="dash-filter-chip active">
              {modalities.find(m => m.id === selectedModality)?.icon}{' '}
              {modalities.find(m => m.id === selectedModality)?.name}
              <button className="dash-filter-chip-x" onClick={() => setSelectedModality(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </span>
          )}
          {!selectedModality && selectedPeriod === 'current' && (
            <span className="dash-filter-chip muted">Todos os dados — {periodLabel}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="dash-filter-select-wrap">
            <FontAwesomeIcon icon={faCalendarDay} className="dash-filter-icon" />
            <select
              className="dash-filter-select"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
            >
              <option value="current">Mês atual</option>
              <option value="previous">Mês anterior</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="12m">Últimos 12 meses</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div className="dash-filter-select-wrap">
            <FontAwesomeIcon icon={faFilter} className="dash-filter-icon" />
            <select
              className="dash-filter-select"
              value={selectedModality || ''}
              onChange={e => setSelectedModality(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Filtrar por modalidade</option>
              {modalities.map(m => (
                <option key={m.id} value={m.id}>
                  {m.icon ? `${m.icon} ` : ''}{m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {selectedPeriod === 'custom' && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>De:</span>
          <input
            type="month"
            className="dash-filter-select"
            value={customRange.start}
            onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
            style={{ minWidth: '160px' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Até:</span>
          <input
            type="month"
            className="dash-filter-select"
            value={customRange.end}
            onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
            style={{ minWidth: '160px' }}
          />
        </div>
      )}

      {/* ── Matrículas ── */}
      <section className="dash-section">
        <h2 className="dash-title">
          <FontAwesomeIcon icon={faUsers} /> Matrículas
        </h2>
        <div className="dash-row-3">
          <div className="kpi-card" onClick={() => navigate('/matriculas')}>
            <div className="kpi-icon blue"><FontAwesomeIcon icon={faUsers} /></div>
            <div className="kpi-body">
              <span className="kpi-label">Ativas</span>
              <span className="kpi-value">{enrollmentStats.ativas}</span>
            </div>
            <div className="kpi-accent blue" />
          </div>
          <div className="kpi-card" onClick={() => navigate('/relatorios')}>
            <div className="kpi-icon green"><FontAwesomeIcon icon={faUserPlus} /></div>
            <div className="kpi-body">
              <span className="kpi-label">Novas no mês</span>
              <span className="kpi-value">{enrollmentStats.novas}</span>
            </div>
            <div className="kpi-accent green" />
          </div>
          <div className="kpi-card" onClick={() => navigate('/relatorios')}>
            <div className="kpi-icon red"><FontAwesomeIcon icon={faUserMinus} /></div>
            <div className="kpi-body">
              <span className="kpi-label">Canceladas</span>
              <span className="kpi-value">{enrollmentStats.canceladas}</span>
            </div>
            <div className="kpi-accent red" />
          </div>
        </div>
      </section>

      {/* ── Financeiro ── */}
      <section className="dash-section">
        <div className="dash-title-row">
          <h2 className="dash-title"><FontAwesomeIcon icon={faMoneyBillWave} /> Financeiro</h2>
          <span className="dash-badge">{monthLabel}</span>
        </div>
        <div className="dash-row-5">
          <div className="kpi-card compact" onClick={() => navigate('/financeiro')}>
            <div className="kpi-icon-sm purple"><FontAwesomeIcon icon={faReceipt} /></div>
            <span className="kpi-label">Total Faturado</span>
            <span className="kpi-value-sm">{formatCurrency(financialStats.total)}</span>
            <span className="kpi-detail">{financialStats.totalCount} faturas</span>
            <div className="kpi-accent purple" />
          </div>
          <div className="kpi-card compact" onClick={() => navigate('/financeiro')}>
            <div className="kpi-icon-sm green"><FontAwesomeIcon icon={faCalendarCheck} /></div>
            <span className="kpi-label">Recebido</span>
            <span className="kpi-value-sm green-text">{formatCurrency(financialStats.paidTotal)}</span>
            <span className="kpi-detail">{financialStats.paidCount} faturas</span>
            <div className="kpi-accent green" />
          </div>
          <div className="kpi-card compact" onClick={() => navigate('/financeiro')}>
            <div className="kpi-icon-sm amber"><FontAwesomeIcon icon={faClock} /></div>
            <span className="kpi-label">A Vencer</span>
            <span className="kpi-value-sm amber-text">{formatCurrency(financialStats.pendingTotal)}</span>
            <span className="kpi-detail">{financialStats.pendingCount} faturas</span>
            <div className="kpi-accent amber" />
          </div>
          <div className="kpi-card compact" onClick={() => navigate('/financeiro')}>
            <div className="kpi-icon-sm red"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
            <span className="kpi-label">Em Atraso</span>
            <span className="kpi-value-sm red-text">{formatCurrency(financialStats.overdueTotal)}</span>
            <span className="kpi-detail">{financialStats.overdueCount} faturas</span>
            <div className="kpi-accent red" />
          </div>
          <div className="kpi-card compact highlight" onClick={() => navigate('/financeiro')}>
            <div className="kpi-icon-sm orange"><FontAwesomeIcon icon={faDollarSign} /></div>
            <span className="kpi-label">Total a Receber</span>
            <span className="kpi-value-sm">{formatCurrency(financialStats.toReceive)}</span>
            <span className="kpi-detail">{financialStats.toReceiveCount} faturas</span>
            <div className="kpi-accent orange" />
          </div>
        </div>
      </section>

      {/* ── Gráfico (full width, ACIMA de vagas/níveis) ── */}
      <section className="dash-panel chart-panel">
        <div className="dash-panel-top">
          <h3 className="dash-panel-title">
            <FontAwesomeIcon icon={faChartLine} /> Faturamento Mensal
          </h3>
          <button className="dash-link" onClick={() => navigate('/relatorios')}>
            Relatórios <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
        <div className="dash-chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
              <Bar yAxisId="left" dataKey="faturado" name="Faturado" fill="#C7D2FE" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar yAxisId="left" dataKey="recebido" name="Recebido" fill="#34D399" radius={[6, 6, 0, 0]} barSize={24} />
              <Line yAxisId="right" type="monotone" dataKey="matriculas" name="Matrículas" stroke="#F58A25" strokeWidth={3}
                dot={{ fill: '#F58A25', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Vagas + Níveis + Mini Agenda (3 colunas) ── */}
      <div className="dash-triple">
        {/* Vagas por Turma */}
        <section className="dash-panel collapsible-panel">
          <div className="dash-panel-top">
            <h3 className="dash-panel-title">
              <FontAwesomeIcon icon={faDumbbell} /> Vagas
            </h3>
            <button className="dash-link" onClick={() => navigate('/turmas')}>
              Ver turmas <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="collapsible-content">
            {/* Total */}
            <div className="vagas-total">
              <div className="vagas-total-row">
                <span className="vagas-total-label">Total</span>
                <span className="vagas-total-nums">
                  <strong>{vagasData.totalEnr}</strong>/{vagasData.totalCap}
                </span>
              </div>
              <div className="progress-track large">
                <div className="progress-fill" style={{
                  width: `${Math.min(vagasData.totalPct, 100)}%`,
                  background: getProgressColor(vagasData.totalPct),
                }} />
              </div>
              <span className="vagas-pct">{vagasData.totalPct}% ocupado</span>
            </div>

            <div className="vagas-divider" />
            <span className="vagas-section-label">Por Turma</span>

            <div className="vagas-list">
              {vagasData.groups.map(group => (
                <div key={group.levelName} className="vagas-level-group">
                  <div
                    className={`vagas-level-header ${expandedLevels.has(group.levelName) ? 'expanded' : ''}`}
                    onClick={() => {
                      const next = new Set(expandedLevels);
                      if (next.has(group.levelName)) next.delete(group.levelName);
                      else next.add(group.levelName);
                      setExpandedLevels(next);
                    }}
                  >
                    <div className="vagas-level-left">
                      <div className="vagas-level-dot" style={{ background: group.color }} />
                      <span className="vagas-level-name">{group.levelName}</span>
                      <span className="vagas-level-count">({group.turmas.length})</span>
                    </div>
                    <div className="vagas-level-right">
                      <span className="vagas-level-nums">{group.totalEnr}/{group.totalCap}</span>
                      <FontAwesomeIcon icon={expandedLevels.has(group.levelName) ? faChevronUp : faChevronDown} className="vagas-level-arrow" />
                    </div>
                  </div>
                  {expandedLevels.has(group.levelName) && (
                    <div className="vagas-level-turmas">
                      {group.turmas.map(turma => (
                        <div
                          key={turma.id}
                          className="vagas-item vagas-item-clickable"
                          onClick={async () => {
                            const schedule = `${weekdayShort[turma.weekday] || turma.weekday} ${turma.startTime}${turma.endTime ? `-${turma.endTime}` : ''}`;
                            setStudentsPopup({ className: turma.name, schedule, students: [], loading: true });
                            try {
                              const res = await classService.getClassById(turma.id);
                              if (res.data?.students) {
                                setStudentsPopup(prev => prev ? { ...prev, students: res.data.students || [], loading: false } : null);
                              } else {
                                setStudentsPopup(prev => prev ? { ...prev, loading: false } : null);
                              }
                            } catch {
                              setStudentsPopup(prev => prev ? { ...prev, loading: false } : null);
                            }
                          }}
                        >
                          <div className="vagas-item-row">
                            <div className="vagas-item-info">
                              <span className="vagas-mod-name">{turma.name}</span>
                              <span className="vagas-mod-schedule">
                                {weekdayShort[turma.weekday] || turma.weekday} {turma.startTime}{turma.endTime ? `-${turma.endTime}` : ''}
                              </span>
                            </div>
                            <span className="vagas-mod-nums">{turma.enrolled}/{turma.capacity}</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{
                              width: `${Math.min(turma.pct, 100)}%`,
                              background: getProgressColor(turma.pct),
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {vagasData.turmas.length === 0 && <p className="vagas-empty">Nenhuma turma cadastrada</p>}
            </div>
          </div>
        </section>

        {/* Alunos por Nível */}
        <section className="dash-panel collapsible-panel">
          <div className="dash-panel-top">
            <h3 className="dash-panel-title">
              <FontAwesomeIcon icon={faUserGraduate} /> Alunos por Nível
            </h3>
            <button className="dash-link" onClick={() => navigate('/niveis')}>
              Ver níveis <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="collapsible-content">
            {levelsData.length === 0 ? (
              <p className="vagas-empty">Nenhum nível cadastrado</p>
            ) : (
              <div className="levels-list">
                {(levelsExpanded ? levelsData : levelsData.slice(0, LEVELS_COLLAPSED_COUNT)).map(lvl => (
                  <div key={lvl.name} className="level-item">
                    <div className="level-color-dot" style={{ background: lvl.color }} />
                    <span className="level-name">{lvl.name}</span>
                    <span className="level-count">{lvl.count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="levels-total">
              <span>Total de alunos ativos</span>
              <strong>{levelsData.reduce((sum, lvl) => sum + lvl.count, 0)}</strong>
            </div>

            {levelsData.length > LEVELS_COLLAPSED_COUNT && (
              <button className="expand-btn" onClick={() => setLevelsExpanded(!levelsExpanded)}>
                <FontAwesomeIcon icon={levelsExpanded ? faChevronUp : faChevronDown} />
                {levelsExpanded ? 'Ver menos' : `Ver todos (${levelsData.length})`}
              </button>
            )}
          </div>
        </section>

        {/* Mini Agenda */}
        <section className="dash-panel collapsible-panel mini-agenda-panel">
          <div className="dash-panel-top">
            <h3 className="dash-panel-title">
              <FontAwesomeIcon icon={faCalendarDay} /> Agenda de Hoje
            </h3>
            <button className="dash-link" onClick={() => navigate('/agenda')}>
              Ver agenda <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="collapsible-content">
            <div className="mini-agenda-day-label">
              {weekdayLabel[getTodayWeekday()]}
              <span className="mini-agenda-count">{todaySchedule.length} atividades</span>
            </div>

            <div className="mini-agenda-legend">
              <span className="mini-agenda-legend-item turma">
                <span className="mini-agenda-legend-dot" />
                Turmas
              </span>
              <span className="mini-agenda-legend-item locacao">
                <span className="mini-agenda-legend-dot" />
                Locações
              </span>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="mini-agenda-empty">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <p>Nenhuma atividade hoje</p>
              </div>
            ) : (
              <>
                <div className="mini-agenda-list">
                  {(agendaExpanded ? todaySchedule : todaySchedule.slice(0, AGENDA_COLLAPSED_COUNT)).map(item => (
                    <div key={item.id} className={`mini-agenda-item ${item.type}`}>
                      <div className="mini-agenda-time">
                        {item.time}
                        {item.endTime && <span className="mini-agenda-end">- {item.endTime}</span>}
                      </div>
                      <div className="mini-agenda-info">
                        <span className="mini-agenda-title">{item.title}</span>
                        {item.subtitle && (
                          <span className="mini-agenda-subtitle">
                            <FontAwesomeIcon icon={item.type === 'turma' ? faMapMarkerAlt : faUsers} />
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.type === 'turma' && (
                        <span className="mini-agenda-tag turma">
                          Turma {item.capacity && `· ${item.capacity}`}
                        </span>
                      )}
                      {item.type === 'locacao' && (
                        <span className="mini-agenda-tag locacao">Locação</span>
                      )}
                    </div>
                  ))}
                </div>
                {todaySchedule.length > AGENDA_COLLAPSED_COUNT && (
                  <button className="expand-btn" onClick={() => setAgendaExpanded(!agendaExpanded)}>
                    <FontAwesomeIcon icon={agendaExpanded ? faChevronUp : faChevronDown} />
                    {agendaExpanded ? 'Ver menos' : `Ver todos (${todaySchedule.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Mini Calendário de Locações ── */}
      {rentals.length > 0 && (() => {
        const todayRentals = rentals
          .filter(r => r.status !== 'cancelada')
          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

        const courtNames = [...new Set(todayRentals.map(r => r.court_name))];
        const COURT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
        const courtColorMap: Record<string, string> = {};
        courtNames.forEach((name, i) => { courtColorMap[name] = COURT_COLORS[i % COURT_COLORS.length]; });

        const hours: number[] = [];
        if (todayRentals.length > 0) {
          const minH = Math.min(...todayRentals.map(r => parseInt((r.start_time || '08:00').split(':')[0])));
          const maxH = Math.max(...todayRentals.map(r => parseInt((r.end_time || '22:00').split(':')[0])));
          for (let h = Math.max(0, minH); h <= Math.min(23, maxH); h++) hours.push(h);
        }

        return (
          <section className="dash-panel" style={{ marginBottom: '2rem' }}>
            <div className="dash-panel-top">
              <h3 className="dash-panel-title">
                <FontAwesomeIcon icon={faTableTennis} /> Locações de Hoje
              </h3>
              <button className="dash-link" onClick={() => navigate('/locacoes')}>
                Ver locações <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            <div className="collapsible-content">
              {/* Court legend */}
              <div className="mini-agenda-legend" style={{ marginBottom: '12px' }}>
                {courtNames.map(name => (
                  <span key={name} className="mini-agenda-legend-item" style={{ gap: '5px' }}>
                    <span className="mini-agenda-legend-dot" style={{ background: courtColorMap[name] }} />
                    {name}
                  </span>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ position: 'relative', display: 'flex', gap: '0' }}>
                {/* Time labels */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '42px', flexShrink: 0 }}>
                  {hours.map(h => (
                    <div key={h} style={{
                      height: '40px', fontSize: '0.72rem', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'flex-start', paddingTop: '1px',
                      fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Grid + rental blocks */}
                <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border-light)' }}>
                  {hours.map(h => (
                    <div key={h} style={{ height: '40px', borderBottom: '1px solid var(--border-light)' }} />
                  ))}

                  {todayRentals.map((rental) => {
                    const startParts = (rental.start_time || '08:00').split(':');
                    const endParts = (rental.end_time || '09:00').split(':');
                    const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                    const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                    const baseMin = hours[0] * 60;
                    const topPx = ((startMin - baseMin) / 60) * 40;
                    const heightPx = Math.max(18, ((endMin - startMin) / 60) * 40 - 2);
                    const color = courtColorMap[rental.court_name] || '#3B82F6';

                    return (
                      <div
                        key={rental.id}
                        style={{
                          position: 'absolute', top: `${topPx}px`, left: '4px', right: '4px',
                          height: `${heightPx}px`, background: `${color}12`,
                          borderLeft: `3px solid ${color}`, borderRadius: 'var(--radius-sm)',
                          padding: '3px 8px', overflow: 'hidden', fontSize: '0.73rem',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                        title={`${rental.renter_name} — ${rental.court_name} (${rental.start_time?.substring(0, 5)}-${rental.end_time?.substring(0, 5)})`}
                      >
                        <span style={{ fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                          {rental.start_time?.substring(0, 5)}-{rental.end_time?.substring(0, 5)}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{rental.court_name}</span>
                        {heightPx > 22 && (
                          <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rental.renter_name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '12px', padding: '8px 12px',
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
              }}>
                <span><strong>{todayRentals.length}</strong> locaç{todayRentals.length === 1 ? 'ão' : 'ões'} hoje</span>
                <span style={{ fontWeight: 600, color: 'var(--color-green)' }}>
                  {formatCurrency(todayRentals.reduce((sum, r) => sum + (r.price_cents || 0), 0))}
                </span>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Avisos Rápidos ── */}
      <section className="dash-panel announcements-panel">
        <div className="dash-panel-top">
          <h3 className="dash-panel-title">
            <FontAwesomeIcon icon={faBullhorn} /> Avisos
          </h3>
          <button className="dash-link" onClick={() => navigate('/avisos')}>
            Ver todos <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
        <div className="announcements-content">
          <div className="quick-announce-form">
            <div className="quick-announce-row">
              <input
                type="text"
                className="quick-announce-input flex"
                placeholder="Título do aviso"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
              />
              <select
                className="quick-announce-select"
                value={quickType}
                onChange={e => setQuickType(e.target.value as any)}
              >
                <option value="info">Informativo</option>
                <option value="warning">Atenção</option>
                <option value="urgent">Urgente</option>
                <option value="event">Evento</option>
              </select>
            </div>
            <div className="quick-announce-row">
              <input
                type="text"
                className="quick-announce-input flex"
                placeholder="Mensagem do aviso..."
                value={quickContent}
                onChange={e => setQuickContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAnnouncement()}
              />
              <button
                className="quick-announce-btn"
                onClick={handleQuickAnnouncement}
                disabled={sendingAnnouncement || !quickTitle.trim() || !quickContent.trim()}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
            {announceSent && (
              <div className="quick-announce-feedback success">Aviso enviado com sucesso!</div>
            )}
            {announceError && (
              <div className="quick-announce-feedback error">{announceError}</div>
            )}
          </div>

          {announcements.length > 0 && (
            <div className="announcements-list">
              {announcements.map(a => {
                const typeClass = a.type === 'urgent' ? 'urgent' : a.type === 'warning' ? 'warning' : a.type === 'event' ? 'event' : 'info';
                return (
                  <div key={a.id} className={`announcement-item ${typeClass}`}>
                    <div className="announcement-header">
                      <span className="announcement-title">{a.title}</span>
                      <span className="announcement-date">
                        {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="announcement-body">{a.content}</p>
                    {a.target_count != null && a.read_count != null && (
                      <span className="announcement-stats">
                        {a.read_count}/{a.target_count} leram
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {announcements.length === 0 && (
            <p className="announcements-empty">Nenhum aviso ativo no momento</p>
          )}
        </div>
      </section>

      {/* ── Inadimplentes ── */}
      {overdueInvoices.length > 0 && (
        <section className="dash-panel overdue-panel">
          <div className="dash-panel-top overdue-top">
            <h3 className="dash-panel-title">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Inadimplentes
              <span className="overdue-badge">{overdueInvoices.length}</span>
            </h3>
            <button className="dash-link" onClick={() => navigate('/financeiro')}>
              Ver todos <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="overdue-grid">
            {overdueDisplay.map(inv => (
              <div key={inv.id} className="overdue-card">
                <div className="overdue-card-top">
                  <div className="overdue-avatar">{inv.student_name?.charAt(0).toUpperCase()}</div>
                  <div className="overdue-info">
                    <span className="overdue-name">{inv.student_name}</span>
                    <span className="overdue-amount">{formatCurrency(Number(inv.final_amount_cents || 0))}</span>
                    <span className="overdue-due">Venceu em {formatDate(inv.due_date)}</span>
                  </div>
                </div>
                <button className="btn-wpp" onClick={() => handleWhatsApp(inv.student_phone, inv.student_name || '')}
                  disabled={!inv.student_phone} title={inv.student_phone ? 'Enviar mensagem' : 'Telefone não cadastrado'}>
                  <FontAwesomeIcon icon={faWhatsapp} /> Cobrar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
