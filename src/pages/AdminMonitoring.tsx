import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faDatabase,
  faCloud,
  faUsers,
  faChartLine,
  faRefresh,
  faCheckCircle,
  faExclamationTriangle,
  faCog,
  faGauge,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { monitoringService } from '../services/monitoringService';
import UserManagement from '../components/UserManagement';
import AdminBilling from '../components/AdminBilling';
import type {
  DashboardMetrics,
  GCPMetrics,
  HealthCheck,
} from '../types/monitoringTypes';
import '../styles/AdminMonitoring.css';

// Chart colors
const COLORS = {
  primary: '#FF9900',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export default function AdminMonitoring() {
  const { user } = useAuthStore();
  const [mainTab, setMainTab] = useState<'billing' | 'metricas' | 'features'>('billing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gcp' | 'health'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [gcpMetrics, setGCPMetrics] = useState<GCPMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);

  // Historical data for charts (últimos 20 pontos) - persiste no localStorage
  const [metricsHistory, setMetricsHistory] = useState<Array<{
    time: string;
    requests: number;
    responseTime: number;
    memory: number;
    connections: number;
  }>>(() => {
    // Carregar dados históricos do localStorage
    try {
      const saved = localStorage.getItem('admin_metrics_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Salvar histórico no localStorage quando mudar
  useEffect(() => {
    if (metricsHistory.length > 0) {
      localStorage.setItem('admin_metrics_history', JSON.stringify(metricsHistory));
    }
  }, [metricsHistory]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData(true);

      // Auto-refresh a cada 30 segundos (silencioso, sem loading state)
      const interval = setInterval(() => {
        loadData(false);
      }, 30000);

      return () => clearInterval(interval);
    } else if (user) {
      // Se o usuário não tem permissão, para de carregar
      setLoading(false);
    }
  }, [user?.role]);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      await Promise.all([
        loadDashboard().catch(e => console.error('Dashboard error:', e)),
        loadGCP().catch(e => console.error('GCP error:', e)),
        loadHealth().catch(e => console.error('Health error:', e))
      ]);
    } catch (error: any) {
      console.error('Error loading monitoring data:', error);
      setError(error?.message || 'Erro ao carregar dados de monitoramento');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await monitoringService.getDashboard();
      if ((response as any).status === 'success' || (response as any).success === true) {
        setDashboard(response.data);

        // Adicionar ao histórico de métricas
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        setMetricsHistory(prev => {
          const newPoint = {
            time: timeStr,
            requests: response.data?.api?.requests?.total || 0,
            responseTime: response.data?.api?.requests?.avgResponseTime || 0,
            memory: response.data?.backend?.memory?.heapUsed || 0,
            connections: response.data?.database?.connectionPool?.active || 0,
          };

          // Manter apenas os últimos 20 pontos
          const updated = [...prev, newPoint];
          return updated.slice(-20);
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    }
  };

  const loadGCP = async () => {
    try {
      const response = await monitoringService.getGCPMetrics();
      if ((response as any).status === 'success' || (response as any).success === true) setGCPMetrics(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar GCP:', error);
      // GCP é opcional, não mostra erro
    }
  };

  const loadHealth = async () => {
    try {
      const response = await monitoringService.getHealthCheck();
      if ((response as any).status === 'success' || (response as any).success === true) setHealth(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar health:', error);
      toast.error('Erro ao carregar status de saúde');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Métricas atualizadas!');
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-monitoring-container">
        <div className="access-denied">
          <h1>Acesso Negado</h1>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-monitoring-container">
        <div className="loading">Carregando métricas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-monitoring-container">
        <div className="info-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <div>
            <p><strong>Erro ao carregar painel de monitoramento</strong></p>
            <p>{error}</p>
            <button className="btn-refresh" onClick={loadData} style={{ marginTop: '1rem' }}>
              <FontAwesomeIcon icon={faRefresh} />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-monitoring-container">
      <div className="monitoring-header">
        <div>
          <h1>Gerenciador</h1>
          <p>Gerenciamento de sistema e usuários</p>
        </div>
        {mainTab === 'metricas' && (
          <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
            <FontAwesomeIcon icon={faRefresh} spin={refreshing} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="monitoring-tabs main-tabs">
        <button
          className={`tab ${mainTab === 'billing' ? 'active' : ''}`}
          onClick={() => setMainTab('billing')}
        >
          <FontAwesomeIcon icon={faChartLine} /> Billing
        </button>
        <button
          className={`tab ${mainTab === 'metricas' ? 'active' : ''}`}
          onClick={() => setMainTab('metricas')}
        >
          <FontAwesomeIcon icon={faGauge} /> Metricas
        </button>
        <button
          className={`tab ${mainTab === 'features' ? 'active' : ''}`}
          onClick={() => setMainTab('features')}
        >
          <FontAwesomeIcon icon={faCog} /> Usuários
        </button>
      </div>

      {/* Content */}
      <div className="monitoring-content">
        {/* Billing Tab */}
        {mainTab === 'billing' && (
          <AdminBilling />
        )}

        {/* Metricas Tab */}
        {mainTab === 'metricas' && (
          <>
            {/* Sub-Tabs for Metrics */}
            <div className="monitoring-tabs sub-tabs">
              <button
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <FontAwesomeIcon icon={faChartLine} /> Dashboard
              </button>
              <button
                className={`tab ${activeTab === 'gcp' ? 'active' : ''}`}
                onClick={() => setActiveTab('gcp')}
              >
                <FontAwesomeIcon icon={faCloud} /> Google Cloud
              </button>
              <button
                className={`tab ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Health Check
              </button>
            </div>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                {!dashboard ? (
                  <div className="info-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <div>
                      <p><strong>Aguardando dados do servidor...</strong></p>
                      <p>Se o erro persistir, verifique se as rotas de monitoramento estão configuradas no backend.</p>
                    </div>
                  </div>
                ) : (
              <div className="tab-content">
                <div className="metrics-grid">
                  {/* Backend Metrics */}
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faServer} />
                      <h3>Backend (Node.js)</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Uptime:</span>
                        <strong>{dashboard?.backend?.uptime ? formatUptime(dashboard.backend.uptime) : 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Memória Usada:</span>
                        <strong>{dashboard?.backend?.memory?.heapUsed ? formatBytes(dashboard.backend.memory.heapUsed) : 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Memória Total:</span>
                        <strong>{dashboard?.backend?.memory?.heapTotal ? formatBytes(dashboard.backend.memory.heapTotal) : 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Node Version:</span>
                        <strong>{dashboard?.backend?.nodeVersion || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Database Metrics */}
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faDatabase} />
                      <h3>Banco de Dados</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Conexões Ativas:</span>
                        <strong>{dashboard?.database?.connectionPool?.active ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Conexões Idle:</span>
                        <strong>{dashboard?.database?.connectionPool?.idle ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Total Queries:</span>
                        <strong>{dashboard?.database?.queries?.total ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Tempo Médio:</span>
                        <strong>{dashboard?.database?.queries?.avgTime ? dashboard.database.queries.avgTime.toFixed(2) + 'ms' : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* API Metrics */}
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faChartLine} />
                      <h3>API</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Total Requests:</span>
                        <strong>{dashboard?.api?.requests?.total ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Sucessos:</span>
                        <strong className="success">{dashboard?.api?.requests?.success ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Erros:</span>
                        <strong className="error">{dashboard?.api?.requests?.errors ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Tempo Médio:</span>
                        <strong>{dashboard?.api?.requests?.avgResponseTime ? dashboard.api.requests.avgResponseTime.toFixed(2) + 'ms' : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Users Metrics */}
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faUsers} />
                      <h3>Usuários</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Total:</span>
                        <strong>{dashboard?.users?.total ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Ativos:</span>
                        <strong className="success">{dashboard?.users?.active ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Premium:</span>
                        <strong className="premium">{dashboard?.users?.premium ?? 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Novos (30d):</span>
                        <strong>{dashboard?.users?.recentSignups ?? 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Charts Section */}
                {metricsHistory.length > 0 && (
                  <div className="charts-section">
                    <h2 className="charts-title">📊 Métricas ao Longo do Tempo</h2>

                    <div className="charts-grid">
                      {/* API Requests Chart */}
                      <div className="chart-card">
                        <h3>Total de Requests</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={metricsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="requests"
                              stroke={COLORS.primary}
                              strokeWidth={2}
                              dot={{ fill: COLORS.primary, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Response Time Chart */}
                      <div className="chart-card">
                        <h3>Tempo de Resposta Médio (ms)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={metricsHistory}>
                            <defs>
                              <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={COLORS.info} stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="responseTime"
                              stroke={COLORS.info}
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorResponseTime)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Database Connections Chart */}
                      <div className="chart-card">
                        <h3>Conexões do Banco de Dados</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={metricsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="connections" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Success Rate Pie Chart */}
                      <div className="chart-card">
                        <h3>Taxa de Sucesso de Requests</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Sucesso', value: dashboard?.api?.requests?.success || 0 },
                                { name: 'Erros', value: dashboard?.api?.requests?.errors || 0 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill={COLORS.success} />
                              <Cell fill={COLORS.error} />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                )}
              </>
            )}

            {/* GCP Tab */}
            {activeTab === 'gcp' && (
              <>
                {!gcpMetrics ? (
                  <div className="info-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <div>
                      <p><strong>Aguardando métricas do Google Cloud...</strong></p>
                      <p>Verifique se o serviço de monitoramento está configurado no backend.</p>
                    </div>
                  </div>
                ) : (
              <div className="tab-content">
                {gcpMetrics.enabled === false ? (
                  <div className="info-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <p>Google Cloud Monitoring está desabilitado. Configure ENABLE_GCP_MONITORING=true.</p>
                  </div>
                ) : (
                  <div className="metrics-grid">
                    {/* Cloud SQL */}
                    {gcpMetrics?.cloudSQL && !gcpMetrics.cloudSQL.error && (
                      <div className="metric-card">
                        <div className="metric-header">
                          <FontAwesomeIcon icon={faDatabase} />
                          <h3>Cloud SQL</h3>
                        </div>
                        <div className="metric-body">
                          <div className="metric-item">
                            <span>Instance:</span>
                            <strong>{gcpMetrics?.cloudSQL?.instance || 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>CPU Atual:</span>
                            <strong>{gcpMetrics?.cloudSQL?.cpu?.current ? formatPercent(gcpMetrics.cloudSQL.cpu.current) : 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Memória Atual:</span>
                            <strong>{gcpMetrics?.cloudSQL?.memory?.current ? formatPercent(gcpMetrics.cloudSQL.memory.current) : 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Conexões:</span>
                            <strong>{gcpMetrics?.cloudSQL?.connections?.current ? Math.round(gcpMetrics.cloudSQL.connections.current) : 'N/A'}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cloud Run */}
                    {gcpMetrics?.cloudRun && !gcpMetrics.cloudRun.error && (
                      <div className="metric-card">
                        <div className="metric-header">
                          <FontAwesomeIcon icon={faServer} />
                          <h3>Cloud Run</h3>
                        </div>
                        <div className="metric-body">
                          <div className="metric-item">
                            <span>Service:</span>
                            <strong>{gcpMetrics?.cloudRun?.service || 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Requests:</span>
                            <strong>{gcpMetrics?.cloudRun?.requests?.current ? Math.round(gcpMetrics.cloudRun.requests.current) : 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Latência Média:</span>
                            <strong>{gcpMetrics?.cloudRun?.latency?.avg ? gcpMetrics.cloudRun.latency.avg.toFixed(2) + 'ms' : 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Instâncias:</span>
                            <strong>{gcpMetrics?.cloudRun?.instances?.current ? Math.round(gcpMetrics.cloudRun.instances.current) : 'N/A'}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing */}
                    {gcpMetrics?.billing && !gcpMetrics.billing.error && (
                      <div className="metric-card">
                        <div className="metric-header">
                          <FontAwesomeIcon icon={faCloud} />
                          <h3>Billing</h3>
                        </div>
                        <div className="metric-body">
                          <div className="metric-item">
                            <span>Project:</span>
                            <strong>{gcpMetrics?.billing?.projectId || 'N/A'}</strong>
                          </div>
                          <div className="metric-item">
                            <span>Billing Enabled:</span>
                            <strong className={gcpMetrics?.billing?.billingEnabled ? 'success' : 'error'}>
                              {gcpMetrics?.billing?.billingEnabled ? 'Sim' : 'Não'}
                            </strong>
                          </div>
                          <div className="metric-item info-text" style={{ gridColumn: '1 / -1' }}>
                            {gcpMetrics?.billing?.message || ''}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
                )}
              </>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && (
              <>
                {!health ? (
                  <div className="info-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <div>
                      <p><strong>Aguardando health check...</strong></p>
                      <p>Verifique se o endpoint de health está acessível.</p>
                    </div>
                  </div>
                ) : (
              <div className="tab-content">
                <div className="health-status">
                  <div className={`status-badge ${health?.status || 'unknown'}`}>
                    <FontAwesomeIcon
                      icon={health?.status === 'healthy' ? faCheckCircle : faExclamationTriangle}
                    />
                    {health?.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                  <p className="health-timestamp">Last check: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}</p>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-header">
                      <h3>Backend</h3>
                      <span className={`status-dot ${health?.services?.backend?.status || 'unknown'}`}></span>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Status:</span>
                        <strong>{health?.services?.backend?.status || 'N/A'}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Uptime:</span>
                        <strong>{health?.services?.backend?.uptime ? formatUptime(health.services.backend.uptime) : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <h3>Database</h3>
                      <span className={`status-dot ${health?.services?.database?.status || 'unknown'}`}></span>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Status:</span>
                        <strong>{health?.services?.database?.status || 'N/A'}</strong>
                      </div>
                      {health?.services?.database?.error && (
                        <div className="metric-item error">
                          <span>Error:</span>
                          <strong>{health.services.database.error}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                )}
              </>
            )}
          </>
        )}

        {/* Features Tab - User Management */}
        {mainTab === 'features' && (
          <UserManagement />
        )}
      </div>
    </div>
  );
}
