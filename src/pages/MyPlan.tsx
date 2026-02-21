import { useEffect, useState } from 'react';
import { platformBillingService } from '../services/platformBillingService';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown,
  faUsers,
  faChalkboardTeacher,
  faFileInvoiceDollar,
  faArrowUp,
  faPuzzlePiece,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faTimesCircle,
  faBan,
  faSpinner,
  faStar,
  faInfinity,
  faHandshake,
  faMobileAlt,
  faGift,
  faPercent,
} from '@fortawesome/free-solid-svg-icons';

// --------------- Types ---------------

interface Addon {
  addon_name: string;
  addon_price_cents: number;
  addon_slug: string;
}

interface Subscription {
  plan_name: string;
  plan_slug: string;
  max_students: number;
  max_classes: number;
  plan_price_cents: number;
  status: string;
  trial_ends_at: string | null;
  addons: Addon[];
}

interface Invoice {
  id: number;
  reference_month: string;
  due_date: string;
  final_amount_cents: number;
  status: string;
  paid_at: string | null;
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  max_students: number;
  max_classes: number;
  price_cents: number;
  description: string;
  has_app_access: boolean;
}

interface AvailableAddon {
  id: number;
  name: string;
  slug: string;
  price_cents: number;
  description: string;
  is_bundle: boolean;
}

// --------------- Helpers ---------------

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const isUnlimited = (value: number) => value >= 999999;

// --------------- Component ---------------

export default function MyPlan() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<AvailableAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);
  const [promiseLoading, setPromiseLoading] = useState(false);

  // Upgrade modal
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<Plan | null>(null);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subRes, invRes, plansRes, addonsRes] = await Promise.all([
        platformBillingService.getMySubscription(),
        platformBillingService.getMyInvoices(),
        platformBillingService.getPlans(),
        platformBillingService.getAddons(),
      ]);
      setSubscription(subRes.data.subscription);
      setStudentCount(subRes.data.student_count);
      setClassCount(subRes.data.class_count);
      setInvoices(invRes.data ?? []);
      setPlans(plansRes.data ?? []);
      setAddons(addonsRes.data ?? []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do plano:', err);
      toast.error(err.response?.data?.message || 'Erro ao carregar dados do plano');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Upgrade ----------

  const openUpgradeModal = (plan: Plan) => {
    setUpgradeModalPlan(plan);
    setUpgradeReason('');
    setUpgradeSuccess(false);
    setUpgradeSubmitting(false);
  };

  const closeUpgradeModal = () => {
    setUpgradeModalPlan(null);
    setUpgradeReason('');
    setUpgradeSuccess(false);
  };

  const submitUpgradeRequest = async () => {
    if (!upgradeModalPlan) return;
    try {
      setUpgradeSubmitting(true);
      await platformBillingService.createUpgradeRequest({
        requested_plan_id: upgradeModalPlan.id,
        reason: upgradeReason || undefined,
      });
      setUpgradeSuccess(true);
    } catch (err: any) {
      console.error('Erro ao solicitar upgrade:', err);
      toast.error(err.response?.data?.message || 'Erro ao solicitar upgrade');
    } finally {
      setUpgradeSubmitting(false);
    }
  };

  // ---------- Promise Payment ----------

  const handlePromisePayment = async () => {
    if (!confirm('Ao prometer pagamento, seu acesso será mantido por mais 3 dias. Deseja continuar?')) return;

    try {
      setPromiseLoading(true);
      const res = await platformBillingService.promisePayment();
      const promiseUntil = res.data?.promise_until;
      toast.success(`Pagamento prometido! Acesso garantido até ${promiseUntil ? new Date(promiseUntil).toLocaleDateString('pt-BR') : '+3 dias'}.`);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao prometer pagamento:', err);
      toast.error(err.response?.data?.message || 'Erro ao prometer pagamento');
    } finally {
      setPromiseLoading(false);
    }
  };

  // ---------- Status helpers ----------

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string; icon: any }> = {
      trial: { label: 'Trial', bg: '#EEF2FF', color: '#4F46E5', icon: faClock },
      active: { label: 'Ativo', bg: '#ECFDF5', color: '#059669', icon: faCheckCircle },
      past_due: { label: 'Pagamento Pendente', bg: '#FEF3C7', color: '#D97706', icon: faExclamationTriangle },
      blocked: { label: 'Bloqueado', bg: '#FEE2E2', color: '#DC2626', icon: faBan },
    };
    const s = map[status] || { label: status, bg: '#F3F4F6', color: '#6B7280', icon: faClock };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        backgroundColor: s.bg, color: s.color,
      }}>
        <FontAwesomeIcon icon={s.icon} /> {s.label}
      </span>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      pending: { label: 'Pendente', bg: '#FEF3C7', color: '#D97706' },
      paid: { label: 'Pago', bg: '#ECFDF5', color: '#059669' },
      overdue: { label: 'Vencida', bg: '#FEE2E2', color: '#DC2626' },
      cancelled: { label: 'Cancelada', bg: '#F3F4F6', color: '#6B7280' },
    };
    const s = map[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
        backgroundColor: s.bg, color: s.color,
      }}>
        {s.label}
      </span>
    );
  };

  // ---------- Recommended plan logic ----------

  const getRecommendedPlanId = (): number | null => {
    if (plans.length === 0) return null;
    const sorted = [...plans].sort((a, b) => a.price_cents - b.price_cents);
    const recommended = sorted.find(
      (p) => (isUnlimited(p.max_students) || p.max_students >= studentCount) &&
             (isUnlimited(p.max_classes) || p.max_classes >= classCount)
    );
    return recommended?.id ?? null;
  };

  // ---------- Progress bar ----------

  const ProgressBar = ({ current, max, label }: { current: number; max: number; label: string }) => {
    const unlimited = isUnlimited(max);
    const pct = unlimited ? Math.min((current / 100) * 100, 100) : Math.min((current / max) * 100, 100);
    const isNearLimit = !unlimited && pct >= 80;
    const isOverLimit = !unlimited && current > max;
    const barColor = isOverLimit ? '#DC2626' : isNearLimit ? '#F59E0B' : '#3B82F6';

    return (
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#6B7280' }}>
          <span>{label}</span>
          <span style={{ fontWeight: 600, color: isOverLimit ? '#DC2626' : '#111827' }}>
            {current} de {unlimited ? 'Ilimitado' : max}
          </span>
        </div>
        <div style={{
          width: '100%', height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            width: `${unlimited ? Math.min(pct, 100) : Math.min(pct, 100)}%`,
            height: '100%', backgroundColor: barColor, borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>
    );
  };

  // ---------- Loading ----------

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', color: '#6B7280',
      }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 28, marginRight: 12 }} />
        <span style={{ fontSize: 16 }}>Carregando dados do plano...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', color: '#6B7280', fontSize: 16,
      }}>
        Nenhuma assinatura encontrada.
      </div>
    );
  }

  const recommendedPlanId = getRecommendedPlanId();
  const isPastDueOrBlocked = subscription.status === 'past_due' || subscription.status === 'blocked';
  const recentInvoices = invoices.slice(0, 10);

  // ===================== RENDER =====================

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ===== Section 1: Current Plan Header ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <FontAwesomeIcon icon={faCrown} style={{ fontSize: 22, color: '#FBBF24' }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{subscription.plan_name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {getStatusBadge(subscription.status)}
              <span style={{ fontSize: 22, fontWeight: 700, color: '#FBBF24' }}>
                {formatBRL(subscription.plan_price_cents)}<span style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>/mes</span>
              </span>
            </div>
            {subscription.status === 'trial' && subscription.trial_ends_at && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: '#94A3B8' }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />
                Trial termina em {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
          <ProgressBar current={studentCount} max={subscription.max_students} label="Alunos" />
          <ProgressBar current={classCount} max={subscription.max_classes} label="Turmas" />
        </div>
      </div>

      {/* ===== Section 5: Payment Promise (only if past_due or blocked) ===== */}
      {isPastDueOrBlocked && (
        <div style={{
          backgroundColor: subscription.status === 'blocked' ? '#FEE2E2' : '#FEF3C7',
          border: `1px solid ${subscription.status === 'blocked' ? '#FECACA' : '#FDE68A'}`,
          borderRadius: 12, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ fontSize: 24, color: subscription.status === 'blocked' ? '#DC2626' : '#D97706' }}
            />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: subscription.status === 'blocked' ? '#991B1B' : '#92400E' }}>
                {subscription.status === 'blocked'
                  ? 'Sua conta esta bloqueada por falta de pagamento.'
                  : 'Voce possui faturas pendentes. Regularize para evitar bloqueio.'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                Prometendo pagamento, seu acesso sera mantido por mais 3 dias.
              </p>
            </div>
          </div>
          <button
            onClick={handlePromisePayment}
            disabled={promiseLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              backgroundColor: '#D97706', color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: promiseLoading ? 'not-allowed' : 'pointer', opacity: promiseLoading ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {promiseLoading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Processando...</>
            ) : (
              <><FontAwesomeIcon icon={faHandshake} /> Prometer Pagamento (+3 dias)</>
            )}
          </button>
        </div>
      )}

      {/* ===== Section 2: Active Add-ons ===== */}
      {subscription.addons && subscription.addons.length > 0 && (
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, padding: '20px 24px',
          marginBottom: 24, border: '1px solid #E5E7EB',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FontAwesomeIcon icon={faPuzzlePiece} style={{ color: '#8B5CF6' }} />
            Add-ons Ativos
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {subscription.addons.map((addon) => (
              <div key={addon.addon_slug} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE',
                borderRadius: 8, padding: '10px 16px',
              }}>
                <FontAwesomeIcon icon={faPuzzlePiece} style={{ color: '#7C3AED', fontSize: 14 }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: '#4C1D95' }}>{addon.addon_name}</span>
                <span style={{ fontSize: 13, color: '#6D28D9', fontWeight: 500 }}>{formatBRL(addon.addon_price_cents)}/mes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Section 3: Plan Options ===== */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px',
        marginBottom: 24, border: '1px solid #E5E7EB',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faArrowUp} style={{ color: '#3B82F6' }} />
          Planos Disponiveis
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280' }}>
          Voce tem <strong style={{ color: '#111827' }}>{studentCount} alunos</strong> e{' '}
          <strong style={{ color: '#111827' }}>{classCount} turmas</strong>.
        </p>

        {/* Plans grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16, marginBottom: 24,
        }}>
          {plans.map((plan) => {
            const isCurrent = plan.slug === subscription.plan_slug;
            const isRecommended = plan.id === recommendedPlanId && !isCurrent;
            const isHigherPlan = plan.price_cents > subscription.plan_price_cents;

            return (
              <div key={plan.id} style={{
                position: 'relative',
                border: isCurrent ? '2px solid #3B82F6' : isRecommended ? '2px solid #10B981' : '1px solid #E5E7EB',
                borderRadius: 12, padding: '20px 18px',
                backgroundColor: isCurrent ? '#EFF6FF' : isRecommended ? '#ECFDF5' : '#fff',
                transition: 'box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Badge */}
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: -10, left: 16,
                    backgroundColor: '#3B82F6', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                    textTransform: 'uppercase',
                  }}>Plano Atual</span>
                )}
                {isRecommended && (
                  <span style={{
                    position: 'absolute', top: -10, left: 16,
                    backgroundColor: '#10B981', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                    textTransform: 'uppercase',
                  }}>
                    <FontAwesomeIcon icon={faStar} style={{ marginRight: 4 }} />Recomendado
                  </span>
                )}

                <h3 style={{ margin: '8px 0 4px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
                  {plan.name}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#1E293B' }}>
                  {formatBRL(plan.price_cents)}
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#6B7280' }}>/mes</span>
                </p>

                {plan.description && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>
                )}

                <div style={{ fontSize: 13, color: '#374151', marginBottom: 16, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesomeIcon icon={faUsers} style={{ color: '#3B82F6', width: 14 }} />
                    <span>
                      {isUnlimited(plan.max_students) ? (
                        <><FontAwesomeIcon icon={faInfinity} style={{ marginRight: 4 }} />Alunos ilimitados</>
                      ) : (
                        <>Ate <strong>{plan.max_students}</strong> alunos</>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ color: '#3B82F6', width: 14 }} />
                    <span>
                      {isUnlimited(plan.max_classes) ? (
                        <><FontAwesomeIcon icon={faInfinity} style={{ marginRight: 4 }} />Turmas ilimitadas</>
                      ) : (
                        <>Ate <strong>{plan.max_classes}</strong> turmas</>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesomeIcon icon={faMobileAlt} style={{ color: plan.has_app_access ? '#10B981' : '#D1D5DB', width: 14 }} />
                    <span style={{ color: plan.has_app_access ? '#374151' : '#9CA3AF' }}>
                      {plan.has_app_access ? (
                        <><strong>App</strong> do aluno e gestor</>
                      ) : (
                        <s>Sem acesso ao app</s>
                      )}
                    </span>
                  </div>
                </div>

                {isCurrent ? (
                  <button disabled style={{
                    width: '100%', padding: '10px 0', borderRadius: 8,
                    border: '1px solid #93C5FD', backgroundColor: '#DBEAFE',
                    color: '#2563EB', fontWeight: 600, fontSize: 13, cursor: 'default',
                  }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 6 }} />Seu Plano
                  </button>
                ) : isHigherPlan ? (
                  <button
                    onClick={() => openUpgradeModal(plan)}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 8,
                      border: 'none', backgroundColor: isRecommended ? '#10B981' : '#3B82F6',
                      color: '#fff', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: 6 }} />Solicitar Upgrade
                  </button>
                ) : (
                  <button disabled style={{
                    width: '100%', padding: '10px 0', borderRadius: 8,
                    border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                    color: '#9CA3AF', fontWeight: 600, fontSize: 13, cursor: 'default',
                  }}>
                    Plano inferior
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Available Add-ons */}
        {addons.length > 0 && (
          <>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontAwesomeIcon icon={faPuzzlePiece} style={{ color: '#8B5CF6' }} />
              Add-ons Disponiveis
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {addons.map((addon) => {
                const isActive = subscription.addons?.some((a) => a.addon_slug === addon.slug);
                return (
                  <div key={addon.id} style={{
                    border: isActive ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                    borderRadius: 10, padding: '14px 18px',
                    backgroundColor: isActive ? '#F5F3FF' : '#fff',
                    minWidth: 200, flex: '1 1 200px', maxWidth: 320,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {addon.name}
                        {addon.is_bundle && (
                          <span style={{
                            marginLeft: 6, fontSize: 10, backgroundColor: '#FBBF24', color: '#78350F',
                            padding: '1px 6px', borderRadius: 6, fontWeight: 700,
                          }}>BUNDLE</span>
                        )}
                      </h4>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
                        {formatBRL(addon.price_cents)}<span style={{ fontSize: 11, fontWeight: 400 }}>/mes</span>
                      </span>
                    </div>
                    {addon.description && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                        {addon.description}
                      </p>
                    )}
                    {isActive && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 8, fontSize: 11, fontWeight: 600, color: '#059669',
                      }}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Ativo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ===== ApertAi + ArenAi Promo Banner ===== */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5a623 0%, #e8920d 50%, #d4820a 100%)',
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 24,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(245, 166, 35, 0.3)',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -30,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Left: Logos */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/arenai-logo.svg"
                alt="ArenAi"
                style={{ height: 36 }}
              />
              <span style={{ fontSize: 22, fontWeight: 300, opacity: 0.7 }}>+</span>
              <img
                src="/apertai-logo.svg"
                alt="ApertAi"
                style={{ height: 36 }}
              />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.25)', borderRadius: 20,
              padding: '4px 14px', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <FontAwesomeIcon icon={faGift} /> Oferta Exclusiva
            </div>
          </div>

          {/* Center: Text */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
              Duas plataformas. Um ecossistema completo.
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5, opacity: 0.92 }}>
              <strong>ArenAi</strong> cuida da gestao da sua quadra. <strong>ApertAi</strong> eterniza os melhores
              momentos com replays esportivos em alta qualidade. Contratando as duas, ganhe desconto especial.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <FontAwesomeIcon icon={faPercent} style={{ fontSize: 18 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>20% OFF</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>Em todos os planos ArenAi</div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <FontAwesomeIcon icon={faGift} style={{ fontSize: 18 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>1 Mes Gratis</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>De teste na outra plataforma</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <a
              href="https://apertai.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10,
                background: '#1a1a1a', color: '#fff',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              Quero aproveitar
            </a>
            <a
              href="https://apertai.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 10,
                background: 'transparent', color: '#fff',
                fontWeight: 600, fontSize: 13, textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.5)',
              }}
            >
              Conhecer o ApertAi
            </a>
          </div>
        </div>
      </div>

      {/* ===== Section 4: Invoices ===== */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px',
        marginBottom: 24, border: '1px solid #E5E7EB',
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#F59E0B' }} />
          Faturas Recentes
        </h2>

        {recentInvoices.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>Nenhuma fatura encontrada.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Mes</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Vencimento</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Valor</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Pago em</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>
                      {inv.reference_month}
                    </td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>
                      {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                      {formatBRL(inv.final_amount_cents)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {getInvoiceStatusBadge(inv.status)}
                    </td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>
                      {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Upgrade Request Modal ===== */}
      {upgradeModalPlan && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
          onClick={closeUpgradeModal}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, width: '95%', maxWidth: 520,
              overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              animation: 'fadeInUp 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {upgradeSuccess ? (
              /* ── Success state ── */
              <div style={{ padding: '48px 36px', textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#fff', fontSize: 32 }} />
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
                  Solicitacao Enviada!
                </h2>
                <p style={{ margin: '0 0 8px', fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
                  Seu pedido de upgrade para o plano <strong style={{ color: '#111827' }}>{upgradeModalPlan.name}</strong> foi enviado com sucesso.
                </p>
                <p style={{ margin: '0 0 28px', fontSize: 14, color: '#9CA3AF' }}>
                  Nossa equipe analisara e voce sera notificado assim que aprovado.
                </p>
                <button
                  onClick={closeUpgradeModal}
                  style={{
                    padding: '12px 36px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  }}
                >
                  Entendido
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                {/* Header with gradient */}
                <div style={{
                  background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                  padding: '28px 32px', color: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Solicitar upgrade para
                      </p>
                      <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>
                        {upgradeModalPlan.name}
                      </h2>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#FBBF24' }}>
                        {formatBRL(upgradeModalPlan.price_cents)}
                        <span style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>/mes</span>
                      </span>
                    </div>
                    <button
                      onClick={closeUpgradeModal}
                      style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#94A3B8', fontSize: 16,
                        transition: 'background 0.2s',
                      }}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '28px 32px' }}>
                  {/* Comparison */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16,
                    alignItems: 'center', marginBottom: 24,
                  }}>
                    {/* Current */}
                    <div style={{
                      background: '#F9FAFB', borderRadius: 12, padding: '16px 18px',
                      border: '1px solid #E5E7EB', textAlign: 'center',
                    }}>
                      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Atual</p>
                      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#374151' }}>{subscription?.plan_name}</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                        {isUnlimited(subscription?.max_students ?? 0) ? 'Ilimitado' : `${subscription?.max_students} alunos`}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                        {isUnlimited(subscription?.max_classes ?? 0) ? 'Ilimitado' : `${subscription?.max_classes} turmas`}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FontAwesomeIcon icon={faArrowUp} style={{ color: '#fff', fontSize: 16, transform: 'rotate(90deg)' }} />
                    </div>

                    {/* New */}
                    <div style={{
                      background: '#EFF6FF', borderRadius: 12, padding: '16px 18px',
                      border: '2px solid #3B82F6', textAlign: 'center',
                    }}>
                      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#3B82F6', textTransform: 'uppercase', fontWeight: 600 }}>Novo</p>
                      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1E40AF' }}>{upgradeModalPlan.name}</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#3B82F6' }}>
                        {isUnlimited(upgradeModalPlan.max_students) ? 'Ilimitado' : `${upgradeModalPlan.max_students} alunos`}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#3B82F6' }}>
                        {isUnlimited(upgradeModalPlan.max_classes) ? 'Ilimitado' : `${upgradeModalPlan.max_classes} turmas`}
                      </p>
                    </div>
                  </div>

                  {/* Benefits highlight */}
                  {upgradeModalPlan.has_app_access && !(subscription as any)?.has_app_access && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10,
                      padding: '12px 16px', marginBottom: 20,
                    }}>
                      <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#059669', fontSize: 18 }} />
                      <span style={{ fontSize: 14, color: '#065F46', fontWeight: 600 }}>
                        Inclui acesso ao aplicativo do aluno e do gestor
                      </span>
                    </div>
                  )}

                  {/* Reason textarea */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                      Motivo ou observacao <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
                    </label>
                    <textarea
                      value={upgradeReason}
                      onChange={e => setUpgradeReason(e.target.value)}
                      placeholder="Ex: Preciso de mais vagas para alunos novos..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        border: '1px solid #D1D5DB', fontSize: 14, resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit', color: '#374151',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#3B82F6'}
                      onBlur={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={closeUpgradeModal}
                      style={{
                        flex: 1, padding: '13px 16px', borderRadius: 10,
                        border: '1px solid #D1D5DB', background: '#fff',
                        color: '#374151', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitUpgradeRequest}
                      disabled={upgradeSubmitting}
                      style={{
                        flex: 2, padding: '13px 16px', borderRadius: 10,
                        border: 'none',
                        background: upgradeSubmitting
                          ? '#93C5FD'
                          : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        color: '#fff', fontWeight: 700, fontSize: 15,
                        cursor: upgradeSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: upgradeSubmitting ? 'none' : '0 4px 14px rgba(59,130,246,0.35)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {upgradeSubmitting ? (
                        <><FontAwesomeIcon icon={faSpinner} spin /> Enviando...</>
                      ) : (
                        <><FontAwesomeIcon icon={faArrowUp} /> Solicitar Upgrade</>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
