import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faMoneyBillWave,
  faUsers,
  faChartLine,
  faMobileScreenButton,
  faBell,
  faRobot,
  faComments,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
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

    document.querySelectorAll('.recursos-section, .ia-section, .contato-section').forEach(section => {
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

    // Animate dashboard cards
    cards.forEach((card, index) => {
      const element = card as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';

      setTimeout(() => {
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 800 + (index * 200));
    });

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
    const phone = '5531992048792';
    const message = `Olá! Gostaria de contratar o ArenaAi - Gestão de Quadras Inteligente.`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
              Gerencie sua quadra<br />
              sem dor de cabeça.<br />
              <span className="headline-accent">Deixe a ArenaAi fazer o trabalho.</span>
            </h2>

            <p className="hero-text">
              ArenaAi organiza horários, alunos, pagamentos e ocupação da sua quadra esportiva em um só painel.
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
            <img src="/hero-person.png" alt="Gestor Esportivo" className="person-image" />
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
          <h2 className="section-title">Recursos que fazem a diferença</h2>
          <p className="section-subtitle">Tudo que você precisa para gerenciar sua quadra em um só lugar</p>

          <div className="recursos-grid">
            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faCalendarDays} size="3x" color="#f04f28" />
              </div>
              <h3>Agenda Inteligente</h3>
              <p>Organize horários, aulas e eventos automaticamente. Sem conflitos, sem dor de cabeça.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faMoneyBillWave} size="3x" color="#f04f28" />
              </div>
              <h3>Controle Financeiro</h3>
              <p>Acompanhe pagamentos, mensalidades e inadimplências em tempo real com relatórios completos.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faUsers} size="3x" color="#f04f28" />
              </div>
              <h3>Gestão de Alunos</h3>
              <p>Cadastre alunos, controle presenças e organize turmas de forma simples e rápida.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faChartLine} size="3x" color="#f04f28" />
              </div>
              <h3>Relatórios em Tempo Real</h3>
              <p>Veja métricas de ocupação, faturamento e performance da sua quadra instantaneamente.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faMobileScreenButton} size="3x" color="#f04f28" />
              </div>
              <h3>WhatsApp Integrado</h3>
              <p>Envie lembretes de pagamento e confirmações de aula direto pelo WhatsApp.</p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">
                <FontAwesomeIcon icon={faBell} size="3x" color="#f04f28" />
              </div>
              <h3>Notificações Automáticas</h3>
              <p>Receba alertas sobre inadimplência, horários vagos e oportunidades de vendas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* IA SECTION */}
      <section id="ia" className="ia-section">
        <div className="ia-content">
          <div className="ia-left">
            <h2 className="section-title">Inteligência Artificial trabalhando para você</h2>
            <p className="section-subtitle">Nossa IA cuida do operacional enquanto você foca no que importa: seus alunos</p>

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

      {/* CONTATO SECTION */}
      <section id="contato" className="contato-section">
        <div className="contato-content">
          <h2 className="section-title">Pronto para transformar sua gestão?</h2>
          <p className="section-subtitle">Teste grátis por 14 dias. Sem cartão de crédito.</p>
          <button className="btn-cta-large" onClick={handleContratar}>Começar agora</button>
        </div>
      </section>
    </div>
  );
}
