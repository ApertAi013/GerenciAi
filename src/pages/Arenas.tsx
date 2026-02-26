import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUsers, faUserGroup, faPen, faPowerOff, faArrowRightToBracket, faPlus, faCheckCircle, faChartBar, faMoneyBillWave, faExclamationTriangle, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { arenaService } from '../services/arenaService';
import type { ArenaDashboardData } from '../services/arenaService';
import { useAuthStore } from '../store/authStore';
import type { Arena } from '../types/authTypes';

const ARENA_COLORS = ['#FF9900', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

interface ArenaWithCounts extends Arena {
  student_count?: number;
  class_count?: number;
  description?: string;
  created_at?: string;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatMonth = (monthStr: string) => {
  const [y, m] = monthStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
};

export default function Arenas() {
  const [arenas, setArenas] = useState<ArenaWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArena, setEditingArena] = useState<ArenaWithCounts | null>(null);
  const [error, setError] = useState('');
  const { currentArenaId, setCurrentArena, user, setUser } = useAuthStore();

  // Dashboard state
  const [dashboard, setDashboard] = useState<ArenaDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [monthsFilter, setMonthsFilter] = useState(6);

  useEffect(() => {
    fetchArenas();
  }, []);

  useEffect(() => {
    if (arenas.length > 0) {
      fetchDashboard();
    }
  }, [arenas.length, monthsFilter]);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const response = await arenaService.getDashboard({ months: monthsFilter });
      if (response.status === 'success' && response.data) {
        setDashboard(response.data);
      }
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Build chart data from dashboard.monthly
  const chartData = useMemo(() => {
    if (!dashboard?.monthly) return [];
    return dashboard.monthly.map(m => {
      const row: any = { month: formatMonth(m.month) };
      for (const a of m.arenas) {
        row[`faturado_${a.arena_id}`] = a.faturado_cents / 100;
        row[`recebido_${a.arena_id}`] = a.recebido_cents / 100;
      }
      // Add totals
      row.faturado_total = m.arenas.reduce((s, a) => s + a.faturado_cents, 0) / 100;
      row.recebido_total = m.arenas.reduce((s, a) => s + a.recebido_cents, 0) / 100;
      return row;
    });
  }, [dashboard]);

  // Financial totals for the selected period
  const financialTotals = useMemo(() => {
    if (!dashboard?.monthly) return { faturado: 0, recebido: 0, overdue: 0, pending: 0 };
    let faturado = 0, recebido = 0, overdue = 0, pending = 0;
    for (const m of dashboard.monthly) {
      for (const a of m.arenas) {
        faturado += a.faturado_cents;
        recebido += a.recebido_cents;
        overdue += a.overdue_cents;
        pending += a.pending_cents;
      }
    }
    return { faturado, recebido, overdue, pending };
  }, [dashboard]);

  // Per-arena financial totals for table
  const arenaFinancials = useMemo(() => {
    if (!dashboard) return [];
    const map = new Map<number, { faturado: number; recebido: number }>();
    for (const m of dashboard.monthly) {
      for (const a of m.arenas) {
        const curr = map.get(a.arena_id) || { faturado: 0, recebido: 0 };
        curr.faturado += a.faturado_cents;
        curr.recebido += a.recebido_cents;
        map.set(a.arena_id, curr);
      }
    }
    return dashboard.arenas.map(a => ({
      ...a,
      faturado: map.get(a.arena_id)?.faturado || 0,
      recebido: map.get(a.arena_id)?.recebido || 0,
    }));
  }, [dashboard]);

  const fetchArenas = async () => {
    try {
      setIsLoading(true);
      const response = await arenaService.getArenas();
      if (response.status === 'success' && response.data) {
        setArenas(response.data as ArenaWithCounts[]);
      }
    } catch (error) {
      console.error('Erro ao buscar arenas:', error);
      setError('Erro ao carregar arenas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    const arena = arenas.find((a) => a.id === id);
    if (!arena) return;

    if (arena.is_default) {
      alert('Nao e possivel desativar a arena padrao');
      return;
    }

    if (!confirm(`Tem certeza que deseja desativar a arena "${arena.name}"? Alunos e turmas desta arena nao serao mais visiveis.`)) {
      return;
    }

    try {
      await arenaService.deleteArena(id);
      fetchArenas();
      if (user) {
        const updatedArenas = user.arenas?.filter(a => a.id !== id) || [];
        setUser({ ...user, arenas: updatedArenas });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao desativar arena');
    }
  };

  const handleSwitchToArena = (arenaId: number) => {
    setCurrentArena(arenaId);
    window.location.reload();
  };

  const handleSuccess = () => {
    setShowCreateModal(false);
    setEditingArena(null);
    fetchArenas();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>Arenas</h1>
          <p style={{ color: '#737373', fontSize: '14px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Gerencie suas arenas. Cada arena possui alunos, turmas e quadras independentes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingArena(null); setShowCreateModal(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#FF9900',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e68a00')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FF9900')}
        >
          <FontAwesomeIcon icon={faPlus} />
          Nova Arena
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Cross-Arena Dashboard */}
      {arenas.length > 0 && dashboard && (
        <div style={{ marginBottom: '40px' }}>
          {/* Period filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ color: '#FF9900', fontSize: '16px' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>Visao Geral</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              {[
                { label: '3m', value: 3 },
                { label: '6m', value: 6 },
                { label: '12m', value: 12 },
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setMonthsFilter(p.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: monthsFilter === p.value ? '1px solid #FF9900' : '1px solid #E5E5E5',
                    background: monthsFilter === p.value ? '#FFF3E0' : 'white',
                    color: monthsFilter === p.value ? '#FF9900' : '#737373',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Alunos', value: String(dashboard.totals.student_count), icon: faUsers, color: '#3B82F6' },
              { label: 'Matriculas Ativas', value: String(dashboard.totals.active_enrollments), icon: faClipboardList, color: '#10B981' },
              { label: 'Faturado', value: formatCurrency(financialTotals.faturado), icon: faMoneyBillWave, color: '#FF9900' },
              { label: 'Recebido', value: formatCurrency(financialTotals.recebido), icon: faMoneyBillWave, color: '#10B981' },
              { label: 'Inadimplencia', value: formatCurrency(dashboard.totals.total_overdue_cents), icon: faExclamationTriangle, color: '#EF4444' },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderLeft: `3px solid ${kpi.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={kpi.icon} style={{ color: kpi.color, fontSize: '13px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#404040' }}>
                Receita por Arena
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} barGap={2} barCategoryGap="20%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A3A3A3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#A3A3A3' }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value * 100),
                      name,
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {dashboard.arenas.map((arena, idx) => (
                    <Bar
                      key={`fat_${arena.arena_id}`}
                      dataKey={`faturado_${arena.arena_id}`}
                      name={`${arena.arena_name} (Faturado)`}
                      fill={ARENA_COLORS[idx % ARENA_COLORS.length]}
                      radius={[3, 3, 0, 0]}
                      opacity={0.85}
                    />
                  ))}
                  {dashboard.arenas.map((arena, idx) => (
                    <Bar
                      key={`rec_${arena.arena_id}`}
                      dataKey={`recebido_${arena.arena_id}`}
                      name={`${arena.arena_name} (Recebido)`}
                      fill={ARENA_COLORS[idx % ARENA_COLORS.length]}
                      radius={[3, 3, 0, 0]}
                      opacity={0.45}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Comparison Table */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            marginBottom: '8px',
            overflowX: 'auto',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#404040' }}>
              Comparativo por Arena
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                  {['Arena', 'Alunos', 'Matriculas', 'Turmas', 'Faturado', 'Recebido', 'Inadimplencia'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: h === 'Arena' ? 'left' : 'right',
                      fontWeight: 600,
                      color: '#737373',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arenaFinancials.map((a, idx) => (
                  <tr key={a.arena_id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#1a1a1a' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: ARENA_COLORS[idx % ARENA_COLORS.length],
                        marginRight: '8px',
                      }} />
                      {a.arena_name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#404040' }}>{a.student_count}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#404040' }}>{a.active_enrollments}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#404040' }}>{a.class_count}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#404040', fontWeight: 500 }}>{formatCurrency(a.faturado)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10B981', fontWeight: 500 }}>{formatCurrency(a.recebido)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: a.total_overdue_cents > 0 ? '#EF4444' : '#404040', fontWeight: 500 }}>
                      {formatCurrency(a.total_overdue_cents)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ borderTop: '2px solid #E5E5E5', background: '#FAFAFA' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#1a1a1a' }}>Total</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{dashboard.totals.student_count}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{dashboard.totals.active_enrollments}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{dashboard.totals.class_count}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#1a1a1a' }}>{formatCurrency(financialTotals.faturado)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatCurrency(financialTotals.recebido)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: dashboard.totals.total_overdue_cents > 0 ? '#EF4444' : '#1a1a1a' }}>
                    {formatCurrency(dashboard.totals.total_overdue_cents)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arena Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {arenas.map((arena) => {
          const isActive = arena.id === currentArenaId;
          return (
            <div
              key={arena.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: isActive
                  ? '0 0 0 2px #FF9900, 0 4px 16px rgba(255, 153, 0, 0.15)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isActive ? '#FF9900' : '#E5E5E5',
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isActive ? '#FFF3E0' : '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FontAwesomeIcon
                    icon={faBuilding}
                    style={{ fontSize: '20px', color: isActive ? '#FF9900' : '#A3A3A3' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{arena.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {arena.is_default && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#737373',
                        background: '#F0F0F0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>Padrao</span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#16a34a',
                        background: '#f0fdf4',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
                        Selecionada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {arena.description && (
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: '#737373',
                  lineHeight: '1.5',
                }}>{arena.description}</p>
              )}

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  flex: 1,
                  background: '#FAFAFA',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faUsers} style={{ color: '#667eea', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                      {arena.student_count ?? 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A3A3A3', fontWeight: 500 }}>Alunos</div>
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  background: '#FAFAFA',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <FontAwesomeIcon icon={faUserGroup} style={{ color: '#f59e0b', fontSize: '16px' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                      {arena.class_count ?? 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A3A3A3', fontWeight: 500 }}>Turmas</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => handleSwitchToArena(arena.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#FF9900',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#e68a00')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FF9900')}
                  >
                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                    Acessar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setEditingArena(arena); setShowCreateModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: 'white',
                    color: '#404040',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: '11px' }} />
                  Editar
                </button>
                {!arena.is_default && (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(arena.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: 'white',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <FontAwesomeIcon icon={faPowerOff} style={{ fontSize: '11px' }} />
                    Desativar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <ArenaModal
          arena={editingArena}
          onClose={() => { setShowCreateModal(false); setEditingArena(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function ArenaModal({
  arena,
  onClose,
  onSuccess,
}: {
  arena: ArenaWithCounts | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!arena;
  const [formData, setFormData] = useState({
    name: arena?.name || '',
    description: arena?.description || '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome e obrigatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && arena) {
        await arenaService.updateArena(arena.id, formData);
      } else {
        const response = await arenaService.createArena(formData);
        if (user && response.data) {
          const newArena: Arena = {
            id: response.data.id,
            name: response.data.name,
            is_default: false,
            status: 'ativa',
          };
          setUser({ ...user, arenas: [...(user.arenas || []), newArena] });
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao ${isEditMode ? 'atualizar' : 'criar'} arena`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
            {isEditMode ? 'Editar Arena' : 'Criar Nova Arena'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#A3A3A3',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="arena-name" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#404040',
              marginBottom: '6px',
            }}>Nome *</label>
            <input
              id="arena-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Arena Norte, Unidade Centro"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D4D4D4',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="arena-description" style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#404040',
              marginBottom: '6px',
            }}>Descricao</label>
            <textarea
              id="arena-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descricao opcional da arena"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D4D4D4',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#404040',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                background: '#FF9900',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? isEditMode ? 'Salvando...' : 'Criando...'
                : isEditMode ? 'Salvar' : 'Criar Arena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
