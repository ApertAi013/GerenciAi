import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faDollarSign,
  faExclamationTriangle,
  faReceipt,
  faUserPlus,
  faUserMinus,
  faUsers,
  faChartLine,
  faChartPie,
  faFilter,
  faTimes,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { reportService } from '../services/reportService';
import { modalityService } from '../services/modalityService';
import type { Modality } from '../types/levelTypes';
import type { EnrollmentMonthlyData, FinancialMonthlyData, PlanBreakdown, ModalityBreakdown } from '../types/reportTypes';
import '../styles/Reports.css';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatCurrencyShort = (cents: number) => {
  const val = cents / 100;
  if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
  return `R$${val.toFixed(0)}`;
};

const formatMonthLabel = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${names[parseInt(month) - 1]}/${year.slice(2)}`;
};

const DONUT_COLORS = ['#F58A25', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];

export default function Reports() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [selectedModality, setSelectedModality] = useState<number | null>(null);

  // Data states
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentMonthlyData[]>([]);
  const [enrollmentSummary, setEnrollmentSummary] = useState({ current_active: 0, total_new: 0, total_cancellations: 0 });
  const [financialMonthly, setFinancialMonthly] = useState<FinancialMonthlyData[]>([]);
  const [byPlan, setByPlan] = useState<PlanBreakdown[]>([]);
  const [byModality, setByModality] = useState<ModalityBreakdown[]>([]);
  const [overdueSummary, setOverdueSummary] = useState({ overdue_students: 0, total_overdue_cents: 0, overdue_invoice_count: 0 });

  // Period control
  const [months, setMonths] = useState(6);

  useEffect(() => {
    const fetchModalities = async () => {
      try {
        const response = await modalityService.getModalities();
        if ((response as any).status === 'success' || (response as any).success === true) {
          setModalities(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar modalidades:', error);
      }
    };
    fetchModalities();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        setIsLoading(true);
        const params: { months: number; modality_id?: number } = { months };
        if (selectedModality) params.modality_id = selectedModality;

        const [enrollmentRes, financialRes] = await Promise.all([
          reportService.getEnrollmentStats(params),
          reportService.getFinancialMonthly(params),
        ]);

        if (enrollmentRes.data?.monthly) {
          setEnrollmentStats(enrollmentRes.data.monthly);
          setEnrollmentSummary(enrollmentRes.data.summary);
        }
        if (financialRes.data) {
          setFinancialMonthly(financialRes.data.monthly || []);
          setByPlan(financialRes.data.by_plan || []);
          setByModality(financialRes.data.by_modality || []);
          setOverdueSummary(financialRes.data.overdue_summary || { overdue_students: 0, total_overdue_cents: 0, overdue_invoice_count: 0 });
        }
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [user, months, selectedModality]);

  // Calculated totals
  const totalFaturado = financialMonthly.reduce((s, m) => s + m.faturado_cents, 0);
  const totalRecebido = financialMonthly.reduce((s, m) => s + m.recebido_cents, 0);
  const avgTicket = (() => {
    const totalPaid = financialMonthly.reduce((s, m) => s + m.paid_count, 0);
    return totalPaid > 0 ? Math.round(totalRecebido / totalPaid) : 0;
  })();

  // Chart data for revenue
  const revenueChartData = financialMonthly.map(m => ({
    month: formatMonthLabel(m.month),
    Faturado: m.faturado_cents / 100,
    Recebido: m.recebido_cents / 100,
  }));

  // Chart data for enrollments
  const enrollmentChartData = enrollmentStats.map(m => ({
    month: formatMonthLabel(m.month),
    Novas: m.new_enrollments,
    Canceladas: m.cancellations,
  }));

  // Chart data for active clients
  const activeChartData = enrollmentStats.map(m => ({
    month: formatMonthLabel(m.month),
    Ativos: m.active_at_end,
  }));

  // Chart data for churn
  const churnChartData = enrollmentStats.map(m => ({
    month: formatMonthLabel(m.month),
    'Churn %': m.churn_rate,
  }));

  // Chart data for ticket medio
  const ticketChartData = financialMonthly.map(m => ({
    month: formatMonthLabel(m.month),
    'Ticket Medio': m.ticket_medio_cents / 100,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rpt-tooltip">
        <p className="rpt-tooltip-label">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="rpt-tooltip-row" style={{ color: entry.color }}>
            <span className="rpt-tooltip-dot" style={{ background: entry.color }} />
            {entry.name}:{' '}
            <strong>
              {entry.name === 'Churn %'
                ? `${entry.value.toFixed(1)}%`
                : entry.name === 'Novas' || entry.name === 'Canceladas' || entry.name === 'Ativos'
                  ? entry.value
                  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
            </strong>
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rpt-loading">
        <div className="loading-spinner" />
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="rpt">
      {/* Header */}
      <header className="rpt-header">
        <div className="rpt-header-inner">
          <div>
            <h1 className="rpt-title">Relatórios</h1>
            <p className="rpt-subtitle">Visão geral dos últimos {months} meses</p>
          </div>
          <div className="rpt-header-right">
            <div className="rpt-period-control">
              <button
                className="rpt-period-btn"
                onClick={() => setMonths(m => Math.max(3, m - 3))}
                disabled={months <= 3}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <span className="rpt-period-label">{months} meses</span>
              <button
                className="rpt-period-btn"
                onClick={() => setMonths(m => Math.min(24, m + 3))}
                disabled={months >= 24}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Active Filters */}
      <div className="rpt-filters">
        <div className="rpt-filter-chips">
          {selectedModality && (
            <span className="rpt-chip active">
              {modalities.find(m => m.id === selectedModality)?.icon}{' '}
              {modalities.find(m => m.id === selectedModality)?.name}
              <button className="rpt-chip-remove" onClick={() => setSelectedModality(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </span>
          )}
        </div>
        <div className="rpt-filter-actions">
          <FontAwesomeIcon icon={faFilter} className="rpt-filter-icon" />
          <select
            className="rpt-filter-select"
            value={selectedModality || ''}
            onChange={e => setSelectedModality(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Todas as modalidades</option>
            {modalities.map(m => (
              <option key={m.id} value={m.id}>
                {m.icon ? `${m.icon} ` : ''}{m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="rpt-kpis">
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon green"><FontAwesomeIcon icon={faDollarSign} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Recebido</span>
            <span className="rpt-kpi-value green-text">{formatCurrency(totalRecebido)}</span>
          </div>
          <div className="rpt-kpi-accent green" />
        </div>
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon purple"><FontAwesomeIcon icon={faReceipt} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Faturado</span>
            <span className="rpt-kpi-value">{formatCurrency(totalFaturado)}</span>
          </div>
          <div className="rpt-kpi-accent purple" />
        </div>
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon orange"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Inadimplentes</span>
            <span className="rpt-kpi-value amber-text">{overdueSummary.overdue_students}</span>
            <span className="rpt-kpi-detail">{formatCurrency(overdueSummary.total_overdue_cents)}</span>
          </div>
          <div className="rpt-kpi-accent orange" />
        </div>
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon blue"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Ativos</span>
            <span className="rpt-kpi-value">{enrollmentSummary.current_active}</span>
          </div>
          <div className="rpt-kpi-accent blue" />
        </div>
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon teal"><FontAwesomeIcon icon={faUserPlus} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Novas</span>
            <span className="rpt-kpi-value">{enrollmentSummary.total_new}</span>
            <span className="rpt-kpi-detail">no período</span>
          </div>
          <div className="rpt-kpi-accent teal" />
        </div>
        <div className="rpt-kpi">
          <div className="rpt-kpi-icon red"><FontAwesomeIcon icon={faUserMinus} /></div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">Canceladas</span>
            <span className="rpt-kpi-value red-text">{enrollmentSummary.total_cancellations}</span>
            <span className="rpt-kpi-detail">no período</span>
          </div>
          <div className="rpt-kpi-accent red" />
        </div>
      </div>

      {/* Row 1: Receita Mensal + Ticket Médio */}
      <div className="rpt-grid-2">
        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faMoneyBillWave} /> Receita Mensal
            </h3>
          </div>
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="Faturado" fill="#C7D2FE" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Recebido" fill="#34D399" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faChartLine} /> Ticket Médio
            </h3>
            <span className="rpt-badge">Média: {formatCurrency(avgTicket)}</span>
          </div>
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ticketChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="Ticket Medio" stroke="#F58A25" strokeWidth={3}
                  dot={{ fill: '#F58A25', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 2: Novas vs Canceladas + Clientes Ativos */}
      <div className="rpt-grid-2">
        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faUserPlus} /> Novas vs Canceladas
            </h3>
          </div>
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enrollmentChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="Novas" fill="#34D399" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Canceladas" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faUsers} /> Clientes Ativos
            </h3>
          </div>
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activeChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Ativos" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: Churn + Inadimplentes */}
      <div className="rpt-grid-2">
        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faChartLine} /> Churn (Evasão)
            </h3>
          </div>
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={churnChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${v}%`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Churn %" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faExclamationTriangle} /> Inadimplência
            </h3>
          </div>
          <div className="rpt-inadimplencia">
            <div className="rpt-inadimplencia-big">
              <span className="rpt-inadimplencia-number">{overdueSummary.overdue_students}</span>
              <span className="rpt-inadimplencia-label">alunos inadimplentes</span>
            </div>
            <div className="rpt-inadimplencia-stats">
              <div className="rpt-inadimplencia-stat">
                <span className="rpt-inadimplencia-stat-value">{overdueSummary.overdue_invoice_count}</span>
                <span className="rpt-inadimplencia-stat-label">faturas vencidas</span>
              </div>
              <div className="rpt-inadimplencia-stat">
                <span className="rpt-inadimplencia-stat-value red-text">{formatCurrency(overdueSummary.total_overdue_cents)}</span>
                <span className="rpt-inadimplencia-stat-label">valor total em aberto</span>
              </div>
            </div>
            {totalFaturado > 0 && (
              <div className="rpt-inadimplencia-bar-wrap">
                <span className="rpt-inadimplencia-bar-label">
                  Taxa de inadimplência: {((overdueSummary.total_overdue_cents / totalFaturado) * 100).toFixed(1)}%
                </span>
                <div className="rpt-inadimplencia-bar-track">
                  <div
                    className="rpt-inadimplencia-bar-fill"
                    style={{ width: `${Math.min((overdueSummary.total_overdue_cents / totalFaturado) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 4: Planos + Modalidades (donuts/lists) */}
      <div className="rpt-grid-2">
        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faChartPie} /> Planos Mais Vendidos
            </h3>
          </div>
          {byPlan.length > 0 ? (
            <div className="rpt-donut-section">
              <div className="rpt-donut-chart">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={byPlan.slice(0, 8)}
                      dataKey="enrollment_count"
                      nameKey="plan_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {byPlan.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} matrículas`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rpt-donut-list">
                {byPlan.slice(0, 6).map((plan, i) => (
                  <div key={plan.plan_name} className="rpt-donut-item">
                    <span className="rpt-donut-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="rpt-donut-name">{plan.plan_name}</span>
                    <span className="rpt-donut-pct">{plan.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rpt-empty">Nenhum plano com matrículas ativas</div>
          )}
        </section>

        <section className="rpt-panel">
          <div className="rpt-panel-top">
            <h3 className="rpt-panel-title">
              <FontAwesomeIcon icon={faChartPie} /> Matrículas por Modalidade
            </h3>
          </div>
          {byModality.length > 0 ? (
            <div className="rpt-donut-section">
              <div className="rpt-donut-chart">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={byModality.slice(0, 8)}
                      dataKey="enrollment_count"
                      nameKey="modality_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {byModality.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} matrículas`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rpt-donut-list">
                {byModality.slice(0, 6).map((mod, i) => (
                  <div key={mod.modality_name} className="rpt-donut-item">
                    <span className="rpt-donut-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="rpt-donut-name">{mod.icon ? `${mod.icon} ` : ''}{mod.modality_name}</span>
                    <span className="rpt-donut-pct">{mod.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rpt-empty">Nenhuma modalidade com matrículas ativas</div>
          )}
        </section>
      </div>
    </div>
  );
}
