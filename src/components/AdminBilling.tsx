import { useState, useEffect, useCallback } from 'react';
import { platformBillingService } from '../services/platformBillingService';
import { monitoringService } from '../services/monitoringService';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faUsers,
  faClock,
  faExclamationTriangle,
  faArrowUp,
  faSearch,
  faFileInvoiceDollar,
  faCheck,
  faTimes,
  faSpinner,
  faRefresh,
  faEye,
  faToggleOn,
  faToggleOff,
  faPlus,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import type { Feature } from '../types/monitoringTypes';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  gestores: { total: number; active: number; trial: number; blocked: number; past_due: number };
  mrr_cents: number;
  mrr_reais: number;
  active_paid_subscriptions: number;
  overdue_total_cents: number;
  pending_upgrade_requests: number;
}

interface GestorRow {
  id: number;
  full_name: string;
  email: string;
  billing_status: string;
  billing_plan_slug: string;
  max_students: number;
  max_classes: number;
  student_count: number;
  class_count: number;
  plan_name: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

interface GestorDetail {
  user: any;
  subscription: any;
  student_count: number;
  class_count: number;
  invoices: any[];
  upgrade_requests: any[];
}

interface InvoiceRow {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  reference_month: string;
  due_date: string;
  final_amount_cents: number;
  status: string;
  paid_at: string | null;
}

interface UpgradeRequestRow {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  current_plan_name: string;
  requested_plan_name: string;
  requested_addons: any;
  reason: string;
  status: string;
  created_at: string;
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  max_students: number;
  max_classes: number;
  price_cents: number;
}

interface Addon {
  id: number;
  name: string;
  slug: string;
  price_cents: number;
  feature_codes: string[];
  is_bundle: boolean;
}

export type BillingSubTab = 'dashboard' | 'gestores' | 'faturas' | 'upgrades';

interface AdminBillingProps {
  forcedTab?: BillingSubTab;
  hideTabBar?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusColors: Record<string, { bg: string; color: string }> = {
  trial: { bg: '#DBEAFE', color: '#1E40AF' },
  active: { bg: '#D1FAE5', color: '#065F46' },
  past_due: { bg: '#FEF3C7', color: '#92400E' },
  blocked: { bg: '#FEE2E2', color: '#991B1B' },
  pending: { bg: '#FEF3C7', color: '#92400E' },
  paid: { bg: '#D1FAE5', color: '#065F46' },
  overdue: { bg: '#FEE2E2', color: '#991B1B' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  denied: { bg: '#FEE2E2', color: '#991B1B' },
};

const statusLabel: Record<string, string> = {
  trial: 'Trial',
  active: 'Ativo',
  past_due: 'Inadimplente',
  blocked: 'Bloqueado',
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  approved: 'Aprovado',
  denied: 'Negado',
};

// ── Inline style objects ─────────────────────────────────────────────────────

const styles = {
  container: { padding: 0 } as React.CSSProperties,
  subtabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '1.5rem',
    paddingTop: '0.5rem',
  } as React.CSSProperties,
  subtab: (active: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: '0.75rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: active ? '#FF9900' : '#6B7280',
    cursor: 'pointer',
    borderBottom: active ? '3px solid #FF9900' : '3px solid transparent',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  statCard: (accent: string): React.CSSProperties => ({
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #E5E7EB',
    borderLeft: `4px solid ${accent}`,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }),
  statIcon: (accent: string): React.CSSProperties => ({
    fontSize: '1.5rem',
    color: accent,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: `${accent}15`,
    flexShrink: 0,
  }),
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#1F2937', margin: 0 } as React.CSSProperties,
  statLabel: { fontSize: '0.8rem', color: '#6B7280', margin: 0 } as React.CSSProperties,
  filterRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } as React.CSSProperties,
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '0.9rem',
    outline: 'none',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#fff',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '0.75rem 1rem',
    background: '#F9FAFB',
    color: '#6B7280',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '2px solid #E5E7EB',
  } as React.CSSProperties,
  td: (idx: number): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: '#1F2937',
    borderBottom: '1px solid #F3F4F6',
    background: idx % 2 === 0 ? '#fff' : '#FAFBFC',
  }),
  badge: (status: string): React.CSSProperties => {
    const c = statusColors[status] || { bg: '#F3F4F6', color: '#6B7280' };
    return {
      display: 'inline-block',
      padding: '0.2rem 0.65rem',
      borderRadius: '12px',
      fontSize: '0.78rem',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    };
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  btnSuccess: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.82rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  btnDanger: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.82rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  btnSmall: {
    padding: '0.35rem 0.7rem',
    fontSize: '0.8rem',
    borderRadius: '6px',
  } as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    width: '95%',
    maxWidth: '800px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #F3F4F6',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1F2937',
    margin: '1.5rem 0 0.75rem 0',
  } as React.CSSProperties,
  spinner: { textAlign: 'center' as const, padding: '2rem', color: '#6B7280' } as React.CSSProperties,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminBilling({ forcedTab, hideTabBar }: AdminBillingProps = {}) {
  const [internalTab, setInternalTab] = useState<BillingSubTab>('dashboard');
  const activeTab = forcedTab ?? internalTab;
  const [loading, setLoading] = useState(false);

  // Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Gestores
  const [gestores, setGestores] = useState<GestorRow[]>([]);
  const [gestorSearch, setGestorSearch] = useState('');
  const [gestorStatusFilter, setGestorStatusFilter] = useState('all');
  const [gestorModalOpen, setGestorModalOpen] = useState(false);
  const [selectedGestorId, setSelectedGestorId] = useState<number | null>(null);
  const [gestorDetail, setGestorDetail] = useState<GestorDetail | null>(null);
  const [gestorDetailLoading, setGestorDetailLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Faturas
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  // Upgrade Requests
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequestRow[]>([]);
  const [upgradeStatusFilter, setUpgradeStatusFilter] = useState('all');
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({});

  // Premium Features (individual toggles per gestor)
  const [features, setFeatures] = useState<Feature[]>([]);
  const [updatingFeature, setUpdatingFeature] = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await platformBillingService.adminGetDashboard();
      if (res.success) setDashboardData(res.data);
    } catch {
      toast.error('Erro ao carregar dashboard de billing');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGestores = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (gestorSearch) params.search = gestorSearch;
      if (gestorStatusFilter !== 'all') params.billing_status = gestorStatusFilter;
      const res = await platformBillingService.adminGetGestores(params);
      if (res.success) setGestores(res.data);
    } catch {
      toast.error('Erro ao carregar gestores');
    } finally {
      setLoading(false);
    }
  }, [gestorSearch, gestorStatusFilter]);

  const loadPlansAndAddons = useCallback(async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        platformBillingService.getPlans(),
        platformBillingService.getAddons(),
      ]);
      if (pRes.success) setPlans(pRes.data);
      if (aRes.success) setAddons(aRes.data);
    } catch {
      // Silent – plans/addons are secondary
    }
  }, []);

  const loadGestorDetail = useCallback(async (id: number) => {
    try {
      setGestorDetailLoading(true);
      const res = await platformBillingService.adminGetGestorDetail(id);
      if (res.success) setGestorDetail(res.data);
    } catch {
      toast.error('Erro ao carregar detalhes do gestor');
    } finally {
      setGestorDetailLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (invoiceMonth) params.month = invoiceMonth;
      if (invoiceStatusFilter !== 'all') params.status = invoiceStatusFilter;
      const res = await platformBillingService.adminGetInvoices(params);
      if (res.success) setInvoices(res.data);
    } catch {
      toast.error('Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  }, [invoiceMonth, invoiceStatusFilter]);

  const loadUpgradeRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (upgradeStatusFilter !== 'all') params.status = upgradeStatusFilter;
      const res = await platformBillingService.adminGetUpgradeRequests(params);
      if (res.success) setUpgradeRequests(res.data);
    } catch {
      toast.error('Erro ao carregar solicitações de upgrade');
    } finally {
      setLoading(false);
    }
  }, [upgradeStatusFilter]);

  const loadFeatures = useCallback(async () => {
    try {
      const response = await monitoringService.listFeatures();
      if ((response as any).status === 'success' || (response as any).success === true) {
        setFeatures(response.data);
      }
    } catch {
      // Silent - features are secondary
    }
  }, []);

  const toggleGestorFeature = async (featureCode: string, currentlyEnabled: boolean) => {
    if (!selectedGestorId || !gestorDetail) return;
    setUpdatingFeature(featureCode);
    try {
      const currentFeatures: string[] = gestorDetail.user?.premium_features || [];
      let updatedFeatures: string[];
      if (currentlyEnabled) {
        updatedFeatures = currentFeatures.filter((f: string) => !f.startsWith(featureCode));
      } else {
        updatedFeatures = [...currentFeatures, `${featureCode}:unlimited`];
      }
      const response = await monitoringService.updateUserFeatures(selectedGestorId, { features: updatedFeatures });
      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(currentlyEnabled ? `Feature "${featureCode}" desabilitada` : `Feature "${featureCode}" habilitada`);
        await loadGestorDetail(selectedGestorId);
      } else {
        toast.error('Falha ao atualizar feature');
      }
    } catch {
      toast.error('Erro ao atualizar feature');
    } finally {
      setUpdatingFeature(null);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'gestores') {
      loadGestores();
      loadPlansAndAddons();
      loadFeatures();
    }
    if (activeTab === 'faturas') loadInvoices();
    if (activeTab === 'upgrades') loadUpgradeRequests();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'gestores') loadGestores();
  }, [gestorSearch, gestorStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'faturas') loadInvoices();
  }, [invoiceMonth, invoiceStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'upgrades') loadUpgradeRequests();
  }, [upgradeStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const openGestorModal = async (id: number) => {
    setSelectedGestorId(id);
    setGestorModalOpen(true);
    setGestorDetail(null);
    setSelectedPlanId(null);
    await loadGestorDetail(id);
  };

  const handleAssignPlan = async () => {
    if (!selectedGestorId || !selectedPlanId) return;
    try {
      const res = await platformBillingService.adminAssignPlan(selectedGestorId, selectedPlanId);
      if (res.success) {
        toast.success('Plano atribuído com sucesso');
        await loadGestorDetail(selectedGestorId);
        loadGestores();
      } else {
        toast.error(res.message || 'Erro ao atribuir plano');
      }
    } catch {
      toast.error('Erro ao atribuir plano');
    }
  };

  const handleToggleAddon = async (addonId: number, currentlyEnabled: boolean) => {
    if (!selectedGestorId) return;
    try {
      const res = await platformBillingService.adminToggleAddon(selectedGestorId, addonId, !currentlyEnabled);
      if (res.success) {
        toast.success(currentlyEnabled ? 'Addon desabilitado' : 'Addon habilitado');
        await loadGestorDetail(selectedGestorId);
      } else {
        toast.error(res.message || 'Erro ao alterar addon');
      }
    } catch {
      toast.error('Erro ao alterar addon');
    }
  };

  const handleConfirmPayment = async (invoiceId: number) => {
    if (!window.confirm('Confirmar pagamento desta fatura?')) return;
    try {
      const res = await platformBillingService.adminConfirmPayment(invoiceId);
      if (res.success) {
        toast.success('Pagamento confirmado');
        loadInvoices();
      } else {
        toast.error(res.message || 'Erro ao confirmar pagamento');
      }
    } catch {
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const handleGenerateInvoices = async () => {
    if (!invoiceMonth) {
      toast.error('Selecione o mês de referência');
      return;
    }
    if (!window.confirm(`Gerar faturas para ${invoiceMonth}?`)) return;
    try {
      setGenerating(true);
      const res = await platformBillingService.adminGenerateInvoices(invoiceMonth);
      if (res.success) {
        const d = res.data;
        toast.success(`Faturas geradas: ${d.generated} | Ignoradas: ${d.skipped} | Erros: ${d.errors}`);
        loadInvoices();
      } else {
        toast.error(res.message || 'Erro ao gerar faturas');
      }
    } catch {
      toast.error('Erro ao gerar faturas');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveUpgrade = async (requestId: number) => {
    const notes = actionNotes[requestId] || '';
    try {
      const res = await platformBillingService.adminApproveUpgrade(requestId, notes || undefined);
      if (res.success) {
        toast.success('Upgrade aprovado');
        loadUpgradeRequests();
      } else {
        toast.error(res.message || 'Erro ao aprovar upgrade');
      }
    } catch {
      toast.error('Erro ao aprovar upgrade');
    }
  };

  const handleDenyUpgrade = async (requestId: number) => {
    const notes = actionNotes[requestId] || '';
    try {
      const res = await platformBillingService.adminDenyUpgrade(requestId, notes || undefined);
      if (res.success) {
        toast.success('Upgrade negado');
        loadUpgradeRequests();
      } else {
        toast.error(res.message || 'Erro ao negar upgrade');
      }
    } catch {
      toast.error('Erro ao negar upgrade');
    }
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  const renderDashboard = () => {
    if (loading && !dashboardData) {
      return <div style={styles.spinner}><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</div>;
    }
    if (!dashboardData) return null;

    const g = dashboardData.gestores;
    const cards = [
      { label: 'MRR', value: formatBRL(dashboardData.mrr_cents), sublabel: `${dashboardData.active_paid_subscriptions || 0} assinaturas pagas`, icon: faDollarSign, accent: '#10B981' },
      { label: 'Gestores Total', value: g.total, sublabel: `${g.active} ativos`, icon: faUsers, accent: '#3B82F6' },
      { label: 'Trial', value: g.trial, icon: faClock, accent: '#8B5CF6' },
      { label: 'Inadimplentes', value: g.past_due + g.blocked, icon: faExclamationTriangle, accent: '#EF4444' },
      { label: 'Inadimplência', value: formatBRL(dashboardData.overdue_total_cents), icon: faExclamationTriangle, accent: '#DC2626' },
      { label: 'Requests Pendentes', value: dashboardData.pending_upgrade_requests, icon: faArrowUp, accent: '#F59E0B' },
    ];

    return (
      <div style={styles.statsGrid}>
        {cards.map((c) => (
          <div key={c.label} style={styles.statCard(c.accent)}>
            <div style={styles.statIcon(c.accent)}>
              <FontAwesomeIcon icon={c.icon} />
            </div>
            <div>
              <p style={styles.statValue}>{c.value}</p>
              <p style={styles.statLabel}>{c.label}</p>
              {'sublabel' in c && c.sublabel && (
                <p style={{ ...styles.statLabel, fontSize: '0.72rem', marginTop: '0.15rem' }}>{c.sublabel}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGestores = () => (
    <>
      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <FontAwesomeIcon
            icon={faSearch}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
          />
          <input
            style={{ ...styles.input, paddingLeft: '2rem', width: '100%' }}
            placeholder="Buscar por nome..."
            value={gestorSearch}
            onChange={(e) => setGestorSearch(e.target.value)}
          />
        </div>
        <select
          style={styles.select}
          value={gestorStatusFilter}
          onChange={(e) => setGestorStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="trial">Trial</option>
          <option value="active">Ativo</option>
          <option value="past_due">Inadimplente</option>
          <option value="blocked">Bloqueado</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.spinner}><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Plano</th>
                <th style={styles.th}>Alunos</th>
                <th style={styles.th}>Turmas</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gestores.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...styles.td(0), textAlign: 'center', color: '#9CA3AF' }}>
                    Nenhum gestor encontrado
                  </td>
                </tr>
              ) : (
                gestores.map((g, idx) => (
                  <tr key={g.id}>
                    <td style={styles.td(idx)}>{g.full_name}</td>
                    <td style={{ ...styles.td(idx), fontSize: '0.83rem', color: '#6B7280' }}>{g.email}</td>
                    <td style={styles.td(idx)}>{g.plan_name || g.billing_plan_slug || '-'}</td>
                    <td style={styles.td(idx)}>
                      {g.student_count}/{g.max_students === -1 ? '\u221E' : g.max_students}
                    </td>
                    <td style={styles.td(idx)}>
                      {g.class_count}/{g.max_classes === -1 ? '\u221E' : g.max_classes}
                    </td>
                    <td style={styles.td(idx)}>
                      <span style={styles.badge(g.billing_status)}>
                        {statusLabel[g.billing_status] || g.billing_status}
                      </span>
                    </td>
                    <td style={styles.td(idx)}>
                      <button
                        style={{ ...styles.btnPrimary, ...styles.btnSmall }}
                        onClick={() => openGestorModal(g.id)}
                      >
                        <FontAwesomeIcon icon={faEye} /> Gerenciar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Gestor detail modal */}
      {gestorModalOpen && renderGestorModal()}
    </>
  );

  const renderGestorModal = () => {
    const activeAddonIds: number[] =
      gestorDetail?.subscription?.addons?.map((a: any) => a.addon_id || a.id) || [];

    return (
      <div style={styles.modal} onClick={() => setGestorModalOpen(false)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1F2937' }}>
              Gerenciar Gestor
            </h2>
            <button
              onClick={() => setGestorModalOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {gestorDetailLoading ? (
            <div style={styles.spinner}><FontAwesomeIcon icon={faSpinner} spin /> Carregando detalhes...</div>
          ) : gestorDetail ? (
            <>
              {/* User info */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0.25rem 0', color: '#1F2937' }}>
                  <strong>{gestorDetail.user?.full_name}</strong> — {gestorDetail.user?.email}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#6B7280', fontSize: '0.85rem' }}>
                  Alunos: {gestorDetail.student_count} | Turmas: {gestorDetail.class_count}
                </p>
                {gestorDetail.subscription && (
                  <p style={{ margin: '0.25rem 0', color: '#6B7280', fontSize: '0.85rem' }}>
                    Plano atual: <strong>{gestorDetail.subscription.plan_name || '-'}</strong> | Status:{' '}
                    <span style={styles.badge(gestorDetail.subscription.status || 'active')}>
                      {statusLabel[gestorDetail.subscription.status] || gestorDetail.subscription.status}
                    </span>
                  </p>
                )}
              </div>

              {/* Assign plan */}
              <h3 style={styles.sectionTitle}>Atribuir Plano</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <select
                  style={{ ...styles.select, flex: 1 }}
                  value={selectedPlanId || ''}
                  onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecionar plano...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatBRL(p.price_cents)} (max {p.max_students === -1 ? '\u221E' : p.max_students} alunos, {p.max_classes === -1 ? '\u221E' : p.max_classes} turmas)
                    </option>
                  ))}
                </select>
                <button
                  style={styles.btnPrimary}
                  disabled={!selectedPlanId}
                  onClick={handleAssignPlan}
                >
                  Atribuir Plano
                </button>
              </div>

              {/* Addons */}
              <h3 style={styles.sectionTitle}>Addons</h3>
              {addons.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Nenhum addon disponível</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {addons.map((addon) => {
                    const enabled = activeAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.75rem',
                          background: enabled ? '#F0FDF4' : '#F9FAFB',
                          borderRadius: '8px',
                          border: `1px solid ${enabled ? '#BBF7D0' : '#E5E7EB'}`,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                            {addon.name}
                          </span>
                          <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '0.8rem' }}>
                            {formatBRL(addon.price_cents)}
                            {addon.is_bundle ? ' (bundle)' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleAddon(addon.id, enabled)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.4rem',
                            color: enabled ? '#10B981' : '#D1D5DB',
                            transition: 'color 0.2s',
                          }}
                          title={enabled ? 'Desabilitar' : 'Habilitar'}
                        >
                          <FontAwesomeIcon icon={enabled ? faToggleOn : faToggleOff} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Premium Features (individual) */}
              {features.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Features Premium</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {features.map((feature) => {
                      const userFeatures: string[] = gestorDetail?.user?.premium_features || [];
                      const isEnabled = userFeatures.some((f: string) => f.startsWith(feature.feature_code));
                      const isUpdating = updatingFeature === feature.feature_code;
                      return (
                        <div
                          key={feature.feature_code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.75rem',
                            background: isEnabled ? '#EFF6FF' : '#F9FAFB',
                            borderRadius: '8px',
                            border: `1px solid ${isEnabled ? '#BFDBFE' : '#E5E7EB'}`,
                            opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>
                              {feature.feature_name}
                            </span>
                            <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '0.8rem' }}>
                              {feature.description}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleGestorFeature(feature.feature_code, isEnabled)}
                            disabled={isUpdating}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isUpdating ? 'wait' : 'pointer',
                              fontSize: '1.4rem',
                              color: isEnabled ? '#3B82F6' : '#D1D5DB',
                              transition: 'color 0.2s',
                            }}
                            title={isEnabled ? 'Desabilitar' : 'Habilitar'}
                          >
                            {isUpdating ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <FontAwesomeIcon icon={isEnabled ? faToggleOn : faToggleOff} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Recent invoices */}
              {gestorDetail.invoices && gestorDetail.invoices.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Faturas Recentes</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Mês Ref.</th>
                          <th style={styles.th}>Valor</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gestorDetail.invoices.slice(0, 6).map((inv: any, idx: number) => (
                          <tr key={inv.id}>
                            <td style={styles.td(idx)}>{inv.reference_month}</td>
                            <td style={styles.td(idx)}>{formatBRL(inv.final_amount_cents)}</td>
                            <td style={styles.td(idx)}>
                              <span style={styles.badge(inv.status)}>
                                {statusLabel[inv.status] || inv.status}
                              </span>
                            </td>
                            <td style={styles.td(idx)}>
                              {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Pending upgrade requests */}
              {gestorDetail.upgrade_requests && gestorDetail.upgrade_requests.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Solicitações de Upgrade</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Plano Solicitado</th>
                          <th style={styles.th}>Motivo</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gestorDetail.upgrade_requests.map((req: any, idx: number) => (
                          <tr key={req.id}>
                            <td style={styles.td(idx)}>{req.requested_plan_name || '-'}</td>
                            <td style={{ ...styles.td(idx), maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.reason || '-'}
                            </td>
                            <td style={styles.td(idx)}>
                              <span style={styles.badge(req.status)}>
                                {statusLabel[req.status] || req.status}
                              </span>
                            </td>
                            <td style={styles.td(idx)}>
                              {req.created_at ? new Date(req.created_at).toLocaleDateString('pt-BR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <p style={{ color: '#9CA3AF' }}>Nenhum dado encontrado.</p>
          )}
        </div>
      </div>
    );
  };

  const renderFaturas = () => (
    <>
      {/* Filters */}
      <div style={styles.filterRow}>
        <input
          type="month"
          style={styles.input}
          value={invoiceMonth}
          onChange={(e) => setInvoiceMonth(e.target.value)}
        />
        <select
          style={styles.select}
          value={invoiceStatusFilter}
          onChange={(e) => setInvoiceStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <button
          style={{ ...styles.btnSuccess, opacity: generating ? 0.6 : 1 }}
          disabled={generating}
          onClick={handleGenerateInvoices}
        >
          <FontAwesomeIcon icon={generating ? faSpinner : faPlus} spin={generating} />
          {generating ? 'Gerando...' : 'Gerar Faturas do Mês'}
        </button>
        <button
          style={{ ...styles.btnPrimary, ...styles.btnSmall }}
          onClick={loadInvoices}
        >
          <FontAwesomeIcon icon={faRefresh} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div style={styles.spinner}><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Gestor</th>
                <th style={styles.th}>Mês Ref.</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Pago em</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...styles.td(0), textAlign: 'center', color: '#9CA3AF' }}>
                    Nenhuma fatura encontrada
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={inv.id}>
                    <td style={styles.td(idx)}>
                      <div>{inv.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{inv.email}</div>
                    </td>
                    <td style={styles.td(idx)}>{inv.reference_month}</td>
                    <td style={styles.td(idx)}>{formatBRL(inv.final_amount_cents)}</td>
                    <td style={styles.td(idx)}>
                      <span style={styles.badge(inv.status)}>
                        {statusLabel[inv.status] || inv.status}
                      </span>
                    </td>
                    <td style={styles.td(idx)}>
                      {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={styles.td(idx)}>
                      {(inv.status === 'pending' || inv.status === 'overdue') && (
                        <button
                          style={{ ...styles.btnSuccess, ...styles.btnSmall }}
                          onClick={() => handleConfirmPayment(inv.id)}
                        >
                          <FontAwesomeIcon icon={faCheck} /> Confirmar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderUpgradeRequests = () => (
    <>
      {/* Filters */}
      <div style={styles.filterRow}>
        <select
          style={styles.select}
          value={upgradeStatusFilter}
          onChange={(e) => setUpgradeStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="denied">Negado</option>
        </select>
        <button
          style={{ ...styles.btnPrimary, ...styles.btnSmall }}
          onClick={loadUpgradeRequests}
        >
          <FontAwesomeIcon icon={faRefresh} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div style={styles.spinner}><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Gestor</th>
                <th style={styles.th}>Plano Atual</th>
                <th style={styles.th}>Plano Solicitado</th>
                <th style={styles.th}>Motivo</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {upgradeRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...styles.td(0), textAlign: 'center', color: '#9CA3AF' }}>
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                upgradeRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td style={styles.td(idx)}>
                      <div>{req.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{req.email}</div>
                    </td>
                    <td style={styles.td(idx)}>{req.current_plan_name || '-'}</td>
                    <td style={styles.td(idx)}>{req.requested_plan_name || '-'}</td>
                    <td style={{ ...styles.td(idx), maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.reason || '-'}
                    </td>
                    <td style={styles.td(idx)}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={styles.td(idx)}>
                      <span style={styles.badge(req.status)}>
                        {statusLabel[req.status] || req.status}
                      </span>
                    </td>
                    <td style={styles.td(idx)}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '180px' }}>
                          <input
                            style={{ ...styles.input, fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                            placeholder="Observações (opcional)"
                            value={actionNotes[req.id] || ''}
                            onChange={(e) =>
                              setActionNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                          />
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              style={{ ...styles.btnSuccess, ...styles.btnSmall }}
                              onClick={() => handleApproveUpgrade(req.id)}
                            >
                              <FontAwesomeIcon icon={faCheck} /> Aprovar
                            </button>
                            <button
                              style={{ ...styles.btnDanger, ...styles.btnSmall }}
                              onClick={() => handleDenyUpgrade(req.id)}
                            >
                              <FontAwesomeIcon icon={faTimes} /> Negar
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Sub-tabs (hidden when controlled externally) */}
      {!hideTabBar && (
        <div style={styles.subtabs}>
          <button style={styles.subtab(activeTab === 'dashboard')} onClick={() => setInternalTab('dashboard')}>
            <FontAwesomeIcon icon={faDollarSign} /> Dashboard
          </button>
          <button style={styles.subtab(activeTab === 'gestores')} onClick={() => setInternalTab('gestores')}>
            <FontAwesomeIcon icon={faUsers} /> Gestores
          </button>
          <button style={styles.subtab(activeTab === 'faturas')} onClick={() => setInternalTab('faturas')}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} /> Faturas
          </button>
          <button style={styles.subtab(activeTab === 'upgrades')} onClick={() => setInternalTab('upgrades')}>
            <FontAwesomeIcon icon={faArrowUp} /> Upgrade Requests
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'gestores' && renderGestores()}
      {activeTab === 'faturas' && renderFaturas()}
      {activeTab === 'upgrades' && renderUpgradeRequests()}
    </div>
  );
}
