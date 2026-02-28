import type { LaraModule, LaraCategoryInfo, LaraCategory } from '../types/laraTypes';

// ===== Categorias =====
export const LARA_CATEGORIES: LaraCategoryInfo[] = [
  { id: 'gestao_alunos', label: 'Gestao de Alunos', icon: 'faUsers', description: 'Alunos, experimentais, matriculas e instrutores' },
  { id: 'aulas_agenda', label: 'Aulas e Agenda', icon: 'faCalendarDays', description: 'Turmas, agenda e niveis' },
  { id: 'financeiro', label: 'Financeiro', icon: 'faMoneyBillWave', description: 'Faturas, planos, relatorios e pagamentos' },
  { id: 'quadras_locacoes', label: 'Quadras e Locacoes', icon: 'faSquare', description: 'Quadras, locacoes e mensalistas' },
  { id: 'comunicacao', label: 'Comunicacao', icon: 'faBullhorn', description: 'Avisos e formularios' },
  { id: 'configuracoes', label: 'Configuracoes', icon: 'faCog', description: 'Preferencias, plano e migracao' },
  { id: 'premium', label: 'Recursos Premium', icon: 'faCrown', description: 'IA, Chat IA e WhatsApp' },
  { id: 'admin', label: 'Administracao', icon: 'faGauge', description: 'Arenas e monitoramento' },
];

// ===== Modulos =====
export const LARA_MODULES: LaraModule[] = [
  // ── 1. DASHBOARD ──
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'faHome',
    description: 'Painel principal com visao geral do negocio.',
    keywords: {
      primary: ['dashboard', 'painel', 'inicio', 'home', 'visao geral', 'resumo'],
      secondary: ['receita', 'metricas', 'kpi', 'graficos', 'faturamento', 'indicadores', 'pagina inicial'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'dashboard_overview',
        label: 'Visao geral do Dashboard',
        keywords: ['visao geral', 'o que tem', 'como funciona', 'painel principal'],
        response: 'O Dashboard e sua pagina inicial! Nele voce encontra um resumo completo do seu negocio: receita do mes, quantidade de alunos ativos, status de pagamentos, turmas e avisos recentes.',
        steps: [
          'Acesse "Inicio" no menu lateral',
          'Veja os cards de KPIs no topo (receita, alunos, turmas)',
          'Acompanhe os graficos de faturamento mensal',
          'Confira os avisos e alertas na parte inferior',
        ],
        link: '/dashboard',
        linkLabel: 'Ir para o Dashboard',
      },
      {
        id: 'dashboard_revenue',
        label: 'Acompanhar receita',
        keywords: ['receita', 'faturamento', 'quanto ganhei', 'ganhos', 'lucro'],
        response: 'No Dashboard voce acompanha a receita mensal, compara com meses anteriores e ve o status dos pagamentos (pagos, pendentes, atrasados).',
        steps: [
          'Acesse o Dashboard',
          'Veja o card "Receita do Mes" no topo',
          'Clique no grafico para detalhes por periodo',
          'Para mais detalhes, acesse o modulo Financeiro',
        ],
        link: '/dashboard',
        linkLabel: 'Ver receita',
      },
      {
        id: 'dashboard_metrics',
        label: 'Metricas de alunos',
        keywords: ['metricas alunos', 'quantos alunos', 'alunos ativos', 'novos alunos'],
        response: 'O Dashboard mostra o total de alunos ativos, novos cadastros do mes e a distribuicao por nivel e modalidade.',
        link: '/dashboard',
        linkLabel: 'Ver metricas',
      },
    ],
  },

  // ── 2. ALUNOS ──
  {
    id: 'alunos',
    name: 'Alunos',
    path: '/alunos',
    icon: 'faUsers',
    description: 'Gestao completa de alunos: cadastro, edicao, busca e filtros.',
    keywords: {
      primary: ['alunos', 'aluno', 'estudantes', 'estudante', 'cadastrar aluno', 'lista de alunos'],
      secondary: ['cadastro', 'perfil', 'cpf', 'telefone', 'email aluno', 'nivel aluno', 'status aluno', 'ativo', 'inativo'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'alunos_cadastrar',
        label: 'Cadastrar novo aluno',
        keywords: ['cadastrar', 'novo aluno', 'adicionar aluno', 'criar aluno', 'registrar aluno'],
        response: 'Para cadastrar um novo aluno, acesse o modulo Alunos e clique no botao "Novo Aluno". Preencha os dados pessoais.',
        steps: [
          'Acesse "Alunos" no menu lateral',
          'Clique no botao "Novo Aluno" no canto superior direito',
          'Preencha nome completo, email, telefone e CPF',
          'Selecione o nivel do aluno',
          'Clique em "Salvar" para concluir',
        ],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_buscar',
        label: 'Buscar e filtrar alunos',
        keywords: ['buscar', 'pesquisar', 'filtrar', 'encontrar aluno', 'procurar'],
        response: 'Voce pode buscar alunos pelo nome usando a barra de pesquisa. Tambem pode filtrar por status (ativo, inativo) e por nivel.',
        steps: [
          'Acesse "Alunos" no menu lateral',
          'Use a barra de pesquisa para buscar por nome',
          'Use os filtros de status para ver apenas ativos ou inativos',
          'Use o filtro de nivel para filtrar por habilidade',
        ],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_editar',
        label: 'Editar dados do aluno',
        keywords: ['editar aluno', 'alterar', 'modificar', 'atualizar dados', 'mudar'],
        response: 'Para editar um aluno, clique no nome dele na lista ou no icone de edicao. Voce pode alterar todos os dados pessoais, nivel e status.',
        steps: [
          'Acesse "Alunos" no menu lateral',
          'Encontre o aluno (use a busca se necessario)',
          'Clique no nome ou no icone de lapis',
          'Altere os dados desejados',
          'Clique em "Salvar"',
        ],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_detalhes',
        label: 'Ver detalhes de um aluno',
        keywords: ['detalhes', 'perfil aluno', 'informacoes', 'historico aluno'],
        response: 'Na pagina de detalhes do aluno voce encontra todas as informacoes: dados pessoais, matriculas ativas, historico de pagamentos e turmas vinculadas.',
        steps: [
          'Acesse "Alunos" no menu lateral',
          'Clique no nome do aluno na lista',
          'Veja as abas: Dados, Matriculas, Pagamentos, Turmas',
        ],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
    ],
  },

  // ── 3. ALUNOS EXPERIMENTAIS ──
  {
    id: 'alunos_experimentais',
    name: 'Alunos Experimentais',
    path: '/alunos-experimentais',
    icon: 'faUserClock',
    description: 'Gestao de alunos em aula experimental e conversao.',
    keywords: {
      primary: ['experimental', 'experimentais', 'aula experimental', 'aula teste', 'trial'],
      secondary: ['agendamento experimental', 'conversao', 'converter aluno', 'link agendamento', 'teste gratuito'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'trial_criar',
        label: 'Agendar aula experimental',
        keywords: ['agendar experimental', 'nova aula experimental', 'criar experimental', 'marcar experimental'],
        response: 'Para agendar uma aula experimental, acesse o modulo de Alunos Experimentais e cadastre o aluno com os dados basicos e a data da aula.',
        steps: [
          'Acesse "Alunos Experimentais" no menu lateral',
          'Clique em "Novo Aluno Experimental"',
          'Preencha nome, telefone e email',
          'Selecione a turma e data da aula',
          'Clique em "Salvar"',
        ],
        link: '/alunos-experimentais',
        linkLabel: 'Ir para Experimentais',
      },
      {
        id: 'trial_converter',
        label: 'Converter para aluno pago',
        keywords: ['converter', 'conversao', 'matricular experimental', 'tornar aluno'],
        response: 'Quando um aluno experimental decide continuar, voce pode converte-lo para aluno regular diretamente pela plataforma.',
        steps: [
          'Acesse "Alunos Experimentais"',
          'Encontre o aluno experimental',
          'Clique no botao "Converter"',
          'Preencha os dados da matricula (plano, turma)',
          'O aluno sera criado automaticamente em Alunos',
        ],
        link: '/alunos-experimentais',
        linkLabel: 'Ir para Experimentais',
      },
      {
        id: 'trial_link',
        label: 'Link publico de agendamento',
        keywords: ['link publico', 'link agendamento', 'compartilhar link', 'booking link'],
        response: 'Voce pode gerar um link publico para que interessados agendem aulas experimentais sozinhos, sem precisar entrar em contato diretamente.',
        steps: [
          'Acesse "Alunos Experimentais"',
          'Clique em "Link de Agendamento"',
          'Copie o link gerado',
          'Compartilhe via WhatsApp, redes sociais ou site',
        ],
        link: '/alunos-experimentais',
        linkLabel: 'Ir para Experimentais',
      },
    ],
  },

  // ── 4. TURMAS ──
  {
    id: 'turmas',
    name: 'Turmas',
    path: '/turmas',
    icon: 'faUserGroup',
    description: 'Gestao de turmas: criar, editar, horarios, capacidade e alunos.',
    keywords: {
      primary: ['turma', 'turmas', 'classe', 'classes', 'aula', 'aulas'],
      secondary: ['modalidade', 'capacidade', 'horario turma', 'criar turma', 'nova turma', 'alunos da turma'],
    },
    category: 'aulas_agenda',
    subTopics: [
      {
        id: 'turmas_criar',
        label: 'Criar nova turma',
        keywords: ['criar turma', 'nova turma', 'adicionar turma', 'cadastrar turma'],
        response: 'Para criar uma nova turma, defina o nome, modalidade, instrutor, horarios da semana e capacidade maxima.',
        steps: [
          'Acesse "Turmas" no menu lateral',
          'Clique em "Nova Turma"',
          'Defina nome, modalidade e instrutor',
          'Configure os dias e horarios da semana',
          'Defina a capacidade maxima',
          'Clique em "Salvar"',
        ],
        link: '/turmas',
        linkLabel: 'Ir para Turmas',
      },
      {
        id: 'turmas_alunos',
        label: 'Adicionar alunos a turma',
        keywords: ['adicionar aluno turma', 'vincular aluno', 'alunos turma', 'matricular turma'],
        response: 'Para adicionar alunos a uma turma, voce pode fazer pela matricula ou diretamente no card da turma.',
        steps: [
          'Acesse "Turmas" no menu lateral',
          'Encontre a turma desejada',
          'Clique em "Alunos" no card da turma',
          'Selecione os alunos para adicionar',
          'Confirme a adicao',
        ],
        link: '/turmas',
        linkLabel: 'Ir para Turmas',
      },
      {
        id: 'turmas_editar',
        label: 'Editar turma existente',
        keywords: ['editar turma', 'alterar turma', 'modificar turma', 'mudar horario'],
        response: 'Para editar uma turma, clique no icone de edicao no card dela. Voce pode alterar nome, horarios, instrutor e capacidade.',
        steps: [
          'Acesse "Turmas"',
          'Clique no icone de edicao na turma',
          'Altere os campos desejados',
          'Clique em "Salvar"',
        ],
        link: '/turmas',
        linkLabel: 'Ir para Turmas',
      },
    ],
  },

  // ── 5. MATRICULAS ──
  {
    id: 'matriculas',
    name: 'Matriculas',
    path: '/matriculas',
    icon: 'faClipboardList',
    description: 'Gestao de matriculas: vincular aluno a plano e turma.',
    keywords: {
      primary: ['matricula', 'matriculas', 'inscricao', 'inscricoes'],
      secondary: ['inscrever', 'vincular', 'plano aluno', 'desconto', 'vencimento', 'gerar fatura', 'cancelar matricula'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'matriculas_criar',
        label: 'Criar nova matricula',
        keywords: ['nova matricula', 'criar matricula', 'matricular aluno', 'inscrever aluno'],
        response: 'Para criar uma matricula, selecione o aluno, o plano e a(s) turma(s). Defina o dia de vencimento e desconto (se houver).',
        steps: [
          'Acesse "Matriculas" no menu lateral',
          'Clique em "Nova Matricula"',
          'Selecione o aluno',
          'Escolha o plano e a(s) turma(s)',
          'Defina dia de vencimento e desconto (opcional)',
          'Clique em "Salvar" - as faturas serao geradas automaticamente',
        ],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_desconto',
        label: 'Aplicar desconto',
        keywords: ['desconto', 'aplicar desconto', 'desconto matricula', 'porcentagem', 'valor fixo'],
        response: 'Ao criar ou editar uma matricula, voce pode aplicar um desconto fixo (em reais) ou percentual. O desconto sera aplicado em todas as faturas futuras.',
        steps: [
          'Acesse "Matriculas"',
          'Crie ou edite uma matricula',
          'No campo de desconto, escolha o tipo (fixo ou %)',
          'Informe o valor do desconto',
          'Salve a matricula',
        ],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_cancelar',
        label: 'Cancelar ou suspender matricula',
        keywords: ['cancelar matricula', 'suspender matricula', 'desativar', 'parar matricula'],
        response: 'Voce pode cancelar ou suspender uma matricula. A suspensao pausa temporariamente, enquanto o cancelamento encerra definitivamente.',
        steps: [
          'Acesse "Matriculas"',
          'Encontre a matricula desejada',
          'Clique no botao de opcoes',
          'Escolha "Suspender" ou "Cancelar"',
          'Confirme a acao',
        ],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
    ],
  },

  // ── 6. INSTRUTORES ──
  {
    id: 'instrutores',
    name: 'Instrutores',
    path: '/instrutores',
    icon: 'faChalkboardTeacher',
    description: 'Gestao de instrutores: cadastro, permissoes e turmas.',
    keywords: {
      primary: ['instrutor', 'instrutores', 'professor', 'professores', 'treinador'],
      secondary: ['convite instrutor', 'permissao', 'cadastrar professor', 'vincular instrutor', 'funcionario'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'instrutores_cadastrar',
        label: 'Cadastrar instrutor',
        keywords: ['cadastrar instrutor', 'novo instrutor', 'adicionar professor', 'convidar instrutor'],
        response: 'Para cadastrar um instrutor, envie um convite por email. Ele recebera um link para criar a conta e acessar o sistema com as permissoes definidas.',
        steps: [
          'Acesse "Instrutores" no menu lateral',
          'Clique em "Novo Instrutor"',
          'Informe o email do instrutor',
          'Defina as permissoes de acesso',
          'Envie o convite - ele recebera por email',
        ],
        link: '/instrutores',
        linkLabel: 'Ir para Instrutores',
      },
      {
        id: 'instrutores_permissoes',
        label: 'Configurar permissoes',
        keywords: ['permissao', 'permissoes', 'acesso instrutor', 'restringir acesso'],
        response: 'Voce pode configurar quais modulos cada instrutor pode acessar: alunos, turmas, financeiro, etc.',
        steps: [
          'Acesse "Instrutores"',
          'Clique no instrutor desejado',
          'Acesse a aba de "Permissoes"',
          'Marque/desmarque os modulos que ele pode acessar',
          'Salve as alteracoes',
        ],
        link: '/instrutores',
        linkLabel: 'Ir para Instrutores',
      },
    ],
  },

  // ── 7. AGENDA ──
  {
    id: 'agenda',
    name: 'Agenda',
    path: '/agenda',
    icon: 'faCalendarDays',
    description: 'Calendario semanal/mensal com aulas e locacoes.',
    keywords: {
      primary: ['agenda', 'calendario', 'horario', 'horarios', 'programacao', 'schedule'],
      secondary: ['semanal', 'mensal', 'dia', 'semana', 'hoje', 'amanha', 'aula hoje'],
    },
    category: 'aulas_agenda',
    subTopics: [
      {
        id: 'agenda_visualizar',
        label: 'Visualizar a agenda',
        keywords: ['ver agenda', 'consultar horarios', 'calendario semanal', 'calendario mensal'],
        response: 'A Agenda mostra todas as aulas e locacoes em formato de calendario. Alterne entre visao semanal e mensal, e filtre por turma, modalidade ou instrutor.',
        steps: [
          'Acesse "Agenda" no menu lateral',
          'Escolha a visualizacao: semanal ou mensal',
          'Use os filtros para ver aulas especificas',
          'Clique em um horario para ver detalhes',
        ],
        link: '/agenda',
        linkLabel: 'Ir para Agenda',
      },
      {
        id: 'agenda_filtros',
        label: 'Filtrar por turma ou instrutor',
        keywords: ['filtrar agenda', 'filtro turma', 'filtro instrutor', 'filtro modalidade'],
        response: 'Na Agenda voce pode filtrar por turma, modalidade ou instrutor para ver apenas os horarios relevantes.',
        steps: [
          'Acesse "Agenda"',
          'Clique nos filtros no topo',
          'Selecione a turma, modalidade ou instrutor',
          'A agenda atualizara automaticamente',
        ],
        link: '/agenda',
        linkLabel: 'Ir para Agenda',
      },
    ],
  },

  // ── 8. QUADRAS ──
  {
    id: 'quadras',
    name: 'Quadras',
    path: '/quadras',
    icon: 'faSquare',
    description: 'Gestao de quadras: precos, horarios e politicas.',
    keywords: {
      primary: ['quadra', 'quadras', 'espaco', 'espacos', 'court'],
      secondary: ['preco quadra', 'horario quadra', 'cancelamento', 'disponibilidade', 'funcionamento'],
    },
    category: 'quadras_locacoes',
    subTopics: [
      {
        id: 'quadras_criar',
        label: 'Cadastrar nova quadra',
        keywords: ['nova quadra', 'criar quadra', 'adicionar quadra', 'cadastrar quadra'],
        response: 'Para cadastrar uma quadra, defina o nome, preco padrao, horarios de funcionamento e politica de cancelamento.',
        steps: [
          'Acesse "Quadras" no menu lateral',
          'Clique em "Nova Quadra"',
          'Preencha nome e descricao',
          'Defina o preco padrao por hora',
          'Configure os horarios de funcionamento por dia da semana',
          'Defina a politica de cancelamento',
          'Clique em "Salvar"',
        ],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
      },
      {
        id: 'quadras_horarios',
        label: 'Configurar horarios',
        keywords: ['horario quadra', 'funcionamento', 'abrir quadra', 'fechar quadra', 'horario funcionamento'],
        response: 'Voce pode definir horarios de funcionamento diferentes para cada dia da semana em cada quadra.',
        steps: [
          'Acesse "Quadras"',
          'Clique em "Horarios" na quadra desejada',
          'Defina horario de inicio e fim para cada dia',
          'Desmarque os dias em que a quadra nao funciona',
          'Salve as alteracoes',
        ],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
      },
      {
        id: 'quadras_precos',
        label: 'Definir precos',
        keywords: ['preco', 'valor hora', 'custo quadra', 'tarifa'],
        response: 'O preco padrao da quadra e definido na criacao/edicao. Voce pode alterar o preco a qualquer momento.',
        steps: [
          'Acesse "Quadras"',
          'Clique em editar na quadra',
          'Altere o campo "Preco por hora"',
          'Salve as alteracoes',
        ],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
      },
    ],
  },

  // ── 9. LOCACOES ──
  {
    id: 'locacoes',
    name: 'Locacoes',
    path: '/locacoes',
    icon: 'faBaseballBall',
    description: 'Gestao de locacoes de quadra: reservas e pagamentos.',
    keywords: {
      primary: ['locacao', 'locacoes', 'reserva', 'reservas', 'alugar quadra', 'aluguel'],
      secondary: ['agendar quadra', 'horario livre', 'link reserva', 'booking', 'reservar'],
    },
    category: 'quadras_locacoes',
    subTopics: [
      {
        id: 'locacoes_criar',
        label: 'Criar nova locacao',
        keywords: ['nova locacao', 'criar reserva', 'agendar', 'reservar quadra', 'nova reserva'],
        response: 'Para criar uma locacao, selecione a quadra, o horario, o tipo (aluno ou convidado) e registre o pagamento.',
        steps: [
          'Acesse "Locacoes" no menu lateral',
          'Clique em "Nova Locacao"',
          'Selecione a quadra e o horario',
          'Escolha se e para um aluno ou convidado',
          'Preencha os dados do locatario',
          'Registre o pagamento e salve',
        ],
        link: '/locacoes',
        linkLabel: 'Ir para Locacoes',
      },
      {
        id: 'locacoes_link',
        label: 'Link publico de reserva',
        keywords: ['link reserva', 'link publico', 'compartilhar reserva', 'agendamento online'],
        response: 'Voce pode gerar um link publico para que clientes reservem quadras diretamente, escolhendo horario e fazendo pagamento.',
        steps: [
          'Acesse "Quadras"',
          'Ative a opcao "Reserva Publica" na quadra',
          'Copie o link de reserva gerado',
          'Compartilhe via WhatsApp ou redes sociais',
        ],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
      },
      {
        id: 'locacoes_agenda',
        label: 'Ver agenda de locacoes',
        keywords: ['agenda locacoes', 'ver reservas', 'horarios ocupados', 'calendario quadra'],
        response: 'Na agenda de locacoes voce ve todos os horarios reservados e disponiveis de cada quadra, facilitando o gerenciamento.',
        steps: [
          'Acesse "Locacoes"',
          'Clique na aba "Agenda"',
          'Filtre por quadra se necessario',
          'Veja os horarios ocupados e livres',
        ],
        link: '/locacoes/agenda',
        linkLabel: 'Ver agenda de locacoes',
      },
    ],
  },

  // ── 10. MENSALISTAS ──
  {
    id: 'mensalistas',
    name: 'Mensalistas',
    path: '/mensalistas',
    icon: 'faCalendarDays',
    description: 'Gestao de mensalistas: reservas recorrentes de quadra.',
    keywords: {
      primary: ['mensalista', 'mensalistas', 'mensal', 'recorrente'],
      secondary: ['reserva mensal', 'quadra fixa', 'horario fixo', 'plano mensal quadra'],
    },
    category: 'quadras_locacoes',
    subTopics: [
      {
        id: 'mensalistas_criar',
        label: 'Cadastrar mensalista',
        keywords: ['novo mensalista', 'criar mensalista', 'cadastrar mensalista'],
        response: 'Para cadastrar um mensalista, defina o cliente, a quadra, os dias e horarios fixos da semana e o valor mensal.',
        steps: [
          'Acesse "Mensalistas" no menu lateral',
          'Clique em "Novo Mensalista"',
          'Selecione o cliente e a quadra',
          'Defina os dias e horarios da semana',
          'Informe o valor mensal',
          'Salve o cadastro',
        ],
        link: '/mensalistas',
        linkLabel: 'Ir para Mensalistas',
      },
      {
        id: 'mensalistas_gerenciar',
        label: 'Gerenciar mensalistas',
        keywords: ['gerenciar mensalista', 'editar mensalista', 'cancelar mensalista'],
        response: 'Na lista de mensalistas voce pode editar horarios, alterar valores ou cancelar o plano de qualquer mensalista.',
        link: '/mensalistas',
        linkLabel: 'Ir para Mensalistas',
      },
    ],
  },

  // ── 11. FINANCEIRO ──
  {
    id: 'financeiro',
    name: 'Financeiro',
    path: '/financeiro',
    icon: 'faMoneyBillWave',
    description: 'Gestao de faturas, pagamentos, estornos e lembretes.',
    keywords: {
      primary: ['financeiro', 'financas', 'faturas', 'fatura', 'pagamento', 'pagamentos', 'cobranca'],
      secondary: ['inadimplente', 'inadimplencia', 'pagar', 'boleto', 'vencimento', 'estorno', 'receber', 'devendo'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'financeiro_faturas',
        label: 'Ver e gerenciar faturas',
        keywords: ['faturas', 'listar faturas', 'ver faturas', 'fatura do aluno'],
        response: 'No Financeiro voce visualiza todas as faturas. Filtre por status (paga, pendente, atrasada), mes, instrutor ou modalidade.',
        steps: [
          'Acesse "Financeiro" no menu lateral',
          'Use os filtros de status para ver faturas pendentes, pagas ou atrasadas',
          'Filtre por mes para um periodo especifico',
          'Clique em uma fatura para ver detalhes',
        ],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_registrar',
        label: 'Registrar pagamento',
        keywords: ['registrar pagamento', 'pagar fatura', 'marcar como pago', 'receber pagamento'],
        response: 'Para registrar um pagamento, encontre a fatura e clique no botao de pagamento. Escolha o metodo (pix, cartao, dinheiro, transferencia).',
        steps: [
          'Acesse "Financeiro"',
          'Encontre a fatura desejada',
          'Clique no icone de pagamento',
          'Selecione o metodo de pagamento',
          'Confirme o valor e a data',
          'Clique em "Confirmar"',
        ],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_inadimplentes',
        label: 'Ver inadimplentes',
        keywords: ['inadimplente', 'inadimplencia', 'atrasado', 'devendo', 'nao pagou'],
        response: 'Filtre as faturas por status "Atrasada" para ver os inadimplentes. Voce pode enviar lembretes via WhatsApp diretamente.',
        steps: [
          'Acesse "Financeiro"',
          'Selecione o filtro "Atrasada"',
          'Veja todas as faturas vencidas',
          'Use o botao WhatsApp para enviar lembretes',
        ],
        link: '/financeiro',
        linkLabel: 'Ver inadimplentes',
      },
      {
        id: 'financeiro_estorno',
        label: 'Fazer estorno',
        keywords: ['estorno', 'estornar', 'devolver', 'reembolso', 'cancelar pagamento'],
        response: 'Para estornar um pagamento, encontre a fatura paga e use a opcao de estorno. A fatura voltara ao status pendente.',
        steps: [
          'Acesse "Financeiro"',
          'Encontre a fatura paga',
          'Clique nas opcoes da fatura',
          'Selecione "Estornar"',
          'Confirme o estorno',
        ],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
    ],
  },

  // ── 12. PAGAMENTO APP ──
  {
    id: 'pagamentos_app',
    name: 'Pagamento App',
    path: '/pagamentos-app',
    icon: 'faMobileAlt',
    description: 'Pagamentos pelo aplicativo mobile.',
    keywords: {
      primary: ['pagamento app', 'pagamento aplicativo', 'pagar pelo app', 'app pagamento'],
      secondary: ['gateway', 'cartao credito app', 'pix app', 'pagamento online'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'pagamento_app_config',
        label: 'Configurar pagamento no app',
        keywords: ['configurar pagamento', 'ativar pagamento app', 'setup pagamento'],
        response: 'O modulo de Pagamento App permite que seus alunos paguem diretamente pelo aplicativo mobile, facilitando a cobranca.',
        steps: [
          'Acesse "Pagamento App" no menu lateral',
          'Configure os metodos de pagamento aceitos',
          'Ative o pagamento pelo app',
        ],
        link: '/pagamentos-app',
        linkLabel: 'Ir para Pagamento App',
      },
    ],
  },

  // ── 13. RELATORIOS ──
  {
    id: 'relatorios',
    name: 'Relatorios',
    path: '/relatorios',
    icon: 'faChartBar',
    description: 'Relatorios de matriculas, financeiro e churn.',
    keywords: {
      primary: ['relatorio', 'relatorios', 'report', 'estatisticas', 'analise'],
      secondary: ['exportar', 'graficos', 'churn', 'inadimplencia relatorio', 'tendencia', 'evolucao'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'relatorios_financeiro',
        label: 'Relatorio financeiro',
        keywords: ['relatorio financeiro', 'receita mensal', 'faturamento mensal', 'relatorio receita'],
        response: 'O relatorio financeiro mostra a receita por mes, por plano e por modalidade, com graficos de tendencia e exportacao.',
        steps: [
          'Acesse "Relatorios" no menu lateral',
          'Selecione a aba "Financeiro"',
          'Escolha o periodo desejado',
          'Veja os graficos e tabelas',
          'Exporte se necessario',
        ],
        link: '/relatorios',
        linkLabel: 'Ir para Relatorios',
      },
      {
        id: 'relatorios_matriculas',
        label: 'Relatorio de matriculas',
        keywords: ['relatorio matriculas', 'evolucao alunos', 'novas matriculas', 'cancelamentos'],
        response: 'O relatorio de matriculas mostra a evolucao de novas inscricoes vs cancelamentos por mes, ajudando a identificar tendencias.',
        steps: [
          'Acesse "Relatorios"',
          'Selecione a aba "Matriculas"',
          'Analise os graficos de evolucao',
          'Compare meses e identifique tendencias',
        ],
        link: '/relatorios',
        linkLabel: 'Ir para Relatorios',
      },
      {
        id: 'relatorios_inadimplencia',
        label: 'Relatorio de inadimplencia',
        keywords: ['relatorio inadimplencia', 'devedores', 'atrasos', 'cobranca relatorio'],
        response: 'O relatorio de inadimplencia mostra todos os alunos com pagamentos atrasados, valores e tempo de atraso.',
        link: '/relatorios',
        linkLabel: 'Ver relatorio',
      },
    ],
  },

  // ── 14. NIVEIS ──
  {
    id: 'niveis',
    name: 'Niveis',
    path: '/niveis',
    icon: 'faLayerGroup',
    description: 'Definicao de niveis de habilidade com cores.',
    keywords: {
      primary: ['nivel', 'niveis', 'habilidade', 'classificacao'],
      secondary: ['iniciante', 'intermediario', 'avancado', 'cor nivel', 'nivel personalizado'],
    },
    category: 'aulas_agenda',
    subTopics: [
      {
        id: 'niveis_criar',
        label: 'Criar novo nivel',
        keywords: ['criar nivel', 'novo nivel', 'adicionar nivel'],
        response: 'Voce pode criar niveis personalizados com nome e cor para classificar seus alunos por habilidade.',
        steps: [
          'Acesse "Niveis" no menu lateral',
          'Clique em "Novo Nivel"',
          'Defina o nome (ex: Iniciante, Avancado)',
          'Escolha uma cor para identificacao visual',
          'Clique em "Salvar"',
        ],
        link: '/niveis',
        linkLabel: 'Ir para Niveis',
      },
      {
        id: 'niveis_usar',
        label: 'Como usar niveis',
        keywords: ['usar nivel', 'para que serve', 'nivel aluno', 'aplicar nivel'],
        response: 'Os niveis sao usados para classificar alunos por habilidade. Eles aparecem nos filtros de alunos, turmas e relatorios.',
        link: '/niveis',
        linkLabel: 'Ir para Niveis',
      },
    ],
  },

  // ── 15. PLANOS ──
  {
    id: 'planos',
    name: 'Planos',
    path: '/planos',
    icon: 'faTags',
    description: 'Gestao de planos de assinatura e precos.',
    keywords: {
      primary: ['plano', 'planos', 'assinatura', 'mensalidade', 'pacote'],
      secondary: ['preco plano', 'valor mensal', 'criar plano', 'ajustar preco', 'reajuste'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'planos_criar',
        label: 'Criar novo plano',
        keywords: ['criar plano', 'novo plano', 'adicionar plano'],
        response: 'Para criar um plano, defina o nome, modalidade, valor mensal e limite de turmas permitidas.',
        steps: [
          'Acesse "Planos" no menu lateral',
          'Clique em "Novo Plano"',
          'Preencha nome e descricao',
          'Selecione a modalidade',
          'Defina o valor mensal',
          'Configure o limite de turmas',
          'Clique em "Salvar"',
        ],
        link: '/planos',
        linkLabel: 'Ir para Planos',
      },
      {
        id: 'planos_ajuste',
        label: 'Ajuste de precos em lote',
        keywords: ['ajustar preco', 'reajuste', 'aumentar preco', 'preco em lote', 'reajustar'],
        response: 'Voce pode ajustar precos de varios planos de uma vez usando a ferramenta de ajuste em lote.',
        steps: [
          'Acesse "Planos"',
          'Clique em "Ajuste em Lote"',
          'Selecione os planos que deseja ajustar',
          'Defina o percentual ou valor do reajuste',
          'Confirme o ajuste',
        ],
        link: '/planos',
        linkLabel: 'Ir para Planos',
      },
    ],
  },

  // ── 16. AVISOS ──
  {
    id: 'avisos',
    name: 'Avisos',
    path: '/avisos',
    icon: 'faBullhorn',
    description: 'Sistema de avisos e comunicados para alunos.',
    keywords: {
      primary: ['aviso', 'avisos', 'comunicado', 'comunicados', 'anuncio'],
      secondary: ['notificar', 'informar alunos', 'urgente', 'evento', 'publicar', 'notificacao'],
    },
    category: 'comunicacao',
    subTopics: [
      {
        id: 'avisos_criar',
        label: 'Criar aviso',
        keywords: ['criar aviso', 'novo aviso', 'enviar aviso', 'publicar aviso'],
        response: 'Para criar um aviso, defina o titulo, conteudo, tipo (info, alerta, urgente, evento) e o publico-alvo.',
        steps: [
          'Acesse "Avisos" no menu lateral',
          'Clique em "Novo Aviso"',
          'Preencha titulo e conteudo',
          'Selecione o tipo de aviso',
          'Escolha o publico-alvo (todos, por modalidade, nivel ou alunos especificos)',
          'Defina as datas de inicio e expiracao',
          'Clique em "Publicar"',
        ],
        link: '/avisos',
        linkLabel: 'Ir para Avisos',
      },
      {
        id: 'avisos_publico',
        label: 'Segmentar publico-alvo',
        keywords: ['publico alvo', 'segmentar', 'alunos especificos', 'por modalidade', 'por nivel'],
        response: 'Ao criar um aviso, voce pode escolher quem recebera: todos os alunos, por modalidade, por nivel ou selecionar alunos especificos.',
        link: '/avisos',
        linkLabel: 'Ir para Avisos',
      },
    ],
  },

  // ── 17. FORMULARIOS ──
  {
    id: 'formularios',
    name: 'Formularios',
    path: '/formularios',
    icon: 'faClipboardCheck',
    description: 'Pesquisas e formularios para feedback dos alunos.',
    keywords: {
      primary: ['formulario', 'formularios', 'pesquisa', 'enquete', 'survey'],
      secondary: ['pergunta', 'resposta', 'feedback', 'opiniao', 'questionario'],
    },
    category: 'comunicacao',
    subTopics: [
      {
        id: 'formularios_criar',
        label: 'Criar formulario',
        keywords: ['criar formulario', 'nova pesquisa', 'novo formulario', 'criar enquete'],
        response: 'Para criar um formulario, defina as perguntas (multipla escolha, texto livre, etc.), o publico-alvo e o periodo de ativacao.',
        steps: [
          'Acesse "Formularios" no menu lateral',
          'Clique em "Novo Formulario"',
          'Adicione as perguntas e tipos de resposta',
          'Escolha o publico-alvo',
          'Defina datas de inicio e expiracao',
          'Publique o formulario',
        ],
        link: '/formularios',
        linkLabel: 'Ir para Formularios',
      },
      {
        id: 'formularios_respostas',
        label: 'Ver respostas',
        keywords: ['ver respostas', 'respostas formulario', 'resultados pesquisa', 'analisar respostas'],
        response: 'Para ver as respostas de um formulario, acesse o formulario e clique em "Respostas". Voce vera as respostas agrupadas por pergunta.',
        link: '/formularios',
        linkLabel: 'Ir para Formularios',
      },
    ],
  },

  // ── 18. IA ──
  {
    id: 'ia',
    name: 'IA',
    path: '/ia',
    icon: 'faBrain',
    description: 'Sugestoes inteligentes geradas por IA (premium).',
    keywords: {
      primary: ['ia', 'inteligencia artificial', 'sugestoes ia', 'ai', 'inteligencia'],
      secondary: ['sugestao', 'recomendacao', 'automatico', 'smart', 'analise ia'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'ia_sugestoes',
        label: 'Ver sugestoes da IA',
        keywords: ['sugestoes', 'recomendacoes', 'insights', 'sugestoes automaticas'],
        response: 'O modulo de IA analisa seus dados e gera sugestoes automaticas para melhorar seu negocio: alunos em risco de churn, oportunidades de receita, etc. Este e um recurso premium.',
        steps: [
          'Acesse "IA" no menu lateral',
          'Veja as sugestoes geradas automaticamente',
          'Clique em uma sugestao para ver detalhes',
          'Siga as recomendacoes sugeridas',
        ],
        link: '/ia',
        linkLabel: 'Ir para IA',
      },
      {
        id: 'ia_config',
        label: 'Configurar IA',
        keywords: ['configurar ia', 'settings ia', 'ajustar ia'],
        response: 'Nas configuracoes da IA voce pode personalizar quais tipos de sugestoes deseja receber e a frequencia das analises.',
        link: '/ia/configuracoes',
        linkLabel: 'Configuracoes de IA',
      },
    ],
  },

  // ── 19. WHATSAPP ──
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    path: '/whatsapp',
    icon: 'faWhatsapp',
    description: 'Integracao WhatsApp Business: templates e automacoes (premium).',
    keywords: {
      primary: ['whatsapp', 'zap', 'zapzap', 'wpp', 'mensagem whatsapp'],
      secondary: ['template', 'automacao', 'enviar mensagem', 'configurar whatsapp', 'mensagem automatica'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'whatsapp_config',
        label: 'Configurar WhatsApp',
        keywords: ['configurar whatsapp', 'conectar whatsapp', 'setup whatsapp', 'ativar whatsapp'],
        response: 'Para usar o WhatsApp integrado, voce precisa configurar sua conta WhatsApp Business na plataforma. Este e um recurso premium.',
        steps: [
          'Acesse "WhatsApp" no menu lateral',
          'Clique em "Configuracao"',
          'Siga as instrucoes para conectar sua conta',
          'Teste o envio de mensagens',
        ],
        link: '/whatsapp/config',
        linkLabel: 'Configurar WhatsApp',
      },
      {
        id: 'whatsapp_templates',
        label: 'Criar templates de mensagem',
        keywords: ['template', 'modelo mensagem', 'criar template', 'mensagem padrao'],
        response: 'Templates permitem criar mensagens padronizadas para enviar rapidamente (cobranças, avisos, boas-vindas, etc.).',
        steps: [
          'Acesse "WhatsApp" > "Templates"',
          'Clique em "Novo Template"',
          'Defina o nome e conteudo da mensagem',
          'Use variaveis como {nome}, {valor}, {data}',
          'Salve o template',
        ],
        link: '/whatsapp/templates',
        linkLabel: 'Ir para Templates',
      },
      {
        id: 'whatsapp_automacao',
        label: 'Automacoes',
        keywords: ['automacao', 'mensagem automatica', 'automatizar', 'regra automatica'],
        response: 'As automacoes enviam mensagens automaticamente em situacoes definidas: lembrete de pagamento, boas-vindas, aniversario, etc.',
        steps: [
          'Acesse "WhatsApp" > "Automacao"',
          'Clique em "Nova Automacao"',
          'Defina o gatilho (evento que dispara a mensagem)',
          'Selecione o template da mensagem',
          'Ative a automacao',
        ],
        link: '/whatsapp/automation',
        linkLabel: 'Ir para Automacoes',
      },
    ],
  },

  // ── 20. CHAT IA ──
  {
    id: 'chat_ia',
    name: 'Chat IA',
    path: '/chat',
    icon: 'faRobot',
    description: 'Chat com assistente IA para duvidas do negocio (premium).',
    keywords: {
      primary: ['chat ia', 'chat inteligencia', 'assistente ia', 'chatgpt', 'claude'],
      secondary: ['conversar com ia', 'perguntar ia', 'chat bot ia', 'conversa inteligente'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'chat_ia_usar',
        label: 'Como usar o Chat IA',
        keywords: ['usar chat ia', 'conversar ia', 'fazer pergunta ia'],
        response: 'O Chat IA permite conversar com um assistente inteligente que conhece seus dados e pode responder duvidas sobre seu negocio. Este e um recurso premium.',
        steps: [
          'Acesse "Chat IA" no menu lateral',
          'Digite sua pergunta na caixa de mensagem',
          'A IA respondera com base nos dados do seu negocio',
          'Voce pode continuar a conversa com perguntas de acompanhamento',
        ],
        link: '/chat',
        linkLabel: 'Ir para Chat IA',
      },
    ],
  },

  // ── 21. ARENAS ──
  {
    id: 'arenas',
    name: 'Arenas',
    path: '/arenas',
    icon: 'faBuilding',
    description: 'Gestao de multiplas unidades/arenas.',
    keywords: {
      primary: ['arena', 'arenas', 'unidade', 'unidades', 'filial', 'filiais'],
      secondary: ['multi unidade', 'outra arena', 'trocar arena', 'nova unidade', 'localizacao'],
    },
    category: 'admin',
    subTopics: [
      {
        id: 'arenas_criar',
        label: 'Criar nova arena',
        keywords: ['nova arena', 'criar arena', 'adicionar unidade', 'nova filial'],
        response: 'Para criar uma nova arena/unidade, acesse o modulo Arenas (disponivel para gestores e admins).',
        steps: [
          'Acesse "Arenas" no menu lateral',
          'Clique em "Nova Arena"',
          'Preencha nome e endereco',
          'Configure as informacoes da unidade',
          'Salve a arena',
        ],
        link: '/arenas',
        linkLabel: 'Ir para Arenas',
      },
      {
        id: 'arenas_trocar',
        label: 'Trocar de arena ativa',
        keywords: ['trocar arena', 'mudar arena', 'selecionar arena', 'alternar unidade'],
        response: 'Para trocar a arena ativa e ver os dados de outra unidade, use o seletor de arena no topo da pagina ou no modulo Arenas.',
        link: '/arenas',
        linkLabel: 'Ir para Arenas',
      },
      {
        id: 'arenas_metricas',
        label: 'Metricas por arena',
        keywords: ['metricas arena', 'dashboard arena', 'receita arena', 'alunos arena'],
        response: 'No modulo Arenas voce ve metricas individuais de cada unidade: alunos, turmas, receita e evolucao historica.',
        link: '/arenas',
        linkLabel: 'Ver metricas',
      },
    ],
  },

  // ── 22. MEU PLANO ──
  {
    id: 'meu_plano',
    name: 'Meu Plano',
    path: '/meu-plano',
    icon: 'faCrown',
    description: 'Assinatura da plataforma: upgrades e cobrancas.',
    keywords: {
      primary: ['meu plano', 'assinatura plataforma', 'upgrade', 'premium', 'plano gerenciai'],
      secondary: ['contratar', 'addon', 'mudar plano', 'cancelar plano', 'cobrado', 'fatura plataforma'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'plano_ver',
        label: 'Ver meu plano atual',
        keywords: ['ver plano', 'plano atual', 'qual meu plano', 'status plano'],
        response: 'Em "Meu Plano" voce ve qual plano esta contratado, os recursos incluidos, addons ativos e o historico de cobranças.',
        steps: [
          'Acesse "Meu Plano" no menu lateral',
          'Veja seu plano atual no topo',
          'Confira os addons ativos',
          'Veja o historico de cobranças',
        ],
        link: '/meu-plano',
        linkLabel: 'Ir para Meu Plano',
      },
      {
        id: 'plano_upgrade',
        label: 'Fazer upgrade',
        keywords: ['upgrade', 'melhorar plano', 'contratar premium', 'mudar plano'],
        response: 'Para fazer upgrade do seu plano, acesse "Meu Plano" e veja as opcoes disponiveis. O upgrade libera recursos premium como IA, WhatsApp e Chat IA.',
        link: '/meu-plano',
        linkLabel: 'Ver opcoes de plano',
      },
    ],
  },

  // ── 23. PREFERENCIAS ──
  {
    id: 'preferencias',
    name: 'Preferencias',
    path: '/preferencias',
    icon: 'faCog',
    description: 'Configuracoes do usuario: tema, notificacoes.',
    keywords: {
      primary: ['preferencias', 'configuracoes', 'configurar', 'ajustes', 'settings'],
      secondary: ['tema', 'dark mode', 'modo escuro', 'notificacao', 'aparencia', 'modo claro'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'pref_tema',
        label: 'Alterar tema (claro/escuro)',
        keywords: ['tema', 'dark mode', 'modo escuro', 'modo claro', 'aparencia', 'trocar tema'],
        response: 'Voce pode alternar entre modo claro e escuro nas Preferencias. A mudanca e aplicada imediatamente em todo o sistema.',
        steps: [
          'Acesse "Preferencias" no menu lateral',
          'Encontre a opcao de tema',
          'Clique para alternar entre Claro e Escuro',
          'O tema sera aplicado imediatamente',
        ],
        link: '/preferencias',
        linkLabel: 'Ir para Preferencias',
      },
      {
        id: 'pref_notificacoes',
        label: 'Configurar notificacoes',
        keywords: ['notificacao', 'notificacoes', 'alertas', 'avisar'],
        response: 'Nas Preferencias voce pode configurar quais notificacoes deseja receber e como deseja ser avisado.',
        link: '/preferencias',
        linkLabel: 'Ir para Preferencias',
      },
    ],
  },

  // ── 24. ADMIN MONITORING ──
  {
    id: 'admin_monitoring',
    name: 'Gerenciador',
    path: '/admin/monitoring',
    icon: 'faGauge',
    description: 'Painel admin: saude do sistema e atividade (somente admin).',
    keywords: {
      primary: ['admin', 'monitoramento', 'monitoring', 'administracao', 'gerenciador'],
      secondary: ['saude sistema', 'atividade', 'usuarios ativos', 'painel admin'],
    },
    category: 'admin',
    subTopics: [
      {
        id: 'admin_overview',
        label: 'Visao geral do gerenciador',
        keywords: ['painel admin', 'visao geral admin', 'monitorar sistema'],
        response: 'O Gerenciador e um painel exclusivo para administradores. Nele voce monitora a saude do sistema, atividade de usuarios e gestores cadastrados.',
        link: '/admin/monitoring',
        linkLabel: 'Ir para Gerenciador',
      },
    ],
  },

  // ── 25. MIGRACAO ──
  {
    id: 'migracao',
    name: 'Migracao',
    path: '/migracao',
    icon: 'faDatabase',
    description: 'Ferramentas de migracao de dados de outros sistemas.',
    keywords: {
      primary: ['migracao', 'migrar', 'importar dados', 'migration'],
      secondary: ['importar', 'exportar', 'outro sistema', 'planilha', 'transferir dados'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'migracao_usar',
        label: 'Migrar dados',
        keywords: ['migrar', 'importar dados', 'trazer dados', 'migrar sistema'],
        response: 'O modulo de Migracao permite importar dados de outros sistemas para o GerenciAi, facilitando a transicao.',
        steps: [
          'Acesse "Migracao" no menu lateral',
          'Selecione o tipo de dado a importar',
          'Faca o upload da planilha ou arquivo',
          'Verifique o mapeamento dos campos',
          'Confirme a importacao',
        ],
        link: '/migracao',
        linkLabel: 'Ir para Migracao',
      },
    ],
  },
];

// ===== Helpers =====
export function getModuleById(id: string): LaraModule | undefined {
  return LARA_MODULES.find(m => m.id === id);
}

export function getModulesByCategory(category: LaraCategory): LaraModule[] {
  return LARA_MODULES.filter(m => m.category === category);
}

export function getCategoryInfo(category: LaraCategory): LaraCategoryInfo | undefined {
  return LARA_CATEGORIES.find(c => c.id === category);
}
