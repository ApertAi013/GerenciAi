# GerenciAi Frontend Web - CLAUDE.md

## REGRAS OBRIGATORIAS

### Versionamento
- **ANTES de qualquer commit, PERGUNTAR ao usuario qual versao sera (patch/minor/major)**
- Versao atual: verificar `package.json` > `version`
- Formato: semver (MAJOR.MINOR.PATCH)
- Criar tag git apos releases significativas

### Deploy
- Pipeline automatica: push em `main` com changes em `src/**`, `public/**`, `index.html`, `package.json`, `vite.config.ts`, `app.yaml`
- Deploy para Google App Engine (gerenciai-476500)
- URL: https://arenai.com.br
- NAO precisa de deploy manual, pipe faz tudo

### Commits
- Sempre em portugues sem acentos
- Formato: `tipo: descricao curta` (feat, fix, chore)
- Sempre incluir `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
- NUNCA commitar secrets ou API keys

## ARQUITETURA

- **Stack**: React 19 + TypeScript + Vite
- **UI**: Lucide React (icones) + CSS customizado + Recharts (graficos)
- **State**: Zustand (authStore, themeStore, quickEditStore)
- **Routing**: React Router 7
- **API**: Axios via `src/services/api.ts`

## REGRAS DE NEGOCIO NO FRONTEND

### Login Multi-Role
- Se usuario tem `available_roles` > 1, mostra tela de selecao de perfil
- Login salvo (conta salva) tambem pergunta perfil se multi-role
- Header tem seletor de contexto (Gestor/Instrutor) quando multi-role
- Switch role via `POST /api/auth/switch-role` + reload

### Verificacao de Email
- Login bloqueado se `email_verified_at` = null
- Mostra tela com botoes: Reenviar email, Preciso de ajuda
- Pagina `/verificar-email/:token` para confirmar

### Financeiro
- Status diferencia "Fatura Cancelada" (amarelo) vs "Matr. Cancelada" (vermelho)
- Botao Reativar so aparece se matricula NAO esta cancelada
- Modal customizado para reativar (nao usar confirm nativo)
- Valor recebido = `payments.amount_cents` (valor real pago)

### Alunos Experimentais
- Filtros: Presentes, Faltantes, Cancelados, Contatados, Pendente
- Status reflete acao real: Cancelada, Presente, Faltou, Contatado, Agendado, Novo
- Uma linha por agendamento (aluno com 2 modalidades = 2 linhas)
- Coluna Detalhes: icone bloco de notas (verde=contatado, amarelo=tem obs, cinza=sem)
- Modal de observacoes com checkbox "Entrei em contato"
- Board de proximos agendamentos mostra cancelados com visual diferenciado

### Chat de Suporte (Tony)
- Integrado dentro do LaraChat (Tony)
- Botao "Falar com Suporte" no painel do Tony
- Badge roxo ao lado da bolinha quando tem mensagem nova
- Polling: unread a cada 15s, mensagens a cada 5s quando aberto

### Dark Mode
- `useThemeStore` gerencia tema
- Todos os modais e componentes devem respeitar `isDark`
- Containers usar `isDark ? '#1a1a1a' : '#f8f9fa'` (nao hardcodar branco)

## PAGINAS CRITICAS (modificar com cuidado)
- `src/pages/Enrollments.tsx` (98KB) - Matriculas completas
- `src/pages/TrialStudents.tsx` (134KB) - Sistema experimental
- `src/pages/Financial.tsx` (77KB) - Faturamento
- `src/pages/Onboarding.tsx` (127KB) - Setup inicial
- `src/pages/Login.tsx` - Autenticacao multi-role
- `src/App.tsx` - Rotas
- `src/store/authStore.ts` - Estado de autenticacao
- `src/components/layout/Header.tsx` - Seletor de arena/role
- `src/components/layout/Layout.tsx` - Layout principal
- `src/components/lara/LaraChat.tsx` - Chat Tony + suporte
