import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGift,
  faPercent,
  faCheck,
  faArrowRight,
  faSpinner,
  faPhone,
  faEnvelope,
  faUser,
  faBuilding,
  faPlay,
  faVideo,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ApertaiPromo.css';

const API_URL = import.meta.env.DEV ? '' : 'https://gerenciai-backend-798546007335.us-east1.run.app';

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function ApertaiPromo() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [arenaName, setArenaName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError('Preencha nome e email.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() + (arenaName.trim() ? ` (${arenaName.trim()})` : ''),
          email: email.trim(),
          phone: phone.replace(/\D/g, ''),
          plan_slug: 'apertai-promo',
          action: 'callback',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erro ao enviar. Tente novamente.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apt-page">
      {/* Nav */}
      <nav className="apt-nav">
        <a href="/" className="apt-nav-logo">
          Arena<span>Ai</span>
        </a>
        <div className="apt-nav-badges">
          <span className="apt-nav-badge">+</span>
          <img src="/apertai-logo.svg" alt="Apertai" className="apt-nav-apertai" />
        </div>
      </nav>

      {/* Hero */}
      <section className="apt-hero">
        <div className="apt-hero-bg">
          <div className="apt-hero-glow" />
        </div>
        <div className="apt-hero-content">
          <div className="apt-hero-left">
            <div className="apt-badge">
              <FontAwesomeIcon icon={faStar} /> Promoção Exclusiva
            </div>
            <h1>
              Duas plataformas.<br />
              <span className="apt-gradient-text">Um ecossistema completo.</span>
            </h1>
            <p className="apt-hero-desc">
              Contrate o <strong>ApertAi</strong> e ganhe benefícios exclusivos no <strong>ArenaAi</strong>.
              Gestão inteligente + replays esportivos profissionais para sua arena.
            </p>

            <div className="apt-benefits-hero">
              <div className="apt-benefit-card">
                <div className="apt-benefit-icon">
                  <FontAwesomeIcon icon={faGift} />
                </div>
                <div>
                  <strong>1 Mês Grátis</strong>
                  <span>do ApertAi para novos clientes</span>
                </div>
              </div>
              <div className="apt-benefit-card">
                <div className="apt-benefit-icon purple">
                  <FontAwesomeIcon icon={faPercent} />
                </div>
                <div>
                  <strong>Desconto Especial</strong>
                  <span>no ArenaAi para quem contratar</span>
                </div>
              </div>
            </div>

            <a href="#formulario" className="apt-hero-cta">
              Quero aproveitar <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>

          <div className="apt-hero-right">
            <div className="apt-showcase">
              <img src="/apertai-logo.svg" alt="Apertai" className="apt-showcase-logo" />
              <img src="/tennis-player.png" alt="Jogador" className="apt-showcase-player" />
              <div className="apt-floating-card apt-card-1">
                <FontAwesomeIcon icon={faVideo} />
                <span>Replays em Full HD</span>
              </div>
              <div className="apt-floating-card apt-card-2">
                <FontAwesomeIcon icon={faPlay} />
                <span>Seus melhores momentos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O que você ganha */}
      <section className="apt-features">
        <h2>O que você ganha com essa parceria</h2>
        <div className="apt-features-grid">
          <div className="apt-feature">
            <div className="apt-feature-num">1</div>
            <h3>Contrate o ApertAi</h3>
            <p>Sistema de replays esportivos em alta qualidade para sua quadra de beach tennis ou padel</p>
          </div>
          <div className="apt-feature">
            <div className="apt-feature-num">2</div>
            <h3>Ganhe 1 mês grátis</h3>
            <p>Primeiro mês do ApertAi totalmente por nossa conta para você testar sem compromisso</p>
          </div>
          <div className="apt-feature">
            <div className="apt-feature-num">3</div>
            <h3>Desconto no ArenaAi</h3>
            <p>Condição especial e exclusiva no ArenaAi para gestão completa da sua arena esportiva</p>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section className="apt-form-section" id="formulario">
        <div className="apt-form-card">
          {submitted ? (
            <div className="apt-success">
              <div className="apt-success-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <h2>Interesse registrado!</h2>
              <p>
                Nossa equipe entrará em contato em breve para apresentar os detalhes
                da promoção ApertAi + ArenaAi.
              </p>
              <a href="/" className="apt-back-link">Voltar ao site</a>
            </div>
          ) : (
            <>
              <div className="apt-form-header">
                <h2>Tenho interesse na promoção</h2>
                <p>Preencha seus dados e nossa equipe entrará em contato com todos os detalhes</p>
              </div>

              {error && <div className="apt-error">{error}</div>}

              <div className="apt-form-fields">
                <div className="apt-field">
                  <label>Nome completo *</label>
                  <div className="apt-field-input">
                    <FontAwesomeIcon icon={faUser} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="apt-field">
                  <label>Email *</label>
                  <div className="apt-field-input">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="apt-field">
                  <label>Telefone / WhatsApp</label>
                  <div className="apt-field-input">
                    <FontAwesomeIcon icon={faPhone} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="apt-field">
                  <label>Nome da arena / quadra</label>
                  <div className="apt-field-input">
                    <FontAwesomeIcon icon={faBuilding} />
                    <input
                      type="text"
                      value={arenaName}
                      onChange={e => setArenaName(e.target.value)}
                      placeholder="Ex: Arena Beach Sports"
                    />
                  </div>
                </div>
              </div>

              <button
                className="apt-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Enviando...</>
                ) : (
                  <>Quero aproveitar a promoção <FontAwesomeIcon icon={faArrowRight} /></>
                )}
              </button>

              <p className="apt-form-disclaimer">
                Ao enviar, você autoriza o contato da nossa equipe por email ou WhatsApp.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="apt-footer">
        <div className="apt-footer-logos">
          <span className="apt-footer-arena">Arena<span>Ai</span></span>
          <span className="apt-footer-plus">+</span>
          <img src="/apertai-logo.svg" alt="Apertai" className="apt-footer-apertai" />
        </div>
        <p>Juntos para transformar sua arena esportiva.</p>
      </footer>
    </div>
  );
}
