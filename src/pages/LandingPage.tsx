import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { authService } from '../services/authService';
import {
  faCalendarDays,
  faMoneyBillWave,
  faChartLine,
  faMobileScreenButton,
  faRobot,
  faComments,
  faCheck,
  faGift,
  faPlay,
  faVideo,
  faPercent,
  faUserPlus,
  faTableTennis,
  faCreditCard,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado e tem a preferência de "mantenha-me logado"
    const token = authService.getToken();
    const keepLoggedIn = localStorage.getItem('keepLoggedIn') === 'true';

    if (token && keepLoggedIn) {
      // Redirecionar automaticamente para o dashboard
      navigate('/dashboard');
      return;
    }

    // Smooth scroll for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(anchor => {
      anchor.addEventListener('click', function (e: Event) {
        e.preventDefault();
        const target = document.querySelector((e.currentTarget as HTMLAnchorElement).getAttribute('href')!);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Scroll animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.recursos-section, .ia-section, .parceria-section, .app-section, .contato-section').forEach(section => {
      sectionObserver.observe(section);
    });

    // Parallax effect on cards
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };

    document.addEventListener('mousemove', handleMouseMove);

    const cards = document.querySelectorAll('.dashboard-card');
    let animationId: number;

    const animateCards = () => {
      cards.forEach((card, index) => {
        const speed = (index + 1) * 8;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;
        (card as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
      animationId = requestAnimationFrame(animateCards);
    };

    animateCards();

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar') as HTMLElement;

    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      if (navbar) {
        if (currentScroll > 100) {
          navbar.style.background = 'rgba(26, 26, 26, 0.95)';
          navbar.style.backdropFilter = 'blur(10px)';
          navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
          navbar.style.background = 'transparent';
          navbar.style.backdropFilter = 'none';
          navbar.style.boxShadow = 'none';
        }
      }
      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll);

    // Hero elements animation
    const heroElements = [
      document.querySelector('.hero-headline'),
      document.querySelector('.hero-text'),
      document.querySelector('.hero-subtext'),
      document.querySelector('.btn-cta')
    ];

    heroElements.forEach((el, index) => {
      if (el) {
        const element = el as HTMLElement;
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.8s ease';

        setTimeout(() => {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }, 300 + (index * 150));
      }
    });

    // Dashboard cards animation is now handled by CSS (see LandingPage.css)

    // Chat auto-scroll
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
      sectionObserver.disconnect();
    };
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleContratar = () => {
    navigate('/contratar');
  };

  const handleCTA = () => {
    const contatoSection = document.querySelector('#contato');
    if (contatoSection) {
      contatoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* HERO SECTION */}
      <div className="hero-container">
        {/* LEFT SIDE - Dark Section */}
        <div className="hero-left">
          {/* Navigation Bar */}
          <nav className="navbar">
            <div className="logo">
              <h1>ArenaA<span className="logo-dot">i</span></h1>
              <p className="logo-subtitle">Gestão de Quadras Inteligente</p>
            </div>

            <ul className="nav-links">
              <li><a href="#inicio">Início</a></li>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#ia">IA</a></li>
              <li>
                <a href="#parceria" className="nav-promo">
                  <FontAwesomeIcon icon={faGift} className="promo-icon" />
                  <span>Promoção</span>
                </a>
              </li>
              <li><a href="#contato">Contato</a></li>
            </ul>

            <div className="nav-buttons">
              <button className="btn-outline" onClick={handleLoginClick}>Já sou cliente</button>
              <button className="btn-primary" onClick={handleContratar}>Contratar agora</button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="hero-content">
            <h2 className="hero-headline">
              Gestão de quadras esportivas<br />
              sem dor de cabeça.<br />
              <span className="headline-accent">Deixe a ArenaAi fazer o trabalho.</span>
            </h2>

            <p className="hero-text">
              ArenaAi organiza horários, alunos, pagamentos e ocupação da sua arena de beach tennis, society, futevôlei e padel em um só painel.
              <strong> Zero planilha. Zero estresse.</strong>
            </p>

            <p className="hero-subtext">
              Nossa IA avisa inadimplente, preenche presença, sugere remanejamento e evita horário vazio
              antes do problema acontecer.
            </p>

            <button className="btn-cta" onClick={handleCTA}>Quero ver funcionando</button>
          </div>
        </div>

        {/* RIGHT SIDE - Orange Section */}
        <div className="hero-right">
          {/* Circular Rings Background */}
          <div className="rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>

          {/* Hero Image */}
          <div className="hero-image">
            <img src="/hero-person.png" alt="Gestor de quadra esportiva usando o sistema ArenaAi para gerenciar arena de beach tennis e society" className="person-image" />
          </div>

          {/* Floating Dashboard Cards */}
          <div className="dashboard-card card-ai">
            <div className="card-icon">
              <FontAwesomeIcon icon={faRobot} style={{ color: '#8E44AD' }} size="lg" />
            </div>
            <div className="card-content">
              <p className="card-label">Gestão por IA</p>
              <p className="card-value">100% automatizado</p>
            </div>
          </div>

          <div className="dashboard-card card-financial">
            <div className="card-icon">
              <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: '#FF6B35' }} size="lg" />
            </div>
            <div className="card-content">
              <p className="card-label">Pagamentos recebidos hoje</p>
              <p className="card-value">R$ 1.280</p>
            </div>
          </div>

          <div className="dashboard-card card-occupancy">
            <div className="card-icon">
              <FontAwesomeIcon icon={faChartLine} style={{ color: '#FF4081' }} size="lg" />
            </div>
            <div className="card-content">
              <p className="card-label">Ocupação da quadra</p>
              <p className="card-value">92% horários vendidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* RECURSOS SECTION */}
      <section id="recursos" className="recursos-section">
        <div className="section-transition"></div>
        <div className="recursos-content">
          <h2 className="section-title">Recursos para gestão de quadras esportivas</h2>
          <p className="section-subtitle">Tudo que você precisa para gerenciar sua arena de beach tennis, society, futevôlei e padel</p>

          <div className="recursos-grid">
            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faUserPlus} size="3x" color="#f04f28" />
              </div>
              <h3>Alunos Experimentais</h3>
              <p>Sistema completo de aulas experimentais com links de agendamento público, acompanhamento de status e conversão automática.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faTableTennis} size="3x" color="#f04f28" />
              </div>
              <h3>Locação de Quadras de Areia e Society</h3>
              <p>Agendamento visual com preços por horário, link público para reservas, controle de mensalistas e detecção de conflitos.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faCreditCard} size="3x" color="#f04f28" />
              </div>
              <h3>Gestão Financeira</h3>
              <p>Cobranças automáticas via PIX e cartão, controle de inadimplência, pagamento direto pelo app do aluno.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faWhatsapp} size="3x" color="#f04f28" />
              </div>
              <h3>Automação WhatsApp</h3>
              <p>Lembretes de cobrança, confirmação de pagamento e templates personalizáveis enviados automaticamente.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faMobileScreenButton} size="3x" color="#f04f28" />
              </div>
              <h3>App Mobile</h3>
              <p>App completo para alunos: créditos, cancelamentos, reservas de aula experimental, pagamentos e notificações push.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faCalendarDays} size="3x" color="#f04f28" />
              </div>
              <h3>Agenda Inteligente</h3>
              <p>Drag-and-drop de turmas e alunos, visão semanal e diária, busca rápida e detecção automática de conflitos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* IA SECTION */}
      <section id="ia" className="ia-section">
        <div className="ia-content">
          <div className="ia-left">
            <h2 className="section-title">IA para gestão de arenas esportivas</h2>
            <p className="section-subtitle">Nossa inteligência artificial cuida do operacional da sua quadra enquanto você foca no que importa: seus alunos</p>

            <div className="ia-features">
              <div className="ia-feature">
                <span className="feature-icon">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <div>
                  <h4>Previsão de Inadimplência</h4>
                  <p>IA identifica padrões e avisa antes do aluno atrasar</p>
                </div>
              </div>
              <div className="ia-feature">
                <span className="feature-icon">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <div>
                  <h4>Sugestões de Remanejamento</h4>
                  <p>Otimize horários vazios automaticamente</p>
                </div>
              </div>
              <div className="ia-feature">
                <span className="feature-icon">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <div>
                  <h4>Presença Automática</h4>
                  <p>Sistema aprende padrões e registra presenças</p>
                </div>
              </div>
              <div className="ia-feature">
                <span className="feature-icon">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <div>
                  <h4>Análise Preditiva</h4>
                  <p>Projeções de faturamento e ocupação inteligentes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ia-right">
            <div className="chat-demo">
              <div className="chat-header">
                <div className="chat-avatar">
                  <FontAwesomeIcon icon={faRobot} size="lg" />
                </div>
                <div>
                  <h4>Assistente ArenaAi</h4>
                  <p className="chat-status">● Online</p>
                </div>
              </div>

              <div className="chat-messages">
                <div className="message ai-message">
                  <div className="message-content">
                    Olá! Detectei que 3 alunos estão com pagamento próximo do vencimento. Deseja que eu envie lembretes automáticos?
                  </div>
                  <span className="message-time">10:23</span>
                </div>

                <div className="message user-message">
                  <div className="message-content">
                    Sim, pode enviar!
                  </div>
                  <span className="message-time">10:24</span>
                </div>

                <div className="message ai-message">
                  <div className="message-content">
                    ✓ Lembretes enviados via WhatsApp para:<br />
                    • João Silva - R$ 150,00<br />
                    • Maria Santos - R$ 200,00<br />
                    • Pedro Costa - R$ 150,00
                  </div>
                  <span className="message-time">10:24</span>
                </div>

                <div className="message ai-message">
                  <div className="message-content">
                    Também notei que você tem 2 horários vagos na terça-feira às 14h e 16h. Posso sugerir alunos para remanejamento?
                  </div>
                  <span className="message-time">10:25</span>
                </div>
              </div>

              <div className="chat-input">
                <input type="text" placeholder="Digite sua mensagem..." disabled />
                <button>
                  <FontAwesomeIcon icon={faComments} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARCERIA APERTAI SECTION */}
      <section id="parceria" className="parceria-section">
        <div className="parceria-bg-shapes">
          <div className="parceria-shape shape-1"></div>
          <div className="parceria-shape shape-2"></div>
          <div className="parceria-shape shape-3"></div>
        </div>

        <div className="parceria-content">
          <div className="parceria-left">
            <div className="parceria-badge">
              <FontAwesomeIcon icon={faGift} />
              <span>Oferta Exclusiva</span>
            </div>

            <h2 className="parceria-title">
              Duas plataformas.<br />
              <span className="parceria-accent">Um ecossistema completo.</span>
            </h2>

            <p className="parceria-description">
              <strong>ArenaAi</strong> cuida da gestão da sua quadra. <strong>Apertai</strong> eterniza os melhores momentos
              dos seus alunos com replays esportivos em alta qualidade. Juntos, oferecem a experiência completa
              para sua arena esportiva.
            </p>

            <div className="parceria-benefits">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FontAwesomeIcon icon={faGift} />
                </div>
                <div className="benefit-content">
                  <h4>1 Mês Grátis</h4>
                  <p>Contratando qualquer plataforma, ganhe 1 mês de teste grátis da outra</p>
                </div>
              </div>

              <div className="benefit-card">
                <div className="benefit-icon">
                  <FontAwesomeIcon icon={faPercent} />
                </div>
                <div className="benefit-content">
                  <h4>25% OFF Vitalício</h4>
                  <p>Desconto permanente na mensalidade da segunda plataforma</p>
                </div>
              </div>
            </div>

            <div className="parceria-cta-group">
              <button className="btn-parceria-primary" onClick={handleContratar}>
                Quero aproveitar
              </button>
              <a href="https://apertai.com.br" target="_blank" rel="noopener noreferrer" className="btn-parceria-secondary">
                Conhecer o Apertai
                <FontAwesomeIcon icon={faPlay} />
              </a>
            </div>
          </div>

          <div className="parceria-right">
            <div className="apertai-showcase">
              <div className="apertai-logo-container">
                <img src="/apertai-logo.svg" alt="Apertai - Sistema de replays esportivos para quadras de beach tennis e padel" className="apertai-logo" />
              </div>

              <div className="apertai-player-container">
                <img src="/tennis-player.png" alt="Jogador de beach tennis em quadra de areia com sistema de replay Apertai" className="tennis-player" />

                <div className="floating-video-card card-replay">
                  <div className="video-card-icon">
                    <FontAwesomeIcon icon={faVideo} />
                  </div>
                  <div className="video-card-content">
                    <p className="video-card-label">Seus vídeos</p>
                    <p className="video-card-value">em alta qualidade</p>
                  </div>
                </div>

                <div className="floating-video-card card-fullhd">
                  <div className="video-card-icon fullhd-icon">
                    <span>FULL</span>
                    <span className="hd">HD</span>
                  </div>
                  <div className="video-card-content">
                    <p className="video-card-label">Filmagem</p>
                    <p className="video-card-value">1080p</p>
                  </div>
                </div>

                <div className="play-button-overlay">
                  <div className="play-button">
                    <FontAwesomeIcon icon={faPlay} />
                  </div>
                </div>
              </div>

              <div className="apertai-tagline">
                <p>Eternize suas jogadas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APP SHOWCASE SECTION */}
      <section className="app-section">
        <div className="app-content">
          <div className="app-left">
            <h2 className="section-title">App para alunos da sua quadra esportiva</h2>
            <p className="section-subtitle" style={{ textAlign: 'left' }}>Seus alunos de beach tennis, society, futevôlei e padel gerenciam tudo na palma da mão.</p>

            <div className="app-features-list">
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Créditos e cancelamentos de aula</span>
              </div>
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Reservas de aula experimental</span>
              </div>
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Pagamento de mensalidade pelo app</span>
              </div>
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Formulários e pesquisas</span>
              </div>
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Notificações push em tempo real</span>
              </div>
              <div className="app-feature-item">
                <FontAwesomeIcon icon={faCheck} className="app-feature-check" />
                <span>Avisos e comunicados do gestor</span>
              </div>
            </div>

            <button className="btn-cta" onClick={handleContratar} style={{ marginTop: 24 }}>
              Quero o app para meus alunos
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
            </button>
          </div>

          <div className="app-right">
            <div className="app-mockup">
              <div className="app-phone">
                <div className="app-phone-notch"></div>
                <div className="app-phone-screen">
                  <div className="app-screen-header">
                    <span>ArenaAi</span>
                    <span className="app-screen-bell">🔔</span>
                  </div>
                  <div className="app-screen-card">
                    <div className="app-screen-label">Próxima aula</div>
                    <div className="app-screen-value">Terça, 18h - Beach Tennis</div>
                  </div>
                  <div className="app-screen-card">
                    <div className="app-screen-label">Créditos restantes</div>
                    <div className="app-screen-value" style={{ color: '#22C55E' }}>3 aulas</div>
                  </div>
                  <div className="app-screen-card">
                    <div className="app-screen-label">Fatura</div>
                    <div className="app-screen-value">R$ 200,00 <span className="app-screen-badge">Pago</span></div>
                  </div>
                  <div className="app-screen-btn">Reservar aula experimental</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO SECTION */}
      <section id="contato" className="contato-section">
        <div className="contato-content">
          <h2 className="section-title">Pronto para transformar a gestão da sua quadra?</h2>
          <p className="section-subtitle">Sistema completo para arenas de beach tennis, society, futevôlei e padel. Teste grátis por 30 dias.</p>
          <button className="btn-cta-large" onClick={handleContratar}>
            Começar agora
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 12 }} />
          </button>
        </div>
      </section>
    </div>
  );
}
