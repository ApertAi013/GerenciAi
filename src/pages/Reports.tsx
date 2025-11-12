import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faDollarSign, faTriangleExclamation, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../store/authStore';
import { reportService } from '../services/reportService';
import { modalityService } from '../services/modalityService';
import type { Modality } from '../types/levelTypes';
import '../styles/Reports.css';

interface MonthlyData {
  month: string;
  vendas: number;
  receitas: number;
  meta: number;
}

interface RevenueStats {
  total_received: number;
  total_to_receive: number;
  total_overdue: number;
  overdue_count: number;
}

interface DateFilter {
  filterType: 'month' | 'custom';
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  modality_id?: number | null;
}

export default function Reports() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalities, setModalities] = useState<Modality[]>([]);

  // Estado do filtro de datas
  const currentDate = new Date();
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    filterType: 'month',
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    startDate: '',
    endDate: '',
    modality_id: null,
  });

  // Buscar modalidades ao carregar a página
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

  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    total_received: 0,
    total_to_receive: 0,
    total_overdue: 0,
    overdue_count: 0,
  });

  // Dados mock para os gráficos (serão substituídos por dados reais do backend)
  const [monthlyData] = useState<MonthlyData[]>([
    { month: 'jul/2025', vendas: 95000, receitas: 47000, meta: 140000 },
    { month: 'ago/2025', vendas: 135000, receitas: 50000, meta: 140000 },
    { month: 'set/2025', vendas: 125000, receitas: 55000, meta: 140000 },
  ]);

  // Buscar relatórios sempre que o filtro mudar
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Preparar parâmetros baseados no tipo de filtro
        const baseParams = dateFilter.filterType === 'month'
          ? { period: 'month' as const, year: dateFilter.year, month: dateFilter.month }
          : { period: 'custom' as const, start_date: dateFilter.startDate, end_date: dateFilter.endDate };

        // Adicionar modality_id aos parâmetros se selecionado
        const params = dateFilter.modality_id
          ? { ...baseParams, modality_id: dateFilter.modality_id }
          : baseParams;

        const toReceiveParams = dateFilter.filterType === 'month'
          ? { year: dateFilter.year, month: dateFilter.month }
          : {};

        const toReceiveParamsWithModality = dateFilter.modality_id
          ? { ...toReceiveParams, modality_id: dateFilter.modality_id }
          : toReceiveParams;

        const overdueParams = dateFilter.modality_id
          ? { modality_id: dateFilter.modality_id }
          : {};

        const [receivedRes, toReceiveRes, overdueRes] = await Promise.all([
          reportService.getReceivedRevenue(params),
          reportService.getRevenueToReceive(toReceiveParamsWithModality),
          reportService.getAllOverdue(overdueParams),
        ]);

        setRevenueStats({
          total_received: receivedRes.data.summary?.total_received_cents || 0,
          total_to_receive: toReceiveRes.data.summary?.total_to_receive_cents || 0,
          total_overdue: overdueRes.data.length || 0,
          overdue_count: overdueRes.data.length || 0,
        });
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user, dateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const getMaxValue = (data: MonthlyData[]) => {
    const allValues = data.flatMap(d => [d.vendas, d.receitas, d.meta]);
    return Math.max(...allValues);
  };

  const getBarHeight = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  // Formatar período selecionado para exibição
  const getDisplayPeriod = () => {
    let period = '';
    if (dateFilter.filterType === 'month') {
      const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      period = `${monthNames[dateFilter.month - 1]}/${dateFilter.year}`;
    } else {
      period = `${dateFilter.startDate} até ${dateFilter.endDate}`;
    }

    // Adicionar modalidade se selecionada
    if (dateFilter.modality_id) {
      const modality = modalities.find((m) => m.id === dateFilter.modality_id);
      if (modality) {
        period += ` - ${modality.name}`;
      }
    }

    return period;
  };

  // Handler para mudança rápida de mês
  const handleQuickMonthChange = (monthsOffset: number) => {
    const newDate = new Date(dateFilter.year, dateFilter.month - 1 + monthsOffset, 1);
    setDateFilter({
      ...dateFilter,
      year: newDate.getFullYear(),
      month: newDate.getMonth() + 1,
    });
  };

  // Handler para aplicar filtro customizado
  const handleApplyCustomFilter = () => {
    setShowFilterModal(false);
    // O useEffect será disparado automaticamente devido à mudança no dateFilter
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const maxValue = getMaxValue(monthlyData);

  return (
    <div className="reports">
      {/* Header */}
      <div className="reports-header">
        <h1>Relatórios Financeiros</h1>
        <div className="period-selector">
          <button
            type="button"
            className="btn-nav-period"
            onClick={() => handleQuickMonthChange(-1)}
            title="Mês anterior"
          >
            ◄
          </button>
          <div className="period-display">{getDisplayPeriod()}</div>
          <button
            type="button"
            className="btn-nav-period"
            onClick={() => handleQuickMonthChange(1)}
            title="Próximo mês"
          >
            ►
          </button>
          <button
            type="button"
            className="btn-filter"
            onClick={() => setShowFilterModal(true)}
          >
            FILTROS
          </button>
        </div>
      </div>

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filtrar Relatórios</h2>
              <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Tipo de Filtro */}
              <div className="form-group">
                <label>Tipo de Filtro</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="filterType"
                      checked={dateFilter.filterType === 'month'}
                      onChange={() => setDateFilter({ ...dateFilter, filterType: 'month' })}
                    />
                    <span>Por Mês</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="filterType"
                      checked={dateFilter.filterType === 'custom'}
                      onChange={() => setDateFilter({ ...dateFilter, filterType: 'custom' })}
                    />
                    <span>Período Customizado</span>
                  </label>
                </div>
              </div>

              {/* Filtro por Mês */}
              {dateFilter.filterType === 'month' && (
                <div className="filter-month-group">
                  <div className="form-group">
                    <label>Mês</label>
                    <select
                      value={dateFilter.month}
                      onChange={(e) => setDateFilter({ ...dateFilter, month: parseInt(e.target.value) })}
                    >
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ano</label>
                    <input
                      type="number"
                      value={dateFilter.year}
                      onChange={(e) => setDateFilter({ ...dateFilter, year: parseInt(e.target.value) })}
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>
              )}

              {/* Filtro Customizado */}
              {dateFilter.filterType === 'custom' && (
                <div className="filter-custom-group">
                  <div className="form-group">
                    <label>Data Inicial</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Data Final</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Filtro por Modalidade */}
              <div className="form-group" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                <label>Modalidade</label>
                <select
                  value={dateFilter.modality_id || ''}
                  onChange={(e) => setDateFilter({
                    ...dateFilter,
                    modality_id: e.target.value ? parseInt(e.target.value) : null
                  })}
                >
                  <option value="">Todas as modalidades</option>
                  {modalities.map((modality) => (
                    <option key={modality.id} value={modality.id}>
                      {modality.icon ? `${modality.icon} ` : ''}{modality.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowFilterModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleApplyCustomFilter}>
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Receita Recebida</p>
            <h2 className="metric-value">{formatCurrency(revenueStats.total_received)}</h2>
            <span className="metric-meta">-- da meta de --</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Valor Recebido</p>
            <h2 className="metric-value">{formatCurrency(revenueStats.total_received)}</h2>
            <span className="metric-meta">-- da meta de --</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Valor em Aberto</p>
            <h2 className="metric-value">{formatCurrency(revenueStats.total_to_receive)}</h2>
            <span className="metric-meta">-- da meta de --</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon blue">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <div className="metric-content">
            <p className="metric-label">Valor em Andamento</p>
            <h2 className="metric-value">R$ 0,00</h2>
            <span className="metric-meta">-- da meta de --</span>
          </div>
        </div>
      </div>

      {/* Gráficos de Vendas e Receita */}
      <div className="charts-row">
        {/* Gráfico de Vendas */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Vendas</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>R$160K</span>
              <span>R$140K</span>
              <span>R$120K</span>
              <span>R$100K</span>
              <span>R$80K</span>
              <span>R$60K</span>
              <span>R$40K</span>
              <span>R$20K</span>
              <span>R$0</span>
            </div>
            <div className="chart-bars-container">
              {monthlyData.map((data, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div
                      className="bar bar-meta"
                      style={{ height: getBarHeight(data.meta, maxValue) }}
                      title={`Meta: ${formatCurrency(data.meta)}`}
                    ></div>
                    <div
                      className="bar bar-vendas"
                      style={{ height: getBarHeight(data.vendas, maxValue) }}
                      title={`Vendas: ${formatCurrency(data.vendas)}`}
                    ></div>
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color meta"></span> Meta</span>
            <span className="legend-item"><span className="legend-color vendas"></span> Vendas</span>
          </div>
        </div>

        {/* Gráfico de Receita */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Receita</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>R$60K</span>
              <span>R$50K</span>
              <span>R$40K</span>
              <span>R$30K</span>
              <span>R$20K</span>
              <span>R$10K</span>
              <span>R$0</span>
            </div>
            <div className="chart-bars-container">
              {monthlyData.map((data, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div
                      className="bar bar-receitas"
                      style={{ height: getBarHeight(data.receitas, 60000) }}
                      title={`Receitas: ${formatCurrency(data.receitas)}`}
                    ></div>
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color meta"></span> Meta</span>
            <span className="legend-item"><span className="legend-color receitas"></span> Receitas</span>
          </div>
        </div>
      </div>

      {/* Gráficos de Receita Prevista e Ticket Médio */}
      <div className="charts-row">
        {/* Receita Prevista */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Receita prevista</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>R$60K</span>
              <span>R$50K</span>
              <span>R$40K</span>
              <span>R$30K</span>
              <span>R$20K</span>
              <span>R$10K</span>
              <span>R$0</span>
            </div>
            <div className="chart-bars-container">
              {monthlyData.map((data, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div
                      className="bar bar-receitas"
                      style={{ height: getBarHeight(data.receitas, 60000) }}
                    ></div>
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ticket médio</h3>
          </div>
          <div className="line-chart">
            <div className="chart-y-axis">
              <span>R$250</span>
              <span>R$200</span>
              <span>R$150</span>
              <span>R$100</span>
              <span>R$50</span>
              <span>R$0</span>
            </div>
            <div className="line-chart-container">
              <svg viewBox="0 0 300 150" className="line-svg">
                {/* Linhas de grid */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#f0f0f0" strokeWidth="1"/>
                <line x1="0" y1="60" x2="300" y2="60" stroke="#f0f0f0" strokeWidth="1"/>
                <line x1="0" y1="90" x2="300" y2="90" stroke="#f0f0f0" strokeWidth="1"/>
                <line x1="0" y1="120" x2="300" y2="120" stroke="#f0f0f0" strokeWidth="1"/>

                {/* Linha geral */}
                <polyline
                  points="50,80 150,75 250,70"
                  fill="none"
                  stroke="#48bb78"
                  strokeWidth="2"
                />
                <circle cx="50" cy="80" r="4" fill="#48bb78"/>
                <circle cx="150" cy="75" r="4" fill="#48bb78"/>
                <circle cx="250" cy="70" r="4" fill="#48bb78"/>

                {/* Linha contrato/serviço */}
                <polyline
                  points="50,100 150,95 250,90"
                  fill="none"
                  stroke="#3182ce"
                  strokeWidth="2"
                />
                <circle cx="50" cy="100" r="4" fill="#3182ce"/>
                <circle cx="150" cy="95" r="4" fill="#3182ce"/>
                <circle cx="250" cy="90" r="4" fill="#3182ce"/>

                {/* Linha produto */}
                <polyline
                  points="50,60 150,55 250,50"
                  fill="none"
                  stroke="#9f7aea"
                  strokeWidth="2"
                />
                <circle cx="50" cy="60" r="4" fill="#9f7aea"/>
                <circle cx="150" cy="55" r="4" fill="#9f7aea"/>
                <circle cx="250" cy="50" r="4" fill="#9f7aea"/>
              </svg>
              <div className="line-chart-labels">
                <span>jul/2025</span>
                <span>ago/2025</span>
                <span>set/2025</span>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color ticket-geral"></span> Ticket médio geral</span>
            <span className="legend-item"><span className="legend-color ticket-contrato"></span> Ticket médio contrato/serviço</span>
            <span className="legend-item"><span className="legend-color ticket-produto"></span> Ticket médio produto</span>
          </div>
        </div>
      </div>

      {/* Gráficos: Vendas por origem e Recuperação */}
      <div className="charts-row">
        {/* Vendas por Origem */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Vendas por origem</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="donut-chart-container">
            <svg viewBox="0 0 200 200" className="donut-svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#48bb78" strokeWidth="50"
                      strokeDasharray="502" strokeDashoffset="0" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="50"
                      strokeDasharray="502" strokeDashoffset="502" />
              <text x="100" y="100" textAnchor="middle" dy="0" fontSize="24" fontWeight="bold" fill="#000">Manual</text>
              <text x="100" y="120" textAnchor="middle" fontSize="16" fill="#666">100%</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-item-vertical">
                <span className="legend-dot" style={{backgroundColor: '#48bb78'}}></span>
                <span>Manual</span>
                <span className="legend-percentage">100%</span>
              </div>
              <div className="legend-item-vertical">
                <span className="legend-dot" style={{backgroundColor: '#e2e8f0'}}></span>
                <span>Outros</span>
                <span className="legend-percentage">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recuperação com motor de cobrança */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Recuperação com motor de cobrança</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>R$350</span>
              <span>R$300</span>
              <span>R$250</span>
              <span>R$200</span>
              <span>R$150</span>
              <span>R$100</span>
              <span>R$50</span>
              <span>R$0</span>
            </div>
            <div className="chart-bars-container">
              <div className="bar-group">
                <div className="bar-stack">
                  <div className="bar bar-receitas" style={{height: '85%'}}></div>
                </div>
                <span className="bar-label">ago/2025</span>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color receitas"></span> Recuperação com motor de cobrança
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos: Contratos Vendidos e LTV */}
      <div className="charts-row">
        {/* Contratos Vendidos */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Contratos vendidos</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>50</span>
              <span>45</span>
              <span>40</span>
              <span>35</span>
              <span>30</span>
              <span>25</span>
              <span>20</span>
              <span>15</span>
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            <div className="chart-bars-container">
              {['jul/2025', 'ago/2025', 'set/2025'].map((month, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div className="bar bar-blue" style={{height: '60%'}}></div>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LTV */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>LTV (valor)</h3>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>R$4.5K</span>
              <span>R$4K</span>
              <span>R$3.5K</span>
              <span>R$3K</span>
              <span>R$2.5K</span>
              <span>R$2K</span>
              <span>R$1.5K</span>
              <span>R$1K</span>
              <span>R$500</span>
              <span>R$0</span>
            </div>
            <div className="chart-bars-container">
              {['jul/2025', 'ago/2025', 'set/2025'].map((month, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div className="bar bar-purple" style={{height: '70%'}}></div>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color ltv"></span> LTV</span>
          </div>
        </div>
      </div>

      {/* Gráficos: Histórico de clientes ativos e Churn */}
      <div className="charts-row">
        {/* Histórico de Clientes Ativos */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Histórico de clientes ativos</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>250</span>
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="chart-bars-container">
              {['jul/2025', 'ago/2025', 'set/2025'].map((month, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div className="bar bar-purple" style={{height: '90%'}}></div>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color meta"></span> Meta</span>
            <span className="legend-item"><span className="legend-color active-clients"></span> Clientes ativos</span>
          </div>
        </div>

        {/* Churn (Evasão) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Churn (Evasão)</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>10%</span>
              <span>9%</span>
              <span>8%</span>
              <span>7%</span>
              <span>6%</span>
              <span>5%</span>
              <span>4%</span>
              <span>3%</span>
              <span>2%</span>
              <span>1%</span>
              <span>0%</span>
            </div>
            <div className="chart-bars-container">
              {['jul/2025', 'ago/2025', 'set/2025'].map((month, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-stack">
                    <div className="bar bar-red" style={{height: '60%'}}></div>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color churn"></span> Churn</span>
          </div>
        </div>
      </div>

      {/* Gráficos Donut: Contratos mais vendidos e Contratos encerrados */}
      <div className="charts-row">
        {/* Contratos mais vendidos */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Contratos mais vendidos</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="donut-chart-container">
            <svg viewBox="0 0 200 200" className="donut-svg">
              {/* Placeholder para gráfico de pizza */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#3182ce" strokeWidth="50"
                      strokeDasharray="251 251" strokeDashoffset="0" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#63b3ed" strokeWidth="50"
                      strokeDasharray="125 377" strokeDashoffset="-251" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#90cdf4" strokeWidth="50"
                      strokeDasharray="88 414" strokeDashoffset="-376" transform="rotate(-90 100 100)" />
            </svg>
            <div className="donut-stats">
              <div className="donut-stat-item">
                <span className="stat-name">Beach Tênis 2x ANUAL</span>
                <span className="stat-percent">26.83%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Futevôlei 2x ANUAL</span>
                <span className="stat-percent">24.39%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Beach Tênis 1x ANUAL</span>
                <span className="stat-percent">19.51%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Outros</span>
                <span className="stat-percent">29.27%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contratos encerrados por motivo */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Contratos encerrados por motivo</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="donut-chart-container">
            <svg viewBox="0 0 200 200" className="donut-svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#e53e3e" strokeWidth="50"
                      strokeDasharray="251 251" strokeDashoffset="0" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#fc8181" strokeWidth="50"
                      strokeDasharray="150 352" strokeDashoffset="-251" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#feb2b2" strokeWidth="50"
                      strokeDasharray="67 435" strokeDashoffset="-401" transform="rotate(-90 100 100)" />
            </svg>
            <div className="donut-stats">
              <div className="donut-stat-item">
                <span className="stat-name">Mudou de contrato/plano</span>
                <span className="stat-percent">50%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Sem justificativa</span>
                <span className="stat-percent">30%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Sem tempo</span>
                <span className="stat-percent">13.33%</span>
              </div>
              <div className="donut-stat-item">
                <span className="stat-name">Outros</span>
                <span className="stat-percent">6.67%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas de Contratos */}
      <div className="full-width-chart">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Estatísticas de contratos</h3>
            <button type="button" className="btn-open-report">Abrir relatório</button>
          </div>
          <div className="stacked-bar-chart">
            <div className="chart-y-axis">
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            <div className="stacked-bars-container">
              {['jul/2025', 'ago/2025', 'set/2025'].map((month, index) => (
                <div key={index} className="stacked-bar-group">
                  <div className="stacked-bar-wrapper">
                    <div className="bar-segment green" style={{height: '40%'}}></div>
                    <div className="bar-segment blue" style={{height: '30%'}}></div>
                    <div className="bar-segment lightblue" style={{height: '15%'}}></div>
                    <div className="bar-segment red" style={{height: '10%'}}></div>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color contract-new"></span> Adesão de clientes</span>
            <span className="legend-item"><span className="legend-color contract-renew"></span> Renovação de clientes</span>
            <span className="legend-item"><span className="legend-color contract-return"></span> Retorno de clientes</span>
            <span className="legend-item"><span className="legend-color contract-end"></span> Encerramento de clientes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
