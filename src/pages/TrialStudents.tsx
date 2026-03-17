import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  Calendar,
  Settings,
  BarChart3,
  X,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Link2,
  Plus,
  Edit3,
  ExternalLink,
  Send,
  Bell,
  Target,
  UserCheck,
  FileText,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { trialStudentService } from '../services/trialStudentService';
import { classService } from '../services/classService';
import CreateTrialStudentModal from '../components/CreateTrialStudentModal';
import ConvertTrialStudentModal from '../components/ConvertTrialStudentModal';
import type { TrialStudent, TrialMetrics, TrialReport } from '../types/trialStudentTypes';
import { useThemeStore } from '../store/themeStore';
import '../styles/TrialStudents.css';

const WEEKDAY_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
  sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual', public: 'Público', app: 'App',
};

export default function TrialStudents() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [students, setStudents] = useState<TrialStudent[]>([]);
  const [metrics, setMetrics] = useState<TrialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'inativo' | ''>('');
  const [expiredFilter, setExpiredFilter] = useState<'all' | 'expired' | 'active'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [studentToConvert, setStudentToConvert] = useState<TrialStudent | null>(null);
  const [studentToView, setStudentToView] = useState<TrialStudent | null>(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  // Trial class config state
  const [showConfigSection, setShowConfigSection] = useState(false);
  const [configInitialized, setConfigInitialized] = useState(false);
  const [trialClassConfigs, setTrialClassConfigs] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingToken, setBookingToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Booking links state
  const [bookingLinks, setBookingLinks] = useState<any[]>([]);
  const [showBookingLinksSection, setShowBookingLinksSection] = useState(false);
  const [linksInitialized, setLinksInitialized] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<any | null>(null);

  // Price settings state
  const [showTrialPrices, setShowTrialPrices] = useState(false);
  const [visiblePlanIds, setVisiblePlanIds] = useState<number[]>([]);
  const [allPlans, setAllPlans] = useState<Array<{ id: number; name: string; sessions_per_week: number; price_cents: number }>>([]);
  const [loadingPriceSettings, setLoadingPriceSettings] = useState(false);

  // Report state
  const [report, setReport] = useState<TrialReport | null>(null);
  const [showReportSection, setShowReportSection] = useState(false);
  const [showConvertedModal, setShowConvertedModal] = useState(false);

  // Attendance filter
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'absent' | 'pending' | 'cancelled' | 'contacted'>('all');

  // Sorting state
  type SortKey = 'name' | 'modality' | 'trial_date' | 'classes_count' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('trial_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Helper function to safely convert to number
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  useEffect(() => {
    fetchStudents();
    fetchMetrics();
    fetchTrialClassConfig();
    fetchUpcomingBookings();
    fetchAllClasses();
    fetchBookingLinks();
    fetchPriceSettings();
    fetchReport();
  }, [statusFilter, expiredFilter]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params: any = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (expiredFilter === 'expired') {
        params.expired = true;
      } else if (expiredFilter === 'active') {
        params.expired = false;
      }

      const response = await trialStudentService.getAll(params);

      if (response.status === 'success') {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching trial students:', error);
      toast.error('Erro ao carregar alunos experimentais');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await trialStudentService.getMetrics();

      if (response.status === 'success') {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o aluno experimental "${name}"?`)) {
      return;
    }

    try {
      const response = await trialStudentService.delete(id);

      if (response.status === 'success') {
        toast.success('Aluno experimental excluído com sucesso');
        fetchStudents();
        fetchMetrics();
      }
    } catch (error: any) {
      console.error('Error deleting trial student:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao excluir aluno experimental'
      );
    }
  };

  const handleSendFollowup = async (student: TrialStudent) => {
    if (!student.email && !student.phone) {
      toast.error('Aluno não possui e-mail nem telefone cadastrado');
      return;
    }

    try {
      const response = await trialStudentService.sendFollowup({
        trial_student_id: student.id,
        followup_type: student.email ? 'email' : 'whatsapp',
      });

      if (response.status === 'success') {
        toast.success('Follow-up enviado com sucesso!');
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error sending followup:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao enviar follow-up'
      );
    }
  };

  const [attendanceModalStudent, setAttendanceModalStudent] = useState<TrialStudent | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [notesModalStudent, setNotesModalStudent] = useState<TrialStudent | null>(null);
  const [notesModalValue, setNotesModalValue] = useState('');
  const [notesModalContacted, setNotesModalContacted] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const openNotesModal = (student: TrialStudent) => {
    setNotesModalStudent(student);
    setNotesModalValue(student.trial_notes || '');
    setNotesModalContacted(!!(student as any).trial_contacted);
  };

  const handleSaveNotes = async () => {
    if (!notesModalStudent) return;
    setSavingNotes(true);
    try {
      await trialStudentService.update(notesModalStudent.id, {
        trial_notes: notesModalValue || null,
        trial_contacted: notesModalContacted,
      });
      toast.success('Detalhes salvos');
      setNotesModalStudent(null);
      fetchStudents();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSetAttendance = async (student: TrialStudent, attended: boolean) => {
    if (!student.last_trial_attendance_id) return;
    setAttendanceLoading(true);
    try {
      const response = await trialStudentService.toggleAttendance(student.last_trial_attendance_id, attended);
      if (response.status === 'success') {
        setStudents(prev => prev.map(s =>
          s.id === student.id ? { ...s, last_trial_attended: response.data.attended } : s
        ));
        toast.success(attended ? 'Presença confirmada!' : 'Falta registrada');
        setAttendanceModalStudent(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar presença');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleOpenWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const fetchTrialClassConfig = async () => {
    try {
      const response = await trialStudentService.getTrialClassConfig();
      if (response.status === 'success') {
        setTrialClassConfigs(response.data);
        if (!configInitialized) {
          setConfigInitialized(true);
          // Expand only if no configs (not yet set up)
          const enabledConfigs = (response.data || []).filter((c: any) => c.is_enabled);
          if (enabledConfigs.length === 0) setShowConfigSection(true);
        }
      }
    } catch (error) {
      console.error('Error fetching trial class config:', error);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await classService.getClasses({ status: 'ativa', limit: 500 });
      if (response.success || response.data) {
        setAllClasses(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      const response = await trialStudentService.getUpcomingTrialBookings();
      if (response.status === 'success') {
        setUpcomingBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    }
  };

  const fetchBookingLinks = async () => {
    try {
      const response = await trialStudentService.getBookingLinks();
      if (response.status === 'success') {
        setBookingLinks(response.data);
        if (!linksInitialized) {
          setLinksInitialized(true);
          if ((response.data || []).length === 0) setShowBookingLinksSection(true);
        }
      }
    } catch (error) {
      console.error('Error fetching booking links:', error);
    }
  };

  const fetchPriceSettings = async () => {
    try {
      const response = await trialStudentService.getTrialPriceSettings();
      if (response.status === 'success') {
        setShowTrialPrices(response.data.show_trial_prices);
        setVisiblePlanIds(response.data.trial_visible_plan_ids || []);
        setAllPlans(response.data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching price settings:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await trialStudentService.getReport();
      if (response.status === 'success') {
        setReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const handleToggleTrialPrices = async (value: boolean) => {
    setLoadingPriceSettings(true);
    try {
      await trialStudentService.updateTrialPriceSettings({ show_trial_prices: value });
      setShowTrialPrices(value);
      toast.success(value ? 'Preços habilitados nos links' : 'Preços desabilitados nos links');
    } catch {
      toast.error('Erro ao atualizar configuração');
    } finally {
      setLoadingPriceSettings(false);
    }
  };

  const handleTogglePlanVisibility = async (planId: number) => {
    const newIds = visiblePlanIds.includes(planId)
      ? visiblePlanIds.filter(id => id !== planId)
      : [...visiblePlanIds, planId];
    setVisiblePlanIds(newIds);
    try {
      await trialStudentService.updateTrialPriceSettings({ trial_visible_plan_ids: newIds });
    } catch {
      toast.error('Erro ao atualizar planos');
      // revert
      setVisiblePlanIds(visiblePlanIds);
    }
  };

  const handleDeleteBookingLink = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o link "${name}"?`)) return;
    try {
      await trialStudentService.deleteBookingLink(id);
      toast.success('Link excluído com sucesso');
      fetchBookingLinks();
    } catch (error) {
      toast.error('Erro ao excluir link');
    }
  };

  const handleToggleBookingLink = async (link: any) => {
    try {
      await trialStudentService.updateBookingLink(link.id, { is_active: !link.is_active });
      toast.success(link.is_active ? 'Link desativado' : 'Link ativado');
      fetchBookingLinks();
    } catch (error) {
      toast.error('Erro ao atualizar link');
    }
  };

  const copyCustomBookingLink = (token: string) => {
    const link = `${window.location.origin}/aula-experimental/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleToggleClass = async (classId: number, currentConfig: any) => {
    try {
      if (currentConfig) {
        await trialStudentService.upsertTrialClassConfig({
          class_id: classId,
          is_enabled: !currentConfig.is_enabled,
          allow_overbooking: currentConfig.allow_overbooking || false,
          max_trial_per_day: currentConfig.max_trial_per_day || 2,
        });
      } else {
        await trialStudentService.upsertTrialClassConfig({
          class_id: classId,
          is_enabled: true,
          allow_overbooking: false,
          max_trial_per_day: 2,
        });
      }
      fetchTrialClassConfig();
    } catch (error) {
      console.error('Error toggling class:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleToggleOverbooking = async (config: any) => {
    try {
      await trialStudentService.upsertTrialClassConfig({
        class_id: config.class_id,
        is_enabled: config.is_enabled,
        allow_overbooking: !config.allow_overbooking,
        max_trial_per_day: config.max_trial_per_day,
      });
      fetchTrialClassConfig();
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleChangeMaxTrial = async (config: any, value: number) => {
    try {
      await trialStudentService.upsertTrialClassConfig({
        class_id: config.class_id,
        is_enabled: config.is_enabled,
        allow_overbooking: config.allow_overbooking,
        max_trial_per_day: value,
      });
      fetchTrialClassConfig();
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleShareLink = async () => {
    setGeneratingToken(true);
    try {
      // Try to get existing token first
      const getResponse = await trialStudentService.getBookingToken();
      if (getResponse.data?.booking_token) {
        setBookingToken(getResponse.data.booking_token);
        setShowShareModal(true);
      } else {
        // Generate new token
        const genResponse = await trialStudentService.generateBookingToken();
        if (genResponse.data?.booking_token) {
          setBookingToken(genResponse.data.booking_token);
          setShowShareModal(true);
        }
      }
    } catch (error) {
      console.error('Error generating booking token:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyBookingLink = () => {
    if (!bookingToken) return;
    const link = `${window.location.origin}/aula-experimental/${bookingToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  // Trial class config filter
  const [configModalityFilter, setConfigModalityFilter] = useState<string>('all');

  // Upcoming bookings modality filter
  const [bookingModalityFilter, setBookingModalityFilter] = useState<string>('all');

  // Get config map for quick lookup
  const configMap = new Map(trialClassConfigs.map((c: any) => [c.class_id, c]));

  // Classes not yet configured
  const unconfiguredClasses = allClasses.filter((c: any) => !configMap.has(c.id));

  // All classes (configured + unconfigured) merged for display
  const allClassesForConfig = [
    ...trialClassConfigs.map((c: any) => ({ ...c, isConfigured: true })),
    ...unconfiguredClasses.map((c: any) => ({
      class_id: c.id,
      class_name: c.name,
      modality_name: c.modality_name || c.modality || 'Sem modalidade',
      modality_id: c.modality_id,
      weekday: c.weekday,
      start_time: c.start_time,
      end_time: c.end_time,
      capacity: c.capacity || c.max_students,
      enrolled_count: c.enrolled_count || 0,
      color: c.color,
      is_enabled: false,
      allow_overbooking: false,
      max_trial_per_day: 2,
      isConfigured: false,
    })),
  ];

  // Get unique modalities
  const configModalities = [...new Set(allClassesForConfig.map((c: any) => c.modality_name || 'Sem modalidade'))].sort();

  // Filter + group by modality
  const filteredConfigClasses = configModalityFilter === 'all'
    ? allClassesForConfig
    : allClassesForConfig.filter((c: any) => (c.modality_name || 'Sem modalidade') === configModalityFilter);

  const configGroupedByModality: Record<string, any[]> = {};
  filteredConfigClasses.forEach((c: any) => {
    const mod = c.modality_name || 'Sem modalidade';
    if (!configGroupedByModality[mod]) configGroupedByModality[mod] = [];
    configGroupedByModality[mod].push(c);
  });

  // Sort classes within each modality by weekday then time
  const weekdayOrder = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  Object.values(configGroupedByModality).forEach(classes => {
    classes.sort((a: any, b: any) => {
      const wa = weekdayOrder.indexOf(a.weekday) ?? 99;
      const wb = weekdayOrder.indexOf(b.weekday) ?? 99;
      if (wa !== wb) return wa - wb;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  });

  const filteredStudents = students.filter((student) => {
    const removeAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const term = removeAccents(searchTerm.toLowerCase());
    const matchesSearch =
      removeAccents(student.full_name.toLowerCase()).includes(term) ||
      removeAccents((student.phone || '').toLowerCase()).includes(term) ||
      removeAccents((student.email || '').toLowerCase()).includes(term);

    if (!matchesSearch) return false;

    // Attendance filter
    if (attendanceFilter !== 'all') {
      const attended = student.last_trial_attended;
      const st = student as any;
      if (attendanceFilter === 'attended' && Number(attended) !== 1) return false;
      if (attendanceFilter === 'absent' && !(Number(attended) === 0 && attended !== null && attended !== undefined)) return false;
      if (attendanceFilter === 'pending' && (attended !== null && attended !== undefined)) return false;
      if (attendanceFilter === 'cancelled' && !(st.cancelled_count > 0 || st.last_trial_status === 'cancelada')) return false;
      if (attendanceFilter === 'contacted' && !st.trial_contacted) return false;
    }

    return true;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'name':
        return dir * a.full_name.localeCompare(b.full_name);
      case 'modality':
        return dir * (a.last_trial_modality_name || '').localeCompare(b.last_trial_modality_name || '');
      case 'trial_date': {
        const dateA = a.last_trial_date ? new Date(String(a.last_trial_date).split('T')[0]).getTime() : 0;
        const dateB = b.last_trial_date ? new Date(String(b.last_trial_date).split('T')[0]).getTime() : 0;
        return dir * (dateA - dateB);
      }
      case 'classes_count':
        return dir * ((a.trial_classes_count || 0) - (b.trial_classes_count || 0));
      case 'status': {
        const statusOrder = (s: TrialStudent) =>
          s.trial_converted_to_regular ? 3 : s.is_expired ? 2 : s.status === 'inativo' ? 1 : 0;
        return dir * (statusOrder(a) - statusOrder(b));
      }
      default:
        return 0;
    }
  });

  const getDaysRemaining = (student: TrialStudent): string | null => {
    if (!student.trial_expiration_date || !student.trial_retention_days) {
      return null;
    }

    const today = new Date();
    const expiration = new Date(student.trial_expiration_date);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expirado há ${Math.abs(diffDays)} dias`;
    } else if (diffDays === 0) {
      return 'Expira hoje';
    } else {
      return `${diffDays} dias restantes`;
    }
  };

  const getExpirationClass = (student: TrialStudent): string => {
    if (!student.trial_expiration_date || !student.trial_retention_days) {
      return 'unlimited';
    }

    if (student.is_expired) {
      return 'danger';
    }

    const today = new Date();
    const expiration = new Date(student.trial_expiration_date);
    const diffDays = Math.ceil(
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 3) {
      return 'danger';
    } else if (diffDays <= 7) {
      return 'warning';
    }

    return 'normal';
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="trial-metrics-grid">
        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">{metrics.active_trial_students}</h3>
              <p className="trial-metric-label">Alunos Ativos</p>
            </div>
            <div className="trial-metric-icon active">
              <Users />
            </div>
          </div>
        </div>

        <div className="trial-metric-card" onClick={() => metrics.converted_students > 0 && setShowConvertedModal(true)} style={{ cursor: metrics.converted_students > 0 ? 'pointer' : undefined }}>
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">{metrics.converted_students}</h3>
              <p className="trial-metric-label">Conversões</p>
            </div>
            <div className="trial-metric-icon converted">
              <CheckCircle />
            </div>
          </div>
          <span className="trial-metric-change positive">
            {metrics.converted_students > 0 ? 'Clique para ver detalhes' : `De ${metrics.total_trial_students} alunos experimentais`}
          </span>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                {safeNumber(metrics.conversion_rate_percentage).toFixed(1)}%
              </h3>
              <p className="trial-metric-label">Taxa de Conversão</p>
            </div>
            <div className="trial-metric-icon rate">
              <TrendingUp />
            </div>
          </div>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                {safeNumber(metrics.avg_days_to_convert).toFixed(0)}
              </h3>
              <p className="trial-metric-label">Dias até Conversão</p>
            </div>
            <div className="trial-metric-icon days">
              <Clock />
            </div>
          </div>
          <span className="trial-metric-change positive">Média</span>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                R${' '}
                {(safeNumber(metrics.total_conversion_value_cents) / 100).toLocaleString(
                  'pt-BR',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
              <p className="trial-metric-label">Receita das Conversões</p>
            </div>
            <div className="trial-metric-icon converted">
              <DollarSign />
            </div>
          </div>
        </div>

        {(metrics as any).total_with_attendance > 0 && (
          <div className="trial-metric-card">
            <div className="trial-metric-header">
              <div>
                <h3 className="trial-metric-value">
                  {(metrics as any).attended_students}/{(metrics as any).total_with_attendance}
                </h3>
                <p className="trial-metric-label">Presentes / Total</p>
              </div>
              <div className="trial-metric-icon active">
                <UserCheck />
              </div>
            </div>
            <span className="trial-metric-change positive">
              {(metrics as any).total_with_attendance > 0
                ? `${(((metrics as any).attended_students / (metrics as any).total_with_attendance) * 100).toFixed(1)}% compareceram`
                : ''}
            </span>
          </div>
        )}

        {(metrics as any).attended_students > 0 && (
          <div className="trial-metric-card">
            <div className="trial-metric-header">
              <div>
                <h3 className="trial-metric-value">
                  {metrics.converted_students}/{(metrics as any).attended_students}
                </h3>
                <p className="trial-metric-label">Matriculados / Presentes</p>
              </div>
              <div className="trial-metric-icon converted">
                <Target />
              </div>
            </div>
            <span className="trial-metric-change positive">
              {(metrics as any).attended_students > 0
                ? `${((metrics.converted_students / (metrics as any).attended_students) * 100).toFixed(1)}% dos presentes matricularam`
                : ''}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="trial-students-page">
      {/* Header */}
      <div className="trial-students-header">
        <h1>
          Alunos Experimentais
          <span className="trial-badge">Experimental</span>
        </h1>

        <div className="trial-students-actions">
          <button
            className="btn-secondary"
            onClick={handleShareLink}
            disabled={generatingToken}
            title="Compartilhar Link de Aula Experimental"
          >
            <Share2 size={18} style={{ marginRight: '0.5rem' }} />
            {generatingToken ? 'Gerando...' : 'Compartilhar Link'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowEmailConfig(true)}
            title="Configurar Emails Automáticos"
          >
            <Settings size={18} style={{ marginRight: '0.5rem' }} />
            Configurações
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
            Novo Aluno Experimental
          </button>
        </div>
      </div>

      {/* Como funciona o fluxo */}
      <div className="trial-config-section">
        <div className="trial-config-header" style={{ cursor: 'default' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            Como funciona o fluxo
          </h2>
        </div>
        <div className="trial-config-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { icon: <Send size={20} />, color: '#3B82F6', title: 'Você compartilha o link', desc: 'Envie o link de aula experimental para seus prospects via WhatsApp, redes sociais ou site.' },
              { icon: <UserPlus size={20} />, color: '#8B5CF6', title: 'O prospect se cadastra', desc: 'Ele escolhe a turma, seleciona o dia e preenche seus dados.' },
              { icon: <Bell size={20} />, color: '#F59E0B', title: 'Você recebe uma notificação', desc: 'O sistema avisa sobre o novo agendamento de aula experimental.' },
              { icon: <Target size={20} />, color: '#10B981', title: 'Acompanhe e converta', desc: 'Gerencie os experimentais aqui e converta-os em alunos matriculados.' },
            ].map((step, i) => (
              <div key={i} style={{
                background: `${step.color}10`, border: `1px solid ${step.color}30`,
                borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step.color, fontWeight: 600 }}>
                  {step.icon}
                  <span style={{ fontSize: '0.875rem' }}>{step.title}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trial Class Config Section */}
      <div className="trial-config-section">
        <div
          className="trial-config-header"
          onClick={() => setShowConfigSection(!showConfigSection)}
          style={{ cursor: 'pointer' }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} />
            Turmas Habilitadas para Aula Experimental
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 400 }}>
              ({trialClassConfigs.filter((c: any) => c.is_enabled).length} ativas)
            </span>
          </h2>
          {showConfigSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showConfigSection && (
          <div className="trial-config-body">
            {/* Modality filter */}
            <div className="trial-config-filters">
              <button
                className={`trial-config-filter-btn ${configModalityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setConfigModalityFilter('all')}
              >
                Todas ({allClassesForConfig.length})
              </button>
              {configModalities.map(mod => {
                const count = allClassesForConfig.filter((c: any) => (c.modality_name || 'Sem modalidade') === mod).length;
                const enabledCount = allClassesForConfig.filter((c: any) => (c.modality_name || 'Sem modalidade') === mod && c.is_enabled).length;
                return (
                  <button
                    key={mod}
                    className={`trial-config-filter-btn ${configModalityFilter === mod ? 'active' : ''}`}
                    onClick={() => setConfigModalityFilter(mod)}
                  >
                    {mod}
                    {enabledCount > 0 && (
                      <span className="trial-config-filter-count">{enabledCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grouped by modality */}
            {Object.entries(configGroupedByModality).map(([modality, classes]) => {
              const enabledInGroup = classes.filter((c: any) => c.is_enabled).length;
              return (
                <div key={modality} className="trial-config-modality-group">
                  <div className="trial-config-modality-header">
                    <span className="trial-config-modality-name">{modality}</span>
                    <span className="trial-config-modality-count">
                      {enabledInGroup}/{classes.length} habilitadas
                    </span>
                  </div>
                  <div className="trial-config-classes-grid">
                    {classes.map((config: any) => {
                      const classId = config.class_id;
                      const existingConfig = configMap.get(classId);
                      return (
                        <div
                          key={classId}
                          className={`trial-config-class-card ${config.is_enabled ? 'enabled' : 'disabled'}`}
                        >
                          <div className="trial-config-class-top">
                            <div className="trial-config-class-info">
                              <span
                                className="trial-config-class-dot"
                                style={{ background: config.color || '#3B82F6' }}
                              />
                              <div>
                                <div className="trial-config-class-name">{config.class_name || '-'}</div>
                                <div className="trial-config-class-schedule">
                                  {WEEKDAY_LABELS[config.weekday] || config.weekday} · {config.start_time?.slice(0,5)} - {config.end_time?.slice(0,5)}
                                </div>
                              </div>
                            </div>
                            <button
                              className="trial-toggle-btn"
                              onClick={() => handleToggleClass(classId, existingConfig || null)}
                              style={{ color: config.is_enabled ? '#22c55e' : '#ccc' }}
                            >
                              {config.is_enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </div>

                          {config.is_enabled && (
                            <div className="trial-config-class-options">
                              <div className="trial-config-class-stat">
                                <span className="trial-config-stat-label">Vagas</span>
                                <span style={{ color: (config.enrolled_count || 0) >= (config.capacity || 20) ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                                  {config.enrolled_count || 0}/{config.capacity || 20}
                                </span>
                              </div>
                              <div className="trial-config-class-stat">
                                <span className="trial-config-stat-label">Overbooking</span>
                                <button
                                  className="trial-toggle-btn"
                                  onClick={() => handleToggleOverbooking(existingConfig || config)}
                                  style={{ color: config.allow_overbooking ? '#22c55e' : '#ccc' }}
                                >
                                  {config.allow_overbooking ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                </button>
                              </div>
                              <div className="trial-config-class-stat">
                                <span className="trial-config-stat-label">Max/dia</span>
                                <select
                                  value={config.max_trial_per_day}
                                  onChange={(e) => handleChangeMaxTrial(existingConfig || config, parseInt(e.target.value))}
                                  className="trial-config-max-select"
                                >
                                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {allClassesForConfig.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>
                Nenhuma turma ativa encontrada. Crie turmas na seção de Turmas primeiro.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price visibility settings - own section */}
      <div className="trial-config-section">
        <div className="trial-config-header" style={{ cursor: 'default' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} />
            Exibição de Preços nos Links
          </h2>
          <button
            type="button"
            onClick={() => handleToggleTrialPrices(!showTrialPrices)}
            disabled={loadingPriceSettings}
            style={{
              width: '52px', height: '28px', borderRadius: '14px', border: 'none',
              background: showTrialPrices ? '#22C55E' : (isDark ? '#404040' : '#D1D5DB'),
              cursor: loadingPriceSettings ? 'wait' : 'pointer',
              position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: isDark ? '#e0e0e0' : 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              position: 'absolute', top: '3px',
              left: showTrialPrices ? '27px' : '3px',
              transition: 'left 0.2s ease',
            }} />
          </button>
        </div>

        <div className="trial-config-body">
          <p style={{ fontSize: '0.875rem', color: isDark ? '#a0a0a0' : '#666', marginBottom: showTrialPrices ? '1rem' : 0 }}>
            {showTrialPrices
              ? 'Os preços dos planos selecionados serão exibidos no link global e nos links personalizados que tiverem preços habilitados.'
              : 'Os preços dos planos estão ocultos em todos os links de aula experimental.'}
          </p>

          {showTrialPrices && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: isDark ? '#f0f0f0' : '#374151', marginBottom: '8px' }}>
                Planos a exibir no link global:
              </div>
              {allPlans.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: isDark ? '#6b6b6b' : '#999' }}>
                  Nenhum plano ativo encontrado. Crie planos na seção de Planos.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allPlans.map((plan) => (
                    <label
                      key={plan.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                        background: visiblePlanIds.includes(plan.id)
                          ? (isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5')
                          : (isDark ? '#141414' : 'white'),
                        border: `1px solid ${visiblePlanIds.includes(plan.id)
                          ? (isDark ? '#22c55e' : '#86EFAC')
                          : (isDark ? '#262626' : '#E5E7EB')}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visiblePlanIds.includes(plan.id)}
                        onChange={() => handleTogglePlanVisibility(plan.id)}
                        style={{ accentColor: '#22C55E' }}
                      />
                      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: isDark ? '#f0f0f0' : '#1F2937' }}>
                        {plan.name}
                        {plan.sessions_per_week > 0 && (
                          <span style={{ color: isDark ? '#a0a0a0' : '#6B7280', fontWeight: 400 }}> · {plan.sessions_per_week}x/sem</span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#34d399' : '#059669' }}>
                        R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: isDark ? '#6b6b6b' : '#9CA3AF', marginTop: '8px' }}>
                Links personalizados podem ter seus próprios planos selecionados ao criar/editar.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Custom Booking Links Section */}
      <div className="trial-config-section">
        <div
          className="trial-config-header"
          onClick={() => setShowBookingLinksSection(!showBookingLinksSection)}
          style={{ cursor: 'pointer' }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link2 size={20} />
            Links Personalizados
            <span style={{ fontSize: '0.8rem', color: isDark ? '#a0a0a0' : '#666', fontWeight: 400 }}>
              ({bookingLinks.filter((l: any) => l.is_active).length} ativos)
            </span>
          </h2>
          {showBookingLinksSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showBookingLinksSection && (
          <div className="trial-config-body">
            <p style={{ fontSize: '0.875rem', color: isDark ? '#a0a0a0' : '#666', marginBottom: '1rem' }}>
              Crie links de agendamento que mostram apenas turmas específicas. Ideal para divulgar modalidades separadamente.
            </p>

            <button
              className="btn-primary"
              onClick={() => { setEditingLink(null); setShowCreateLinkModal(true); }}
              style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} /> Criar Link Personalizado
            </button>

            {bookingLinks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '1.5rem 0' }}>
                Nenhum link personalizado criado. O link global continua funcionando normalmente.
              </p>
            ) : (
              <div className="booking-links-list">
                {bookingLinks.map((link: any) => (
                  <div key={link.id} className={`booking-link-card ${link.is_active ? 'active' : 'inactive'}`}>
                    <div className="booking-link-top">
                      <div className="booking-link-info">
                        <div className="booking-link-name">
                          {link.name}
                          {!link.is_active && (
                            <span className="booking-link-inactive-badge">Inativo</span>
                          )}
                        </div>
                        <div className="booking-link-classes">
                          {link.classes && link.classes.length > 0 ? (
                            link.classes.map((c: any) => (
                              <span key={c.id} className="booking-link-class-badge">
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>
                              {link.class_ids?.length || 0} turma(s)
                            </span>
                          )}
                          {link.show_prices && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                              background: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                              color: isDark ? '#34d399' : '#059669', fontWeight: 500,
                            }}>
                              <DollarSign size={10} /> Preços
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="booking-link-actions">
                        <button
                          className="trial-toggle-btn"
                          onClick={() => handleToggleBookingLink(link)}
                          style={{ color: link.is_active ? '#22c55e' : '#ccc' }}
                          title={link.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {link.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                        <button
                          className="trial-action-btn"
                          onClick={() => copyCustomBookingLink(link.token)}
                          title="Copiar link"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="trial-action-btn"
                          onClick={() => { setEditingLink(link); setShowCreateLinkModal(true); }}
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="trial-action-btn delete"
                          onClick={() => handleDeleteBookingLink(link.id, link.name)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="booking-link-url">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/aula-experimental/${link.token}`}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Trial Bookings Mini Agenda */}
      {upcomingBookings.length > 0 && (() => {
        const bookingModalities = [...new Set(upcomingBookings.map((b: any) => b.modality_name || 'Sem modalidade'))].sort();
        const filteredBookings = bookingModalityFilter === 'all'
          ? upcomingBookings
          : upcomingBookings.filter((b: any) => (b.modality_name || 'Sem modalidade') === bookingModalityFilter);

        return (
          <div className="trial-upcoming-section">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Próximos Agendamentos (7 dias)
            </h2>

            {bookingModalities.length > 1 && (
              <div className="trial-config-filters" style={{ marginBottom: '1rem' }}>
                <button
                  className={`trial-config-filter-btn ${bookingModalityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBookingModalityFilter('all')}
                >
                  Todas ({upcomingBookings.length})
                </button>
                {bookingModalities.map(mod => {
                  const count = upcomingBookings.filter((b: any) => (b.modality_name || 'Sem modalidade') === mod).length;
                  return (
                    <button
                      key={mod}
                      className={`trial-config-filter-btn ${bookingModalityFilter === mod ? 'active' : ''}`}
                      onClick={() => setBookingModalityFilter(mod)}
                    >
                      {mod}
                      <span className="trial-config-filter-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="trial-upcoming-list">
              {filteredBookings.length === 0 ? (
                <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '1rem 0' }}>Nenhum agendamento para esta modalidade</p>
              ) : (() => {
                const grouped: Record<string, any[]> = {};
                filteredBookings.forEach((b: any) => {
                  const dateKey = b.attendance_date?.split('T')[0] || b.attendance_date;
                  if (!grouped[dateKey]) grouped[dateKey] = [];
                  grouped[dateKey].push(b);
                });
                return Object.entries(grouped).map(([date, bookings]) => (
                  <div key={date} className="trial-upcoming-day">
                    <div className="trial-upcoming-date">
                      {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                      <span className="trial-upcoming-count">{bookings.length}</span>
                    </div>
                    <div className="trial-upcoming-bookings">
                      {bookings.map((b: any) => (
                        <div key={b.id} className="trial-upcoming-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', opacity: b.status === 'cancelada' ? 0.6 : 1 }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: b.status === 'cancelada' ? '#9CA3AF' : (b.color || '#3B82F6'), flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, textDecoration: b.status === 'cancelada' ? 'line-through' : 'none' }}>{b.student_name}</span>
                          <span style={{ color: isDark ? '#aaa' : '#666' }}>{b.class_name} · {b.start_time?.slice(0,5)}-{b.end_time?.slice(0,5)}</span>
                          {b.student_phone && (
                            <span style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#888' }}>{b.student_phone}</span>
                          )}
                          <span className={`trial-source-badge ${b.booking_source}`}>
                            {SOURCE_LABELS[b.booking_source] || b.booking_source}
                          </span>
                          {b.status === 'cancelada' ? (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: '#fef2f2', color: '#dc2626', fontWeight: 600, border: '1px solid #fecaca' }}>Cancelada</span>
                          ) : b.attended === null || b.attended === undefined ? (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: isDark ? '#333' : '#f3f4f6', color: isDark ? '#aaa' : '#6b7280', fontWeight: 500 }}>Pendente</span>
                          ) : Number(b.attended) === 1 ? (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>Compareceu</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>Faltou</span>
                          )}
                          {b.trial_notes && (
                            <span style={{ fontSize: '0.75rem', color: isDark ? '#999' : '#888', fontStyle: 'italic' }} title={b.trial_notes}>
                              Obs: {b.trial_notes.length > 30 ? b.trial_notes.slice(0, 30) + '...' : b.trial_notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        );
      })()}

      {/* Metrics */}
      {renderMetrics()}

      {/* Report Section */}
      {report && (report.monthly.length > 0 || report.by_modality.length > 0 || (report.by_class && report.by_class.length > 0) || (report.by_plan && report.by_plan.length > 0)) && (
        <div className="trial-config-section" style={{ marginBottom: '1.5rem' }}>
          <div
            className="trial-config-header"
            onClick={() => setShowReportSection(!showReportSection)}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} />
              Relatório de Conversão
            </h2>
            {showReportSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {showReportSection && (
            <div style={{ padding: '1.5rem' }}>
              <div className="trial-report-grid">
                {/* Monthly conversion chart */}
                {report.monthly.length > 0 && (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Conversão Mensal</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={report.monthly.map(m => ({
                        ...m,
                        label: (() => {
                          const [y, mo] = m.month.split('-');
                          const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                          return months[parseInt(mo) - 1] || m.month;
                        })(),
                        nao_convertidos: m.total - m.converted,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                        <XAxis dataKey="label" tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                        />
                        <Legend />
                        <Bar dataKey="converted" name="Convertidos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="nao_convertidos" name="Não convertidos" fill={isDark ? '#444' : '#e0e0e0'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Modality conversion pie */}
                {report.by_modality.length > 0 && (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Conversão por Modalidade</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={report.by_modality}
                          dataKey="total"
                          nameKey="modality_name"
                          cx="50%" cy="50%"
                          outerRadius={90}
                          label={({ modality_name, conversion_rate }) => `${modality_name} (${conversion_rate}%)`}
                          labelLine={true}
                        >
                          {report.by_modality.map((_, i) => (
                            <Cell key={i} fill={['#667eea','#38ef7d','#f5576c','#4facfe','#f093fb','#ffd700','#ff6b6b','#48dbfb'][i % 8]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                          formatter={(value: number, name: string, props: any) => [`${value} alunos (${props.payload.converted} convertidos)`, props.payload.modality_name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Weekday conversion chart */}
                {report.by_weekday.length > 0 && (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Conversão por Dia da Semana</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={report.by_weekday.map(w => ({
                        ...w,
                        label: WEEKDAY_LABELS[w.weekday] || w.weekday,
                        nao_convertidos: w.total - w.converted,
                      }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <YAxis dataKey="label" type="category" width={80} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                        />
                        <Legend />
                        <Bar dataKey="converted" name="Convertidos" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="nao_convertidos" name="Não convertidos" fill={isDark ? '#444' : '#e0e0e0'} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Days to convert distribution */}
                {report.by_days_to_convert && report.by_days_to_convert.length > 0 && (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Tempo até Conversão</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={report.by_days_to_convert}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                        <XAxis dataKey="range_label" tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                          formatter={(value: number) => [`${value} alunos`, 'Convertidos']}
                        />
                        <Bar dataKey="count" name="Alunos" fill="#4facfe" radius={[4, 4, 0, 0]}>
                          {report.by_days_to_convert.map((_, i) => (
                            <Cell key={i} fill={['#22c55e','#4facfe','#f5a623','#f093fb','#f5576c'][i % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Most chosen plans */}
                {report.by_plan && report.by_plan.length > 0 && (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Planos Mais Escolhidos</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={report.by_plan}
                          dataKey="count"
                          nameKey="plan_name"
                          cx="50%" cy="50%"
                          outerRadius={90}
                          label={({ plan_name, count }) => `${plan_name} (${count})`}
                          labelLine={true}
                        >
                          {report.by_plan.map((_, i) => (
                            <Cell key={i} fill={['#667eea','#22c55e','#f5576c','#4facfe','#f093fb','#ffd700','#ff6b6b','#48dbfb'][i % 8]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                          formatter={(value: number, name: string, props: any) => {
                            const price = props.payload.price_cents;
                            const formatted = price ? `R$ ${(price / 100).toFixed(2).replace('.', ',')}` : '';
                            return [`${value} alunos${formatted ? ` • ${formatted}` : ''}`, props.payload.plan_name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Monthly attendance: Total vs Presentes */}
              {(report as any).monthly_attendance && (report as any).monthly_attendance.length > 0 && (
                <div className="trial-report-chart-card">
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Total de Alunos x Presentes (Mensal)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={(report as any).monthly_attendance.map((m: any) => ({
                      ...m,
                      label: (() => {
                        const [y, mo] = m.month.split('-');
                        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                        return months[parseInt(mo) - 1] || m.month;
                      })(),
                      not_attended: m.total - m.attended,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                      <XAxis dataKey="label" tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                        labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                        itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'Presentes') return [`${value} (${props.payload.total > 0 ? ((value / props.payload.total) * 100).toFixed(0) : 0}%)`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="attended" name="Presentes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Faltaram" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pendentes" fill={isDark ? '#555' : '#d1d5db'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Funnel: Total -> Presentes -> Matriculados */}
              {(report as any).funnel && (report as any).funnel.total_students > 0 && (() => {
                const f = (report as any).funnel;
                const funnelChartData = [
                  { name: 'Total Experimentais', value: f.total_students, fill: '#3B82F6' },
                  { name: 'Com Agendamento', value: f.with_booking, fill: '#8B5CF6' },
                  { name: 'Presentes', value: f.attended, fill: '#22c55e' },
                  { name: 'Matriculados', value: f.converted, fill: '#f59e0b' },
                ];
                return (
                  <div className="trial-report-chart-card">
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Funil: Presentes x Matriculados</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={funnelChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" width={130} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                          labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                          itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                          formatter={(value: number, _: string, props: any) => {
                            const pct = f.total_students > 0 ? ((value / f.total_students) * 100).toFixed(1) : '0';
                            return [`${value} (${pct}% do total)`, props.payload.name];
                          }}
                        />
                        <Bar dataKey="value" name="Alunos" radius={[0, 4, 4, 0]}>
                          {funnelChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Conversion by class/turma - horizontal bar, full width at bottom */}
              {report.by_class && report.by_class.length > 0 && (
                <div className="trial-report-chart-card" style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>Conversão por Turma</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={report.by_class.map(c => ({
                      ...c,
                      label: `${c.class_name} (${WEEKDAY_LABELS[c.weekday] || c.weekday} ${c.start_time?.slice(0, 5) || ''})`,
                      nao_convertidos: c.total - c.converted,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                      <XAxis dataKey="label" tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fill: isDark ? '#aaa' : '#666', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, borderRadius: 8 }}
                        labelStyle={{ color: isDark ? '#f0f0f0' : '#333' }}
                        itemStyle={{ color: isDark ? '#ccc' : '#555' }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'Convertidos') return [`${value} (${props.payload.conversion_rate}%)`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="converted" name="Convertidos" fill="#667eea" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nao_convertidos" name="Não convertidos" fill={isDark ? '#444' : '#e0e0e0'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="trial-filters">
        <div className="trial-filters-row">
          <div className="trial-filter-item">
            <label>
              <Search size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="trial-filter-item">
            <label>
              <Filter size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div className="trial-filter-item">
            <label>
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Expiração
            </label>
            <select
              value={expiredFilter}
              onChange={(e) => setExpiredFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="active">Não Expirados</option>
              <option value="expired">Expirados</option>
            </select>
          </div>

          <div className="trial-filter-item">
            <label>
              <UserCheck size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Presença
            </label>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="attended">Presentes</option>
              <option value="absent">Faltantes</option>
              <option value="cancelled">Cancelados pelo aluno</option>
              <option value="contacted">Contatados</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="trial-students-table-container">
        {isLoading ? (
          <div className="trial-loading">
            <div className="trial-loading-spinner"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="trial-empty-state">
            <div className="trial-empty-state-icon">
              <Users size={80} />
            </div>
            <h3>Nenhum aluno experimental encontrado</h3>
            <p>
              {searchTerm
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro aluno experimental'}
            </p>
            {!searchTerm && (
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '1rem' }}
              >
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                Criar Primeiro Aluno
              </button>
            )}
          </div>
        ) : (
          <table className="trial-students-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Nome {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Contato</th>
                <th onClick={() => handleSort('modality')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Modalidade {sortKey === 'modality' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('trial_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Aula Experimental {sortKey === 'trial_date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('classes_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Aulas {sortKey === 'classes_count' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Detalhes</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const daysRemaining = getDaysRemaining(student);
                const expirationClass = getExpirationClass(student);

                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                      {!!student.trial_converted_to_regular && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#1976d2',
                            marginTop: '0.25rem',
                          }}
                        >
                          ✓ Convertido
                        </div>
                      )}
                      {!student.trial_converted_to_regular && Number(student.last_trial_attended) === 0 && student.last_trial_attended !== null && student.last_trial_attended !== undefined && student.last_trial_date && new Date(String(student.last_trial_date).split('T')[0] + 'T12:00:00') < new Date() && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#dc2626',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            marginTop: '0.25rem',
                            display: 'inline-block',
                          }}
                        >
                          ⚠ Já faltou
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {student.phone && (
                          <div>
                            {student.phone}
                          </div>
                        )}
                        {student.email && (
                          <div style={{ color: '#666' }}>
                            {student.email}
                          </div>
                        )}
                        {!student.phone && !student.email && (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {student.last_trial_modality_name ? (
                        <span style={{ fontSize: '0.875rem' }}>
                          {student.last_trial_modality_name}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td>
                      {student.last_trial_date ? (
                        <div style={{ fontSize: '0.825rem' }}>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {Number(student.last_trial_attended) === 1 ? (
                              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem', background: '#16a34a', borderRadius: '4px', padding: '1px 6px' }} title="Compareceu">✓</span>
                            ) : Number(student.last_trial_attended) === 0 && student.last_trial_attended !== null && student.last_trial_attended !== undefined && new Date(String(student.last_trial_date).split('T')[0] + 'T12:00:00') < new Date() ? (
                              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem', background: '#dc2626', borderRadius: '4px', padding: '1px 6px' }} title="Faltou">✗</span>
                            ) : null}
                            {(() => {
                              const raw = String(student.last_trial_date).split('T')[0];
                              const [y, m, d] = raw.split('-');
                              return `${d}/${m}`;
                            })()}
                            {student.last_trial_time && ` · ${String(student.last_trial_time).slice(0, 5)}`}
                          </div>
                          {student.last_trial_class_name && (
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.15rem' }}>
                              {student.last_trial_class_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {student.trial_classes_count || 0}
                      </span>
                    </td>
                    <td>
                      <div
                        onClick={() => openNotesModal(student)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}
                        title={student.trial_notes || 'Clique para adicionar observação'}
                      >
                        <FileText
                          size={16}
                          style={{ flexShrink: 0, marginTop: 1 }}
                          color={
                            (student as any).trial_contacted
                              ? '#16a34a'
                              : student.trial_notes
                                ? '#f59e0b'
                                : isDark ? '#555' : '#ccc'
                          }
                        />
                        {student.trial_notes ? (
                          <span style={{ fontSize: '0.8rem', color: isDark ? '#ccc' : '#555', lineHeight: 1.3 }}>
                            {student.trial_notes.length > 40 ? student.trial_notes.slice(0, 40) + '...' : student.trial_notes}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: isDark ? '#555' : '#bbb', fontStyle: 'italic' }}>
                            Adicionar obs.
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {student.trial_converted_to_regular ? (
                        <span className="trial-status-badge converted">
                          Convertido
                        </span>
                      ) : (student as any).last_trial_status === 'cancelada' ? (
                        <span className="trial-status-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                          Cancelada
                        </span>
                      ) : Number(student.last_trial_attended) === 1 ? (
                        <span className="trial-status-badge" style={{ background: '#dcfce7', color: '#16a34a' }}>
                          Presente
                        </span>
                      ) : Number(student.last_trial_attended) === 0 && student.last_trial_attended !== null && student.last_trial_attended !== undefined ? (
                        <span className="trial-status-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          Faltou
                        </span>
                      ) : (student as any).trial_contacted ? (
                        <span className="trial-status-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                          Contatado
                        </span>
                      ) : student.is_expired ? (
                        <span className="trial-status-badge expired">
                          Expirado
                        </span>
                      ) : student.last_trial_attendance_id ? (
                        <span className="trial-status-badge active">Agendado</span>
                      ) : (
                        <span className="trial-status-badge" style={{ background: isDark ? '#333' : '#f3f4f6', color: isDark ? '#aaa' : '#6b7280' }}>
                          Novo
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="trial-actions">
                        {student.last_trial_attendance_id && (
                          <button
                            className="trial-action-btn"
                            onClick={() => setAttendanceModalStudent(student)}
                            title="Registrar presença"
                            style={{
                              color: Number(student.last_trial_attended) === 1 ? '#22c55e' : Number(student.last_trial_attended) === 0 && student.last_trial_attended !== null && student.last_trial_attended !== undefined && student.last_trial_date && new Date(student.last_trial_date) < new Date() ? '#ef4444' : '#999',
                              background: Number(student.last_trial_attended) === 1 ? '#f0fdf4' : Number(student.last_trial_attended) === 0 && student.last_trial_attended !== null && student.last_trial_attended !== undefined && student.last_trial_date && new Date(student.last_trial_date) < new Date() ? '#fef2f2' : undefined,
                            }}
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        {!student.trial_converted_to_regular && (
                          <>
                            <button
                              className="trial-action-btn convert"
                              onClick={() => setStudentToConvert(student)}
                              title="Converter para Aluno Regular"
                            >
                              <CheckCircle size={18} />
                            </button>
                            {student.phone && (
                              <button
                                className="trial-action-btn"
                                onClick={() => handleOpenWhatsApp(student.phone)}
                                title="Abrir WhatsApp"
                                style={{ color: '#25D366' }}
                              >
                                <FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: 18 }} />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="trial-action-btn"
                          onClick={() => setStudentToView(student)}
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {!student.trial_converted_to_regular && (
                          <button
                            className="trial-action-btn delete"
                            onClick={() =>
                              handleDelete(student.id, student.full_name)
                            }
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTrialStudentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchStudents();
            fetchMetrics();
          }}
        />
      )}

      {studentToConvert && (
        <ConvertTrialStudentModal
          trialStudent={studentToConvert}
          onClose={() => setStudentToConvert(null)}
          onSuccess={() => {
            fetchStudents();
            fetchMetrics();
          }}
        />
      )}

      {studentToView && (
        <TrialStudentDetailsModal
          student={studentToView}
          onClose={() => setStudentToView(null)}
          onRefresh={fetchStudents}
        />
      )}

      {/* Converted students modal */}
      {showConvertedModal && report && (
        <div className="modal-overlay" onClick={() => setShowConvertedModal(false)}>
          <div
            className={`modal-content ${isDark ? 'dark' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px', padding: '1.5rem', maxHeight: '80vh', overflow: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Alunos Convertidos ({report.converted_students.length})</h3>
              <button onClick={() => setShowConvertedModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {report.converted_students.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>Nenhum aluno convertido ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {report.converted_students.map(cs => (
                  <div key={cs.id} style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#333' : '#e8e8e8'}`,
                    background: isDark ? '#1a1a1a' : '#fafafa',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cs.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                          {cs.modality_name || '-'}
                          {cs.trial_converted_at && ` · Convertido em ${(() => {
                            const raw = String(cs.trial_converted_at).split('T')[0];
                            const [y, m, d] = raw.split('-');
                            return `${d}/${m}/${y}`;
                          })()}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {cs.conversion_value_cents > 0 && (
                          <div style={{ fontWeight: 600, color: '#22c55e', fontSize: '0.95rem' }}>
                            R$ {(cs.conversion_value_cents / 100).toFixed(2).replace('.', ',')}
                          </div>
                        )}
                        {cs.days_to_convert > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>
                            {cs.days_to_convert} dias
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes/Details modal */}
      {notesModalStudent && (
        <div className="modal-overlay" onClick={() => !savingNotes && setNotesModalStudent(null)}>
          <div
            className={`modal-content ${isDark ? 'dark' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#667eea" />
                Detalhes - {notesModalStudent.full_name}
              </h3>
              <button onClick={() => setNotesModalStudent(null)} className="modal-close-btn" disabled={savingNotes}>
                <X size={20} />
              </button>
            </div>

            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer', marginBottom: '1rem',
                background: notesModalContacted
                  ? (isDark ? 'rgba(22, 163, 106, 0.1)' : '#f0fdf4')
                  : (isDark ? '#1a1a1a' : '#f9fafb'),
                border: `1px solid ${notesModalContacted
                  ? (isDark ? '#16a34a' : '#86efac')
                  : (isDark ? '#333' : '#e5e7eb')}`,
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={notesModalContacted}
                onChange={(e) => setNotesModalContacted(e.target.checked)}
                style={{ accentColor: '#16a34a', width: 18, height: 18 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: notesModalContacted ? '#16a34a' : (isDark ? '#ccc' : '#374151') }}>
                  {notesModalContacted ? 'Entrei em contato' : 'Ainda nao entrei em contato'}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#888' : '#6b7280' }}>
                  Marque quando falar com o aluno
                </div>
              </div>
            </label>

            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#ccc' : '#374151' }}>
              Observacoes
            </div>
            <textarea
              value={notesModalValue}
              onChange={(e) => setNotesModalValue(e.target.value)}
              placeholder="Escreva observacoes sobre o aluno..."
              rows={4}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 8,
                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                background: isDark ? '#141414' : '#fff',
                color: isDark ? '#f0f0f0' : '#333',
                fontSize: '0.9rem', resize: 'vertical', marginBottom: '1.25rem',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setNotesModalStudent(null)}
                disabled={savingNotes}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8,
                  border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                  background: 'transparent', color: isDark ? '#ccc' : '#666',
                  fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none',
                  background: '#667eea', color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem',
                  cursor: savingNotes ? 'wait' : 'pointer',
                }}
              >
                {savingNotes ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance confirmation modal */}
      {attendanceModalStudent && (
        <div className="modal-overlay" onClick={() => !attendanceLoading && setAttendanceModalStudent(null)}>
          <div
            className={`modal-content ${isDark ? 'dark' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Registrar Presença</h3>
              <button onClick={() => setAttendanceModalStudent(null)} className="modal-close-btn" disabled={attendanceLoading}>
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
              <strong>{attendanceModalStudent.full_name}</strong>
            </p>
            {attendanceModalStudent.last_trial_class_name && (
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#666' }}>
                Turma: {attendanceModalStudent.last_trial_class_name}
              </p>
            )}
            {attendanceModalStudent.last_trial_date && (
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#666' }}>
                Data: {(() => {
                  const raw = String(attendanceModalStudent.last_trial_date).split('T')[0];
                  const [y, m, d] = raw.split('-');
                  return `${d}/${m}`;
                })()}
                {attendanceModalStudent.last_trial_time && ` às ${String(attendanceModalStudent.last_trial_time).slice(0, 5)}`}
              </p>
            )}

            <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: isDark ? '#ccc' : '#444' }}>
              O aluno compareceu à aula experimental?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleSetAttendance(attendanceModalStudent, true)}
                disabled={attendanceLoading}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none',
                  background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                  cursor: attendanceLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                }}
              >
                ✓ Compareceu
              </button>
              <button
                onClick={() => handleSetAttendance(attendanceModalStudent, false)}
                disabled={attendanceLoading}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                  cursor: attendanceLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                }}
              >
                ✗ Faltou
              </button>
            </div>

            {attendanceModalStudent.last_trial_attended !== null && attendanceModalStudent.last_trial_attended !== undefined && (
              <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
                Status atual: {attendanceModalStudent.last_trial_attended ? '✓ Compareceu' : '✗ Faltou'}
              </p>
            )}
          </div>
        </div>
      )}

      {showEmailConfig && (
        <EmailAutomationConfigModal
          onClose={() => setShowEmailConfig(false)}
        />
      )}

      {/* Create/Edit Booking Link Modal */}
      {showCreateLinkModal && (
        <CreateBookingLinkModal
          link={editingLink}
          allClasses={allClasses}
          trialClassConfigs={trialClassConfigs}
          allPlans={allPlans}
          onClose={() => { setShowCreateLinkModal(false); setEditingLink(null); }}
          onSuccess={() => {
            fetchBookingLinks();
            setShowCreateLinkModal(false);
            setEditingLink(null);
          }}
        />
      )}

      {/* Share Link Modal */}
      {showShareModal && bookingToken && (
        <div className="trial-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="trial-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="trial-modal-header">
              <h2>
                <Share2 size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Link de Aula Experimental
              </h2>
              <button className="trial-modal-close" onClick={() => setShowShareModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="trial-modal-body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Compartilhe este link para que pessoas possam agendar uma aula experimental:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/aula-experimental/${bookingToken}`}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.875rem' }}
                />
                <button
                  className="btn-primary"
                  onClick={copyBookingLink}
                  style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Copy size={16} /> Copiar
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>
                Este link é o mesmo utilizado para locações de quadra. Certifique-se de habilitar as turmas desejadas na seção de configuração acima.
              </p>
            </div>
            <div className="trial-modal-footer">
              <button className="btn-secondary" onClick={() => setShowShareModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de Detalhes do Aluno
interface TrialStudentDetailsModalProps {
  student: TrialStudent;
  onClose: () => void;
  onRefresh: () => void;
}

function TrialStudentDetailsModal({
  student,
  onClose,
  onRefresh,
}: TrialStudentDetailsModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(student.trial_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [student.id]);

  const fetchDetails = async () => {
    try {
      const response = await trialStudentService.getById(student.id);
      if (response.status === 'success') {
        setDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div
        className="trial-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px' }}
      >
        <div className="trial-modal-header">
          <h2>
            <Eye size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Detalhes do Aluno Experimental
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          {isLoading ? (
            <div className="trial-loading">
              <div className="trial-loading-spinner"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Personal Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                  Informações Pessoais
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    background: isDark ? '#1a1a1a' : '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <strong>Nome:</strong> {student.full_name}
                  </div>
                  {student.phone && (
                    <div>
                      <strong>Telefone:</strong> {student.phone}
                    </div>
                  )}
                  {student.email && (
                    <div>
                      <strong>E-mail:</strong> {student.email}
                    </div>
                  )}
                  {(student.level_name || student.level) && (
                    <div>
                      <strong>Nível:</strong>{' '}
                      <span style={{ textTransform: 'capitalize' }}>
                        {student.level_name || student.level}
                      </span>
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`trial-status-badge ${
                        student.status === 'ativo' ? 'active' : 'inactive'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                  {student.created_at && (
                    <div>
                      <strong>Criado em:</strong>{' '}
                      {new Date(student.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Trial Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                  Informações do Período Experimental
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    background: isDark ? '#1a1a1a' : '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  {student.trial_start_date && (
                    <div>
                      <strong>Início:</strong>{' '}
                      {new Date(student.trial_start_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {student.trial_expiration_date && student.trial_retention_days ? (
                    <div>
                      <strong>Expiração:</strong>{' '}
                      {new Date(student.trial_expiration_date.split('T')[0] + 'T00:00:00').toLocaleDateString(
                        'pt-BR'
                      )}{' '}
                      ({student.trial_retention_days} dias)
                    </div>
                  ) : (
                    <div>
                      <strong>Período:</strong> Ilimitado
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Observações:</strong>
                      {!editingNotes && (
                        <button
                          onClick={() => setEditingNotes(true)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#667eea', fontSize: '0.8rem', fontWeight: 500,
                          }}
                        >
                          {notesValue ? 'Editar' : 'Adicionar'}
                        </button>
                      )}
                    </div>
                    {editingNotes ? (
                      <div>
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Adicione observações sobre o aluno..."
                          rows={3}
                          style={{
                            width: '100%', padding: '0.75rem', borderRadius: '6px',
                            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                            background: isDark ? '#141414' : 'white',
                            color: isDark ? '#f0f0f0' : '#333',
                            fontSize: '0.875rem', resize: 'vertical',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            onClick={async () => {
                              setSavingNotes(true);
                              try {
                                await trialStudentService.update(student.id, { trial_notes: notesValue || null });
                                toast.success('Observações salvas');
                                setEditingNotes(false);
                                onRefresh();
                              } catch {
                                toast.error('Erro ao salvar observações');
                              } finally {
                                setSavingNotes(false);
                              }
                            }}
                            disabled={savingNotes}
                            style={{
                              padding: '0.4rem 1rem', borderRadius: '6px', border: 'none',
                              background: '#667eea', color: '#fff', fontWeight: 500,
                              fontSize: '0.8rem', cursor: savingNotes ? 'wait' : 'pointer',
                            }}
                          >
                            {savingNotes ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => { setEditingNotes(false); setNotesValue(student.trial_notes || ''); }}
                            style={{
                              padding: '0.4rem 1rem', borderRadius: '6px', border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                              background: 'transparent', color: isDark ? '#ccc' : '#666',
                              fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : notesValue ? (
                      <div
                        style={{
                          padding: '0.75rem',
                          background: isDark ? '#141414' : 'white',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: isDark ? '#ccc' : '#333',
                        }}
                      >
                        {notesValue}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: isDark ? '#666' : '#999', fontStyle: 'italic' }}>
                        Nenhuma observação adicionada.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Classes */}
              {details?.trial_classes && details.trial_classes.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                    Aulas Experimentais ({details.trial_classes.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.trial_classes.map((classItem: any) => (
                      <div
                        key={classItem.id}
                        style={{
                          background: isDark ? '#141414' : '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: isDark ? '#f0f0f0' : undefined }}>
                          {classItem.class_name}
                        </div>
                        <div style={{ color: isDark ? '#a0a0a0' : '#666' }}>
                          Data: {new Date(classItem.attendance_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {' · '}
                          {classItem.attended ? (
                            <span style={{ color: '#11998e' }}>✓ Presente</span>
                          ) : (
                            <span style={{ color: '#f5576c' }}>✗ Ausente</span>
                          )}
                        </div>
                        {classItem.notes && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: isDark ? '#1a1a1a' : 'white',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            {classItem.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followups */}
              {details?.followups && details.followups.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                    Follow-ups Enviados ({details.followups.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.followups.map((followup: any) => (
                      <div
                        key={followup.id}
                        style={{
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {followup.followup_type}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color:
                                followup.status === 'sent' || followup.status === 'delivered'
                                  ? '#11998e'
                                  : followup.status === 'failed'
                                  ? '#f5576c'
                                  : '#999',
                            }}
                          >
                            {followup.status}
                          </span>
                        </div>
                        <div style={{ color: '#666', marginTop: '0.25rem' }}>
                          {new Date(followup.followup_date).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="trial-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Criação/Edição de Link Personalizado
interface CreateBookingLinkModalProps {
  link: any | null;
  allClasses: any[];
  trialClassConfigs: any[];
  allPlans: Array<{ id: number; name: string; sessions_per_week: number; price_cents: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateBookingLinkModal({ link, allClasses, trialClassConfigs, allPlans, onClose, onSuccess }: CreateBookingLinkModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [name, setName] = useState(link?.name || '');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>(link?.class_ids || []);
  const [saving, setSaving] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [linkShowPrices, setLinkShowPrices] = useState<boolean>(link?.show_prices || false);
  const [linkPlanIds, setLinkPlanIds] = useState<number[]>(link?.plan_ids || []);

  const WEEKDAY_LABELS_LOCAL: Record<string, string> = {
    seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui',
    sex: 'Sex', sab: 'Sáb', dom: 'Dom',
  };

  // Group classes by modality
  const enabledConfigIds = new Set(trialClassConfigs.filter((c: any) => c.is_enabled).map((c: any) => c.class_id));

  const classesGrouped: Record<string, any[]> = {};
  allClasses.forEach((c: any) => {
    const mod = c.modality_name || c.modality || 'Sem modalidade';
    if (!classesGrouped[mod]) classesGrouped[mod] = [];
    classesGrouped[mod].push(c);
  });

  // Sort within groups
  const weekdayOrder = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  Object.values(classesGrouped).forEach(classes => {
    classes.sort((a: any, b: any) => {
      const wa = weekdayOrder.indexOf(a.weekday) ?? 99;
      const wb = weekdayOrder.indexOf(b.weekday) ?? 99;
      if (wa !== wb) return wa - wb;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  });

  const toggleClass = (id: number) => {
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleModality = (modality: string) => {
    const modClasses = classesGrouped[modality] || [];
    const modIds = modClasses.map((c: any) => c.id);
    const allSelected = modIds.every((id: number) => selectedClassIds.includes(id));
    if (allSelected) {
      setSelectedClassIds(prev => prev.filter(id => !modIds.includes(id)));
    } else {
      setSelectedClassIds(prev => [...new Set([...prev, ...modIds])]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe um nome para o link');
      return;
    }
    if (selectedClassIds.length === 0) {
      toast.error('Selecione pelo menos uma turma');
      return;
    }
    setSaving(true);
    try {
      if (link) {
        await trialStudentService.updateBookingLink(link.id, {
          name: name.trim(), class_ids: selectedClassIds,
          show_prices: linkShowPrices, plan_ids: linkShowPrices ? linkPlanIds : [],
        });
        toast.success('Link atualizado com sucesso');
      } else {
        await trialStudentService.createBookingLink({
          name: name.trim(), class_ids: selectedClassIds,
          show_prices: linkShowPrices, plan_ids: linkShowPrices ? linkPlanIds : [],
        });
        toast.success('Link criado com sucesso');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar link');
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = Object.entries(classesGrouped).filter(([modality, classes]) => {
    if (!classSearch.trim()) return true;
    const search = classSearch.toLowerCase();
    return modality.toLowerCase().includes(search) ||
      classes.some((c: any) => c.name?.toLowerCase().includes(search));
  });

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div className="trial-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="trial-modal-header">
          <h2>
            <Link2 size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {link ? 'Editar Link Personalizado' : 'Criar Link Personalizado'}
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          <div className="trial-form-group">
            <label className="required">Nome do Link</label>
            <input
              type="text"
              placeholder="Ex: Link Beach Tennis, Link Manhã..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="trial-form-group">
            <label className="required">
              Turmas ({selectedClassIds.length} selecionada{selectedClassIds.length !== 1 ? 's' : ''})
            </label>
            <input
              type="text"
              placeholder="Buscar turma..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              style={{ marginBottom: '0.75rem' }}
            />
            <div className="booking-link-class-selector">
              {filteredGroups.map(([modality, classes]) => {
                const search = classSearch.trim().toLowerCase();
                const modalityMatches = search && modality.toLowerCase().includes(search);
                const visibleClasses = !search || modalityMatches
                  ? classes
                  : classes.filter((c: any) => c.name?.toLowerCase().includes(search));
                const modIds = visibleClasses.map((c: any) => c.id);
                const allSelected = modIds.every((id: number) => selectedClassIds.includes(id));
                const someSelected = modIds.some((id: number) => selectedClassIds.includes(id));
                return (
                  <div key={modality} className="booking-link-modality-group">
                    <div
                      className="booking-link-modality-header"
                      onClick={() => toggleModality(modality)}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => toggleModality(modality)}
                      />
                      <span className="booking-link-modality-name">{modality}</span>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        ({visibleClasses.filter((c: any) => selectedClassIds.includes(c.id)).length}/{visibleClasses.length})
                      </span>
                    </div>
                    <div className="booking-link-class-list">
                      {visibleClasses.map((c: any) => {
                        const isEnabled = enabledConfigIds.has(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`booking-link-class-item ${selectedClassIds.includes(c.id) ? 'selected' : ''} ${!isEnabled ? 'not-enabled' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedClassIds.includes(c.id)}
                              onChange={() => toggleClass(c.id)}
                            />
                            <span
                              className="trial-config-class-dot"
                              style={{ background: c.color || '#3B82F6' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                                {WEEKDAY_LABELS_LOCAL[c.weekday] || c.weekday} · {c.start_time?.slice(0, 5)} - {c.end_time?.slice(0, 5)}
                                {!isEnabled && <span style={{ color: '#ef4444', marginLeft: 6 }}>(Não habilitada)</span>}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredGroups.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: '1rem 0' }}>Nenhuma turma encontrada</p>
              )}
            </div>
          </div>

          {selectedClassIds.some(id => !enabledConfigIds.has(id)) && (
            <div style={{
              background: '#fff3cd', borderLeft: '4px solid #ffc107',
              padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.8rem', color: '#856404', marginTop: '0.5rem'
            }}>
              Algumas turmas selecionadas não estão habilitadas para aula experimental. Elas não aparecerão no link enquanto não forem habilitadas na seção acima.
            </div>
          )}

          {/* Price settings for this link */}
          <div style={{
            marginTop: '1rem', padding: '14px', borderRadius: '10px',
            background: linkShowPrices
              ? (isDark ? 'rgba(5, 150, 105, 0.1)' : '#F0FDF4')
              : (isDark ? '#141414' : '#F9FAFB'),
            border: `1.5px solid ${linkShowPrices ? '#22C55E' : (isDark ? '#262626' : '#E5E7EB')}`,
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: linkShowPrices && allPlans.length > 0 ? '10px' : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? '#f0f0f0' : '#1F2937', marginBottom: '2px' }}>
                  Exibir preços neste link
                </div>
                <div style={{ fontSize: '0.75rem', color: isDark ? '#a0a0a0' : '#6B7280' }}>
                  {linkShowPrices ? 'Os planos selecionados serão exibidos neste link.' : 'Preços ocultos neste link.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkShowPrices(!linkShowPrices)}
                style={{
                  width: '48px', height: '26px', borderRadius: '13px', border: 'none',
                  background: linkShowPrices ? '#22C55E' : (isDark ? '#404040' : '#D1D5DB'),
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: isDark ? '#e0e0e0' : 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  position: 'absolute', top: '3px',
                  left: linkShowPrices ? '25px' : '3px',
                  transition: 'left 0.2s ease',
                }} />
              </button>
            </div>

            {linkShowPrices && allPlans.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {allPlans.map((plan) => (
                  <label
                    key={plan.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                      background: linkPlanIds.includes(plan.id)
                        ? (isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5')
                        : (isDark ? '#141414' : 'white'),
                      border: `1px solid ${linkPlanIds.includes(plan.id)
                        ? (isDark ? '#22c55e' : '#86EFAC')
                        : (isDark ? '#262626' : '#E5E7EB')}`,
                      transition: 'all 0.15s ease', fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={linkPlanIds.includes(plan.id)}
                      onChange={() => {
                        setLinkPlanIds(prev =>
                          prev.includes(plan.id) ? prev.filter(id => id !== plan.id) : [...prev, plan.id]
                        );
                      }}
                      style={{ accentColor: '#22C55E' }}
                    />
                    <span style={{ flex: 1, fontWeight: 500, color: isDark ? '#f0f0f0' : '#1F2937' }}>
                      {plan.name}
                      {plan.sessions_per_week > 0 && (
                        <span style={{ color: isDark ? '#a0a0a0' : '#6B7280', fontWeight: 400 }}> · {plan.sessions_per_week}x/sem</span>
                      )}
                    </span>
                    <span style={{ fontWeight: 600, color: isDark ? '#34d399' : '#059669' }}>
                      R$ {(plan.price_cents / 100).toFixed(2).replace('.', ',')}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="trial-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : link ? 'Salvar Alterações' : 'Criar Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Configuração de Email Automático
interface EmailAutomationConfigModalProps {
  onClose: () => void;
}

function EmailAutomationConfigModal({ onClose }: EmailAutomationConfigModalProps) {
  const [config, setConfig] = useState({
    enabled: false,
    days_after_first_class: 3,
    send_time: '10:00',
    template_message:
      'Olá {nome}!\n\nComo foi sua experiência conosco?\n\nGostaríamos de saber sua opinião e te convidar para continuar fazendo parte da nossa equipe!\n\nEntre em contato para mais informações.',
  });

  const handleSave = () => {
    // TODO: Implement save logic to backend
    toast.success('Configurações salvas com sucesso!');
    onClose();
  };

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div
        className="trial-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="trial-modal-header">
          <h2>
            <Settings size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Configuração de E-mails Automáticos
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          <div className="trial-email-config">
            <div className="trial-email-config-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Envio Automático de Follow-ups
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#666' }}>
                  Envie automaticamente e-mails para alunos experimentais
                </p>
              </div>
              <label className="trial-toggle">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) =>
                    setConfig({ ...config, enabled: e.target.checked })
                  }
                />
                <span className="trial-toggle-slider"></span>
              </label>
            </div>
          </div>

          {config.enabled && (
            <>
              <div className="trial-form-row">
                <div className="trial-form-group">
                  <label htmlFor="days_after">Enviar após (dias)</label>
                  <input
                    id="days_after"
                    type="number"
                    min="1"
                    max="30"
                    value={config.days_after_first_class}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        days_after_first_class: parseInt(e.target.value),
                      })
                    }
                  />
                  <small>Dias após a primeira aula experimental</small>
                </div>

                <div className="trial-form-group">
                  <label htmlFor="send_time">Horário de Envio</label>
                  <input
                    id="send_time"
                    type="time"
                    value={config.send_time}
                    onChange={(e) =>
                      setConfig({ ...config, send_time: e.target.value })
                    }
                  />
                  <small>Horário preferido para envio</small>
                </div>
              </div>

              <div className="trial-form-group">
                <label htmlFor="template">Mensagem do E-mail</label>
                <textarea
                  id="template"
                  value={config.template_message}
                  onChange={(e) =>
                    setConfig({ ...config, template_message: e.target.value })
                  }
                  rows={8}
                />
                <small>
                  Use {'{nome}'} para inserir o nome do aluno automaticamente
                </small>
              </div>

              <div
                style={{
                  background: '#fff3cd',
                  borderLeft: '4px solid #ffc107',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#856404',
                }}
              >
                <strong>ℹ️ Dica:</strong> E-mails só serão enviados para alunos
                experimentais que possuam e-mail cadastrado e não tenham sido
                convertidos.
              </div>
            </>
          )}
        </div>

        <div className="trial-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
