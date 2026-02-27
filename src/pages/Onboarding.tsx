import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowLeft,
  faCheck,
  faPlus,
  faPalette,
  faSpinner,
  faBuilding,
  faLayerGroup,
  faTableTennis,
  faClock,
  faDollarSign,
  faUsers,
  faFileInvoiceDollar,
  faCalendarDays,
  faChartLine,
  faMobileScreenButton,
  faBullhorn,
  faClipboardList,
  faCreditCard,
  faUserPlus,
  faChalkboardTeacher,
  faCalendarCheck,
  faLink,
  faImage,
  faTimes,
  faForward,
  faBell,
  faExternalLinkAlt,
  faShareAlt,
  faListOl,
  faCopy,
  faEye,
  faFilter,
  faSearch,
  faCommentDots,
  faPen,
  faGripVertical,
  faMousePointer,
  faVoteYea,
  faCamera,
  faTshirt,
  faTrophy,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { arenaService } from '../services/arenaService';
import { levelService } from '../services/levelService';
import { modalityService } from '../services/modalityService';
import { classService } from '../services/classService';
import { planService } from '../services/planService';
import { courtService } from '../services/courtService';
import { trialStudentService } from '../services/trialStudentService';
import { studentService } from '../services/studentService';
import { api } from '../services/api';

// ─── Types ───
interface CreatedLevel {
  id: number;
  name: string;
  color: string;
}

interface CreatedModality {
  id: number;
  name: string;
}

interface CreatedCourt {
  id: number;
  name: string;
}

interface CreatedClass {
  id: number;
  modality_name: string;
  weekday: string;
  start_time: string;
}

interface CreatedPlan {
  id: number;
  name: string;
  sessions_per_week: number;
  price_cents: number;
}

const TOTAL_STEPS = 8;

const LEVEL_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const WEEKDAYS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

// ─── Styles ───
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #f04f28, #ff6b35)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  skipBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
    padding: '8px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  },
  progressBar: {
    display: 'flex',
    gap: '4px',
    padding: '0 32px',
    marginTop: '16px',
  },
  progressSegment: (state: 'done' | 'current' | 'future') => ({
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    background: state === 'done' ? '#FF9900' : state === 'current' ? 'rgba(255,153,0,0.5)' : 'rgba(255,255,255,0.1)',
    transition: 'background 0.3s',
  }),
  content: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 24px 60px',
    overflowY: 'auto' as const,
  },
  inner: {
    maxWidth: '700px',
    width: '100%',
  },
  stepTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '8px',
    lineHeight: 1.3,
  },
  stepSubtitle: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: '32px',
    lineHeight: 1.6,
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: '#FF9900',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #f04f28, #ff6b35)',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  createBtn: {
    background: 'linear-gradient(135deg, #f04f28, #ff6b35)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 500,
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981',
  },
  infoBox: {
    background: 'rgba(255,153,0,0.08)',
    border: '1px solid rgba(255,153,0,0.2)',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '0.88rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    marginTop: '20px',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  colorGrid: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  colorSwatch: (color: string, selected: boolean) => ({
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: color,
    cursor: 'pointer',
    border: selected ? '3px solid #fff' : '3px solid transparent',
    transition: 'border 0.2s, transform 0.2s',
    transform: selected ? 'scale(1.1)' : 'scale(1)',
  }),
  weekdayChip: (selected: boolean) => ({
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    background: selected ? 'rgba(255,153,0,0.15)' : 'rgba(255,255,255,0.06)',
    border: selected ? '1px solid #FF9900' : '1px solid rgba(255,255,255,0.1)',
    color: selected ? '#FF9900' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s',
  }),
  levelChip: (selected: boolean) => ({
    padding: '6px 14px',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 500,
    background: selected ? 'rgba(255,153,0,0.12)' : 'rgba(255,255,255,0.06)',
    border: selected ? '1px solid #FF9900' : '1px solid rgba(255,255,255,0.1)',
    color: selected ? '#FF9900' : 'rgba(255,255,255,0.5)',
    transition: 'all 0.2s',
  }),
  featureCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255,153,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FF9900',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.5,
  },
  logoUpload: {
    width: '100px',
    height: '100px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.06)',
    border: '2px dashed rgba(255,255,255,0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  stepIndicator: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: '8px',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
};

// ─── Animation CSS ───
const fadeInCSS = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.onb-fade { animation: fadeSlideIn 0.35s ease-out; }
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(255,153,0,0.3), 0 0 24px rgba(255,153,0,0.1); }
  50% { box-shadow: 0 0 16px rgba(255,153,0,0.5), 0 0 40px rgba(255,153,0,0.2); }
}
.onb-link-pulse { animation: pulseGlow 2s ease-in-out infinite; }
@keyframes pointBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(6px); }
}
.onb-point-bounce { animation: pointBounce 1s ease-in-out infinite; }
`;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Arena
  const [arenaName, setArenaName] = useState(user?.arenas?.[0]?.name || '');
  const [logoUrl, setLogoUrl] = useState(user?.logo_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 2 — Levels
  const [levelName, setLevelName] = useState('');
  const [levelColor, setLevelColor] = useState(LEVEL_COLORS[0]);
  const [createdLevels, setCreatedLevels] = useState<CreatedLevel[]>([]);

  // Step 3 — Modalities + Courts + Classes
  const [modalityName, setModalityName] = useState('');
  const [createdModalities, setCreatedModalities] = useState<CreatedModality[]>([]);
  const [courtName, setCourtName] = useState('');
  const [createdCourts, setCreatedCourts] = useState<CreatedCourt[]>([]);
  const [classModalityId, setClassModalityId] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [classWeekdays, setClassWeekdays] = useState<string[]>([]);
  const [classStartTime, setClassStartTime] = useState('');
  const [classDuration, setClassDuration] = useState(60);
  const [classColor, setClassColor] = useState(LEVEL_COLORS[1]);
  const [classLocation, setClassLocation] = useState('');
  const [classCapacity, setClassCapacity] = useState('20');
  const [classAllowedLevels, setClassAllowedLevels] = useState<string[]>([]);
  const [createdClasses, setCreatedClasses] = useState<CreatedClass[]>([]);

  // Step 4 — Plans
  const [planName, setPlanName] = useState('');
  const [planSessions, setPlanSessions] = useState(2);
  const [planPrice, setPlanPrice] = useState('');
  const [planModalityId, setPlanModalityId] = useState<number | undefined>(undefined);
  const [planDescription, setPlanDescription] = useState('');
  const [createdPlans, setCreatedPlans] = useState<CreatedPlan[]>([]);

  // Step 5 — Student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCpf, setStudentCpf] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [createdStudent, setCreatedStudent] = useState<{ id: number; name: string } | null>(null);

  // Step 6 — Trial class config
  const [trialBookingToken, setTrialBookingToken] = useState<string | null>(null);
  const [trialEnabledClassIds, setTrialEnabledClassIds] = useState<Set<number>>(new Set());

  // Step 7 — Court operating hours config
  const [courtBookingToken, setCourtBookingToken] = useState<string | null>(null);
  const [courtHoursConfigured, setCourtHoursConfigured] = useState<Set<number>>(new Set());
  const [editingCourtHours, setEditingCourtHours] = useState<number | null>(null);
  const [courtHoursForm, setCourtHoursForm] = useState<{ open: string; close: string; price: string; slot: number }>({ open: '08:00', close: '22:00', price: '', slot: 60 });

  // ─── Fetch booking tokens when reaching relevant steps ───
  useEffect(() => {
    if (currentStep === 6 && trialBookingToken === null) {
      trialStudentService.getBookingToken().then(res => {
        const token = res.data?.booking_token;
        if (token) setTrialBookingToken(token);
        else {
          trialStudentService.generateBookingToken().then(genRes => {
            setTrialBookingToken(genRes.data?.booking_token || null);
          }).catch(() => {});
        }
      }).catch(() => {});
    }
    if (currentStep === 7 && courtBookingToken === null) {
      courtService.getBookingToken().then(res => {
        const token = res.data?.booking_token;
        if (token) setCourtBookingToken(token);
        else {
          courtService.generateBookingToken().then(genRes => {
            setCourtBookingToken(genRes.data?.booking_token || null);
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [currentStep]);

  // ─── Handlers ───

  const handleSkip = async () => {
    try {
      await authService.completeOnboarding();
      const token = authService.getToken();
      if (user && token) {
        setAuth({ ...user, onboarding_completed: true }, token);
      }
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await authService.completeOnboarding();
      const token = authService.getToken();
      if (user && token) {
        setAuth({ ...user, onboarding_completed: true }, token);
      }
      toast.success('Onboarding concluído! Bem-vindo ao ArenaAi!');
      navigate('/dashboard');
    } catch {
      toast.error('Erro ao finalizar onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data.data.url;
      setLogoUrl(url);
      await authService.updateProfile({ logo_url: url });
      toast.success('Logo atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveArena = async () => {
    if (!arenaName.trim()) return;
    setLoading(true);
    try {
      const defaultArena = user?.arenas?.find(a => a.is_default);
      if (defaultArena) {
        await arenaService.updateArena(defaultArena.id, { name: arenaName.trim() });
      }
      toast.success('Arena configurada!');
      setCurrentStep(2);
    } catch {
      toast.error('Erro ao salvar arena');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLevel = async () => {
    if (!levelName.trim()) return;
    setLoading(true);
    try {
      const res = await levelService.createLevel({ name: levelName.trim(), color: levelColor });
      setCreatedLevels(prev => [...prev, { id: res.data.id, name: res.data.name, color: res.data.color || levelColor }]);
      setLevelName('');
      setLevelColor(LEVEL_COLORS[(createdLevels.length + 1) % LEVEL_COLORS.length]);
      toast.success(`Nível "${res.data.name}" criado!`);
    } catch {
      toast.error('Erro ao criar nível');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModality = async () => {
    if (!modalityName.trim()) return;
    setLoading(true);
    try {
      const res = await modalityService.createModality({ name: modalityName.trim() });
      const newMod = { id: res.data.id, name: res.data.name };
      setCreatedModalities(prev => [...prev, newMod]);
      if (!classModalityId) setClassModalityId(res.data.id);
      setModalityName('');
      toast.success(`Modalidade "${res.data.name}" criada!`);
    } catch {
      toast.error('Erro ao criar modalidade');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourt = async () => {
    if (!courtName.trim()) return;
    setLoading(true);
    try {
      const res = await courtService.createCourt({ name: courtName.trim(), status: 'ativa' });
      setCreatedCourts(prev => [...prev, { id: res.data.id, name: res.data.name }]);
      if (!classLocation) setClassLocation(res.data.name);
      setCourtName('');
      toast.success(`Quadra "${res.data.name}" criada!`);
    } catch {
      toast.error('Erro ao criar quadra');
    } finally {
      setLoading(false);
    }
  };

  const calcEndTime = (start: string, durationMin: number) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  const handleCreateClass = async () => {
    if (!classModalityId || classWeekdays.length === 0 || !classStartTime) {
      toast.error('Preencha modalidade, dia(s) e horário de início');
      return;
    }
    setLoading(true);
    try {
      const endTime = calcEndTime(classStartTime, classDuration);
      const modName = createdModalities.find(m => m.id === classModalityId)?.name || '';

      for (const day of classWeekdays) {
        const res = await classService.createClass({
          modality_id: classModalityId,
          name: className.trim() || undefined,
          weekday: day as any,
          start_time: classStartTime,
          end_time: endTime || undefined,
          allowed_levels: classAllowedLevels.length > 0 ? classAllowedLevels : undefined,
          color: classColor,
          location: classLocation.trim() || undefined,
          capacity: classCapacity ? parseInt(classCapacity) : undefined,
        });
        setCreatedClasses(prev => [...prev, { id: res.data.id, modality_name: modName, weekday: day, start_time: classStartTime }]);
      }

      setClassName('');
      setClassWeekdays([]);
      setClassStartTime('');
      setClassAllowedLevels([]);
      setClassLocation('');
      setClassCapacity('20');
      toast.success(classWeekdays.length > 1 ? `${classWeekdays.length} turmas criadas!` : 'Turma criada!');
    } catch {
      toast.error('Erro ao criar turma');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planName.trim() || !planPrice) {
      toast.error('Preencha nome e preço do plano');
      return;
    }
    const priceCents = Math.round(parseFloat(planPrice.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error('Preço inválido');
      return;
    }
    setLoading(true);
    try {
      const res = await planService.createPlan({
        name: planName.trim(),
        sessions_per_week: planSessions,
        price_cents: priceCents,
        modality_id: planModalityId || undefined,
        description: planDescription.trim() || undefined,
      });
      setCreatedPlans(prev => [...prev, { id: res.data.id, name: res.data.name, sessions_per_week: planSessions, price_cents: priceCents }]);
      setPlanName('');
      setPlanPrice('');
      setPlanSessions(2);
      setPlanModalityId(undefined);
      setPlanDescription('');
      toast.success(`Plano "${res.data.name}" criado!`);
    } catch {
      toast.error('Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!studentName.trim() || !studentEmail.trim() || !studentCpf.trim()) {
      toast.error('Preencha nome, email e CPF');
      return;
    }
    setLoading(true);
    try {
      const selectedLevel = createdLevels.find(l => l.name === studentLevel);
      const res = await studentService.createStudent({
        full_name: studentName.trim(),
        email: studentEmail.trim(),
        cpf: studentCpf.replace(/\D/g, ''),
        phone: studentPhone.replace(/\D/g, '') || undefined,
        level_id: selectedLevel?.id,
        level: studentLevel || undefined,
      });
      setCreatedStudent({ id: res.data.id, name: res.data.full_name });
      toast.success(`Aluno "${res.data.full_name}" cadastrado!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erro ao cadastrar aluno';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleLevelForClass = (levelName: string) => {
    setClassAllowedLevels(prev =>
      prev.includes(levelName) ? prev.filter(l => l !== levelName) : [...prev, levelName]
    );
  };

  const handleToggleTrialClass = async (classId: number) => {
    const isEnabled = trialEnabledClassIds.has(classId);
    setLoading(true);
    try {
      await trialStudentService.upsertTrialClassConfig({
        class_id: classId,
        is_enabled: !isEnabled,
        allow_overbooking: false,
        max_trial_per_day: 3,
      });
      setTrialEnabledClassIds(prev => {
        const next = new Set(prev);
        if (isEnabled) next.delete(classId);
        else next.add(classId);
        return next;
      });
      toast.success(!isEnabled ? 'Turma habilitada para experimental' : 'Turma removida do experimental');
    } catch {
      toast.error('Erro ao configurar turma');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourtHours = async (courtId: number) => {
    if (!courtHoursForm.open || !courtHoursForm.close) {
      toast.error('Preencha os horários');
      return;
    }
    setLoading(true);
    try {
      // Create operating hours for all weekdays (0=dom to 6=sab)
      const hours = Array.from({ length: 7 }, (_, day) => ({
        court_id: courtId,
        day_of_week: day,
        open_time: courtHoursForm.open,
        close_time: courtHoursForm.close,
        slot_duration_minutes: courtHoursForm.slot,
        price_cents: courtHoursForm.price ? Math.round(parseFloat(courtHoursForm.price) * 100) : null,
        is_active: true,
      }));
      await courtService.setOperatingHours(courtId, hours);
      setCourtHoursConfigured(prev => new Set(prev).add(courtId));
      setEditingCourtHours(null);
      toast.success('Horários salvos!');
    } catch {
      toast.error('Erro ao salvar horários');
    } finally {
      setLoading(false);
    }
  };

  const next = () => setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  const formatCentsToReal = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ─── Step Renderers ───

  const renderStep1 = () => (
    <div className="onb-fade" key="step1">
      <div style={styles.stepIndicator}>ETAPA 1 DE 8</div>
      <h1 style={styles.stepTitle}>Bem-vindo ao ArenaAi, {user?.full_name?.split(' ')[0]}!</h1>
      <p style={styles.stepSubtitle}>
        Vamos configurar sua arena em poucos passos. Uma <strong>arena</strong> representa seu espaço esportivo
        — academia, quadra, clube ou centro de treinamento. Comece personalizando o nome e a logo.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.label}>Nome da sua Arena</label>
        <input
          style={styles.input}
          value={arenaName}
          onChange={e => setArenaName(e.target.value)}
          placeholder="Ex: Arena Beach Sports"
          onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Logo da Arena (opcional)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={styles.logoUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingLogo ? (
              <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#FF9900', fontSize: '1.4rem' }} />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
            ) : (
              <>
                <FontAwesomeIcon icon={faImage} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.5rem', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Clique</span>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
          {logoUrl && (
            <button
              style={{ ...styles.secondaryBtn, padding: '8px 14px', fontSize: '0.8rem' }}
              onClick={() => { setLogoUrl(''); authService.updateProfile({ logo_url: '' }); }}
            >
              <FontAwesomeIcon icon={faTimes} /> Remover
            </button>
          )}
        </div>
      </div>

      <div style={styles.infoBox}>
        Depois, gerencie suas arenas na aba <strong>Arenas</strong> no menu lateral, e edite seu perfil e logo em <strong>Preferências</strong>.
      </div>

      <div style={styles.navRow}>
        <div />
        <button
          style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSaveArena}
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : null}
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onb-fade" key="step2">
      <div style={styles.stepIndicator}>ETAPA 2 DE 8</div>
      <h1 style={styles.stepTitle}>Crie seus Níveis</h1>
      <p style={styles.stepSubtitle}>
        Níveis categorizam seus alunos por experiência e servem como filtro para turmas.
        Exemplos: Iniciante, Intermediário, Avançado, Kids.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={styles.label}>Nome do nível</label>
          <input
            style={styles.input}
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            placeholder="Ex: Iniciante"
            onKeyDown={e => e.key === 'Enter' && handleCreateLevel()}
            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>
        <div>
          <label style={styles.label}>
            <FontAwesomeIcon icon={faPalette} style={{ marginRight: '4px' }} /> Cor
          </label>
          <div style={styles.colorGrid}>
            {LEVEL_COLORS.map(c => (
              <div
                key={c}
                style={styles.colorSwatch(c, c === levelColor)}
                onClick={() => setLevelColor(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <button
          style={{ ...styles.createBtn, opacity: loading || !levelName.trim() ? 0.6 : 1 }}
          onClick={handleCreateLevel}
          disabled={loading || !levelName.trim()}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
          Criar Nível
        </button>
      </div>

      {createdLevels.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {createdLevels.map(l => (
            <span key={l.id} style={{ ...styles.chip, borderColor: l.color, color: l.color, background: `${l.color}18` }}>
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} /> {l.name}
            </span>
          ))}
        </div>
      )}

      <div style={styles.infoBox}>
        Gerencie seus níveis a qualquer momento em <strong>Níveis</strong> no menu lateral.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button style={styles.primaryBtn} onClick={next}>
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onb-fade" key="step3">
      <div style={styles.stepIndicator}>ETAPA 3 DE 8</div>
      <h1 style={styles.stepTitle}>Modalidades, Quadras e Turmas</h1>
      <p style={styles.stepSubtitle}>
        Crie as modalidades (esportes/atividades), suas quadras e depois monte as turmas.
        Cada turma pertence a uma modalidade e acontece em uma quadra.
      </p>

      {/* Create Modality */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#FF9900' }}>
          <FontAwesomeIcon icon={faTableTennis} style={{ marginRight: '8px' }} />
          Nova Modalidade
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            value={modalityName}
            onChange={e => setModalityName(e.target.value)}
            placeholder="Ex: Beach Tennis"
            onKeyDown={e => e.key === 'Enter' && handleCreateModality()}
            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            style={{ ...styles.createBtn, opacity: loading || !modalityName.trim() ? 0.6 : 1 }}
            onClick={handleCreateModality}
            disabled={loading || !modalityName.trim()}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
            Criar
          </button>
        </div>
        {createdModalities.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {createdModalities.map(m => (
              <span key={m.id} style={styles.chip}>
                <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} /> {m.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Create Court — only after creating a modality */}
      {createdModalities.length > 0 && (
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', color: '#FF9900' }}>
          <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px' }} />
          Nova Quadra
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', lineHeight: 1.5 }}>
          Crie suas quadras para vincular às turmas. Cada turma acontece em uma quadra específica.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            value={courtName}
            onChange={e => setCourtName(e.target.value)}
            placeholder="Ex: Quadra 1, Quadra Coberta, Arena Principal"
            onKeyDown={e => e.key === 'Enter' && handleCreateCourt()}
            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button
            style={{ ...styles.createBtn, opacity: loading || !courtName.trim() ? 0.6 : 1 }}
            onClick={handleCreateCourt}
            disabled={loading || !courtName.trim()}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
            Criar
          </button>
        </div>
        {createdCourts.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {createdCourts.map(c => (
              <span key={c.id} style={styles.chip}>
                <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} /> {c.name}
              </span>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Create Class — only after creating a modality AND a court */}
      {createdModalities.length > 0 && createdCourts.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#FF9900' }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
            Nova Turma
          </h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Modalidade</label>
              <select
                style={{ ...styles.input, cursor: 'pointer' }}
                value={classModalityId || ''}
                onChange={e => setClassModalityId(Number(e.target.value))}
              >
                {createdModalities.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>{m.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Nome da Turma (opcional)</label>
              <input
                style={styles.input}
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Ex: Turma Iniciantes Manhã"
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Dias da Semana <span style={{ fontWeight: 400, fontSize: '0.8em', color: '#888' }}>(selecione um ou mais)</span></label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {WEEKDAYS.map(w => (
                <div
                  key={w.key}
                  style={styles.weekdayChip(classWeekdays.includes(w.key))}
                  onClick={() => setClassWeekdays(prev =>
                    prev.includes(w.key) ? prev.filter(d => d !== w.key) : [...prev, w.key]
                  )}
                >
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Horário Início</label>
              <input
                type="time"
                style={styles.input}
                value={classStartTime}
                onChange={e => setClassStartTime(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Duração da Aula</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[30, 60, 90].map(d => (
                  <div
                    key={d}
                    style={{
                      ...styles.weekdayChip(classDuration === d),
                      flex: 1,
                      textAlign: 'center' as const,
                    }}
                    onClick={() => setClassDuration(d)}
                  >
                    {d} min
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Horário Fim</label>
              <input
                type="time"
                style={{ ...styles.input, opacity: 0.6 }}
                value={calcEndTime(classStartTime, classDuration)}
                readOnly
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Quadra</label>
              {createdCourts.length > 0 ? (
                <select
                  style={{ ...styles.input, cursor: 'pointer' }}
                  value={classLocation}
                  onChange={e => setClassLocation(e.target.value)}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>Selecione a quadra</option>
                  {createdCourts.map(c => (
                    <option key={c.id} value={c.name} style={{ background: '#1a1a1a' }}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  style={{ ...styles.input, opacity: 0.5 }}
                  value=""
                  readOnly
                  placeholder="Crie uma quadra acima primeiro"
                />
              )}
            </div>
            <div style={{ width: '120px', ...styles.formGroup }}>
              <label style={styles.label}>Capacidade</label>
              <input
                type="number"
                style={styles.input}
                value={classCapacity}
                onChange={e => setClassCapacity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Cor da Turma</label>
            <div style={styles.colorGrid}>
              {LEVEL_COLORS.map(c => (
                <div
                  key={c}
                  style={styles.colorSwatch(c, c === classColor)}
                  onClick={() => setClassColor(c)}
                />
              ))}
            </div>
          </div>

          {createdLevels.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Níveis permitidos (opcional)</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {createdLevels.map(l => (
                  <div
                    key={l.id}
                    style={styles.levelChip(classAllowedLevels.includes(l.name))}
                    onClick={() => toggleLevelForClass(l.name)}
                  >
                    {l.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            style={{ ...styles.createBtn, opacity: loading || classWeekdays.length === 0 || !classStartTime ? 0.6 : 1 }}
            onClick={handleCreateClass}
            disabled={loading || classWeekdays.length === 0 || !classStartTime}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
            Criar Turma
          </button>

          {createdClasses.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {createdClasses.map(c => (
                <span key={c.id} style={styles.chip}>
                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} />
                  {c.modality_name} — {WEEKDAYS.find(w => w.key === c.weekday)?.label} {c.start_time}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.infoBox}>
        Gerencie modalidades e turmas em <strong>Turmas</strong>, e quadras em <strong>Quadras</strong> no menu lateral.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button
          style={{ ...styles.primaryBtn, opacity: createdModalities.length > 0 && createdCourts.length > 0 && createdClasses.length > 0 ? 1 : 0.5 }}
          onClick={next}
          disabled={createdModalities.length === 0 || createdCourts.length === 0 || createdClasses.length === 0}
        >
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onb-fade" key="step4">
      <div style={styles.stepIndicator}>ETAPA 4 DE 8</div>
      <h1 style={styles.stepTitle}>Crie seus Planos</h1>
      <p style={styles.stepSubtitle}>
        Planos definem o preço e a quantidade de aulas por semana. Ao matricular um aluno,
        você seleciona o plano que determina o valor da mensalidade.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, ...styles.formGroup }}>
            <label style={styles.label}>Nome do Plano *</label>
            <input
              style={styles.input}
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="Ex: Plano 2x por semana"
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          {createdModalities.length > 0 && (
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Modalidade</label>
              <select
                style={{ ...styles.input, cursor: 'pointer' }}
                value={planModalityId || ''}
                onChange={e => setPlanModalityId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="" style={{ background: '#1a1a1a' }}>Todas as modalidades</option>
                {createdModalities.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>{m.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px', display: 'block' }}>
                Se definir, só turmas dessa modalidade aparecerão na matrícula
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, ...styles.formGroup }}>
            <label style={styles.label}>Aulas por Semana *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                style={{ ...styles.secondaryBtn, padding: '8px 14px', fontSize: '1.1rem' }}
                onClick={() => setPlanSessions(s => Math.max(1, s - 1))}
              >
                −
              </button>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: '32px', textAlign: 'center' as const }}>{planSessions}</span>
              <button
                style={{ ...styles.secondaryBtn, padding: '8px 14px', fontSize: '1.1rem' }}
                onClick={() => setPlanSessions(s => Math.min(7, s + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ flex: 1, ...styles.formGroup }}>
            <label style={styles.label}>Preço Mensal (R$) *</label>
            <input
              style={styles.input}
              value={planPrice}
              onChange={e => setPlanPrice(e.target.value)}
              placeholder="150,00"
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Descrição (opcional)</label>
          <textarea
            style={{ ...styles.input, resize: 'vertical' as const, minHeight: '70px' }}
            value={planDescription}
            onChange={e => setPlanDescription(e.target.value)}
            placeholder="Descrição opcional do plano"
            rows={3}
            onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        <button
          style={{ ...styles.createBtn, opacity: loading || !planName.trim() || !planPrice ? 0.6 : 1 }}
          onClick={handleCreatePlan}
          disabled={loading || !planName.trim() || !planPrice}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
          Criar Plano
        </button>
      </div>

      {createdPlans.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {createdPlans.map(p => (
            <span key={p.id} style={styles.chip}>
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} />
              {p.name} — {p.sessions_per_week}x/sem — {formatCentsToReal(p.price_cents)}
            </span>
          ))}
        </div>
      )}

      <div style={styles.infoBox}>
        Gerencie seus planos e faça reajustes em massa em <strong>Planos</strong> no menu lateral.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button style={styles.primaryBtn} onClick={next}>
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  // ─── Shared sub-components ───
  const FlowStep = ({ num, title, desc, icon, color = '#FF9900' }: { num: number; title: string; desc: string; icon: any; color?: string }) => (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', background: `${color}20`,
        border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700, color, flexShrink: 0,
      }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <FontAwesomeIcon icon={icon} style={{ color, fontSize: '0.85rem' }} />
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{title}</span>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );

  const MockupCard = ({ children, label }: { children: React.ReactNode; label?: string }) => (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '16px', position: 'relative' as const,
    }}>
      {label && (
        <div style={{
          position: 'absolute' as const, top: '-10px', left: '16px',
          background: '#0f0f0f', padding: '2px 10px', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px',
          textTransform: 'uppercase' as const, borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );

  const renderStep5 = () => (
    <div className="onb-fade" key="step5">
      <div style={styles.stepIndicator}>ETAPA 5 DE 8</div>
      <h1 style={styles.stepTitle}>Cadastre seu Primeiro Aluno</h1>
      <p style={styles.stepSubtitle}>
        Agora que a arena está configurada, cadastre um aluno para testar o fluxo completo.
        Depois você pode criar a matrícula vinculando plano e turmas.
      </p>

      {/* Student creation form */}
      {!createdStudent ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Nome Completo *</label>
              <input
                style={styles.input}
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Ex: João Silva"
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>CPF *</label>
              <input
                style={styles.input}
                value={studentCpf}
                onChange={e => setStudentCpf(e.target.value)}
                placeholder="000.000.000-00"
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                style={styles.input}
                value={studentEmail}
                onChange={e => setStudentEmail(e.target.value)}
                placeholder="aluno@email.com"
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div style={{ flex: 1, ...styles.formGroup }}>
              <label style={styles.label}>Telefone</label>
              <input
                type="tel"
                style={styles.input}
                value={studentPhone}
                onChange={e => setStudentPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          </div>

          {createdLevels.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Nível</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {createdLevels.map(l => (
                  <div
                    key={l.id}
                    style={styles.levelChip(studentLevel === l.name)}
                    onClick={() => setStudentLevel(studentLevel === l.name ? '' : l.name)}
                  >
                    {l.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            style={{ ...styles.createBtn, opacity: loading || !studentName.trim() || !studentEmail.trim() || !studentCpf.trim() ? 0.6 : 1 }}
            onClick={handleCreateStudent}
            disabled={loading || !studentName.trim() || !studentEmail.trim() || !studentCpf.trim()}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
            Cadastrar Aluno
          </button>
        </div>
      ) : (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981', fontSize: '1.2rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Aluno cadastrado!</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              <strong style={{ color: '#10b981' }}>{createdStudent.name}</strong> — Agora vá em Matrículas para vincular um plano e turmas.
            </div>
          </div>
        </div>
      )}

      {/* Enrollment + Financial info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' }}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}><FontAwesomeIcon icon={faClipboardList} /></div>
          <div>
            <div style={styles.featureTitle}>Matrículas</div>
            <div style={styles.featureDesc}>
              Selecione o aluno, escolha um plano e vincule às turmas. As faturas mensais são geradas
              automaticamente com cobrança PIX.
            </div>
          </div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ ...styles.featureIcon, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </div>
          <div>
            <div style={styles.featureTitle}>Financeiro Automático</div>
            <div style={styles.featureDesc}>
              Faturas geradas automaticamente. Cobranças PIX, registro de pagamento e dashboard financeiro.
            </div>
          </div>
        </div>
      </div>

      {/* Search bar highlight */}
      <div style={{
        marginTop: '20px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '12px', padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <FontAwesomeIcon icon={faSearch} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Busca rápida de alunos</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
          Use a <strong style={{ color: '#3b82f6' }}>barra de pesquisa no topo</strong> para encontrar qualquer aluno
          e editar rapidamente todas as informações — dados, nível, turmas, matrículas e faturas.
        </p>
      </div>

      <div style={styles.infoBox}>
        Cadastre mais alunos em <strong>Alunos</strong>, crie matrículas em <strong>Matrículas</strong>.
        As faturas aparecem em <strong>Financeiro</strong>.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button style={styles.primaryBtn} onClick={next}>
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="onb-fade" key="step6">
      <div style={styles.stepIndicator}>ETAPA 6 DE 8</div>
      <h1 style={styles.stepTitle}>
        <FontAwesomeIcon icon={faUserPlus} style={{ color: '#3b82f6', marginRight: '12px', fontSize: '1.5rem' }} />
        Alunos Experimentais
      </h1>
      <p style={styles.stepSubtitle}>
        Uma das funcionalidades mais poderosas do ArenaAi: <strong>links públicos</strong> para agendamento
        de aulas experimentais. Compartilhe com prospects e deixe-os agendar sozinhos!
      </p>

      {/* Step 1: Select which classes accept trial students */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', color: '#FF9900' }}>
          <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: '8px' }} />
          Selecione as turmas que aceitam aula experimental
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', lineHeight: 1.5 }}>
          Marque as turmas onde prospects podem agendar uma aula experimental. Somente turmas habilitadas aparecerão no link público.
        </p>
        {createdClasses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {createdClasses.map(c => {
              const isEnabled = trialEnabledClassIds.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => !loading && handleToggleTrialClass(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                    background: isEnabled ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isEnabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    border: `2px solid ${isEnabled ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                    background: isEnabled ? '#3b82f6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}>
                    {isEnabled && <FontAwesomeIcon icon={faCheck} style={{ color: 'white', fontSize: '0.65rem' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {c.modality_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      {WEEKDAYS.find(w => w.key === c.weekday)?.label} {c.start_time}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600,
                    background: isEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                    color: isEnabled ? '#10b981' : 'rgba(255,255,255,0.3)',
                  }}>
                    {isEnabled ? 'Habilitada' : 'Desabilitada'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Nenhuma turma criada. Volte à etapa 3 para criar turmas.
          </div>
        )}
      </div>

      {/* CTA: Test the link — only show after enabling at least one class */}
      {trialBookingToken && trialEnabledClassIds.size > 0 && (
        <div
          className="onb-link-pulse"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '16px', padding: '24px', marginBottom: '28px', cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onClick={() => window.open(`${window.location.origin}/aula-experimental/${trialBookingToken}`, '_blank')}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ color: '#3b82f6', fontSize: '1.3rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>
                <span className="onb-point-bounce" style={{ display: 'inline-block', marginRight: '8px' }}>{'👉'}</span>
                Clique aqui para testar seu link!
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                Veja como seus prospects vão agendar uma aula experimental
              </div>
            </div>
            <FontAwesomeIcon icon={faArrowRight} style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'monospace', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {window.location.origin}/aula-experimental/{trialBookingToken}
          </div>
        </div>
      )}

      {/* Section: How it works - Flow */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: '#3b82f6' }}>
        Como funciona o fluxo
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <FlowStep num={1} icon={faLink} color="#3b82f6" title="Você compartilha o link"
          desc="Copie o link público de agendamento e envie para prospects via WhatsApp, Instagram, site ou redes sociais." />
        <FlowStep num={2} icon={faUsers} color="#8b5cf6" title="O prospect se cadastra"
          desc="Ele acessa o link, preenche nome e telefone, escolhe a modalidade e a turma, e seleciona uma data disponível." />
        <FlowStep num={3} icon={faBell} color="#f59e0b" title="Você recebe uma notificação"
          desc="Imediatamente ao agendar, você e seus instrutores recebem notificação. O aluno aparece na agenda da turma." />
        <FlowStep num={4} icon={faEye} color="#10b981" title="Acompanhe e converta"
          desc="Após a aula experimental, converta o prospect em aluno regular com um clique. Acompanhe métricas de conversão." />
      </div>

      {/* Section: Custom Links */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: '#ec4899' }}>
        <FontAwesomeIcon icon={faFilter} style={{ marginRight: '8px' }} />
        Links Personalizados
      </h3>
      <MockupCard label="Exemplo de links">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'Link Geral', desc: 'Todas as turmas disponíveis', color: '#3b82f6' },
            { name: 'Link Iniciantes', desc: 'Só turmas de iniciante', color: '#10b981' },
            { name: 'Link Kids', desc: 'Turmas infantis', color: '#f59e0b' },
            { name: 'Link Feminino', desc: 'Turmas femininas', color: '#ec4899' },
          ].map((link, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: link.color,
                }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{link.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{link.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                }}>
                  <FontAwesomeIcon icon={faCopy} style={{ marginRight: '4px' }} /> Copiar
                </div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '10px', lineHeight: 1.5 }}>
          Crie links filtrados por turma/nível para campanhas específicas. Ex: poste o link "Kids" no
          grupo de pais e o link "Iniciantes" na bio do Instagram.
        </p>
      </MockupCard>

      {/* Section: What happens after */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '28px', marginBottom: '12px', color: '#10b981' }}>
        <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
        Resultado do agendamento
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MockupCard label="Onde aparece">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: faCalendarDays, text: 'Na agenda semanal, junto com os alunos da turma', color: '#FF9900' },
              { icon: faUsers, text: 'Na lista de Alunos Experimentais com dados de contato', color: '#3b82f6' },
              { icon: faBell, text: 'Notificação push para você e instrutores da turma', color: '#f59e0b' },
              { icon: faMobileScreenButton, text: 'Instrutores veem o aluno experimental na turma pelo app', color: '#8b5cf6' },
              { icon: faChartLine, text: 'Dashboard de métricas: taxa de conversão, receita gerada', color: '#10b981' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FontAwesomeIcon icon={item.icon} style={{ color: item.color, width: '16px' }} />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </MockupCard>

        <MockupCard label="Conversão">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem',
              background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontWeight: 600,
            }}>
              Aluno Experimental
            </div>
            <FontAwesomeIcon icon={faArrowRight} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <div style={{
              padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem',
              background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600,
            }}>
              Aluno Regular
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: 1.5 }}>
            Após a aula, clique em "Converter" para transformar o prospect em aluno regular,
            criar matrícula e começar a cobrar. Um clique e pronto!
          </p>
        </MockupCard>
      </div>

      <div style={styles.infoBox}>
        Acesse <strong>Alunos Experimentais</strong> no menu lateral para configurar as turmas participantes,
        copiar seu link e criar links personalizados.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button style={styles.primaryBtn} onClick={next}>
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="onb-fade" key="step7">
      <div style={styles.stepIndicator}>ETAPA 7 DE 8</div>
      <h1 style={styles.stepTitle}>
        <FontAwesomeIcon icon={faBuilding} style={{ color: '#8b5cf6', marginRight: '12px', fontSize: '1.5rem' }} />
        Locação de Quadras
      </h1>
      <p style={styles.stepSubtitle}>
        Ofereça locação de quadras com <strong>link público de reserva</strong>. Seus clientes escolhem quadra,
        data e horário — tudo online, sem precisar te ligar.
      </p>

      {/* Step 1: Configure operating hours for each court */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', color: '#FF9900' }}>
          <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
          Configure os horários de cada quadra
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', lineHeight: 1.5 }}>
          Defina os horários de funcionamento e preço por hora de cada quadra. Esses horários aparecerão no link de reserva.
        </p>
        {createdCourts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {createdCourts.map(court => {
              const isConfigured = courtHoursConfigured.has(court.id);
              const isEditing = editingCourtHours === court.id;
              return (
                <div key={court.id} style={{
                  padding: '14px', borderRadius: '8px',
                  background: isConfigured ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isConfigured ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FontAwesomeIcon icon={faBuilding} style={{ color: isConfigured ? '#8b5cf6' : 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{court.name}</span>
                      {isConfigured && (
                        <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                          Configurada
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        style={{ ...styles.createBtn, padding: '6px 14px', fontSize: '0.78rem' }}
                        onClick={() => { setEditingCourtHours(court.id); setCourtHoursForm({ open: '08:00', close: '22:00', price: '', slot: 60 }); }}
                      >
                        <FontAwesomeIcon icon={faClock} /> {isConfigured ? 'Editar' : 'Definir Horários'}
                      </button>
                    )}
                  </div>
                  {isEditing && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, ...styles.formGroup }}>
                          <label style={styles.label}>Abertura</label>
                          <input type="time" style={styles.input} value={courtHoursForm.open}
                            onChange={e => setCourtHoursForm(p => ({ ...p, open: e.target.value }))} />
                        </div>
                        <div style={{ flex: 1, ...styles.formGroup }}>
                          <label style={styles.label}>Fechamento</label>
                          <input type="time" style={styles.input} value={courtHoursForm.close}
                            onChange={e => setCourtHoursForm(p => ({ ...p, close: e.target.value }))} />
                        </div>
                        <div style={{ flex: 1, ...styles.formGroup }}>
                          <label style={styles.label}>Preço/hora (R$)</label>
                          <input type="number" style={styles.input} value={courtHoursForm.price} placeholder="80"
                            onChange={e => setCourtHoursForm(p => ({ ...p, price: e.target.value }))} />
                        </div>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Duração do slot</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[30, 60, 90, 120].map(d => (
                            <div key={d}
                              style={{ ...styles.weekdayChip(courtHoursForm.slot === d), flex: 1, textAlign: 'center' as const }}
                              onClick={() => setCourtHoursForm(p => ({ ...p, slot: d }))}
                            >
                              {d >= 60 ? `${d / 60}h` : `${d}min`}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button style={{ ...styles.createBtn, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                          onClick={() => setEditingCourtHours(null)}>
                          Cancelar
                        </button>
                        <button style={{ ...styles.createBtn, opacity: loading ? 0.6 : 1 }}
                          onClick={() => handleSaveCourtHours(court.id)} disabled={loading}>
                          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                          Salvar Horários
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Nenhuma quadra criada. Volte à etapa 3 para criar quadras.
          </div>
        )}
      </div>

      {/* CTA: Test the link — only show after configuring at least one court */}
      {courtBookingToken && courtHoursConfigured.size > 0 && (
        <div
          className="onb-link-pulse"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '16px', padding: '24px', marginBottom: '28px', cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onClick={() => window.open(`${window.location.origin}/reservar/${courtBookingToken}`, '_blank')}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ color: '#8b5cf6', fontSize: '1.3rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>
                <span className="onb-point-bounce" style={{ display: 'inline-block', marginRight: '8px' }}>{'👉'}</span>
                Clique aqui para testar seu link de reserva!
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                Veja como seus clientes vão reservar uma quadra online
              </div>
            </div>
            <FontAwesomeIcon icon={faArrowRight} style={{ color: '#8b5cf6', fontSize: '1.2rem' }} />
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'monospace', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {window.location.origin}/reservar/{courtBookingToken}
          </div>
        </div>
      )}

      {/* Flow */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: '#8b5cf6' }}>
        Como funciona
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <FlowStep num={1} icon={faBuilding} color="#8b5cf6" title="Cadastre suas quadras"
          desc="Vá em Quadras no menu, crie cada quadra com nome, preço padrão e horários de funcionamento por dia da semana." />
        <FlowStep num={2} icon={faDollarSign} color="#f59e0b" title="Configure preços por horário"
          desc="Defina preços diferentes para cada dia e faixa horária. Ex: R$80 dias úteis, R$120 finais de semana. Configure duração do slot (30min, 1h, 1h30, 2h)." />
        <FlowStep num={3} icon={faShareAlt} color="#3b82f6" title="Compartilhe o link de reserva"
          desc="Copie o link público e divulgue. O cliente acessa, vê as quadras disponíveis, escolhe data/horário e confirma a reserva." />
        <FlowStep num={4} icon={faBell} color="#10b981" title="Receba e gerencie"
          desc="Você recebe notificação de cada reserva. A locação aparece automaticamente no seu painel — lista, agenda e dashboard." />
      </div>

      {/* Where rentals appear */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: '#FF9900' }}>
        <FontAwesomeIcon icon={faEye} style={{ marginRight: '8px' }} />
        Onde as locações aparecem
      </h3>
      <MockupCard label="Visões disponíveis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            {
              icon: faListOl, title: 'Lista de Locações', color: '#3b82f6',
              desc: 'Tabela com filtros por data, quadra, status e pagamento',
            },
            {
              icon: faCalendarDays, title: 'Agenda de Quadras', color: '#8b5cf6',
              desc: 'Grade semanal visual com blocos coloridos por quadra',
            },
            {
              icon: faChartLine, title: 'Dashboard Home', color: '#FF9900',
              desc: 'Agenda do dia com locações e turmas no mesmo lugar',
            },
            {
              icon: faCreditCard, title: 'Controle Financeiro', color: '#10b981',
              desc: 'Status de pagamento, registrar recebimento com um clique',
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <FontAwesomeIcon icon={item.icon} style={{ color: item.color, marginBottom: '8px', fontSize: '1.1rem' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </MockupCard>

      {/* Monthly renters */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '28px', marginBottom: '12px', color: '#ec4899' }}>
        <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: '8px' }} />
        Mensalistas de Quadra
      </h3>
      <div style={styles.featureCard}>
        <div style={{ ...styles.featureIcon, background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
          <FontAwesomeIcon icon={faLayerGroup} />
        </div>
        <div>
          <div style={styles.featureTitle}>Locações Recorrentes</div>
          <div style={styles.featureDesc}>
            Para clientes fixos, crie mensalistas com dia e horário fixo semanal. A cobrança é gerada
            automaticamente todo mês. O mensalista tem seu próprio painel para acompanhar reservas e pagamentos.
          </div>
        </div>
      </div>

      {/* Booking flow mockup */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '28px', marginBottom: '12px', color: '#3b82f6' }}>
        <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginRight: '8px' }} />
        O que o cliente vê no link
      </h3>
      <MockupCard label="Fluxo de reserva do cliente">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['Dados pessoais', 'Escolhe quadra', 'Escolhe data/hora', 'Confirma reserva', 'Recebe token'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                background: i < 4 ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)',
                color: i < 4 ? '#8b5cf6' : '#10b981',
                whiteSpace: 'nowrap' as const,
              }}>
                {step}
              </div>
              {i < 4 && <FontAwesomeIcon icon={faArrowRight} style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }} />}
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '10px', lineHeight: 1.5 }}>
          O cliente pode ver o status da reserva e acessar um painel pessoal com histórico de reservas —
          tudo sem precisar ligar ou enviar mensagem.
        </p>
      </MockupCard>

      <div style={styles.infoBox}>
        Configure suas quadras em <strong>Quadras</strong>, veja reservas em <strong>Locações</strong> e a agenda visual
        em <strong>Locações {'>'} Agenda</strong>. Para mensalistas, acesse <strong>Mensalistas</strong>.
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <button style={styles.primaryBtn} onClick={next}>
          Próximo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="onb-fade" key="step8">
      <div style={styles.stepIndicator}>ETAPA 8 DE 8</div>
      <h1 style={styles.stepTitle}>App, Comunicação e mais</h1>
      <p style={styles.stepSubtitle}>
        O ArenaAi oferece um ecossistema completo para conectar você com seus alunos.
      </p>

      {/* WhatsApp highlight section */}
      <div style={{
        background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)',
        borderRadius: '14px', padding: '22px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faWhatsapp} style={{ color: '#25D366', fontSize: '1.3rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>WhatsApp Gratuito</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Incluso em todos os planos, sem custo adicional</div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 16px 0' }}>
          Envie mensagens de WhatsApp para seus alunos com <strong style={{ color: '#25D366' }}>um clique</strong>.
          Basta clicar no ícone do WhatsApp na tela do aluno ou no financeiro para abrir uma conversa
          com a mensagem já pronta.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faCommentDots} style={{ color: '#25D366', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Templates personalizados</strong> — Configure vários modelos de mensagem
              em <strong>Preferências</strong>: cobrança, boas-vindas, lembrete de aula, aniversário...
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faUsers} style={{ color: '#25D366', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Na tela do aluno</strong> — Clique no botão WhatsApp e escolha
              o template. A mensagem abre já com nome e dados do aluno preenchidos.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#25D366', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>No financeiro</strong> — Envie cobrança via WhatsApp direto
              da lista de faturas com valor e vencimento já preenchidos no template.
            </span>
          </div>
        </div>

        <div style={{
          marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)',
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
        }}>
          Configure seus templates em <strong>Preferências {'>'} Templates WhatsApp</strong>. Você pode criar
          quantos quiser e selecionar na hora de enviar.
        </div>
      </div>

      {/* Avisos e Comunicados - detailed section */}
      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '14px', padding: '22px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faBullhorn} style={{ color: '#f59e0b', fontSize: '1.3rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Avisos e Comunicados</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Envie mensagens direto para o app dos seus alunos</div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 16px 0' }}>
          Comunique-se com seus alunos pelo <strong style={{ color: '#f59e0b' }}>app</strong> de forma rápida e organizada.
          Crie avisos com título e conteúdo, e seus alunos recebem instantaneamente no celular.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faEnvelope} style={{ color: '#f59e0b', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Tipos de aviso</strong> — Informativo, importante ou urgente.
              Cada tipo aparece com destaque diferente no app do aluno.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faFilter} style={{ color: '#f59e0b', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Segmentação</strong> — Envie para todos, por turma,
              por nível ou para alunos específicos. Alcance exatamente quem precisa.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faBell} style={{ color: '#f59e0b', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Notificação push</strong> — O aluno recebe no celular
              na hora. Perfeito para avisos de chuva, mudança de horário, eventos, etc.
            </span>
          </div>
        </div>

        <div style={{
          marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
        }}>
          Acesse <strong>Avisos</strong> no menu lateral para criar e gerenciar seus comunicados.
        </div>
      </div>

      {/* Formulários - detailed section */}
      <div style={{
        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '14px', padding: '22px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faClipboardList} style={{ color: '#8b5cf6', fontSize: '1.3rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Formulários Interativos</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Pesquisas, votações e enquetes com fotos</div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 16px 0' }}>
          Crie formulários personalizados e envie para seus alunos pelo app.
          Suporte a <strong style={{ color: '#8b5cf6' }}>imagens e fotos</strong> nas opções — perfeito para votações visuais!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faVoteYea} style={{ color: '#8b5cf6', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Escolha única ou múltipla</strong> — Perguntas com opções
              que o aluno seleciona. Ideal para pesquisas de satisfação e preferências.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faCamera} style={{ color: '#8b5cf6', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Opções com foto</strong> — Adicione imagens às opções!
              Use para votação de camisas, uniformes, modelos de troféu, etc.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faPen} style={{ color: '#8b5cf6', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Resposta aberta</strong> — Texto livre para sugestões,
              feedback detalhado ou qualquer informação que precisar coletar.
            </span>
          </div>
        </div>

        {/* Example use cases */}
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
          Exemplos de uso:
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {[
            { icon: faTshirt, label: 'Votação de camisas', color: '#ec4899' },
            { icon: faTrophy, label: 'Inscrição campeonato', color: '#f59e0b' },
            { icon: faClipboardList, label: 'Pesquisa satisfação', color: '#10b981' },
            { icon: faCalendarCheck, label: 'Confirmação de evento', color: '#3b82f6' },
          ].map((ex, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <FontAwesomeIcon icon={ex.icon} style={{ color: ex.color, fontSize: '0.8rem' }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{ex.label}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
        }}>
          Acesse <strong>Formulários</strong> no menu lateral. Crie quantas perguntas quiser,
          adicione fotos e envie para turmas ou alunos específicos.
        </div>
      </div>

      {/* Agenda Interativa - detailed section */}
      <div style={{
        background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)',
        borderRadius: '14px', padding: '22px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#ec4899', fontSize: '1.3rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Agenda Interativa</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Drag-and-drop, criação rápida e gestão visual</div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 16px 0' }}>
          A agenda semanal do ArenaAi é <strong style={{ color: '#ec4899' }}>totalmente interativa</strong>.
          Arraste, clique e gerencie todas as suas turmas visualmente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faGripVertical} style={{ color: '#ec4899', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Arrastar turmas</strong> — Mude o horário ou dia de uma turma
              simplesmente arrastando o bloco na agenda. Tudo atualiza automaticamente.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faMousePointer} style={{ color: '#ec4899', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Clique para criar</strong> — Clique em qualquer horário
              vazio na agenda e crie uma nova turma direto ali, sem sair da tela.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faUsers} style={{ color: '#ec4899', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Gerenciar alunos</strong> — Clique em uma turma na agenda
              para ver os alunos, verificar frequência, arrastar alunos entre turmas e mais.
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#ec4899', width: '16px' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Relatórios completos</strong> — Financeiro, frequência,
              inadimplência, evolução de alunos. Dados para tomar decisões com confiança.
            </span>
          </div>
        </div>

        <div style={{
          marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)',
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
        }}>
          Acesse <strong>Agenda</strong> no menu lateral para ver sua semana.
          Use <strong>Relatórios</strong> para análises financeiras e de frequência.
        </div>
      </div>

      {/* Remaining features as compact cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        <div style={styles.featureCard}>
          <div style={{ ...styles.featureIcon, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <FontAwesomeIcon icon={faMobileScreenButton} />
          </div>
          <div>
            <div style={styles.featureTitle}>App Mobile para Alunos</div>
            <div style={styles.featureDesc}>
              Turmas, faturas, horários, avisos, formulários e pagamento PIX direto no celular.
            </div>
          </div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ ...styles.featureIcon, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <div>
            <div style={styles.featureTitle}>Pagamentos pelo App</div>
            <div style={styles.featureDesc}>
              Alunos visualizam faturas e pagam diretamente pelo app com PIX.
            </div>
          </div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ ...styles.featureIcon, background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
            <FontAwesomeIcon icon={faChalkboardTeacher} />
          </div>
          <div>
            <div style={styles.featureTitle}>Instrutores</div>
            <div style={styles.featureDesc}>
              Cadastre instrutores com permissões granulares e vincule às turmas.
            </div>
          </div>
        </div>
      </div>

      {/* Celebration */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center' as const,
        background: 'linear-gradient(135deg, rgba(240,79,40,0.08), rgba(255,107,53,0.08))',
        border: '1px solid rgba(255,153,0,0.2)',
        borderRadius: '16px',
        padding: '32px 24px',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Você está pronto!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Sua arena está configurada. Cadastre seus alunos, compartilhe os links de aula experimental
          e locação, e comece a gerenciar tudo pelo ArenaAi.
        </p>
        <button
          style={{ ...styles.primaryBtn, padding: '16px 40px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
          onClick={handleComplete}
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : null}
          Ir para o Dashboard <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      <div style={styles.navRow}>
        <button style={styles.secondaryBtn} onClick={prev}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return renderStep1();
    }
  };

  return (
    <div style={styles.page}>
      <style>{fadeInCSS}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>ArenaAi</div>
        <button
          style={styles.skipBtn}
          onClick={handleSkip}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
            (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
            (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <FontAwesomeIcon icon={faForward} style={{ marginRight: '6px' }} />
          Pular onboarding
        </button>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={styles.progressSegment(
              i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'current' : 'future'
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.inner}>
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}
