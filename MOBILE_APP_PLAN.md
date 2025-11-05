# 📱 Plano de Implementação - App Mobile de Alunos

## 🎯 Objetivo Geral
Criar um aplicativo mobile (React Native) para alunos gerenciarem seus agendamentos de aulas, com sistema de créditos e interface para gestores gerenciarem senhas.

---

## 📊 Funcionalidades Principais

### Para Alunos:
1. ✅ **Ver agenda de aulas** (eventos recorrentes e avulsos)
2. ✅ **Remarcar aulas**
3. ✅ **Novo agendamento** (aulas avulsas)
4. ✅ **Solicitar cancelamento** (gera crédito)
5. ✅ **Solicitar reserva de quadra**
6. ✅ **Sistema de créditos:**
   - Cancelamento → Ganha 1 crédito
   - Usar crédito → Agendar aula nas turmas do seu nível
   - Ver saldo de créditos

### Para Gestores:
1. ✅ **Criar/Resetar senha de alunos**
2. ✅ **Visualizar histórico de créditos dos alunos**
3. ✅ **Aprovar/Rejeitar solicitações de cancelamento**
4. ✅ **Aprovar/Rejeitar reservas de quadra**

---

## 🗄️ FASE 1: Estrutura de Banco de Dados

### 1.1. Nova Tabela: `student_credits`
Gerencia os créditos de cada aluno.

```sql
CREATE TABLE student_credits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  credits INT NOT NULL DEFAULT 0 COMMENT 'Saldo atual de créditos',
  total_earned INT NOT NULL DEFAULT 0 COMMENT 'Total de créditos ganhos',
  total_used INT NOT NULL DEFAULT 0 COMMENT 'Total de créditos usados',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student (student_id)
);
```

### 1.2. Nova Tabela: `credit_transactions`
Histórico de ganho/uso de créditos.

```sql
CREATE TABLE credit_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  type ENUM('earned', 'used', 'expired', 'admin_adjustment') NOT NULL,
  amount INT NOT NULL COMMENT 'Quantidade de créditos (+/- dependendo do tipo)',
  reason VARCHAR(255) COMMENT 'Motivo (ex: "Cancelamento de aula", "Agendamento com crédito")',
  related_enrollment_id BIGINT UNSIGNED COMMENT 'Matrícula relacionada, se aplicável',
  related_booking_id BIGINT UNSIGNED COMMENT 'Agendamento relacionado, se aplicável',
  created_by INT UNSIGNED COMMENT 'Usuário que criou (admin/gestor)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);
```

### 1.3. Nova Tabela: `class_bookings`
Agendamentos avulsos de aulas (com ou sem crédito).

```sql
CREATE TABLE class_bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  event_date DATE NOT NULL COMMENT 'Data específica da aula',
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  used_credit BOOLEAN DEFAULT FALSE COMMENT 'Se usou crédito para agendar',
  cancellation_reason TEXT COMMENT 'Motivo do cancelamento',
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_class (class_id),
  INDEX idx_date (event_date),
  INDEX idx_status (status)
);
```

### 1.4. Nova Tabela: `court_reservations`
Reservas de quadra pelos alunos.

```sql
CREATE TABLE court_reservations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  court_name VARCHAR(100) NOT NULL COMMENT 'Nome da quadra',
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  rejection_reason TEXT COMMENT 'Motivo da rejeição pelo gestor',
  notes TEXT COMMENT 'Observações do aluno',
  approved_by INT UNSIGNED COMMENT 'Gestor que aprovou',
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_date (reservation_date),
  INDEX idx_status (status)
);
```

### 1.5. Adicionar campo `password_hash` em `students`

```sql
ALTER TABLE students
ADD COLUMN password_hash VARCHAR(255) COMMENT 'Senha do aluno (bcrypt)' AFTER phone;
```

---

## 🔧 FASE 2: Backend - Endpoints

### 2.1. Autenticação de Alunos

#### `POST /api/student-auth/login`
Login do aluno.
```json
{
  "email": "aluno@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "student": {
      "id": 1,
      "full_name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999",
      "skill_level": "intermediario",
      "credits": 3
    }
  }
}
```

#### `GET /api/student-auth/me`
Dados do aluno logado.

---

### 2.2. Gestão de Senhas (Admin/Gestor)

#### `POST /api/admin/students/:studentId/reset-password`
Gestor criar/resetar senha de aluno.
```json
{
  "new_password": "novaSenha123"
}
```

#### `PUT /api/admin/students/:studentId/password`
Gestor atualizar senha.

---

### 2.3. Créditos

#### `GET /api/student/credits`
Ver saldo e histórico de créditos do aluno logado.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 3,
    "total_earned": 5,
    "total_used": 2,
    "history": [
      {
        "id": 1,
        "type": "earned",
        "amount": 1,
        "reason": "Cancelamento de aula - Turma Intermediário - 15/01/2025",
        "created_at": "2025-01-15T10:00:00Z"
      },
      {
        "id": 2,
        "type": "used",
        "amount": -1,
        "reason": "Agendamento com crédito - Turma Avançado - 20/01/2025",
        "created_at": "2025-01-20T14:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/admin/students/:studentId/credits`
Gestor ver créditos de um aluno.

#### `POST /api/admin/students/:studentId/credits/adjust`
Gestor ajustar créditos manualmente.
```json
{
  "amount": 2,
  "reason": "Compensação por problemas técnicos"
}
```

---

### 2.4. Agenda do Aluno

#### `GET /api/student/schedule`
Ver agenda completa (eventos recorrentes + agendamentos avulsos).

**Query Params:**
- `start_date` (opcional)
- `end_date` (opcional)
- `status` (opcional): `confirmed`, `pending`, `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "recurring_events": [
      {
        "id": 1,
        "class_name": "Turma Intermediário",
        "weekday": "monday",
        "start_time": "18:00",
        "end_time": "19:00",
        "instructor": "Prof. João",
        "court": "Quadra 1"
      }
    ],
    "one_time_bookings": [
      {
        "id": 10,
        "class_name": "Turma Avançado",
        "event_date": "2025-01-25",
        "start_time": "19:00",
        "end_time": "20:00",
        "status": "confirmed",
        "used_credit": true
      }
    ]
  }
}
```

---

### 2.5. Agendamentos

#### `POST /api/student/bookings`
Criar novo agendamento (aula avulsa).
```json
{
  "class_id": 5,
  "event_date": "2025-01-25",
  "use_credit": true
}
```

**Validações:**
- Verificar se aluno tem nível compatível com a turma
- Se `use_credit: true`, verificar se tem crédito disponível
- Verificar disponibilidade de vagas

#### `GET /api/student/bookings`
Listar agendamentos do aluno.

#### `DELETE /api/student/bookings/:id`
Cancelar agendamento (gera crédito se aplicável).
```json
{
  "cancellation_reason": "Imprevisto pessoal"
}
```

**Regras:**
- Cancelamento com até 24h de antecedência → Ganha crédito
- Cancelamento com menos de 24h → Não ganha crédito
- Agendamento feito com crédito → Crédito volta ao saldo

#### `PUT /api/student/bookings/:id/reschedule`
Remarcar agendamento.
```json
{
  "new_class_id": 6,
  "new_event_date": "2025-01-30"
}
```

---

### 2.6. Turmas Disponíveis

#### `GET /api/student/available-classes`
Listar turmas compatíveis com o nível do aluno que têm vagas.

**Query Params:**
- `date` (opcional): data específica
- `weekday` (opcional): dia da semana

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Turma Intermediário B",
      "weekday": "wednesday",
      "start_time": "19:00",
      "end_time": "20:00",
      "instructor": "Prof. Maria",
      "max_students": 12,
      "enrolled_students": 8,
      "available_slots": 4,
      "skill_level": "intermediario"
    }
  ]
}
```

---

### 2.7. Reservas de Quadra

#### `POST /api/student/court-reservations`
Solicitar reserva de quadra.
```json
{
  "court_name": "Quadra 2",
  "reservation_date": "2025-01-28",
  "start_time": "10:00",
  "end_time": "11:00",
  "notes": "Jogo amistoso com amigos"
}
```

#### `GET /api/student/court-reservations`
Listar reservas do aluno.

#### `DELETE /api/student/court-reservations/:id`
Cancelar reserva.

---

### 2.8. Gestão de Reservas (Admin/Gestor)

#### `GET /api/admin/court-reservations`
Listar todas as reservas (pendentes, aprovadas, etc.).

**Query Params:**
- `status`: `pending`, `approved`, `rejected`
- `date`: filtrar por data

#### `PUT /api/admin/court-reservations/:id/approve`
Aprovar reserva.

#### `PUT /api/admin/court-reservations/:id/reject`
Rejeitar reserva.
```json
{
  "rejection_reason": "Quadra já reservada para evento"
}
```

---

## 📱 FASE 3: React Native App

### 3.1. Estrutura do Projeto

```
GerenciAiMobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── student/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ScheduleScreen.tsx
│   │   │   ├── BookClassScreen.tsx
│   │   │   ├── CreditsScreen.tsx
│   │   │   ├── CourtReservationScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── ClassCard.tsx
│   │   ├── CreditBadge.tsx
│   │   └── ReservationCard.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── scheduleService.ts
│   │   ├── creditsService.ts
│   │   └── reservationService.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   └── scheduleStore.ts
│   ├── types/
│   │   ├── student.ts
│   │   ├── booking.ts
│   │   └── reservation.ts
│   └── utils/
│       ├── constants.ts
│       └── dateHelpers.ts
├── App.tsx
└── package.json
```

### 3.2. Bibliotecas Principais

```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "react-native-vector-icons": "^10.x",
    "react-native-calendars": "^1.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-screens": "^3.x"
  }
}
```

### 3.3. Telas Principais

#### **LoginScreen**
- Email + Senha
- Botão de login
- Link "Esqueci minha senha" (contatar gestor)

#### **HomeScreen (Agenda)**
- Tabs: "Eventos Recorrentes" | "Eventos Avulsos"
- Calendário visual
- Lista de eventos do dia/semana
- Botão flutuante: "Novo Agendamento"

#### **ScheduleScreen**
- Lista de todas as aulas (recorrentes + avulsas)
- Cards coloridos por status
- Botão "Cancelar" em cada card
- Botão "Remarcar" em cada card

#### **BookClassScreen**
- Lista de turmas disponíveis
- Filtros: Por dia da semana, horário
- Badge mostrando vagas disponíveis
- Checkbox "Usar crédito" (se tiver)
- Botão "Agendar"

#### **CreditsScreen**
- Card grande com saldo de créditos
- Total ganho / Total usado
- Histórico de transações
- Explicação de como ganhar/usar créditos

#### **CourtReservationScreen**
- Formulário: Data, Horário, Quadra, Observações
- Lista de reservas do aluno
- Status: Pendente / Aprovada / Rejeitada

---

## 🔐 FASE 4: Gestão de Senhas (Web Admin)

### 4.1. Frontend - Nova Seção no Gerenciador

Adicionar no `UserManagement.tsx` (ou criar nova tela):

**Botão "Gerenciar Senha"** em cada card de aluno.

**Modal:**
```tsx
<Modal title="Gerenciar Senha - {student.name}">
  <Input
    label="Nova Senha"
    type="password"
    placeholder="Digite a nova senha"
  />
  <Button onClick={handleResetPassword}>
    Criar/Resetar Senha
  </Button>
</Modal>
```

---

## 📝 Ordem de Implementação

### **Semana 1: Backend - Base**
1. ✅ Criar migrations (4 novas tabelas)
2. ✅ Adicionar `password_hash` em students
3. ✅ Implementar autenticação de alunos
4. ✅ Implementar gestão de senhas (admin)

### **Semana 2: Backend - Créditos**
1. ✅ Implementar sistema de créditos
2. ✅ Endpoints de histórico de créditos
3. ✅ Ajuste manual de créditos (admin)

### **Semana 3: Backend - Agendamentos**
1. ✅ Endpoints de agendamento
2. ✅ Cancelamento com geração de crédito
3. ✅ Remarcação
4. ✅ Listagem de turmas disponíveis

### **Semana 4: Backend - Reservas**
1. ✅ Endpoints de reserva de quadra
2. ✅ Aprovação/Rejeição (admin)
3. ✅ Histórico de reservas

### **Semana 5: React Native - Setup**
1. ✅ Configurar projeto React Native
2. ✅ Configurar navegação
3. ✅ Configurar serviços de API
4. ✅ Tela de Login

### **Semana 6: React Native - Agenda**
1. ✅ HomeScreen com calendário
2. ✅ ScheduleScreen com lista
3. ✅ Integração com backend

### **Semana 7: React Native - Agendamentos**
1. ✅ BookClassScreen
2. ✅ Sistema de créditos
3. ✅ Cancelamento/Remarcação

### **Semana 8: React Native - Reservas + Polish**
1. ✅ CourtReservationScreen
2. ✅ CreditsScreen
3. ✅ ProfileScreen
4. ✅ Testes e ajustes finais

---

## 🎨 Design System (baseado nas imagens)

- **Cor principal:** Laranja (#FF6B00)
- **Cor secundária:** Verde (#22c55e)
- **Fonte:** Roboto / System Font
- **Cards:** Brancos com border-radius 12px, sombra suave
- **Botões:** Laranja com texto branco, border-radius 8px
- **Status badges:**
  - Confirmado: Verde
  - Pendente: Amarelo
  - Cancelado: Vermelho

---

## 📦 Próximos Passos Imediatos

**Agora vou começar pela FASE 1:**
1. Criar as 4 migrations de banco
2. Adicionar password_hash em students
3. Deploy do backend
4. Depois partimos para o React Native

**Está de acordo com o plano? Quer que eu comece?** 🚀
