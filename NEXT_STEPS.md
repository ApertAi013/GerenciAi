# Próximos Passos - Sistema Mobile GerenciAi

## ✅ O QUE JÁ FOI FEITO

### Backend
1. ✅ **Migrations criadas** - `007_add_student_mobile_system.sql`
2. ✅ **26 endpoints implementados** - Autenticação, créditos, agendamentos, reservas
3. ✅ **Documentação completa** - `MOBILE_API_DOCUMENTATION.md`
4. ✅ **Deploy em andamento** no Cloud Run

---

## ⚠️ IMPORTANTE: APLICAR MIGRATION NO BANCO

A migration `007_add_student_mobile_system.sql` está salva em:
- Local: `/Users/mateuscoelho/Desktop/GerenciAi/backend/database/migrations/007_add_student_mobile_system.sql`
- Cloud Storage: `gs://gerenciai-sql-migrations/007_add_student_mobile_system.sql`

### Opção 1: Via Cloud Console (RECOMENDADO)

1. Acesse o Cloud SQL Console: https://console.cloud.google.com/sql
2. Selecione a instância `gerenciai-db-instance`
3. Vá em "Import"
4. Selecione o arquivo `gs://gerenciai-sql-migrations/007_add_student_mobile_system.sql`
5. Database: `gerenciai_db`
6. Clique em "Import"

### Opção 2: Via Script Local

Se você tiver permissões, pode usar:
```bash
cd /Users/mateuscoelho/Desktop/GerenciAi/backend
node scripts/apply-mobile-migration.js
```

### O que a migration cria:

✅ 4 novas tabelas:
- `student_credits` - Saldo de créditos
- `credit_transactions` - Histórico de transações
- `class_bookings` - Agendamentos
- `court_reservations` - Reservas de quadra

✅ 1 nova coluna:
- `password_hash` em `students`

✅ 3 Views otimizadas:
- `v_student_credit_summary`
- `v_upcoming_bookings`
- `v_pending_court_reservations`

✅ 2 Triggers automáticos:
- Auto-atualização de créditos
- Crédito automático ao cancelar aula

---

## 📱 PRÓXIMOS PASSOS: APP MOBILE

### 1. Configurar Projeto React Native

```bash
# Criar projeto
npx react-native init GerenciAiMobile --template react-native-template-typescript

cd GerenciAiMobile

# Instalar dependências principais
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install axios
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install date-fns

# iOS only (se estiver desenvolvendo para iOS)
cd ios && pod install && cd ..
```

### 2. Estrutura de Pastas Sugerida

```
GerenciAiMobile/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios client configurado
│   │   ├── auth.ts            # Endpoints de autenticação
│   │   ├── credits.ts         # Endpoints de créditos
│   │   ├── bookings.ts        # Endpoints de agendamentos
│   │   └── courtReservations.ts
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── schedule/
│   │   │   ├── ScheduleScreen.tsx
│   │   │   ├── BookingDetailsScreen.tsx
│   │   │   └── CreateBookingScreen.tsx
│   │   ├── credits/
│   │   │   ├── CreditsScreen.tsx
│   │   │   └── TransactionsScreen.tsx
│   │   ├── courtReservations/
│   │   │   ├── ReservationsScreen.tsx
│   │   │   └── CreateReservationScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── BookingCard.tsx
│   │   ├── CreditBalance.tsx
│   │   └── ReservationCard.tsx
│   ├── types/
│   │   └── api.ts
│   └── utils/
│       └── dateHelpers.ts
└── App.tsx
```

### 3. Implementar Telas (em ordem de prioridade)

1. **Login** (1-2 dias)
   - Tela de login
   - Autenticação JWT
   - Storage do token

2. **Schedule/Agenda** (2-3 dias)
   - Lista de aulas agendadas
   - Visualização semanal/mensal
   - Detalhes da aula
   - Cancelar/Remarcar aula

3. **Créditos** (1-2 dias)
   - Saldo de créditos
   - Histórico de transações

4. **Novo Agendamento** (2-3 dias)
   - Lista de turmas disponíveis
   - Seleção de data
   - Opção de usar crédito
   - Confirmação

5. **Reserva de Quadra** (2-3 dias)
   - Formulário de solicitação
   - Lista de reservas
   - Status (pendente/aprovada/rejeitada)
   - Cancelamento

6. **Perfil** (1 dia)
   - Dados do aluno
   - Logout

---

## 🎨 DESIGN SYSTEM (baseado nas screenshots)

### Cores
```typescript
export const colors = {
  primary: '#FF6B00',      // Laranja principal
  secondary: '#FFFFFF',    // Branco
  background: '#F5F5F5',   // Cinza claro
  text: '#333333',         // Texto escuro
  textLight: '#666666',    // Texto cinza
  success: '#4CAF50',      // Verde
  error: '#F44336',        // Vermelho
  warning: '#FF9800',      // Laranja warning
};
```

### Componentes
- Cards com `borderRadius: 12px`
- Sombras suaves
- Botões arredondados
- Badges coloridos para status

---

## 🧪 TESTAR API

Antes de começar o mobile, teste os endpoints:

### 1. Login de Aluno (criar senha primeiro)

**Criar senha para aluno (via Postman/Insomnia):**
```http
PUT https://gerenciai-backend-798546007335.us-east1.run.app/api/students/1/password
Authorization: Bearer <seu_token_de_gestor>
Content-Type: application/json

{
  "password": "senha123"
}
```

**Login do aluno:**
```http
POST https://gerenciai-backend-798546007335.us-east1.run.app/api/mobile/auth/login
Content-Type: application/json

{
  "email": "email_do_aluno@example.com",
  "password": "senha123"
}
```

### 2. Testar outros endpoints

Use o token retornado no login:
```http
GET https://gerenciai-backend-798546007335.us-east1.run.app/api/mobile/auth/me
Authorization: Bearer <student_token>
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (COMPLETO ✅)
- [x] Database migrations
- [x] Controllers implementados
- [x] Routes configuradas
- [x] Middleware de autenticação
- [x] Documentação da API
- [ ] Migration aplicada no banco (PENDENTE - VOCÊ PRECISA FAZER)
- [ ] Deploy finalizado (em andamento)

### Mobile (A FAZER)
- [ ] Projeto React Native configurado
- [ ] Estrutura de pastas criada
- [ ] API client (Axios) configurado
- [ ] Context de autenticação
- [ ] Tela de login
- [ ] Navegação configurada
- [ ] Tela de agenda/schedule
- [ ] Tela de créditos
- [ ] Tela de novo agendamento
- [ ] Tela de reservas de quadra
- [ ] Tela de perfil
- [ ] Testes no simulador iOS/Android

---

## 🚀 TIMELINE ESTIMADO

| Fase | Duração | Descrição |
|------|---------|-----------|
| **Aplicar Migration** | 30 min | Executar migration no banco |
| **Setup React Native** | 2-3 horas | Criar projeto, instalar deps |
| **Auth + API Client** | 1 dia | Login, token storage, axios config |
| **Tela de Agenda** | 2-3 dias | Lista, detalhes, cancelar, remarcar |
| **Tela de Créditos** | 1-2 dias | Saldo e histórico |
| **Novo Agendamento** | 2-3 dias | Turmas disponíveis, agendar |
| **Reservas de Quadra** | 2-3 dias | Criar, listar, cancelar |
| **Perfil e Polimento** | 1-2 dias | Perfil, ajustes finais |
| **Testes** | 2-3 dias | Testes em devices reais |

**Total estimado: 2-3 semanas**

---

## 📞 SUPORTE

Se tiver dúvidas sobre:
- **API**: Consulte `MOBILE_API_DOCUMENTATION.md`
- **Arquitetura**: Consulte `MOBILE_APP_PLAN.md`
- **Migrations**: Arquivo `007_add_student_mobile_system.sql`

---

## 🔑 CREDENCIAIS DE TESTE

Após aplicar a migration, você precisará:

1. **Criar senha para um aluno de teste:**
   - Use o endpoint PUT `/api/students/:id/password` (autenticado como gestor)
   - Defina uma senha (ex: "senha123")

2. **Fazer login no app mobile:**
   - Email: email do aluno
   - Senha: a senha que você definiu

3. **Testar funcionalidades:**
   - Ver agenda
   - Criar agendamentos
   - Ganhar créditos (cancelando aulas)
   - Usar créditos (agendando com crédito)
   - Solicitar reserva de quadra

---

**BOM DESENVOLVIMENTO! 🚀**
