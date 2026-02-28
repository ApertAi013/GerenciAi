import type { LaraModule, LaraCategoryInfo, LaraCategory } from '../types/laraTypes';

// ===== Categorias =====
export const LARA_CATEGORIES: LaraCategoryInfo[] = [
  { id: 'gestao_alunos', label: 'Gestao de Alunos', icon: 'faUsers', description: 'Alunos, experimentais, matriculas e instrutores' },
  { id: 'aulas_agenda', label: 'Aulas e Agenda', icon: 'faCalendarDays', description: 'Turmas, agenda, niveis e creditos' },
  { id: 'financeiro', label: 'Financeiro', icon: 'faMoneyBillWave', description: 'Faturas, planos, relatorios e pagamentos' },
  { id: 'quadras_locacoes', label: 'Quadras e Locacoes', icon: 'faSquare', description: 'Quadras, locacoes e mensalistas' },
  { id: 'comunicacao', label: 'Comunicacao', icon: 'faBullhorn', description: 'Avisos e formularios' },
  { id: 'configuracoes', label: 'Configuracoes', icon: 'faCog', description: 'Preferencias, plano, app e migracao' },
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
        steps: ['Acesse "Inicio" no menu lateral', 'Veja os cards de KPIs no topo (receita, alunos, turmas)', 'Acompanhe os graficos de faturamento mensal', 'Confira os avisos e alertas na parte inferior'],
        link: '/dashboard',
        linkLabel: 'Ir para o Dashboard',
      },
      {
        id: 'dashboard_revenue',
        label: 'Acompanhar receita',
        keywords: ['receita', 'faturamento', 'quanto ganhei', 'ganhos', 'lucro'],
        response: 'No Dashboard voce acompanha a receita mensal, compara com meses anteriores e ve o status dos pagamentos (pagos, pendentes, atrasados).',
        steps: ['Acesse o Dashboard', 'Veja o card "Receita do Mes" no topo', 'Clique no grafico para detalhes por periodo', 'Para mais detalhes, acesse o modulo Financeiro'],
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
        response: 'Para cadastrar um novo aluno, acesse o modulo Alunos e clique em "Novo Aluno". Preencha nome, email, telefone, CPF e nivel.',
        steps: ['Acesse "Alunos" no menu lateral', 'Clique em "Novo Aluno" no canto superior direito', 'Preencha nome completo, email, telefone e CPF', 'Selecione o nivel do aluno', 'Clique em "Salvar"'],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_buscar',
        label: 'Buscar e filtrar alunos',
        keywords: ['buscar', 'pesquisar', 'filtrar', 'encontrar aluno', 'procurar'],
        response: 'Voce pode buscar alunos pelo nome usando a barra de pesquisa. Tambem pode filtrar por status (ativo, inativo) e por nivel.',
        steps: ['Acesse "Alunos" no menu lateral', 'Use a barra de pesquisa para buscar por nome', 'Use os filtros de status (ativo/inativo)', 'Use o filtro de nivel para filtrar por habilidade'],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_detalhes',
        label: 'Detalhes de um aluno',
        keywords: ['detalhes', 'perfil aluno', 'informacoes', 'historico aluno', 'ficha'],
        response: 'Ao clicar no nome de um aluno, voce acessa o perfil completo: dados pessoais, matriculas ativas, historico financeiro, turmas vinculadas e creditos de reposicao.',
        steps: ['Acesse "Alunos"', 'Clique no nome do aluno na lista', 'Navegue pelas abas: Dados, Matriculas, Pagamentos, Turmas', 'Veja os creditos de reposicao e historico completo'],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
      {
        id: 'alunos_creditos',
        label: 'Creditos de reposicao e app',
        keywords: ['credito', 'creditos', 'reposicao', 'makeup', 'remarcar', 'repor aula', 'aplicativo aluno', 'app aluno', 'senha app'],
        response: 'Cada aluno pode ter creditos de reposicao para remarcar aulas. Creditos sao ganhos automaticamente ao cancelar aula com 8h+ de antecedencia, ou podem ser adicionados manualmente. Os alunos usam o aplicativo mobile para ver seus creditos, remarcar aulas e ate pagar faturas!',
        steps: ['Acesse o perfil do aluno (clique no nome)', 'Veja a secao "Creditos de Reposicao"', 'Adicione ou remova creditos manualmente', 'Defina a senha do app do aluno para ele acessar o aplicativo', 'No app, o aluno usa creditos para remarcar aulas em horarios disponiveis'],
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
    description: 'Gestao completa de aulas experimentais: agendamento, links personalizados, conversao e metricas.',
    keywords: {
      primary: ['experimental', 'experimentais', 'aula experimental', 'aula teste', 'trial', 'aula gratis'],
      secondary: ['agendamento experimental', 'conversao', 'converter aluno', 'link agendamento', 'teste gratuito', 'prospect', 'lead'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'trial_como_funciona',
        label: 'Como funciona o sistema',
        keywords: ['como funciona experimental', 'processo experimental', 'fluxo experimental'],
        response: 'O sistema de aulas experimentais funciona em 4 etapas: 1) Voce compartilha um link de agendamento, 2) O interessado escolhe a turma, data e preenche seus dados, 3) Voce recebe uma notificacao do novo agendamento, 4) Apos a aula, voce pode converter o aluno experimental em aluno regular com matricula completa.',
        steps: ['Acesse "Alunos Experimentais" no menu', 'Configure quais turmas aceitam aulas experimentais (secao Configuracao)', 'Compartilhe o link de agendamento via WhatsApp ou redes sociais', 'Acompanhe os agendamentos na mini-agenda', 'Converta os interessados em alunos regulares'],
        link: '/alunos-experimentais',
        linkLabel: 'Ir para Experimentais',
      },
      {
        id: 'trial_config_turmas',
        label: 'Configurar turmas para experimental',
        keywords: ['configurar turma experimental', 'habilitar turma', 'turma experimental', 'overbooking', 'vagas experimental'],
        response: 'Voce pode configurar individualmente quais turmas aceitam aulas experimentais. Para cada turma, defina se permite overbooking e o maximo de experimentais por dia (1 a 5).',
        steps: ['Acesse "Alunos Experimentais"', 'Abra a secao "Configuracao de Turmas"', 'Ative o toggle de cada turma que deve aceitar experimentais', 'Configure "Overbooking" para permitir mais alunos que a capacidade', 'Defina o "Max/dia" (maximo de experimentais por dia naquela turma)'],
        link: '/alunos-experimentais',
        linkLabel: 'Configurar turmas',
      },
      {
        id: 'trial_links',
        label: 'Links de agendamento (global e personalizados)',
        keywords: ['link experimental', 'link personalizado', 'link agendamento', 'compartilhar link', 'link custom', 'link modalidade'],
        response: 'Voce tem dois tipos de links: o Link Global (mostra todas as turmas habilitadas) e Links Personalizados (mostram apenas turmas especificas, ideal para separar por modalidade). Cada link pode exibir ou ocultar os precos dos planos!',
        steps: ['Acesse "Alunos Experimentais"', 'Clique em "Compartilhar Link" para copiar o link global', 'Para criar links personalizados, abra a secao "Links Personalizados"', 'Clique em "Criar Link Personalizado"', 'Escolha um nome (ex: "Link Beach Tennis"), selecione as turmas', 'Ative "Exibir precos" se quiser mostrar os valores dos planos', 'Copie e compartilhe o link via WhatsApp ou redes sociais'],
        link: '/alunos-experimentais',
        linkLabel: 'Gerenciar links',
      },
      {
        id: 'trial_precos',
        label: 'Exibir precos nos links',
        keywords: ['precos experimental', 'mostrar precos', 'valores no link', 'planos no link'],
        response: 'Voce pode exibir os precos dos seus planos diretamente nos links de agendamento! Ha uma configuracao global e uma por link personalizado. Escolha quais planos exibir em cada link.',
        steps: ['Acesse "Alunos Experimentais"', 'Na secao "Visibilidade de Precos", ative o toggle master', 'Marque quais planos devem ter preco exibido no link global', 'Para links personalizados, edite o link e configure os precos individualmente'],
        link: '/alunos-experimentais',
        linkLabel: 'Configurar precos',
      },
      {
        id: 'trial_criar',
        label: 'Cadastrar experimental manualmente',
        keywords: ['cadastrar experimental', 'novo experimental', 'criar experimental', 'marcar experimental'],
        response: 'Alem dos agendamentos pelo link publico, voce pode cadastrar alunos experimentais manualmente. Informe nome, telefone, email, nivel e periodo de retencao (30, 60, 90 dias ou ilimitado).',
        steps: ['Acesse "Alunos Experimentais"', 'Clique em "Novo Aluno Experimental"', 'Preencha nome (obrigatorio), telefone e email', 'Selecione o nivel e periodo de retencao', 'Adicione observacoes se desejar', 'Clique em "Criar"'],
        link: '/alunos-experimentais',
        linkLabel: 'Novo experimental',
      },
      {
        id: 'trial_converter',
        label: 'Converter para aluno regular',
        keywords: ['converter', 'conversao', 'matricular experimental', 'tornar aluno', 'upgrade experimental'],
        response: 'A conversao transforma o experimental em aluno regular com matricula completa! E um processo de 4 etapas: dados pessoais (adicionar CPF), escolha do plano, selecao de turmas e revisao final. A matricula e a primeira fatura sao geradas automaticamente.',
        steps: ['Encontre o aluno experimental na lista', 'Clique no botao de conversao (icone de check)', 'Etapa 1: Adicione CPF, data de nascimento e sexo', 'Etapa 2: Escolha o plano e defina data de inicio e dia de vencimento', 'Etapa 3: Selecione as turmas conforme o plano', 'Etapa 4: Revise tudo e clique em "Confirmar Conversao"', 'A matricula sera criada e o aluno sai da lista de experimentais'],
        link: '/alunos-experimentais',
        linkLabel: 'Ir para Experimentais',
      },
      {
        id: 'trial_metricas',
        label: 'Metricas e acompanhamento',
        keywords: ['metricas experimental', 'taxa conversao', 'dashboard experimental', 'acompanhar experimental'],
        response: 'O modulo mostra 5 metricas importantes: alunos ativos, conversoes realizadas, taxa de conversao (%), media de dias ate a conversao e receita gerada pelas conversoes. Tambem tem uma mini-agenda com os agendamentos dos proximos 7 dias.',
        link: '/alunos-experimentais',
        linkLabel: 'Ver metricas',
      },
      {
        id: 'trial_followup',
        label: 'Follow-ups e notificacoes',
        keywords: ['followup', 'follow-up', 'lembrete experimental', 'email experimental', 'notificar experimental'],
        response: 'Voce pode enviar follow-ups por email ou WhatsApp para alunos experimentais que ainda nao converteram. Use o botao de email/WhatsApp na lista para enviar lembretes individuais.',
        steps: ['Na lista de experimentais, encontre o aluno', 'Clique no icone de email/WhatsApp', 'O sistema envia um lembrete para o aluno', 'Acompanhe os follow-ups enviados nos detalhes do aluno'],
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
        response: 'Para criar uma turma, defina nome, modalidade, instrutor, horarios da semana, capacidade e cor de identificacao.',
        steps: ['Acesse "Turmas" no menu lateral', 'Clique em "Nova Turma"', 'Defina nome, modalidade e instrutor', 'Configure dias e horarios da semana', 'Defina a capacidade maxima', 'Escolha uma cor de identificacao', 'Clique em "Salvar"'],
        link: '/turmas',
        linkLabel: 'Ir para Turmas',
      },
      {
        id: 'turmas_alunos',
        label: 'Ver e gerenciar alunos da turma',
        keywords: ['alunos turma', 'vincular aluno', 'ver alunos', 'quem esta na turma'],
        response: 'No card de cada turma voce ve a barra de ocupacao e pode expandir para ver todos os alunos matriculados. Alunos sao vinculados automaticamente pela matricula.',
        steps: ['Acesse "Turmas"', 'Encontre a turma desejada', 'Clique em "Alunos" no card', 'Veja a lista de alunos matriculados', 'A barra de ocupacao mostra vagas usadas/total'],
        link: '/turmas',
        linkLabel: 'Ir para Turmas',
      },
      {
        id: 'turmas_editar',
        label: 'Editar turma',
        keywords: ['editar turma', 'alterar turma', 'mudar horario turma'],
        response: 'Para editar uma turma, clique no icone de edicao no card dela. Voce pode alterar nome, horarios, instrutor e capacidade.',
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
    description: 'Gestao de matriculas: vincular aluno a plano e turma, descontos e faturas.',
    keywords: {
      primary: ['matricula', 'matriculas', 'inscricao', 'inscricoes'],
      secondary: ['inscrever', 'vincular', 'plano aluno', 'desconto', 'vencimento', 'gerar fatura', 'cancelar matricula', 'suspender'],
    },
    category: 'gestao_alunos',
    subTopics: [
      {
        id: 'matriculas_como_funciona',
        label: 'Como funciona a matricula',
        keywords: ['como funciona matricula', 'processo matricula', 'criar matricula'],
        response: 'A matricula conecta 3 coisas: Aluno + Plano + Turma(s). Voce escolhe o aluno, seleciona um plano (que define o preco e modalidade), depois escolhe as turmas conforme o numero de aulas/semana do plano. Ao salvar, a primeira fatura pode ser gerada automaticamente!',
        steps: ['Acesse "Matriculas" no menu lateral', 'Clique em "Nova Matricula"', 'Busque e selecione o aluno (por nome, CPF ou email)', 'Escolha o plano - ele define preco e quantas turmas o aluno pode ter', 'Selecione as turmas no calendario visual (filtradas pela modalidade do plano)', 'Defina o dia de vencimento (1 a 28) e descontos se houver', 'Escolha se o aluno vai pagar agora ou gerar fatura para depois', 'Clique em "Salvar"'],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_plano_turma',
        label: 'Relacao entre plano e turmas',
        keywords: ['plano turma', 'quantas turmas', 'aulas semana', 'sessoes semana', 'escolher turma'],
        response: 'Cada plano define quantas aulas por semana o aluno tem direito (ex: "2x por semana"). Na hora de criar a matricula, voce deve selecionar exatamente esse numero de turmas. Se o plano tem modalidade definida, so turmas dessa modalidade aparecem. O plano tambem pode filtrar turmas pelo nivel do aluno.',
        steps: ['Crie o plano em "Planos" com o numero de aulas/semana', 'Na matricula, ao selecionar o plano, o sistema mostra quantas turmas escolher', 'Selecione as turmas no calendario visual', 'Use o filtro "Apenas com vagas" para ver so turmas disponiveis', 'O contador mostra "X/Y selecionada(s)" para ajudar'],
        link: '/matriculas',
        linkLabel: 'Criar matricula',
      },
      {
        id: 'matriculas_desconto',
        label: 'Aplicar descontos',
        keywords: ['desconto', 'aplicar desconto', 'desconto matricula', 'porcentagem', 'valor fixo', 'desconto temporario'],
        response: 'Ao criar ou editar uma matricula, voce pode aplicar um desconto fixo (em R$) ou percentual (%). O desconto pode ter data de validade - apos essa data, o valor volta ao normal automaticamente.',
        steps: ['Na criacao ou edicao da matricula, ative "Aplicar Desconto"', 'Escolha o tipo: Porcentagem (%) ou Valor Fixo (R$)', 'Informe o valor do desconto', 'Opcionalmente, defina "Valido ate" para desconto temporario', 'Salve - o desconto sera aplicado nas faturas'],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_fatura',
        label: 'Geracao de faturas',
        keywords: ['gerar fatura', 'primeira fatura', 'fatura proporcional', 'fatura cheia', 'pagar agora'],
        response: 'Ao criar a matricula, voce escolhe: "Vai pagar agora?" (registra pagamento imediato), ou gerar a primeira fatura com 3 opcoes: Fatura Cheia (valor total, vence hoje), Fatura Proporcional (calcula os dias ate o vencimento) ou Pular (gera na proxima geracao mensal).',
        steps: ['Ao criar a matricula, veja a opcao "Vai pagar agora?"', 'Se sim: o pagamento e registrado na hora com metodo de pagamento', 'Se nao: escolha entre Fatura Cheia, Proporcional ou Pular', 'Fatura Cheia: valor integral do plano, vence hoje', 'Proporcional: calcula o valor dos dias restantes ate o proximo vencimento', 'Pular: a fatura sera gerada no fechamento mensal'],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_cancelar',
        label: 'Cancelar, suspender ou reativar',
        keywords: ['cancelar matricula', 'suspender matricula', 'reativar', 'parar matricula', 'desativar'],
        response: 'Voce pode suspender (pausa temporaria), cancelar (encerra definitivamente) ou reativar uma matricula. Ao cancelar, pode optar por cancelar as faturas em aberto tambem. Ao reativar, o sistema verifica se as turmas ainda tem vagas e oferece opcao de gerar nova fatura.',
        steps: ['Encontre a matricula na lista', 'Clique no icone de edicao', 'Altere o status para Suspensa ou Cancelada', 'Ao cancelar: escolha se quer cancelar faturas em aberto', 'Para reativar: o sistema verifica vagas nas turmas originais', 'Se nao houver vagas, voce pode selecionar novas turmas', 'Escolha quando gerar a proxima fatura (agora, no vencimento ou proximo mes)'],
        link: '/matriculas',
        linkLabel: 'Ir para Matriculas',
      },
      {
        id: 'matriculas_editar_plano',
        label: 'Trocar plano de uma matricula',
        keywords: ['trocar plano', 'mudar plano', 'alterar plano matricula', 'upgrade plano'],
        response: 'Voce pode trocar o plano de uma matricula existente! Ao mudar, o sistema pergunta se quer atualizar as faturas em aberto com o novo valor. As turmas podem precisar ser reajustadas se o plano novo tiver mais ou menos aulas/semana.',
        steps: ['Edite a matricula', 'Altere o plano no dropdown', 'Confirme se deseja atualizar faturas em aberto com novo valor', 'Reajuste as turmas se necessario', 'Salve as alteracoes'],
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
        keywords: ['cadastrar instrutor', 'novo instrutor', 'adicionar professor', 'convidar'],
        response: 'Para cadastrar um instrutor, envie um convite por email. Ele recebera um link para criar a conta e acessar o sistema com as permissoes que voce definir.',
        steps: ['Acesse "Instrutores"', 'Clique em "Novo Instrutor"', 'Informe o email', 'Defina as permissoes de acesso', 'Envie o convite'],
        link: '/instrutores',
        linkLabel: 'Ir para Instrutores',
      },
      {
        id: 'instrutores_permissoes',
        label: 'Configurar permissoes',
        keywords: ['permissao', 'permissoes', 'acesso instrutor', 'restringir'],
        response: 'Voce define quais modulos cada instrutor pode acessar: alunos, turmas, financeiro, etc. O instrutor so vera os menus permitidos.',
        steps: ['Acesse "Instrutores"', 'Clique no instrutor', 'Acesse "Permissoes"', 'Marque/desmarque os modulos', 'Salve'],
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
    description: 'Calendario visual com aulas, locacoes, reposicoes e arrastar-e-soltar.',
    keywords: {
      primary: ['agenda', 'calendario', 'horario', 'horarios', 'programacao', 'schedule'],
      secondary: ['semanal', 'mensal', 'dia', 'semana', 'hoje', 'amanha', 'aula hoje', 'arrastar'],
    },
    category: 'aulas_agenda',
    subTopics: [
      {
        id: 'agenda_visualizar',
        label: 'Visualizar a agenda',
        keywords: ['ver agenda', 'consultar horarios', 'calendario semanal', 'calendario mensal', 'visao dia'],
        response: 'A Agenda mostra todas as aulas e locacoes em formato de calendario. Voce pode alternar entre 3 visualizacoes: Semana (padrao), Mes e Dia. Filtre por turma, modalidade, nivel ou instrutor.',
        steps: ['Acesse "Agenda" no menu lateral', 'Escolha a visualizacao: semana, mes ou dia', 'Use os filtros no topo para ver aulas especificas', 'Clique em um horario para ver detalhes dos alunos'],
        link: '/agenda',
        linkLabel: 'Ir para Agenda',
      },
      {
        id: 'agenda_arrastar',
        label: 'Arrastar turmas e alunos',
        keywords: ['arrastar', 'mover turma', 'drag drop', 'reorganizar', 'trocar horario'],
        response: 'Na Agenda voce pode arrastar turmas para outros horarios e ate arrastar alunos de uma turma para outra! Isso facilita reorganizar a grade sem editar cada turma.',
        steps: ['Na visao Semana, clique e segure uma turma', 'Arraste para o novo horario desejado', 'Para mover um aluno: arraste o card do aluno para outra turma', 'O sistema verifica se a turma destino tem vagas'],
        link: '/agenda',
        linkLabel: 'Ir para Agenda',
      },
      {
        id: 'agenda_reposicao',
        label: 'Aulas de reposicao e experimentais',
        keywords: ['reposicao', 'aula reposicao', 'makeup', 'experimental agenda'],
        response: 'Na agenda, aulas de reposicao e experimentais sao identificadas com badges especiais ao lado do nome do aluno. Assim voce sabe quem esta fazendo reposicao e quem e experimental.',
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
        response: 'Para cadastrar uma quadra, defina nome, preco padrao por hora, horarios de funcionamento por dia da semana e politica de cancelamento.',
        steps: ['Acesse "Quadras"', 'Clique em "Nova Quadra"', 'Preencha nome e descricao', 'Defina o preco por hora', 'Configure horarios por dia da semana', 'Defina politica de cancelamento', 'Salve'],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
      },
      {
        id: 'quadras_horarios',
        label: 'Configurar horarios',
        keywords: ['horario quadra', 'funcionamento', 'abrir fechar', 'horario funcionamento'],
        response: 'Defina horarios de funcionamento diferentes para cada dia da semana.',
        steps: ['Acesse "Quadras"', 'Clique em "Horarios" na quadra desejada', 'Defina inicio e fim para cada dia', 'Desmarque dias em que nao funciona', 'Salve'],
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
    description: 'Gestao de locacoes de quadra: reservas, pagamentos e links.',
    keywords: {
      primary: ['locacao', 'locacoes', 'reserva', 'reservas', 'alugar quadra', 'aluguel'],
      secondary: ['agendar quadra', 'horario livre', 'link reserva', 'booking', 'reservar'],
    },
    category: 'quadras_locacoes',
    subTopics: [
      {
        id: 'locacoes_criar',
        label: 'Criar nova locacao',
        keywords: ['nova locacao', 'criar reserva', 'agendar', 'reservar quadra'],
        response: 'Selecione a quadra, horario, tipo (aluno ou convidado) e registre o pagamento.',
        steps: ['Acesse "Locacoes"', 'Clique em "Nova Locacao"', 'Selecione quadra e horario', 'Escolha aluno ou convidado', 'Preencha os dados e pagamento', 'Salve'],
        link: '/locacoes',
        linkLabel: 'Ir para Locacoes',
      },
      {
        id: 'locacoes_link',
        label: 'Link publico de reserva',
        keywords: ['link reserva', 'link publico', 'agendamento online'],
        response: 'Gere um link publico para que clientes reservem quadras sozinhos, escolhendo horario e pagando online.',
        steps: ['Acesse "Quadras"', 'Ative "Reserva Publica" na quadra', 'Copie o link gerado', 'Compartilhe via WhatsApp ou redes sociais'],
        link: '/quadras',
        linkLabel: 'Ir para Quadras',
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
        response: 'Para um mensalista, defina o cliente, a quadra, os dias e horarios fixos e o valor mensal.',
        steps: ['Acesse "Mensalistas"', 'Clique em "Novo Mensalista"', 'Selecione cliente e quadra', 'Defina dias e horarios', 'Informe o valor mensal', 'Salve'],
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
    description: 'Gestao completa de faturas, pagamentos, estornos, colunas personalizaveis e exportacao.',
    keywords: {
      primary: ['financeiro', 'financas', 'faturas', 'fatura', 'pagamento', 'pagamentos', 'cobranca'],
      secondary: ['inadimplente', 'inadimplencia', 'pagar', 'boleto', 'vencimento', 'estorno', 'receber', 'devendo', 'dinheiro'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'financeiro_faturas',
        label: 'Ver e filtrar faturas',
        keywords: ['faturas', 'listar faturas', 'ver faturas', 'filtrar faturas'],
        response: 'No Financeiro voce visualiza todas as faturas com filtros poderosos: status (aberta, paga, vencida, cancelada, estornada), mes, instrutor, modalidade e nivel. Use a busca para encontrar por nome do aluno.',
        steps: ['Acesse "Financeiro" no menu lateral', 'Use os filtros de status no topo', 'Filtre por mes usando as setas ou dropdown', 'Use filtros avancados: instrutor, modalidade, nivel', 'Busque por nome do aluno na barra de pesquisa'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_colunas',
        label: 'Personalizar colunas da tabela',
        keywords: ['colunas', 'personalizar colunas', 'mostrar colunas', 'ocultar colunas', 'tabela financeiro'],
        response: 'Voce pode escolher quais colunas aparecem na tabela financeira! Clique em "Colunas" e marque/desmarque: ID, Aluno, Telefone, Plano, Nivel, Referencia, Vencimento, Valor, Pago, Data Pagamento, Forma Pgto, Status e Acoes. Sua escolha fica salva para as proximas vezes.',
        steps: ['No Financeiro, clique no botao "Colunas"', 'Marque as colunas que deseja ver', 'Desmarque as que deseja ocultar', 'Sua configuracao e salva automaticamente', 'Na proxima vez que acessar, as colunas estarao como voce deixou'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_registrar',
        label: 'Registrar pagamento',
        keywords: ['registrar pagamento', 'pagar fatura', 'marcar como pago', 'receber pagamento'],
        response: 'Para registrar um pagamento, clique no status da fatura ou no botao de pagamento. Escolha o metodo: PIX, Cartao, Dinheiro, Boleto ou Outro. Informe a data e o valor pago.',
        steps: ['Encontre a fatura na lista', 'Clique no status "Aberta/Vencida" ou no botao de pagamento', 'Selecione o metodo (PIX, Cartao, Dinheiro, Boleto, Outro)', 'Confirme a data e o valor', 'Clique em "Confirmar Pagamento"'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_inadimplentes',
        label: 'Ver inadimplentes e cobrar',
        keywords: ['inadimplente', 'inadimplencia', 'atrasado', 'devendo', 'nao pagou', 'cobrar'],
        response: 'Filtre por "Vencidas" para ver os inadimplentes. Voce pode enviar cobranças via WhatsApp diretamente pela tabela! O sistema usa templates de mensagem personalizaveis com nome, valor e data.',
        steps: ['Acesse "Financeiro"', 'Clique no filtro "Vencidas"', 'Veja todas as faturas atrasadas com valores', 'Clique no icone do WhatsApp ao lado da fatura', 'Escolha o template de cobrança', 'A mensagem sera aberta no WhatsApp com dados preenchidos'],
        link: '/financeiro',
        linkLabel: 'Ver inadimplentes',
      },
      {
        id: 'financeiro_estorno',
        label: 'Estorno e cancelamento de pagamento',
        keywords: ['estorno', 'estornar', 'devolver', 'reembolso', 'cancelar pagamento', 'desfazer pagamento'],
        response: 'Ha duas opcoes: "Cancelar Recebimento" (desfaz o pagamento, fatura volta a aberta/vencida) ou "Estornar" (registra o estorno com motivo, fatura fica como estornada). O estorno nao pode ser desfeito!',
        steps: ['Encontre a fatura paga na lista', 'Clique no valor pago ou no botao de editar pagamento', 'Para desfazer: clique em "Cancelar Recebimento"', 'Para estornar: clique em "Estornar", informe o motivo', 'Confirme a acao'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_editar_vencimento',
        label: 'Alterar vencimento de fatura',
        keywords: ['alterar vencimento', 'mudar data', 'editar vencimento', 'data vencimento'],
        response: 'Voce pode alterar a data de vencimento de faturas abertas ou vencidas clicando diretamente na data na tabela.',
        steps: ['Encontre a fatura (status Aberta ou Vencida)', 'Clique na data de vencimento na tabela', 'Escolha a nova data no calendario', 'Salve a alteracao'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_editar_nivel',
        label: 'Alterar nivel do aluno pela fatura',
        keywords: ['nivel fatura', 'mudar nivel', 'alterar nivel'],
        response: 'Voce pode alterar o nivel de um aluno diretamente pela tabela financeira, clicando no badge de nivel.',
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_exportar',
        label: 'Exportar para Excel',
        keywords: ['exportar', 'excel', 'csv', 'planilha', 'download financeiro'],
        response: 'Exporte todas as faturas filtradas para Excel (CSV)! O arquivo inclui todas as colunas, totais e um resumo financeiro com total bruto, descontos, recebido, a vencer e inadimplente.',
        steps: ['Aplique os filtros desejados (mes, status, etc.)', 'Clique no botao "Exportar Excel"', 'O arquivo CSV sera baixado automaticamente', 'Abra no Excel, Google Sheets ou similar'],
        link: '/financeiro',
        linkLabel: 'Ir para Financeiro',
      },
      {
        id: 'financeiro_gerar_faturas',
        label: 'Gerar faturas do mes',
        keywords: ['gerar faturas', 'fechamento', 'faturas do mes', 'criar faturas'],
        response: 'O botao "Gerar Faturas do Mes" cria faturas para todas as matriculas ativas de uma vez, para o mes selecionado. Ideal para o fechamento mensal!',
        steps: ['Acesse "Financeiro"', 'Selecione o mes desejado', 'Clique em "Gerar Faturas do Mes"', 'Confirme a geracao', 'Todas as matriculas ativas terao faturas criadas'],
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
    description: 'Pagamentos pelo aplicativo: PIX, cartao, taxas e cobrancas para alunos.',
    keywords: {
      primary: ['pagamento app', 'pagamento aplicativo', 'pagar pelo app', 'app pagamento'],
      secondary: ['pix', 'cartao credito', 'gateway', 'cobranca app', 'taxa', 'aplicativo aluno'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'app_como_funciona',
        label: 'Como funciona o pagamento pelo app',
        keywords: ['como funciona app', 'pagamento app aluno', 'aluno paga pelo app'],
        response: 'Seus alunos podem pagar faturas diretamente pelo aplicativo mobile via PIX ou cartao de credito! Voce configura sua chave PIX, define as taxas e o escopo (quais alunos tem acesso), depois gera as cobrancas mensais. O dinheiro vai direto para sua conta apos descontar as taxas da plataforma.',
        steps: ['Acesse "Pagamento App" no menu lateral', 'Aba "Configuracao PIX": cadastre sua chave PIX', 'Aba "Taxas e Termos": entenda e aceite as taxas', 'Aba "Escopo": defina quais alunos tem acesso (todos, turmas especificas ou alunos especificos)', 'Aba "Cobrancas": gere as cobrancas mensais para os alunos'],
        link: '/pagamentos-app',
        linkLabel: 'Configurar App',
      },
      {
        id: 'app_pix',
        label: 'Configurar PIX',
        keywords: ['configurar pix', 'chave pix', 'pix academia', 'conta pix'],
        response: 'Cadastre sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatoria) para receber os pagamentos dos alunos. Voce tambem pode habilitar pagamento por cartao de credito, escolhendo se absorve a taxa ou repassa ao aluno.',
        steps: ['Acesse "Pagamento App" > "Configuracao PIX"', 'Selecione o tipo da chave (CPF, CNPJ, Email, Telefone ou Aleatoria)', 'Informe a chave PIX', 'Opcionalmente, informe o nome do titular', 'Habilite cartao de credito se desejar', 'Salve a configuracao'],
        link: '/pagamentos-app',
        linkLabel: 'Configurar PIX',
      },
      {
        id: 'app_taxas',
        label: 'Entender as taxas',
        keywords: ['taxa app', 'quanto custa', 'taxa pix', 'taxa cartao', 'custo app'],
        response: 'Existem duas taxas: a do gateway de pagamento (ASAAS) e a da plataforma (GerenciAi). Na aba "Taxas e Termos" voce ve o percentual exato de cada uma, com exemplos de quanto receberia por cada pagamento. Voce precisa aceitar os termos antes de ativar.',
        link: '/pagamentos-app',
        linkLabel: 'Ver taxas',
      },
      {
        id: 'app_escopo',
        label: 'Definir quais alunos usam o app',
        keywords: ['escopo app', 'quais alunos', 'habilitar alunos', 'acesso app'],
        response: 'Voce define quem pode pagar pelo app: todos os alunos, apenas alunos de turmas especificas, ou alunos selecionados individualmente.',
        steps: ['Acesse "Pagamento App" > "Escopo"', 'Escolha: "Todos os alunos", "Turmas especificas" ou "Alunos especificos"', 'Se turmas: marque as turmas desejadas', 'Se alunos: busque e selecione cada um', 'Salve a configuracao'],
        link: '/pagamentos-app',
        linkLabel: 'Configurar escopo',
      },
      {
        id: 'app_cobrancas',
        label: 'Gerar cobrancas mensais',
        keywords: ['gerar cobranca', 'cobranca mensal', 'cobrar pelo app'],
        response: 'Na aba "Cobrancas", selecione o mes e clique em "Gerar Cobrancas". O sistema cria cobrancas para todos os alunos do escopo. Acompanhe o status de pagamento e repasse de cada cobranca.',
        steps: ['Acesse "Pagamento App" > "Cobrancas"', 'Selecione o mes de referencia', 'Clique em "Gerar Cobrancas do Mes"', 'Acompanhe os status: Pendente, Confirmado, Vencido, Estornado', 'Clique no icone de olho para ver detalhes (QR Code PIX, taxas, valor liquido)'],
        link: '/pagamentos-app',
        linkLabel: 'Gerar cobrancas',
      },
      {
        id: 'app_aluno',
        label: 'O que o aluno ve no app',
        keywords: ['app do aluno', 'aplicativo aluno', 'aluno aplicativo', 'baixar app', 'senha app', 'app mobile'],
        response: 'Seus alunos podem baixar o aplicativo mobile! Nele, eles veem suas faturas, pagam via PIX ou cartao, consultam creditos de reposicao e remarcam aulas. Para o aluno acessar, voce precisa definir a senha dele no perfil do aluno.',
        steps: ['Va ao perfil do aluno (Alunos > clique no nome)', 'Na secao de creditos, clique em "Definir Senha do App"', 'Informe a senha que o aluno usara para login', 'O aluno baixa o app e faz login com email/telefone + senha', 'No app ele pode: ver faturas, pagar, ver creditos e remarcar aulas'],
        link: '/alunos',
        linkLabel: 'Ir para Alunos',
      },
    ],
  },

  // ── 13. RELATORIOS ──
  {
    id: 'relatorios',
    name: 'Relatorios',
    path: '/relatorios',
    icon: 'faChartBar',
    description: 'Relatorios completos: financeiro, matriculas, inadimplencia, churn e curva de pagamento.',
    keywords: {
      primary: ['relatorio', 'relatorios', 'report', 'estatisticas', 'analise'],
      secondary: ['exportar', 'graficos', 'churn', 'inadimplencia relatorio', 'tendencia', 'evolucao'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'relatorios_financeiro',
        label: 'Relatorio financeiro',
        keywords: ['relatorio financeiro', 'receita mensal', 'faturamento mensal', 'faturado recebido'],
        response: 'O relatorio financeiro mostra graficos de barras comparando Faturado (esperado) vs Recebido (efetivo) por mes. Tambem mostra o Ticket Medio (valor medio por fatura) como grafico de linha. Filtre por periodo e modalidade.',
        steps: ['Acesse "Relatorios"', 'Veja os KPIs no topo: Recebido, Faturado, Inadimplentes, Ativos', 'Analise o grafico Faturado vs Recebido', 'Veja a evolucao do Ticket Medio', 'Use os filtros de periodo (mes atual, 3m, 6m, 12m ou personalizado)'],
        link: '/relatorios',
        linkLabel: 'Ir para Relatorios',
      },
      {
        id: 'relatorios_matriculas',
        label: 'Relatorio de matriculas e churn',
        keywords: ['relatorio matriculas', 'evolucao alunos', 'novas matriculas', 'cancelamentos', 'churn', 'retencao'],
        response: 'Veja a evolucao de novas matriculas vs cancelamentos por mes, o total de clientes ativos ao longo do tempo e a taxa de churn (cancelamento) mensal. Clique nos KPIs de "Novas" e "Canceladas" para ver a lista detalhada com opcao de contato via WhatsApp.',
        steps: ['Acesse "Relatorios"', 'Veja os KPIs "Novas" e "Canceladas" - clique neles para ver a lista', 'Analise o grafico "Clientes Ativos" (evolucao mensal)', 'Veja a "Taxa de Churn" para identificar tendencias', 'Use WhatsApp para contatar alunos que cancelaram'],
        link: '/relatorios',
        linkLabel: 'Ir para Relatorios',
      },
      {
        id: 'relatorios_inadimplencia',
        label: 'Relatorio de inadimplencia',
        keywords: ['relatorio inadimplencia', 'devedores', 'atrasos', 'taxa inadimplencia'],
        response: 'O relatorio de inadimplencia mostra: numero de alunos inadimplentes, quantidade de faturas vencidas, valor total em atraso e a taxa de inadimplencia com barra visual de progresso.',
        link: '/relatorios',
        linkLabel: 'Ver relatorio',
      },
      {
        id: 'relatorios_curva',
        label: 'Curva de pagamento',
        keywords: ['curva pagamento', 'curva recebimento', 'quando pagam', 'velocidade pagamento'],
        response: 'A Curva de Recebimento mostra como os pagamentos se acumulam ao longo do mes. Compare ate 3 meses lado a lado para entender o padrao de pagamento dos seus alunos (ex: a maioria paga ate o dia 10?).',
        steps: ['Acesse "Relatorios"', 'Role ate "Curva de Recebimento"', 'Veja o grafico de linha mostrando acumulado por dia do mes', 'Compare com meses anteriores para identificar padroes'],
        link: '/relatorios',
        linkLabel: 'Ver curva',
      },
      {
        id: 'relatorios_planos_modalidades',
        label: 'Planos mais vendidos e modalidades',
        keywords: ['planos vendidos', 'modalidade popular', 'distribuicao planos', 'pizza planos'],
        response: 'Graficos de rosca (donut) mostram os planos mais vendidos e a distribuicao de matriculas por modalidade, com porcentagem e contagem de cada um.',
        link: '/relatorios',
        linkLabel: 'Ver distribuicao',
      },
      {
        id: 'relatorios_filtros',
        label: 'Filtros de periodo',
        keywords: ['filtrar relatorio', 'periodo relatorio', 'data relatorio', 'personalizar periodo'],
        response: 'Filtre todos os relatorios por periodo: mes atual, mes anterior, 3 meses, 6 meses (padrao), 12 meses ou periodo personalizado. Tambem pode filtrar por modalidade especifica.',
        link: '/relatorios',
        linkLabel: 'Ir para Relatorios',
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
      secondary: ['iniciante', 'intermediario', 'avancado', 'cor nivel'],
    },
    category: 'aulas_agenda',
    subTopics: [
      {
        id: 'niveis_criar',
        label: 'Criar e gerenciar niveis',
        keywords: ['criar nivel', 'novo nivel', 'adicionar nivel', 'gerenciar niveis'],
        response: 'Crie niveis personalizados com nome e cor para classificar alunos. Niveis aparecem nos filtros de alunos, turmas, financeiro e relatorios.',
        steps: ['Acesse "Niveis"', 'Clique em "Novo Nivel"', 'Defina nome e cor', 'Salve. O nivel estara disponivel em todo o sistema'],
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
    description: 'Gestao de planos: precos, modalidades, aulas/semana e reajuste em lote.',
    keywords: {
      primary: ['plano', 'planos', 'assinatura', 'mensalidade', 'pacote'],
      secondary: ['preco plano', 'valor mensal', 'criar plano', 'ajustar preco', 'reajuste', 'aulas semana'],
    },
    category: 'financeiro',
    subTopics: [
      {
        id: 'planos_criar',
        label: 'Criar plano',
        keywords: ['criar plano', 'novo plano', 'adicionar plano'],
        response: 'Para criar um plano, defina: nome, aulas por semana (quantas turmas o aluno tera), preco mensal e opcionalmente a modalidade. Se definir modalidade, so turmas dessa modalidade aparecerao na matricula.',
        steps: ['Acesse "Planos"', 'Clique em "Novo Plano"', 'Preencha nome (ex: "2x por semana")', 'Defina aulas/semana (ex: 2)', 'Informe o preco mensal', 'Selecione modalidade (opcional - filtra turmas na matricula)', 'Adicione descricao se desejar', 'Salve'],
        link: '/planos',
        linkLabel: 'Ir para Planos',
      },
      {
        id: 'planos_reajuste',
        label: 'Reajuste de precos em lote',
        keywords: ['reajuste', 'ajustar preco', 'aumentar preco', 'reajustar', 'preco lote', 'ajuste global'],
        response: 'O Reajuste Global permite aumentar ou diminuir precos de varios planos de uma vez! Escolha porcentagem ou valor fixo. Voce tambem pode optar por aplicar o novo valor nas faturas em aberto a partir de um mes especifico.',
        steps: ['Acesse "Planos"', 'Clique em "Reajuste Global"', 'Selecione os planos que deseja reajustar', 'Escolha o tipo: porcentagem (ex: +10%) ou valor fixo (ex: +R$20)', 'Veja o preview com precos antigos e novos', 'Opcionalmente, marque "Aplicar nas faturas em aberto"', 'Confirme o reajuste'],
        link: '/planos',
        linkLabel: 'Reajustar precos',
      },
      {
        id: 'planos_status',
        label: 'Ativar e desativar planos',
        keywords: ['ativar plano', 'desativar plano', 'plano inativo'],
        response: 'Planos podem ser ativados ou desativados. Planos inativos nao aparecem na criacao de matriculas, mas as matriculas existentes continuam normais.',
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
        response: 'Crie avisos com titulo, conteudo, tipo (info, alerta, urgente, evento) e publico-alvo (todos, por modalidade, nivel ou alunos especificos).',
        steps: ['Acesse "Avisos"', 'Clique em "Novo Aviso"', 'Preencha titulo e conteudo', 'Selecione o tipo', 'Escolha o publico-alvo', 'Defina datas de inicio e expiracao', 'Publique'],
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
        keywords: ['criar formulario', 'nova pesquisa', 'criar enquete'],
        response: 'Crie formularios com perguntas de multipla escolha, texto livre, etc. Defina publico-alvo e periodo de ativacao. Acompanhe as respostas em tempo real.',
        steps: ['Acesse "Formularios"', 'Clique em "Novo Formulario"', 'Adicione perguntas e tipos de resposta', 'Escolha o publico-alvo', 'Defina datas', 'Publique'],
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
      primary: ['ia', 'inteligencia artificial', 'sugestoes ia', 'ai'],
      secondary: ['sugestao', 'recomendacao', 'automatico', 'smart'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'ia_sugestoes',
        label: 'Sugestoes da IA',
        keywords: ['sugestoes', 'recomendacoes', 'insights'],
        response: 'O modulo de IA analisa seus dados e gera sugestoes para melhorar seu negocio: alunos em risco de churn, oportunidades de receita, etc. Recurso premium.',
        link: '/ia',
        linkLabel: 'Ir para IA',
      },
    ],
  },

  // ── 19. WHATSAPP ──
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    path: '/whatsapp',
    icon: 'faWhatsapp',
    description: 'Integracao WhatsApp: templates, automacoes e logs (premium).',
    keywords: {
      primary: ['whatsapp', 'zap', 'zapzap', 'wpp', 'mensagem whatsapp'],
      secondary: ['template', 'automacao', 'enviar mensagem', 'configurar whatsapp', 'mensagem automatica'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'whatsapp_templates',
        label: 'Templates de mensagem',
        keywords: ['template', 'modelo mensagem', 'criar template'],
        response: 'Crie templates com variaveis como {nome}, {valor}, {data} para enviar mensagens padronizadas rapidamente (cobrancas, avisos, boas-vindas).',
        steps: ['Acesse "WhatsApp" > "Templates"', 'Clique em "Novo Template"', 'Defina nome e conteudo', 'Use variaveis: {firstName}, {fullName}, {amount}, {dueDate}', 'Salve'],
        link: '/whatsapp/templates',
        linkLabel: 'Ir para Templates',
      },
      {
        id: 'whatsapp_automacao',
        label: 'Automacoes',
        keywords: ['automacao', 'mensagem automatica', 'automatizar'],
        response: 'Configure automacoes para enviar mensagens automaticamente: lembrete de pagamento, boas-vindas, aniversario, etc.',
        steps: ['Acesse "WhatsApp" > "Automacao"', 'Clique em "Nova Automacao"', 'Defina o gatilho', 'Selecione o template', 'Ative a automacao'],
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
      secondary: ['conversar com ia', 'perguntar ia'],
    },
    category: 'premium',
    subTopics: [
      {
        id: 'chat_ia_usar',
        label: 'Como usar o Chat IA',
        keywords: ['usar chat ia', 'conversar ia'],
        response: 'Converse com um assistente inteligente que conhece seus dados e responde duvidas sobre o negocio. Recurso premium.',
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
    description: 'Gestao de multiplas unidades com metricas comparativas e financeiras.',
    keywords: {
      primary: ['arena', 'arenas', 'unidade', 'unidades', 'filial', 'filiais'],
      secondary: ['multi unidade', 'outra arena', 'trocar arena', 'nova unidade', 'localizacao'],
    },
    category: 'admin',
    subTopics: [
      {
        id: 'arenas_como_funciona',
        label: 'Como funciona multi-arenas',
        keywords: ['como funciona arena', 'multi arena', 'varias unidades', 'multiplas unidades'],
        response: 'O sistema de Arenas permite gerenciar multiplas unidades/filiais de forma independente. Cada arena tem seus proprios alunos, turmas, quadras e dados financeiros. Voce pode alternar entre arenas e ver um dashboard comparativo com metricas de todas as unidades.',
        steps: ['Acesse "Arenas" no menu lateral (disponivel para gestores e admins)', 'Veja o dashboard comparativo no topo', 'Cada arena aparece como um card com contagem de alunos e turmas', 'Clique em "Acessar" para trocar para uma arena especifica', 'Todos os modulos passam a mostrar dados da arena selecionada'],
        link: '/arenas',
        linkLabel: 'Ir para Arenas',
      },
      {
        id: 'arenas_criar',
        label: 'Criar nova arena',
        keywords: ['nova arena', 'criar arena', 'adicionar unidade', 'nova filial'],
        response: 'Para criar uma nova arena, basta definir um nome e descricao. A arena comeca vazia e voce pode comecar a cadastrar alunos, turmas e quadras nela.',
        steps: ['Acesse "Arenas"', 'Clique em "Nova Arena"', 'Preencha nome e descricao', 'Salve', 'Clique em "Acessar" para comecar a usar a nova arena'],
        link: '/arenas',
        linkLabel: 'Criar arena',
      },
      {
        id: 'arenas_dashboard',
        label: 'Dashboard comparativo',
        keywords: ['dashboard arena', 'comparar arenas', 'metricas arena', 'receita arena'],
        response: 'O dashboard de Arenas mostra KPIs globais (alunos, matriculas ativas, faturado, recebido, inadimplencia) e uma tabela comparativa com cada arena. Graficos de barras mostram Faturado vs Recebido por arena e por mes. Filtre por periodo (mes atual, 3m, 6m, 12m ou personalizado) e por modalidade.',
        steps: ['Acesse "Arenas"', 'Veja os 5 KPIs globais no topo', 'Analise o grafico Faturado vs Recebido por arena', 'Veja a tabela comparativa com todas as metricas', 'Use os filtros de periodo e modalidade para refinar', 'A linha de total no final soma todas as arenas'],
        link: '/arenas',
        linkLabel: 'Ver dashboard',
      },
      {
        id: 'arenas_trocar',
        label: 'Trocar de arena ativa',
        keywords: ['trocar arena', 'mudar arena', 'selecionar arena', 'alternar'],
        response: 'Para trocar a arena ativa, clique em "Acessar" no card da arena desejada. O sistema recarrega e todos os modulos passam a mostrar dados da arena selecionada.',
        link: '/arenas',
        linkLabel: 'Ir para Arenas',
      },
    ],
  },

  // ── 22. MEU PLANO ──
  {
    id: 'meu_plano',
    name: 'Meu Plano',
    path: '/meu-plano',
    icon: 'faCrown',
    description: 'Assinatura da plataforma: upgrades, addons e cobrancas.',
    keywords: {
      primary: ['meu plano', 'assinatura plataforma', 'upgrade', 'premium', 'plano gerenciai'],
      secondary: ['contratar', 'addon', 'mudar plano', 'cancelar plano', 'fatura plataforma'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'plano_ver',
        label: 'Ver meu plano atual',
        keywords: ['ver plano', 'plano atual', 'qual meu plano'],
        response: 'Em "Meu Plano" voce ve o plano contratado, recursos incluidos, addons ativos e historico de cobrancas.',
        link: '/meu-plano',
        linkLabel: 'Ir para Meu Plano',
      },
      {
        id: 'plano_upgrade',
        label: 'Fazer upgrade',
        keywords: ['upgrade', 'melhorar plano', 'contratar premium'],
        response: 'Faca upgrade para liberar recursos premium como IA, WhatsApp e Chat IA.',
        link: '/meu-plano',
        linkLabel: 'Ver opcoes',
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
      primary: ['preferencias', 'configuracoes', 'ajustes', 'settings'],
      secondary: ['tema', 'dark mode', 'modo escuro', 'notificacao', 'aparencia'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'pref_tema',
        label: 'Alterar tema (claro/escuro)',
        keywords: ['tema', 'dark mode', 'modo escuro', 'modo claro', 'trocar tema'],
        response: 'Alterne entre modo claro e escuro nas Preferencias. A mudanca e aplicada imediatamente.',
        steps: ['Acesse "Preferencias"', 'Encontre a opcao de tema', 'Clique para alternar entre Claro e Escuro'],
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
      secondary: ['saude sistema', 'atividade', 'painel admin'],
    },
    category: 'admin',
    subTopics: [
      {
        id: 'admin_overview',
        label: 'Visao geral do gerenciador',
        keywords: ['painel admin', 'visao geral admin'],
        response: 'Painel exclusivo para administradores para monitorar saude do sistema e atividade de gestores.',
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
    description: 'Importar dados de outros sistemas.',
    keywords: {
      primary: ['migracao', 'migrar', 'importar dados', 'migration'],
      secondary: ['importar', 'exportar', 'outro sistema', 'planilha'],
    },
    category: 'configuracoes',
    subTopics: [
      {
        id: 'migracao_usar',
        label: 'Migrar dados',
        keywords: ['migrar', 'importar dados', 'trazer dados'],
        response: 'O modulo de Migracao permite importar dados de outros sistemas para o GerenciAi.',
        steps: ['Acesse "Migracao"', 'Selecione o tipo de dado', 'Faca upload do arquivo', 'Verifique o mapeamento', 'Confirme a importacao'],
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
