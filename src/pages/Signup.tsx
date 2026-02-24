import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faArrowLeft,
  faArrowRight,
  faUserPlus,
  faTableTennis,
  faCreditCard,
  faCalendarDays,
  faMobileScreenButton,
  faRobot,
  faStar,
  faPhone,
  faEnvelope,
  faCopy,
  faChevronDown,
  faChevronUp,
  faSpinner,
  faCircleCheck,
  faShieldHalved,
  faHeadset
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import '../styles/Signup.css';

const API_URL = import.meta.env.DEV ? '' : 'https://gerenciai-backend-798546007335.us-east1.run.app';

interface Plan {
  id: number;
  name: string;
  slug: string;
  max_students: number;
  max_classes: number;
  price_cents: number;
  description: string;
  has_app_access: boolean;
  sort_order: number;
}

interface SignupResult {
  user: { id: number; full_name: string; email: string };
  temporaryPassword: string;
  plan: { name: string; slug: string; price_cents: number };
  invoice: {
    id: number;
    final_amount_cents: number;
    due_date: string;
    asaas_pix_payload: string | null;
    asaas_pix_qr_image: string | null;
  } | null;
}

const FEATURES = [
  { icon: faUserPlus, title: 'Alunos Experimentais', desc: 'Links públicos de agendamento e acompanhamento' },
  { icon: faTableTennis, title: 'Locação de Quadras', desc: 'Reservas com preços por horário e mensalistas' },
  { icon: faCreditCard, title: 'Gestão Financeira', desc: 'Cobranças automáticas via PIX e cartão' },
  { icon: faWhatsapp, title: 'Automação WhatsApp', desc: 'Lembretes e confirmações automáticas' },
  { icon: faMobileScreenButton, title: 'App Mobile', desc: 'App completo para seus alunos' },
  { icon: faCalendarDays, title: 'Agenda Inteligente', desc: 'Drag-and-drop e detecção de conflitos' },
  { icon: faRobot, title: 'Assistente IA', desc: 'Análise preditiva e sugestões proativas' },
  { icon: faShieldHalved, title: 'Dados Seguros', desc: 'Infraestrutura Google Cloud confiável' },
];

const FAQ_ITEMS = [
  {
    q: 'Quanto tempo dura o período de teste?',
    a: 'Você tem 30 dias grátis para testar todas as funcionalidades do plano escolhido. Sem compromisso e sem cartão de crédito.'
  },
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento pelo painel de controle.'
  },
  {
    q: 'O app mobile está incluso em todos os planos?',
    a: 'O app está disponível a partir do plano Starter+. No plano Starter, a gestão é feita pela versão web.'
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'O pagamento é mensal via PIX. Após o período de teste, geramos a cobrança automaticamente e você paga pelo QR Code.'
  },
  {
    q: 'Preciso de suporte para configurar?',
    a: 'Oferecemos suporte completo para configuração inicial. Nosso time ajuda você a importar dados e configurar turmas.'
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multas ou taxas de cancelamento. Basta solicitar pelo painel ou entrar em contato conosco.'
  },
];

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Result
  const [signupResult, setSignupResult] = useState<SignupResult | null>(null);
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Referral
  const referralCode = searchParams.get('ref') || '';
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  // Track referral click and fetch referrer info
  useEffect(() => {
    if (!referralCode) return;
    // Track click
    fetch(`${API_URL}/api/public/referral/${referralCode}/click`).catch(() => {});
    // Get referrer name
    fetch(`${API_URL}/api/public/referral/${referralCode}/info`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReferrerName(data.data.name);
        }
      })
      .catch(() => {});
  }, [referralCode]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/plans`);
      const data = await res.json();
      if (data.status === 'success') {
        setPlans(data.data);
      }
    } catch {
      console.error('Failed to fetch plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setError('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSubmit = async (action: 'pay' | 'callback') => {
    if (!fullName.trim() || !email.trim()) {
      setError('Preencha nome e email.');
      return;
    }
    if (!selectedPlan) {
      setError('Selecione um plano.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.replace(/\D/g, ''),
          plan_slug: selectedPlan.slug,
          action,
          ...(referralCode ? { referral_code: referralCode } : {})
        })
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        setError(data.message || 'Erro ao processar. Tente novamente.');
        return;
      }

      if (action === 'pay') {
        setSignupResult(data.data);
      } else {
        setCallbackSuccess(true);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPopularPlan = () => {
    return plans.find(p => p.slug === 'essential') || plans.find(p => p.slug === 'growth');
  };

  // Success states
  if (signupResult) {
    return (
      <div className="signup-page">
        <div className="signup-nav">
          <div className="signup-logo" onClick={() => navigate('/')}>
            ArenaA<span className="signup-logo-dot">i</span>
          </div>
        </div>
        <div className="signup-success-container">
          <div className="signup-success-card">
            <div className="signup-success-icon">
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
            <h1>Conta criada com sucesso!</h1>
            <p className="signup-success-sub">Bem-vindo ao ArenaAi, {signupResult.user.full_name}!</p>

            <div className="signup-credentials">
              <h3>Suas credenciais de acesso</h3>
              <div className="signup-credential-row">
                <span>Email:</span>
                <strong>{signupResult.user.email}</strong>
                <button onClick={() => copyToClipboard(signupResult.user.email)} className="signup-copy-btn">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
              <div className="signup-credential-row">
                <span>Senha temporária:</span>
                <strong>{signupResult.temporaryPassword}</strong>
                <button onClick={() => copyToClipboard(signupResult.temporaryPassword)} className="signup-copy-btn">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
              <p className="signup-credential-hint">Estas credenciais também foram enviadas para seu email.</p>
            </div>

            {signupResult.invoice && (
              <div className="signup-payment-section">
                <h3>Pagamento - {signupResult.plan.name}</h3>
                <div className="signup-payment-amount">
                  R$ {formatPrice(signupResult.invoice.final_amount_cents)}<span>/mês</span>
                </div>

                {signupResult.invoice.asaas_pix_qr_image && (
                  <div className="signup-pix-qr">
                    <p>Escaneie o QR Code para pagar via PIX:</p>
                    <img
                      src={`data:image/png;base64,${signupResult.invoice.asaas_pix_qr_image}`}
                      alt="QR Code PIX"
                      className="signup-qr-image"
                    />
                  </div>
                )}

                {signupResult.invoice.asaas_pix_payload && (
                  <div className="signup-pix-copy">
                    <p>Ou copie o código PIX:</p>
                    <div className="signup-pix-code">
                      <input
                        type="text"
                        readOnly
                        value={signupResult.invoice.asaas_pix_payload}
                        className="signup-pix-input"
                      />
                      <button
                        onClick={() => copyToClipboard(signupResult.invoice!.asaas_pix_payload!)}
                        className="signup-pix-copy-btn"
                      >
                        <FontAwesomeIcon icon={faCopy} /> Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="signup-success-actions">
              <button className="signup-btn-primary" onClick={() => navigate('/login')}>
                Acessar o sistema
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (callbackSuccess) {
    return (
      <div className="signup-page">
        <div className="signup-nav">
          <div className="signup-logo" onClick={() => navigate('/')}>
            ArenaA<span className="signup-logo-dot">i</span>
          </div>
        </div>
        <div className="signup-success-container">
          <div className="signup-success-card">
            <div className="signup-success-icon callback">
              <FontAwesomeIcon icon={faHeadset} />
            </div>
            <h1>Recebemos seu interesse!</h1>
            <p className="signup-success-sub">
              Nossa equipe entrará em contato em breve pelo email <strong>{email}</strong>
              {phone && <> ou telefone <strong>{phone}</strong></>}.
            </p>
            <p className="signup-success-detail">
              Enquanto isso, fique à vontade para explorar nossos recursos na página inicial.
            </p>
            <div className="signup-success-actions">
              <button className="signup-btn-primary" onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const popularPlan = getPopularPlan();

  return (
    <div className="signup-page">
      {/* NAV */}
      <div className="signup-nav">
        <div className="signup-logo" onClick={() => navigate('/')}>
          ArenaA<span className="signup-logo-dot">i</span>
        </div>
        <button className="signup-nav-login" onClick={() => navigate('/login')}>
          Já sou cliente
        </button>
      </div>

      {/* HERO */}
      <section className="signup-hero">
        <h1>Comece a gerenciar sua quadra <span className="signup-hero-accent">hoje mesmo</span></h1>
        <p>Escolha o plano ideal e tenha acesso imediato a todas as ferramentas que você precisa.</p>
      </section>

      {/* REFERRAL BANNER */}
      {referrerName && (
        <div className="signup-referral-banner">
          <FontAwesomeIcon icon={faStar} className="signup-referral-icon" />
          <span>Você foi indicado(a) por <strong>{referrerName}</strong>!</span>
        </div>
      )}

      {/* FEATURES GRID */}
      <section className="signup-features">
        <div className="signup-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="signup-feature-card">
              <FontAwesomeIcon icon={f.icon} className="signup-feature-icon" />
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className="signup-plans" id="planos">
        <h2>Escolha seu plano</h2>
        <p className="signup-plans-sub">Todos os planos incluem 30 dias grátis para testar</p>

        {loadingPlans ? (
          <div className="signup-loading">Carregando planos...</div>
        ) : (
          <div className="signup-plans-grid">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`signup-plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${plan.id === popularPlan?.id ? 'popular' : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.id === popularPlan?.id && (
                  <div className="signup-plan-badge">
                    <FontAwesomeIcon icon={faStar} /> Mais popular
                  </div>
                )}
                <h3>{plan.name}</h3>
                <div className="signup-plan-price">
                  <span className="signup-price-currency">R$</span>
                  <span className="signup-price-value">{formatPrice(plan.price_cents)}</span>
                  <span className="signup-price-period">/mês</span>
                </div>
                <p className="signup-plan-desc">{plan.description}</p>
                <ul className="signup-plan-features">
                  <li><FontAwesomeIcon icon={faCheck} /> Até {plan.max_students === 999999 ? 'ilimitados' : plan.max_students} alunos</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Até {plan.max_classes === 999999 ? 'ilimitadas' : plan.max_classes} turmas</li>
                  <li><FontAwesomeIcon icon={faCheck} /> {plan.has_app_access ? 'App mobile incluso' : 'Gestão web completa'}</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Locação de quadras</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Alunos experimentais</li>
                </ul>
                <button
                  className={`signup-plan-btn ${selectedPlan?.id === plan.id ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan); }}
                >
                  {selectedPlan?.id === plan.id ? 'Selecionado' : 'Escolher plano'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FORM */}
      <section className="signup-form-section" ref={formRef} id="formulario">
        <div className="signup-form-card">
          <h2>Complete seu cadastro</h2>
          {selectedPlan ? (
            <div className="signup-selected-plan">
              <span>Plano selecionado:</span>
              <strong>{selectedPlan.name} - R$ {formatPrice(selectedPlan.price_cents)}/mês</strong>
              <button onClick={() => setSelectedPlan(null)} className="signup-change-plan">Trocar</button>
            </div>
          ) : (
            <p className="signup-form-hint">Selecione um plano acima para continuar</p>
          )}

          {error && <div className="signup-error">{error}</div>}

          <div className="signup-form-fields">
            <div className="signup-field">
              <label>Nome completo *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome ou da sua arena"
              />
            </div>
            <div className="signup-field">
              <label>Email *</label>
              <div className="signup-field-icon">
                <FontAwesomeIcon icon={faEnvelope} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div className="signup-field">
              <label>Telefone</label>
              <div className="signup-field-icon">
                <FontAwesomeIcon icon={faPhone} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="(31) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="signup-form-actions">
            <button
              className="signup-btn-primary"
              onClick={() => handleSubmit('pay')}
              disabled={submitting || !selectedPlan}
            >
              {submitting ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Processando...</>
              ) : (
                <>Contratar e pagar <FontAwesomeIcon icon={faArrowRight} /></>
              )}
            </button>
            <button
              className="signup-btn-secondary"
              onClick={() => handleSubmit('callback')}
              disabled={submitting || !selectedPlan}
            >
              {submitting ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Enviando...</>
              ) : (
                <>Quero ser chamado <FontAwesomeIcon icon={faPhone} /></>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="signup-faq">
        <h2>Perguntas frequentes</h2>
        <div className="signup-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`signup-faq-item ${openFaq === i ? 'open' : ''}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="signup-faq-question">
                <span>{item.q}</span>
                <FontAwesomeIcon icon={openFaq === i ? faChevronUp : faChevronDown} />
              </div>
              {openFaq === i && (
                <div className="signup-faq-answer">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="signup-footer">
        <p>ArenaAi - Gestão de Quadras Inteligente</p>
        <div className="signup-footer-links">
          <a href="/privacidade">Política de Privacidade</a>
          <span>|</span>
          <a href="mailto:teus.hcp@gmail.com">Contato</a>
        </div>
      </footer>
    </div>
  );
}
