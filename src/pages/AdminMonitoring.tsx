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
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { monitoringService } from '../services/monitoringService';
import type {
  DashboardMetrics,
  GCPMetrics,
  HealthCheck,
} from '../types/monitoringTypes';
import '../styles/AdminMonitoring.css';

export default function AdminMonitoring() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gcp' | 'health'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [gcpMetrics, setGCPMetrics] = useState<GCPMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'gestor') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadDashboard(), loadGCP(), loadHealth()]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await monitoringService.getDashboard();
      if (response.success) setDashboard(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    }
  };

  const loadGCP = async () => {
    try {
      const response = await monitoringService.getGCPMetrics();
      if (response.success) setGCPMetrics(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar GCP:', error);
      // GCP é opcional, não mostra erro
    }
  };

  const loadHealth = async () => {
    try {
      const response = await monitoringService.getHealthCheck();
      if (response.success) setHealth(response.data);
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

  if (user?.role !== 'admin' && user?.role !== 'gestor') {
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

  return (
    <div className="admin-monitoring-container">
      <div className="monitoring-header">
        <div>
          <h1>Painel de Monitoramento Admin</h1>
          <p>Métricas e estatísticas do sistema</p>
        </div>
        <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
          <FontAwesomeIcon icon={faRefresh} spin={refreshing} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="monitoring-tabs">
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

      {/* Content */}
      <div className="monitoring-content">
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
                    <strong>{formatUptime(dashboard.backend.uptime)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Memória Usada:</span>
                    <strong>{formatBytes(dashboard.backend.memory.heapUsed)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Memória Total:</span>
                    <strong>{formatBytes(dashboard.backend.memory.heapTotal)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Node Version:</span>
                    <strong>{dashboard.backend.nodeVersion}</strong>
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
                    <strong>{dashboard.database.connectionPool.active}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Conexões Idle:</span>
                    <strong>{dashboard.database.connectionPool.idle}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Total Queries:</span>
                    <strong>{dashboard.database.queries.total}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Tempo Médio:</span>
                    <strong>{dashboard.database.queries.avgTime.toFixed(2)}ms</strong>
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
                    <strong>{dashboard.api.requests.total}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Sucessos:</span>
                    <strong className="success">{dashboard.api.requests.success}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Erros:</span>
                    <strong className="error">{dashboard.api.requests.errors}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Tempo Médio:</span>
                    <strong>{dashboard.api.requests.avgResponseTime.toFixed(2)}ms</strong>
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
                    <strong>{dashboard.users.total}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Ativos:</span>
                    <strong className="success">{dashboard.users.active}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Premium:</span>
                    <strong className="premium">{dashboard.users.premium}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Novos (30d):</span>
                    <strong>{dashboard.users.recentSignups}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                {gcpMetrics.cloudSQL && !gcpMetrics.cloudSQL.error && (
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faDatabase} />
                      <h3>Cloud SQL</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Instance:</span>
                        <strong>{gcpMetrics.cloudSQL.instance}</strong>
                      </div>
                      <div className="metric-item">
                        <span>CPU Atual:</span>
                        <strong>{formatPercent(gcpMetrics.cloudSQL.cpu.current)}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Memória Atual:</span>
                        <strong>{formatPercent(gcpMetrics.cloudSQL.memory.current)}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Conexões:</span>
                        <strong>{Math.round(gcpMetrics.cloudSQL.connections.current)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cloud Run */}
                {gcpMetrics.cloudRun && !gcpMetrics.cloudRun.error && (
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faServer} />
                      <h3>Cloud Run</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Service:</span>
                        <strong>{gcpMetrics.cloudRun.service}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Requests:</span>
                        <strong>{Math.round(gcpMetrics.cloudRun.requests.current)}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Latência Média:</span>
                        <strong>{gcpMetrics.cloudRun.latency.avg.toFixed(2)}ms</strong>
                      </div>
                      <div className="metric-item">
                        <span>Instâncias:</span>
                        <strong>{Math.round(gcpMetrics.cloudRun.instances.current)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing */}
                {gcpMetrics.billing && !gcpMetrics.billing.error && (
                  <div className="metric-card">
                    <div className="metric-header">
                      <FontAwesomeIcon icon={faCloud} />
                      <h3>Billing</h3>
                    </div>
                    <div className="metric-body">
                      <div className="metric-item">
                        <span>Project:</span>
                        <strong>{gcpMetrics.billing.projectId}</strong>
                      </div>
                      <div className="metric-item">
                        <span>Billing Enabled:</span>
                        <strong className={gcpMetrics.billing.billingEnabled ? 'success' : 'error'}>
                          {gcpMetrics.billing.billingEnabled ? 'Sim' : 'Não'}
                        </strong>
                      </div>
                      <div className="metric-item info-text" style={{ gridColumn: '1 / -1' }}>
                        {gcpMetrics.billing.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              <div className={`status-badge ${health.status}`}>
                <FontAwesomeIcon
                  icon={health.status === 'healthy' ? faCheckCircle : faExclamationTriangle}
                />
                {health.status.toUpperCase()}
              </div>
              <p className="health-timestamp">Last check: {new Date(health.timestamp).toLocaleString()}</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <h3>Backend</h3>
                  <span className={`status-dot ${health.services.backend.status}`}></span>
                </div>
                <div className="metric-body">
                  <div className="metric-item">
                    <span>Status:</span>
                    <strong>{health.services.backend.status}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Uptime:</span>
                    <strong>{formatUptime(health.services.backend.uptime)}</strong>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h3>Database</h3>
                  <span className={`status-dot ${health.services.database.status}`}></span>
                </div>
                <div className="metric-body">
                  <div className="metric-item">
                    <span>Status:</span>
                    <strong>{health.services.database.status}</strong>
                  </div>
                  {health.services.database.error && (
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
      </div>
    </div>
  );
}
