# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added - 2025-10-28

#### Página de Relatórios Financeiros Completa
- **Nova página de Relatórios** (`/relatorios`) com visualizações financeiras abrangentes
- **14 tipos de gráficos** diferentes para análise de dados:
  - Gráficos de barras: Vendas, Receita, Receita prevista, Contratos vendidos, LTV, Histórico de clientes ativos, Churn, Recuperação com motor de cobrança
  - Gráfico de linha: Ticket médio (geral, contrato/serviço, produto)
  - Gráficos de donut/pizza: Vendas por origem, Contratos mais vendidos, Contratos encerrados por motivo
  - Gráfico de barras empilhadas: Estatísticas de contratos (adesão, renovação, retorno, encerramento)

#### Sistema de Filtros de Data
- **Navegação rápida por mês** com botões de setas (◄ ►)
- **Modal de filtros avançados** com duas opções:
  - Filtro por mês/ano com dropdowns
  - Filtro de período customizado com date pickers
- **Aplicação automática de filtros** a todos os gráficos e métricas
- **Integração completa com API** do backend para buscar dados filtrados

#### Cards de Métricas Principais
- Receita Recebida
- Valor Recebido
- Valor em Aberto
- Valor em Andamento

#### Novos Serviços e Types
- **reportService.ts**: Serviço para chamadas à API de relatórios
  - `getOverdueByClass()` - Inadimplentes por turma
  - `getOverdueByModality()` - Inadimplentes por modalidade
  - `getAllOverdue()` - Todos inadimplentes
  - `getReceivedRevenue()` - Receita recebida com filtros
  - `getRevenueToReceive()` - Receita a receber
  - `getRevenueSummary()` - Resumo financeiro
  - `getStudentPaymentHistory()` - Histórico de pagamentos
  - `getInvoicesSummary()` - Resumo de faturas

- **reportTypes.ts**: Interfaces TypeScript para tipos de dados de relatórios
  - `RevenueData`, `InvoiceSummary`, `OverdueStudent`
  - `PaymentHistoryItem`, `StudentPaymentHistory`
  - `RevenueSummary`, `ChartDataPoint`
  - `MonthlyRevenueData`, `TicketMedioData`, `ContractStats`
  - `SalesOriginData`, `ChurnData`, `ActiveClientsData`

#### Estilos e UI/UX
- **Reports.css**: Estilos customizados e responsivos
  - Modal de filtros com animações suaves
  - Gráficos estilizados com cores consistentes
  - Layout em grid responsivo
  - Hover effects e transições
  - Design system consistente com o resto da aplicação

### Technical Details
- **Arquitetura**: Segue os padrões estabelecidos no projeto (useState, useEffect, try/catch)
- **Integração com Backend**: Conectado aos endpoints de relatórios disponíveis
- **Responsividade**: Layout adaptável para diferentes tamanhos de tela
- **Performance**: useEffect otimizado para buscar dados apenas quando necessário
- **Type Safety**: TypeScript em todos os componentes e serviços

### Files Added
- `src/pages/Reports.tsx` - Componente principal da página de relatórios
- `src/services/reportService.ts` - Serviço de API para relatórios
- `src/types/reportTypes.ts` - Definições de tipos TypeScript
- `src/styles/Reports.css` - Estilos da página de relatórios
- `CHANGELOG.md` - Este arquivo

### Files Modified
- `src/App.tsx` - Adicionada rota `/relatorios` para a nova página
- `package-lock.json` - Atualizado após instalação do Node 20

---

## [0.1.0] - 2025-10-28 (Previous State)

### Existing Features
- Página de Dashboard com estatísticas básicas
- Página de Alunos (CRUD completo)
- Página de Turmas (CRUD completo)
- Sistema de autenticação com JWT
- Layout com Sidebar e Header
- Zustand para gerenciamento de estado
- Axios para requisições HTTP

[Unreleased]: https://github.com/username/gerenciai/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/username/gerenciai/releases/tag/v0.1.0
