import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faUserGroup,
  faClipboardList,
  faMoneyBillWave,
  faCalendarDays,
  faBaseballBatBall,
  faChartBar,
  faBullhorn,
  faRobot,
  faLayerGroup,
  faMobileScreenButton,
  faCheck,
  faArrowRight,
  faArrowDown,
  faRocket,
  faChartLine,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/SystemGuide.css';

const features = [
  { icon: faHome, title: 'Dashboard', desc: 'Visão geral com KPIs, gráficos de faturamento, ocupação de turmas e agenda do dia em um só lugar.' },
  { icon: faUsers, title: 'Alunos', desc: 'Gestão completa de alunos com perfis, níveis personalizados, histórico e controle de presença.' },
  { icon: faUserGroup, title: 'Turmas', desc: 'Organize turmas por dia da semana, horário, modalidade e capacidade máxima de alunos.' },
  { icon: faClipboardList, title: 'Matrículas', desc: 'Gerencie matrículas com planos, datas de vigência, renovação e vinculação de turmas.' },
  { icon: faMoneyBillWave, title: 'Financeiro', desc: 'Controle de faturas, pagamentos, inadimplência e fluxo de caixa com relatórios detalhados.' },
  { icon: faCalendarDays, title: 'Agenda', desc: 'Calendário semanal com visualização de aulas, locações de quadra e disponibilidade em tempo real.' },
  { icon: faBaseballBatBall, title: 'Locação de Quadras', desc: 'Alugue quadras por horário com controle de disponibilidade, pagamento e histórico.' },
  { icon: faChartBar, title: 'Relatórios', desc: 'Relatórios financeiros e de matrículas com gráficos interativos e exportação de dados.' },
  { icon: faBullhorn, title: 'Avisos', desc: 'Envie comunicados push para todos os alunos ou filtre por turmas, níveis e modalidades.' },
  { icon: faRobot, title: 'Chat IA', desc: 'Assistente inteligente que responde dúvidas, analisa métricas e ajuda na gestão do dia a dia.' },
  { icon: faLayerGroup, title: 'Níveis', desc: 'Crie e personalize níveis de habilidade com cores para classificar seus alunos visualmente.' },
  { icon: faMobileScreenButton, title: 'App Mobile', desc: 'Seus alunos acessam horários, pagamentos, avisos e perfil direto do celular.' },
];

const steps = [
  { num: 1, icon: faLayerGroup, title: 'Configure seus Níveis', desc: 'Defina os níveis dos seus alunos: iniciante, intermediário, avançado ou crie níveis personalizados.' },
  { num: 2, icon: faUserGroup, title: 'Cadastre suas Turmas', desc: 'Crie turmas com horários, dias da semana, capacidade máxima e modalidade esportiva.' },
  { num: 3, icon: faUsers, title: 'Adicione seus Alunos', desc: 'Cadastre os alunos com dados pessoais, nível e informações de contato.' },
  { num: 4, icon: faClipboardList, title: 'Gerencie Matrículas', desc: 'Registre matrículas vinculando alunos a turmas e planos. Faturas são geradas automaticamente.' },
  { num: 5, icon: faHome, title: 'Acompanhe no Dashboard', desc: 'Veja tudo funcionando no painel principal com resumo financeiro, agenda e indicadores.' },
];

const checklist = [
  { title: 'Fazer login no sistema', desc: 'Acesse com o email e senha recebidos' },
  { title: 'Configurar níveis de alunos', desc: 'Menu Níveis → crie seus níveis personalizados' },
  { title: 'Cadastrar quadras disponíveis', desc: 'Menu Quadras → adicione suas quadras e horários' },
  { title: 'Criar turmas e horários', desc: 'Menu Turmas → defina turmas por dia e horário' },
  { title: 'Adicionar alunos', desc: 'Menu Alunos → cadastre os alunos da academia' },
  { title: 'Registrar matrículas', desc: 'Menu Matrículas → vincule alunos a turmas e planos' },
  { title: 'Verificar agenda semanal', desc: 'Menu Agenda → confira tudo organizado no calendário' },
  { title: 'Explorar o Chat IA', desc: 'Pergunte qualquer coisa sobre seu negócio ao assistente' },
];

export default function SystemGuide() {
  const navigate = useNavigate();

  useEffect(() => {
    // Hero staggered animation
    const heroEls = document.querySelectorAll('.sg-hero-content > *');
    heroEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('sg-visible');
      }, 200 + i * 180);
    });

    // Scroll animations with IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sg-in-view');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    document.querySelectorAll(
      '.sg-quickstart, .sg-features, .sg-deepdive, .sg-checklist, .sg-cta'
    ).forEach((el) => observer.observe(el));

    // Navbar scroll effect
    const nav = document.querySelector('.sg-nav');
    const handleScroll = () => {
      if (window.scrollY > 80) {
        nav?.classList.add('sg-nav-scrolled');
      } else {
        nav?.classList.remove('sg-nav-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToFeatures = () => {
    document.querySelector('.sg-quickstart')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sg-page">
      {/* ── Navbar ── */}
      <nav className="sg-nav">
        <img src="/arenai-logo.svg" alt="ArenaAi" className="sg-nav-logo" />
        <button className="sg-nav-btn" onClick={() => navigate('/login')}>
          Acessar o Sistema <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="sg-hero">
        <div className="sg-hero-shapes">
          <div className="sg-hero-shape" />
          <div className="sg-hero-shape" />
          <div className="sg-hero-shape" />
        </div>
        <div className="sg-hero-content">
          <img src="/arenai-logo.svg" alt="ArenaAi" className="sg-hero-logo" />
          <div className="sg-hero-badge">
            <FontAwesomeIcon icon={faRocket} /> Guia do Sistema
          </div>
          <h1 className="sg-hero-title">
            Bem-vindo ao <span>ArenaAi</span>
          </h1>
          <p className="sg-hero-desc">
            Seu guia completo para dominar a gestão da sua academia esportiva.
            Descubra todas as funcionalidades e comece a usar em minutos.
          </p>
          <button className="sg-hero-cta" onClick={scrollToFeatures}>
            Explorar Recursos <FontAwesomeIcon icon={faArrowDown} />
          </button>
        </div>
        <div className="sg-hero-scroll">
          Role para baixo
          <div className="sg-hero-scroll-line" />
        </div>
      </section>

      {/* ── 2. Quick Start ── */}
      <section className="sg-section sg-section-light sg-quickstart">
        <div className="sg-section-inner">
          <h2 className="sg-section-title">Comece em 5 Passos</h2>
          <p className="sg-section-subtitle">
            Configure sua academia rapidamente seguindo este fluxo simples
          </p>
          <div className="sg-timeline">
            {steps.map((step) => (
              <div key={step.num} className="sg-timeline-item">
                <div className="sg-timeline-number">{step.num}</div>
                <div className="sg-timeline-body">
                  <h3>
                    <FontAwesomeIcon icon={step.icon} className="sg-timeline-icon" />
                    {step.title}
                  </h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Features Grid ── */}
      <section className="sg-section sg-section-dark sg-features">
        <div className="sg-section-inner">
          <h2 className="sg-section-title">Tudo que Você Precisa em Um Só Lugar</h2>
          <p className="sg-section-subtitle">
            12 módulos completos para gestão total da sua academia esportiva
          </p>
          <div className="sg-features-grid">
            {features.map((f) => (
              <div key={f.title} className="sg-feature-card">
                <div className="sg-feature-icon">
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4A. Deep-Dive: Dashboard ── */}
      <section className="sg-section sg-section-light sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Visão Geral</span>
              <h2>Tudo começa no Dashboard</h2>
              <p>
                O painel principal reúne os indicadores mais importantes da sua academia
                em um só lugar, atualizado em tempo real.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> KPIs de matrículas e financeiro</li>
                <li><FontAwesomeIcon icon={faCheck} /> Gráfico de faturamento mensal</li>
                <li><FontAwesomeIcon icon={faCheck} /> Ocupação de vagas por turma</li>
                <li><FontAwesomeIcon icon={faCheck} /> Agenda do dia com turmas e locações</li>
                <li><FontAwesomeIcon icon={faCheck} /> Lista de inadimplentes com ação rápida</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-row">
                  <div className="sg-mockup-card">
                    <span className="sg-mockup-card-label">Ativas</span>
                    <span className="sg-mockup-card-value" style={{ color: '#3B82F6' }}>248</span>
                  </div>
                  <div className="sg-mockup-card">
                    <span className="sg-mockup-card-label">Novas</span>
                    <span className="sg-mockup-card-value" style={{ color: '#10B981' }}>12</span>
                  </div>
                  <div className="sg-mockup-card">
                    <span className="sg-mockup-card-label">Receita</span>
                    <span className="sg-mockup-card-value" style={{ color: '#F58A25' }}>R$ 42k</span>
                  </div>
                </div>
                <div className="sg-mockup-chart" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4B. Deep-Dive: Financeiro ── */}
      <section className="sg-section sg-section-dark sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content sg-reversed">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Financeiro</span>
              <h2>Controle total das suas finanças</h2>
              <p>
                Gerencie todas as faturas da academia, acompanhe pagamentos e
                tenha visibilidade completa sobre inadimplência e fluxo de caixa.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Geração automática de faturas</li>
                <li><FontAwesomeIcon icon={faCheck} /> Controle de inadimplência</li>
                <li><FontAwesomeIcon icon={faCheck} /> Relatórios de receita mensal</li>
                <li><FontAwesomeIcon icon={faCheck} /> Cobrança via WhatsApp integrada</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-invoice">
                  <span className="sg-mockup-invoice-name">Maria Silva</span>
                  <span className="sg-mockup-invoice-status sg-status-paid">Paga</span>
                </div>
                <div className="sg-mockup-invoice">
                  <span className="sg-mockup-invoice-name">João Santos</span>
                  <span className="sg-mockup-invoice-status sg-status-pending">A Vencer</span>
                </div>
                <div className="sg-mockup-invoice">
                  <span className="sg-mockup-invoice-name">Ana Costa</span>
                  <span className="sg-mockup-invoice-status sg-status-paid">Paga</span>
                </div>
                <div className="sg-mockup-invoice">
                  <span className="sg-mockup-invoice-name">Pedro Lima</span>
                  <span className="sg-mockup-invoice-status sg-status-overdue">Atrasada</span>
                </div>
                <div className="sg-mockup-invoice">
                  <span className="sg-mockup-invoice-name">Carla Oliveira</span>
                  <span className="sg-mockup-invoice-status sg-status-paid">Paga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4C. Deep-Dive: Chat IA ── */}
      <section className="sg-section sg-section-accent sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Inteligência Artificial</span>
              <h2>Seu assistente pessoal</h2>
              <p>
                Converse com a IA sobre qualquer aspecto da sua academia.
                Ela conhece seus dados e ajuda você a tomar decisões inteligentes.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Pergunte sobre alunos e turmas</li>
                <li><FontAwesomeIcon icon={faCheck} /> Análise de métricas financeiras</li>
                <li><FontAwesomeIcon icon={faCheck} /> Sugestões inteligentes de gestão</li>
                <li><FontAwesomeIcon icon={faCheck} /> Disponível 24/7 no sistema</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-chat">
                  <div className="sg-mockup-msg sg-user">
                    Quantos alunos novos tivemos este mês?
                  </div>
                  <div className="sg-mockup-msg sg-bot">
                    Este mês vocês tiveram 12 novas matrículas, um crescimento de 20% em relação ao mês anterior. A turma Iniciante B foi a que mais recebeu alunos novos.
                  </div>
                  <div className="sg-mockup-msg sg-user">
                    Quais alunos estão inadimplentes?
                  </div>
                  <div className="sg-mockup-msg sg-bot">
                    Encontrei 5 alunos com faturas vencidas. O total em atraso é de R$ 1.250,00. Posso listar os detalhes para você?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4D. Deep-Dive: Avisos ── */}
      <section className="sg-section sg-section-light sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content sg-reversed">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Comunicação</span>
              <h2>Avisos e Comunicados</h2>
              <p>
                Mantenha seus alunos informados com avisos enviados diretamente pelo sistema.
                Filtre por turma, nível ou envie para toda a academia de uma vez.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Envio rápido de avisos pelo Dashboard</li>
                <li><FontAwesomeIcon icon={faCheck} /> Tipos: informativo, urgente, evento e promoção</li>
                <li><FontAwesomeIcon icon={faCheck} /> Filtre por turma, nível ou modalidade</li>
                <li><FontAwesomeIcon icon={faCheck} /> Notificações push no app dos alunos</li>
                <li><FontAwesomeIcon icon={faCheck} /> Histórico completo de envios</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-notifications">
                  <div className="sg-notif-item sg-notif-info">
                    <span className="sg-notif-type">Informativo</span>
                    <span className="sg-notif-text">Horários atualizados para o mês de março</span>
                  </div>
                  <div className="sg-notif-item sg-notif-urgent">
                    <span className="sg-notif-type">Urgente</span>
                    <span className="sg-notif-text">Quadra 2 em manutenção dia 15/03</span>
                  </div>
                  <div className="sg-notif-item sg-notif-event">
                    <span className="sg-notif-type">Evento</span>
                    <span className="sg-notif-text">Torneio interno dia 20/03 — inscrições abertas!</span>
                  </div>
                  <div className="sg-notif-item sg-notif-promo">
                    <span className="sg-notif-type">Promoção</span>
                    <span className="sg-notif-text">Indique um amigo e ganhe 10% de desconto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4E. Deep-Dive: Locações de Quadras ── */}
      <section className="sg-section sg-section-dark sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Locações</span>
              <h2>Gestão de Locação de Quadras</h2>
              <p>
                Alugue suas quadras por horário com controle total de disponibilidade,
                preços personalizados e histórico completo de locações.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Agenda visual de disponibilidade</li>
                <li><FontAwesomeIcon icon={faCheck} /> Preços por quadra e horário</li>
                <li><FontAwesomeIcon icon={faCheck} /> Controle de pagamento integrado</li>
                <li><FontAwesomeIcon icon={faCheck} /> Histórico completo de locações</li>
                <li><FontAwesomeIcon icon={faCheck} /> Bloqueio de horários para manutenção</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-schedule">
                  <div className="sg-schedule-header">
                    <span></span>
                    <span>08h</span>
                    <span>09h</span>
                    <span>10h</span>
                    <span>11h</span>
                  </div>
                  <div className="sg-schedule-row">
                    <span className="sg-schedule-court">Quadra 1</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                  </div>
                  <div className="sg-schedule-row">
                    <span className="sg-schedule-court">Quadra 2</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                  </div>
                  <div className="sg-schedule-row">
                    <span className="sg-schedule-court">Quadra 3</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                    <span className="sg-schedule-slot sg-slot-booked">Locado</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                    <span className="sg-schedule-slot sg-slot-free">Livre</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4F. Deep-Dive: Turmas e Instrutores ── */}
      <section className="sg-section sg-section-light sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content sg-reversed">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Organização</span>
              <h2>Turmas e Instrutores</h2>
              <p>
                Organize suas turmas por dia, horário e modalidade. Associe instrutores
                e acompanhe a capacidade de cada turma em tempo real.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Turmas por dia da semana e horário</li>
                <li><FontAwesomeIcon icon={faCheck} /> Vinculação de instrutores às turmas</li>
                <li><FontAwesomeIcon icon={faCheck} /> Controle de capacidade máxima</li>
                <li><FontAwesomeIcon icon={faCheck} /> Níveis e modalidades personalizáveis</li>
                <li><FontAwesomeIcon icon={faCheck} /> Perfil completo de cada instrutor</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-classes">
                  <div className="sg-class-card">
                    <div className="sg-class-header">
                      <span className="sg-class-name">Turma Iniciante A</span>
                      <span className="sg-class-badge">8/12</span>
                    </div>
                    <div className="sg-class-info">Seg e Qua · 08:00 - 09:30</div>
                    <div className="sg-class-instructor">Prof. Ricardo Silva</div>
                  </div>
                  <div className="sg-class-card">
                    <div className="sg-class-header">
                      <span className="sg-class-name">Turma Avançado B</span>
                      <span className="sg-class-badge sg-class-full">12/12</span>
                    </div>
                    <div className="sg-class-info">Ter e Qui · 17:00 - 18:30</div>
                    <div className="sg-class-instructor">Prof. Ana Martins</div>
                  </div>
                  <div className="sg-class-card">
                    <div className="sg-class-header">
                      <span className="sg-class-name">Turma Kids</span>
                      <span className="sg-class-badge">5/10</span>
                    </div>
                    <div className="sg-class-info">Sex · 14:00 - 15:00</div>
                    <div className="sg-class-instructor">Prof. Carlos Souza</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4G. Deep-Dive: Geração de Cobranças ── */}
      <section className="sg-section sg-section-dark sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Automação</span>
              <h2>Geração Automática de Cobranças</h2>
              <p>
                As faturas são geradas automaticamente a partir das matrículas.
                Acompanhe o status de cada cobrança e tenha controle total do fluxo financeiro.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Faturas automáticas por matrícula</li>
                <li><FontAwesomeIcon icon={faCheck} /> Renovação mensal automática</li>
                <li><FontAwesomeIcon icon={faCheck} /> Status em tempo real (paga, pendente, atrasada)</li>
                <li><FontAwesomeIcon icon={faCheck} /> Relatórios de inadimplência</li>
                <li><FontAwesomeIcon icon={faCheck} /> Registro de pagamentos parciais</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-billing">
                  <div className="sg-billing-header">
                    <span className="sg-billing-title">Cobranças — Março 2026</span>
                    <span className="sg-billing-total">R$ 12.450,00</span>
                  </div>
                  <div className="sg-billing-stats">
                    <div className="sg-billing-stat">
                      <span className="sg-billing-stat-value sg-billing-paid">85%</span>
                      <span className="sg-billing-stat-label">Pagas</span>
                    </div>
                    <div className="sg-billing-stat">
                      <span className="sg-billing-stat-value sg-billing-pending">10%</span>
                      <span className="sg-billing-stat-label">Pendentes</span>
                    </div>
                    <div className="sg-billing-stat">
                      <span className="sg-billing-stat-value sg-billing-overdue">5%</span>
                      <span className="sg-billing-stat-label">Atrasadas</span>
                    </div>
                  </div>
                  <div className="sg-billing-bar">
                    <div className="sg-billing-bar-paid" />
                    <div className="sg-billing-bar-pending" />
                    <div className="sg-billing-bar-overdue" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4H. Deep-Dive: WhatsApp ── */}
      <section className="sg-section sg-section-accent sg-deepdive">
        <div className="sg-section-inner">
          <div className="sg-deepdive-content sg-reversed">
            <div className="sg-deepdive-text">
              <span className="sg-badge">Integração</span>
              <h2>Cobranças por WhatsApp</h2>
              <p>
                Envie cobranças e lembretes de pagamento automaticamente pelo WhatsApp.
                Seus alunos recebem direto no celular com link para pagar.
              </p>
              <ul className="sg-deepdive-list">
                <li><FontAwesomeIcon icon={faCheck} /> Envio automático de cobranças</li>
                <li><FontAwesomeIcon icon={faCheck} /> Lembretes de vencimento</li>
                <li><FontAwesomeIcon icon={faCheck} /> Templates personalizáveis</li>
                <li><FontAwesomeIcon icon={faCheck} /> Log completo de mensagens enviadas</li>
                <li><FontAwesomeIcon icon={faCheck} /> Automações por regras de negócio</li>
              </ul>
            </div>
            <div className="sg-deepdive-visual">
              <div className="sg-mockup">
                <div className="sg-mockup-wpp">
                  <div className="sg-wpp-msg sg-wpp-out">
                    <div className="sg-wpp-sender">ArenaAi</div>
                    <div className="sg-wpp-text">Olá Maria! Sua fatura de R$ 180,00 vence dia 10/03. Pague pelo link abaixo:</div>
                    <span className="sg-wpp-time">09:15</span>
                  </div>
                  <div className="sg-wpp-msg sg-wpp-in">
                    <div className="sg-wpp-text">Obrigada! Vou pagar agora</div>
                    <span className="sg-wpp-time">09:22</span>
                  </div>
                  <div className="sg-wpp-msg sg-wpp-out">
                    <div className="sg-wpp-sender">ArenaAi</div>
                    <div className="sg-wpp-text">Pagamento confirmado! Obrigado, Maria.</div>
                    <span className="sg-wpp-time">14:05</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Checklist ── */}
      <section className="sg-section sg-section-light sg-checklist">
        <div className="sg-section-inner">
          <h2 className="sg-section-title">Seu Checklist de Configuração</h2>
          <p className="sg-section-subtitle">
            Siga estes passos para deixar sua academia pronta no sistema
          </p>
          <div className="sg-checklist-items">
            {checklist.map((item, i) => (
              <div key={i} className="sg-checklist-item">
                <div className="sg-checklist-icon">
                  <FontAwesomeIcon icon={faCheck} />
                </div>
                <div className="sg-checklist-text">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA Footer ── */}
      <section className="sg-section sg-section-dark sg-cta">
        <div className="sg-section-inner">
          <div className="sg-cta-content">
            <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '2.5rem', color: '#F58A25', marginBottom: '1.5rem' }} />
            <h2>Pronto para começar?</h2>
            <p>
              Acesse o painel e comece a gerenciar sua academia agora mesmo.
              Sua equipe e alunos vão adorar.
            </p>
            <div className="sg-cta-buttons">
              <button className="sg-btn-primary" onClick={() => navigate('/login')}>
                Acessar o Sistema <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button className="sg-btn-secondary" onClick={() => navigate('/')}>
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
