import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faMoneyBillWave,
  faCalendarCheck,
  faChartLine,
  faExclamationTriangle,
  faArrowRight,
  faClockRotateLeft,
  faDumbbell,
  faMapMarkerAlt,
  faClock,
  faUserGraduate,
  faReceipt,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useAuthStore } from '../store/authStore';
import { financialService } from '../services/financialService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import type { Invoice } from '../types/financialTypes';
import type { Class, Modality } from '../types/classTypes';
import '../styles/Dashboard.css';

interface DashboardStats {
  totalStudents: number;
  newStudentsLast7Days: number;
  totalRevenueLast7Days: number;
  overdueInvoices: number;
  paidInvoicesLast7Days: number;
  classesToday: number;
}

interface ModalitySummary {
  id: number;
  name: string;
  studentCount: number;
  classCount: number;
  revenue: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    newStudentsLast7Days: 0,
    totalRevenueLast7Days: 0,
    overdueInvoices: 0,
    paidInvoicesLast7Days: 0,
    classesToday: 0,
  });
  const [classesToday, setClassesToday] = useState<Class[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<Invoice[]>([]);
  const [modalitySummary, setModalitySummary] = useState<ModalitySummary[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

  const weekdayMap: Record<string, string> = {
    'dom': 'Domingo',
    'seg': 'Segunda',
    'ter': 'Terça',
    'qua': 'Quarta',
    'qui': 'Quinta',
    'sex': 'Sexta',
    'sab': 'Sábado',
  };

  const getTodayWeekday = (): string => {
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        studentsRes,
        invoicesRes,
        classesRes,
        modalitiesRes,
        enrollmentsRes,
      ] = await Promise.all([
        studentService.getStudents({ limit: 1000 }),
        financialService.getInvoices(),
        classService.getClasses(),
        classService.getModalities(),
        enrollmentService.getEnrollments({ status: 'ativa' }),
      ]);

      const students = studentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const classes = classesRes.data || [];
      const modalities = modalitiesRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      setAllInvoices(invoices);

      // Calculate stats
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // New students in last 7 days
      const newStudents = students.filter((s: any) => {
        const createdAt = new Date(s.created_at);
        return createdAt >= sevenDaysAgo;
      });

      // Paid invoices in last 7 days
      const paidLast7Days = invoices.filter((inv: Invoice) => {
        if (inv.status !== 'paga' || !inv.paid_at) return false;
        const paidAt = new Date(inv.paid_at);
        return paidAt >= sevenDaysAgo;
      });

      const revenueLast7Days = paidLast7Days.reduce(
        (sum: number, inv: Invoice) => sum + (inv.paid_amount_cents || inv.final_amount_cents),
        0
      );

      // Overdue invoices
      const overdue = invoices.filter((inv: Invoice) => inv.status === 'vencida');
      setOverdueStudents(overdue.slice(0, 5)); // Top 5 for display

      // Classes today
      const todayWeekday = getTodayWeekday();
      const todayClasses = classes
        .filter((cls: Class) => cls.weekday === todayWeekday && cls.status === 'ativa')
        .sort((a: Class, b: Class) => a.start_time.localeCompare(b.start_time));
      setClassesToday(todayClasses);

      // Modality summary
      const modalitySummaryData: ModalitySummary[] = modalities.map((mod: Modality) => {
        const modalityClasses = classes.filter((cls: Class) => cls.modality_id === mod.id);
        const classIds = modalityClasses.map((cls: Class) => cls.id);

        // Count students in this modality
        const studentsInModality = new Set<number>();
        enrollments.forEach((enr: any) => {
          if (enr.class_ids) {
            const hasModalityClass = enr.class_ids.some((id: number) => classIds.includes(id));
            if (hasModalityClass) {
              studentsInModality.add(enr.student_id);
            }
          }
        });

        // Revenue from this modality (approximate based on invoices)
        const modalityRevenue = invoices
          .filter((inv: Invoice) => inv.status === 'paga' && inv.modalities?.includes(mod.name))
          .reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount_cents || inv.final_amount_cents), 0);

        return {
          id: mod.id,
          name: mod.name,
          studentCount: studentsInModality.size,
          classCount: modalityClasses.length,
          revenue: modalityRevenue,
        };
      }).filter((mod: ModalitySummary) => mod.classCount > 0);

      setModalitySummary(modalitySummaryData);

      setStats({
        totalStudents: students.filter((s: any) => s.status === 'ativo').length,
        newStudentsLast7Days: newStudents.length,
        totalRevenueLast7Days: revenueLast7Days,
        overdueInvoices: overdue.length,
        paidInvoicesLast7Days: paidLast7Days.length,
        classesToday: todayClasses.length,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleWhatsAppClick = (phone: string | undefined, studentName: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const savedTemplate = localStorage.getItem('gerenciai_whatsapp_template');
    let message = savedTemplate || 'Olá [Nome], tudo bem? Identificamos uma pendência financeira em seu cadastro. Por favor, entre em contato conosco para regularizar.';

    const firstName = studentName.split(' ')[0];
    message = message
      .replace(/\[Nome\]/g, firstName)
      .replace(/\[NomeCompleto\]/g, studentName);

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-modern">
      {/* Header Section */}
      <header className="dashboard-header-modern">
        <div className="header-content">
          <div className="greeting-section">
            <h1 className="greeting-text">
              {getGreeting()}, <span className="user-name">{user?.full_name?.split(' ')[0]}</span>!
            </h1>
            <p className="greeting-subtitle">
              Aqui está o resumo do seu sistema para hoje, {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.
            </p>
          </div>
          <div className="header-date">
            <div className="date-badge">
              <span className="date-day">{new Date().getDate()}</span>
              <span className="date-month">{new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats Section */}
      <section className="stats-section">
        <h2 className="section-title">
          <FontAwesomeIcon icon={faClockRotateLeft} />
          Resumo dos últimos 7 dias
        </h2>
        <div className="stats-grid-modern">
          <div className="stat-card-modern stat-students" onClick={() => navigate('/alunos')}>
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Alunos Ativos</span>
              <span className="stat-value">{stats.totalStudents}</span>
              <span className="stat-detail">+{stats.newStudentsLast7Days} novos esta semana</span>
            </div>
          </div>

          <div className="stat-card-modern stat-revenue">
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Faturamento (7 dias)</span>
              <span className="stat-value">{formatCurrency(stats.totalRevenueLast7Days)}</span>
              <span className="stat-detail">{stats.paidInvoicesLast7Days} pagamentos recebidos</span>
            </div>
          </div>

          <div className="stat-card-modern stat-classes" onClick={() => navigate('/agenda')}>
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faCalendarCheck} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Turmas Hoje</span>
              <span className="stat-value">{stats.classesToday}</span>
              <span className="stat-detail">{weekdayMap[getTodayWeekday()]}</span>
            </div>
          </div>

          <div className="stat-card-modern stat-overdue" onClick={() => navigate('/financeiro')}>
            <div className="stat-icon-wrapper">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Faturas Vencidas</span>
              <span className="stat-value">{stats.overdueInvoices}</span>
              <span className="stat-detail">Atenção necessária</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Classes - Mini Agenda */}
        <section className="dashboard-card classes-today-card">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faDumbbell} />
              Agenda de Hoje
            </h3>
            <button className="btn-link" onClick={() => navigate('/agenda')}>
              Ver completa <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="card-content">
            {classesToday.length === 0 ? (
              <div className="empty-state-mini">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <p>Nenhuma turma agendada para hoje</p>
              </div>
            ) : (
              <div className="classes-timeline">
                {classesToday.slice(0, 6).map((cls, index) => (
                  <div
                    key={cls.id}
                    className="timeline-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="timeline-time">
                      <FontAwesomeIcon icon={faClock} />
                      {cls.start_time.substring(0, 5)}
                    </div>
                    <div className="timeline-content">
                      <span className="class-name">{cls.modality_name}</span>
                      {cls.name && <span className="class-subtitle">{cls.name}</span>}
                      {cls.location && (
                        <span className="class-location">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          {cls.location}
                        </span>
                      )}
                    </div>
                    <div className="timeline-capacity">
                      <span className={`capacity-badge ${(cls.enrolled_count || 0) >= (cls.capacity || 0) ? 'full' : ''}`}>
                        {cls.enrolled_count || 0}/{cls.capacity || 0}
                      </span>
                    </div>
                  </div>
                ))}
                {classesToday.length > 6 && (
                  <div className="more-classes">
                    +{classesToday.length - 6} mais turmas
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Modality Summary */}
        <section className="dashboard-card modality-summary-card">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faChartLine} />
              Resumo por Modalidade
            </h3>
          </div>
          <div className="card-content">
            {modalitySummary.length === 0 ? (
              <div className="empty-state-mini">
                <FontAwesomeIcon icon={faLayerGroup} />
                <p>Nenhuma modalidade cadastrada</p>
              </div>
            ) : (
              <div className="modality-list">
                {modalitySummary.map((mod, index) => (
                  <div
                    key={mod.id}
                    className="modality-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="modality-name">
                      <span className="modality-dot"></span>
                      {mod.name}
                    </div>
                    <div className="modality-stats">
                      <div className="modality-stat">
                        <FontAwesomeIcon icon={faUserGraduate} />
                        <span>{mod.studentCount} alunos</span>
                      </div>
                      <div className="modality-stat">
                        <FontAwesomeIcon icon={faCalendarCheck} />
                        <span>{mod.classCount} turmas</span>
                      </div>
                      <div className="modality-stat revenue">
                        <FontAwesomeIcon icon={faReceipt} />
                        <span>{formatCurrency(mod.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Overdue Students */}
        <section className="dashboard-card overdue-card">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Alunos Inadimplentes
            </h3>
            <button className="btn-link" onClick={() => navigate('/financeiro')}>
              Ver todos <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="card-content">
            {overdueStudents.length === 0 ? (
              <div className="empty-state-mini success">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <p>Nenhum aluno inadimplente!</p>
                <span>Todas as faturas estão em dia</span>
              </div>
            ) : (
              <div className="overdue-list">
                {overdueStudents.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className="overdue-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="overdue-info">
                      <span className="student-name">{invoice.student_name}</span>
                      <span className="overdue-details">
                        Vencido em {formatDate(invoice.due_date)} • {formatCurrency(invoice.final_amount_cents)}
                      </span>
                    </div>
                    <button
                      className="btn-whatsapp"
                      onClick={() => handleWhatsAppClick(invoice.student_phone, invoice.student_name || '')}
                      disabled={!invoice.student_phone}
                      title={invoice.student_phone ? 'Enviar mensagem' : 'Telefone não cadastrado'}
                    >
                      <FontAwesomeIcon icon={faWhatsapp} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
