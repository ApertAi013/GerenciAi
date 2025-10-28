# 📚 GerenciAi - API Documentation

**Base URL:** `https://gerenciai-backend-798546007335.us-east1.run.app`

**Versão:** 1.0.0

**Última atualização:** 28 de Outubro de 2025

---

## 🔐 Autenticação

A maioria dos endpoints requer autenticação via **JWT Token**.

Após fazer login, você receberá um token que deve ser enviado no header de todas as requisições protegidas:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📋 Índice

- [Autenticação](#autenticação-endpoints)
- [Alunos (Students)](#alunos-students)
- [Turmas (Classes)](#turmas-classes)
- [Matrículas (Enrollments)](#matrículas-enrollments)
- [Faturas (Invoices)](#faturas-invoices)
- [Relatórios (Reports)](#relatórios-reports)
- [Utilitários](#utilitários)

---

## 🔑 Autenticação Endpoints

### 1. Login

```http
POST /api/auth/login
```

**Descrição:** Autentica usuário e retorna token JWT.

**Permissão:** Público (sem autenticação)

**Body:**
```json
{
  "email": "admin@gerenciai.com",
  "password": "admin123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "Administrador",
    "email": "admin@gerenciai.com",
    "role": "admin"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

---

### 2. Registro de Usuário

```http
POST /api/auth/register
```

**Descrição:** Cria novo usuário no sistema.

**Permissão:** Apenas **admin**

**Headers:**
```
Authorization: Bearer TOKEN_DO_ADMIN
```

**Body:**
```json
{
  "full_name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "role": "instrutor"
}
```

**Roles disponíveis:** `admin`, `gestor`, `instrutor`, `financeiro`

**Response Success (201):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 2,
    "full_name": "João Silva",
    "email": "joao@example.com",
    "role": "instrutor"
  }
}
```

---

### 3. Obter Usuário Atual

```http
GET /api/auth/me
```

**Descrição:** Retorna dados do usuário autenticado.

**Permissão:** Autenticado

**Headers:**
```
Authorization: Bearer SEU_TOKEN
```

**Response Success (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "Administrador",
    "email": "admin@gerenciai.com",
    "role": "admin",
    "status": "ativo"
  }
}
```

---

## 👨‍🎓 Alunos (Students)

### 1. Criar Aluno

```http
POST /api/students
```

**Permissão:** admin, gestor

**Body:**
```json
{
  "full_name": "Maria Santos",
  "cpf": "12345678901",
  "email": "maria@example.com",
  "phone": "11999999999",
  "birth_date": "1995-05-15",
  "sex": "Feminino"
}
```

**Campos:**
- `full_name` (string, obrigatório)
- `cpf` (string, obrigatório, 11 dígitos)
- `email` (string, obrigatório)
- `phone` (string, opcional)
- `birth_date` (date, opcional, formato: YYYY-MM-DD)
- `sex` (enum, opcional): `Masculino`, `Feminino`, `Outro`, `N/I`

**Response Success (201):**
```json
{
  "success": true,
  "message": "Aluno criado com sucesso",
  "student": {
    "id": 1,
    "full_name": "Maria Santos",
    "cpf": "12345678901",
    "email": "maria@example.com",
    "status": "pendente"
  }
}
```

---

### 2. Listar Alunos

```http
GET /api/students
```

**Permissão:** Autenticado

**Query Parameters (opcional):**
- `status` - Filtrar por status: `ativo`, `inativo`, `pendente`
- `search` - Buscar por nome, email ou CPF
- `page` - Página (default: 1)
- `limit` - Itens por página (default: 20)

**Exemplo:**
```
GET /api/students?status=ativo&search=maria&page=1&limit=10
```

**Response Success (200):**
```json
{
  "success": true,
  "count": 15,
  "students": [
    {
      "id": 1,
      "full_name": "Maria Santos",
      "cpf": "12345678901",
      "email": "maria@example.com",
      "phone": "11999999999",
      "status": "ativo",
      "created_at": "2025-10-28T00:00:00.000Z"
    }
  ]
}
```

---

### 3. Obter Aluno por ID

```http
GET /api/students/:id
```

**Permissão:** Autenticado

**Response Success (200):**
```json
{
  "success": true,
  "student": {
    "id": 1,
    "full_name": "Maria Santos",
    "cpf": "12345678901",
    "email": "maria@example.com",
    "phone": "11999999999",
    "birth_date": "1995-05-15",
    "sex": "Feminino",
    "status": "ativo",
    "created_at": "2025-10-28T00:00:00.000Z"
  }
}
```

---

### 4. Atualizar Aluno

```http
PUT /api/students/:id
```

**Permissão:** admin, gestor

**Body (todos opcionais):**
```json
{
  "full_name": "Maria Santos Silva",
  "email": "maria.nova@example.com",
  "phone": "11988888888",
  "status": "ativo"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Aluno atualizado com sucesso"
}
```

---

### 5. Atualização em Massa

```http
PATCH /api/students/bulk-update
```

**Permissão:** admin, gestor, financeiro

**Body:**
```json
{
  "student_ids": [1, 2, 3],
  "status": "ativo"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "3 alunos atualizados com sucesso"
}
```

---

### 6. Deletar Aluno

```http
DELETE /api/students/:id
```

**Permissão:** Apenas admin

**Response Success (200):**
```json
{
  "success": true,
  "message": "Aluno deletado com sucesso"
}
```

---

## 🏐 Turmas (Classes)

### 1. Listar Modalidades

```http
GET /api/classes/modalities
```

**Permissão:** Autenticado

**Response Success (200):**
```json
{
  "success": true,
  "modalities": [
    {
      "id": 1,
      "name": "Futevôlei",
      "description": "Combinação de futebol e vôlei na areia"
    },
    {
      "id": 2,
      "name": "Vôlei de Praia",
      "description": "Vôlei tradicional de praia"
    }
  ]
}
```

---

### 2. Criar Turma

```http
POST /api/classes
```

**Permissão:** admin, gestor

**Body:**
```json
{
  "modality_id": 1,
  "name": "Futevôlei Iniciante - Segunda",
  "weekday": "seg",
  "start_time": "18:00",
  "end_time": "19:30",
  "location": "Quadra 1",
  "capacity": 20,
  "level": "iniciante"
}
```

**Campos:**
- `modality_id` (int, obrigatório)
- `name` (string, opcional)
- `weekday` (enum, obrigatório): `seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`
- `start_time` (string, obrigatório, formato: HH:MM)
- `end_time` (string, opcional, formato: HH:MM)
- `location` (string, opcional)
- `capacity` (int, opcional, default: 20)
- `level` (enum, opcional): `iniciante`, `intermediario`, `avancado`, `todos`

**Response Success (201):**
```json
{
  "success": true,
  "message": "Turma criada com sucesso",
  "class": {
    "id": 1,
    "modality_id": 1,
    "weekday": "seg",
    "start_time": "18:00"
  }
}
```

---

### 3. Listar Turmas

```http
GET /api/classes
```

**Permissão:** Autenticado

**Query Parameters (opcional):**
- `modality_id` - Filtrar por modalidade
- `weekday` - Filtrar por dia da semana
- `level` - Filtrar por nível
- `status` - Filtrar por status: `ativa`, `suspensa`, `cancelada`

**Response Success (200):**
```json
{
  "success": true,
  "classes": [
    {
      "id": 1,
      "modality_id": 1,
      "modality_name": "Futevôlei",
      "name": "Futevôlei Iniciante - Segunda",
      "weekday": "seg",
      "start_time": "18:00",
      "end_time": "19:30",
      "level": "iniciante",
      "capacity": 20,
      "status": "ativa"
    }
  ]
}
```

---

### 4. Filtrar por Nível

```http
GET /api/classes/filter/level/:level
```

**Permissão:** Autenticado

**Exemplo:**
```
GET /api/classes/filter/level/iniciante
```

---

### 5. Filtrar por Horário

```http
GET /api/classes/filter/time
```

**Permissão:** Autenticado

**Query Parameters:**
- `start_time` - Horário mínimo (HH:MM)
- `end_time` - Horário máximo (HH:MM)

**Exemplo:**
```
GET /api/classes/filter/time?start_time=18:00&end_time=20:00
```

---

### 6. Obter Turma por ID

```http
GET /api/classes/:id
```

**Permissão:** Autenticado

---

### 7. Atualizar Turma

```http
PUT /api/classes/:id
```

**Permissão:** admin, gestor

---

### 8. Deletar Turma

```http
DELETE /api/classes/:id
```

**Permissão:** Apenas admin

---

## 📝 Matrículas (Enrollments)

### 1. Listar Planos

```http
GET /api/enrollments/plans
```

**Permissão:** Autenticado

**Response Success (200):**
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "name": "Plano 1x/semana",
      "sessions_per_week": 1,
      "price_cents": 15000,
      "price": "R$ 150,00",
      "description": "Uma aula por semana",
      "status": "ativo"
    }
  ]
}
```

---

### 2. Criar Matrícula

```http
POST /api/enrollments
```

**Permissão:** admin, gestor

**Body:**
```json
{
  "student_id": 1,
  "plan_id": 2,
  "start_date": "2025-11-01",
  "due_day": 10,
  "class_ids": [1, 3]
}
```

**Campos:**
- `student_id` (int, obrigatório)
- `plan_id` (int, obrigatório)
- `start_date` (date, obrigatório, formato: YYYY-MM-DD)
- `due_day` (int, opcional, 1-31, default: 10)
- `class_ids` (array, obrigatório) - IDs das turmas

**Response Success (201):**
```json
{
  "success": true,
  "message": "Matrícula criada com sucesso",
  "enrollment": {
    "id": 1,
    "student_id": 1,
    "plan_id": 2,
    "start_date": "2025-11-01",
    "status": "ativa"
  }
}
```

---

### 3. Atualizar Turmas da Matrícula

```http
PUT /api/enrollments/:enrollment_id/classes
```

**Permissão:** admin, gestor

**Body:**
```json
{
  "class_ids": [1, 2, 4]
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Turmas atualizadas com sucesso"
}
```

---

### 4. Aplicar Desconto

```http
PATCH /api/enrollments/:enrollment_id/discount
```

**Permissão:** admin, gestor, financeiro

**Body:**
```json
{
  "discount_type": "percentage",
  "discount_value": 20,
  "discount_until": "2025-12-31"
}
```

**discount_type:**
- `fixed` - Valor fixo em centavos (ex: 5000 = R$ 50,00)
- `percentage` - Percentual (ex: 20 = 20%)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Desconto aplicado com sucesso"
}
```

---

### 5. Marcar Presença

```http
POST /api/enrollments/attendance
```

**Permissão:** admin, gestor, instrutor

**Body:**
```json
{
  "enrollment_id": 1,
  "class_id": 1,
  "class_date": "2025-10-28",
  "present": true,
  "notes": "Aluno participou ativamente"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Presença registrada com sucesso"
}
```

---

### 6. Consultar Presenças

```http
GET /api/enrollments/attendance
```

**Permissão:** Autenticado

**Query Parameters:**
- `class_id` - ID da turma
- `class_date` - Data da aula (YYYY-MM-DD)
- `enrollment_id` - ID da matrícula

**Exemplo:**
```
GET /api/enrollments/attendance?class_id=1&class_date=2025-10-28
```

---

## 💰 Faturas (Invoices)

### 1. Gerar Faturas do Mês

```http
POST /api/invoices/generate
```

**Permissão:** admin, gestor, financeiro

**Body:**
```json
{
  "reference_month": "2025-11"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "15 faturas geradas para 2025-11",
  "count": 15
}
```

---

### 2. Listar Faturas

```http
GET /api/invoices
```

**Permissão:** Autenticado

**Query Parameters (opcional):**
- `status` - Filtrar por status: `aberta`, `paga`, `vencida`, `cancelada`
- `reference_month` - Filtrar por mês (YYYY-MM)
- `student_id` - Filtrar por aluno

**Exemplo:**
```
GET /api/invoices?status=vencida&reference_month=2025-10
```

**Response Success (200):**
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "enrollment_id": 1,
      "student_name": "Maria Santos",
      "reference_month": "2025-11",
      "due_date": "2025-11-10",
      "amount_cents": 27000,
      "amount": "R$ 270,00",
      "discount_cents": 0,
      "final_amount_cents": 27000,
      "final_amount": "R$ 270,00",
      "status": "aberta"
    }
  ]
}
```

---

### 3. Registrar Pagamento

```http
POST /api/invoices/payment
```

**Permissão:** admin, gestor, financeiro

**Body:**
```json
{
  "invoice_id": 1,
  "paid_at": "2025-10-28T14:30:00",
  "method": "pix",
  "amount_cents": 27000,
  "notes": "Pagamento via PIX"
}
```

**method:** `pix`, `cartao`, `dinheiro`, `boleto`, `outro`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Pagamento registrado com sucesso",
  "payment": {
    "id": 1,
    "invoice_id": 1,
    "amount": "R$ 270,00",
    "method": "pix"
  }
}
```

---

### 4. Cancelar Fatura

```http
PATCH /api/invoices/:id/cancel
```

**Permissão:** admin, gestor, financeiro

**Response Success (200):**
```json
{
  "success": true,
  "message": "Fatura cancelada com sucesso"
}
```

---

### 5. Atualizar Faturas Vencidas

```http
POST /api/invoices/update-overdue
```

**Permissão:** admin, gestor, financeiro

**Descrição:** Atualiza status de faturas abertas que já venceram.

**Response Success (200):**
```json
{
  "success": true,
  "message": "5 faturas marcadas como vencidas"
}
```

---

## 📊 Relatórios (Reports)

### 1. Inadimplentes por Turma

```http
GET /api/reports/overdue/class/:class_id
```

**Permissão:** Autenticado

**Response Success (200):**
```json
{
  "success": true,
  "class_id": 1,
  "overdue_students": [
    {
      "student_id": 1,
      "student_name": "Maria Santos",
      "overdue_count": 2,
      "total_overdue_cents": 54000,
      "total_overdue": "R$ 540,00"
    }
  ]
}
```

---

### 2. Inadimplentes por Modalidade

```http
GET /api/reports/overdue/modality/:modality_id
```

**Permissão:** Autenticado

---

### 3. Todos Inadimplentes

```http
GET /api/reports/overdue/all
```

**Permissão:** Autenticado

**Query Parameters (opcional):**
- `min_days` - Mínimo de dias em atraso

---

### 4. Receita Recebida

```http
GET /api/reports/revenue/received
```

**Permissão:** admin, gestor, financeiro

**Query Parameters:**
- `start_date` - Data inicial (YYYY-MM-DD)
- `end_date` - Data final (YYYY-MM-DD)

**Exemplo:**
```
GET /api/reports/revenue/received?start_date=2025-10-01&end_date=2025-10-31
```

**Response Success (200):**
```json
{
  "success": true,
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  "total_cents": 540000,
  "total": "R$ 5.400,00",
  "count": 20
}
```

---

### 5. Receita a Receber

```http
GET /api/reports/revenue/to-receive
```

**Permissão:** admin, gestor, financeiro

**Query Parameters:**
- `reference_month` - Mês de referência (YYYY-MM)

---

### 6. Resumo Financeiro

```http
GET /api/reports/revenue/summary
```

**Permissão:** admin, gestor, financeiro

**Query Parameters:**
- `month` - Mês (YYYY-MM)

**Response Success (200):**
```json
{
  "success": true,
  "month": "2025-10",
  "summary": {
    "received_cents": 540000,
    "received": "R$ 5.400,00",
    "to_receive_cents": 270000,
    "to_receive": "R$ 2.700,00",
    "overdue_cents": 81000,
    "overdue": "R$ 810,00",
    "total_expected_cents": 891000,
    "total_expected": "R$ 8.910,00"
  }
}
```

---

### 7. Histórico de Pagamentos do Aluno

```http
GET /api/reports/student/:student_id/payment-history
```

**Permissão:** Autenticado

**Response Success (200):**
```json
{
  "success": true,
  "student_id": 1,
  "student_name": "Maria Santos",
  "payments": [
    {
      "invoice_id": 1,
      "reference_month": "2025-10",
      "paid_at": "2025-10-10T14:30:00",
      "amount_cents": 27000,
      "amount": "R$ 270,00",
      "method": "pix"
    }
  ]
}
```

---

## 🛠️ Utilitários

### Health Check

```http
GET /health
```

**Permissão:** Público

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T02:36:32.790Z",
  "uptime": 75.60879536
}
```

---

### API Info

```http
GET /
```

**Permissão:** Público

**Response:**
```json
{
  "message": "GerenciAi API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "students": "/api/students",
    "classes": "/api/classes",
    "enrollments": "/api/enrollments",
    "invoices": "/api/invoices",
    "reports": "/api/reports",
    "health": "/health"
  }
}
```

---

## 📝 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Erro de validação |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

---

## 🔒 Permissões por Role

| Role | Descrição | Permissões |
|------|-----------|------------|
| **admin** | Administrador | Acesso total a tudo |
| **gestor** | Gestor | Gerenciar alunos, turmas, matrículas |
| **financeiro** | Financeiro | Gerenciar faturas, pagamentos, relatórios financeiros |
| **instrutor** | Instrutor | Marcar presenças, visualizar turmas e alunos |

---

## 💡 Exemplos de Uso

### Fluxo Completo: Criar Aluno e Matrícula

```bash
# 1. Login
POST /api/auth/login
{
  "email": "admin@gerenciai.com",
  "password": "admin123"
}
# Retorna: { "token": "..." }

# 2. Criar aluno
POST /api/students
Authorization: Bearer TOKEN
{
  "full_name": "João Silva",
  "cpf": "12345678901",
  "email": "joao@example.com",
  "phone": "11999999999"
}
# Retorna: { "student": { "id": 5 } }

# 3. Listar planos
GET /api/enrollments/plans
Authorization: Bearer TOKEN
# Retorna lista de planos

# 4. Criar matrícula
POST /api/enrollments
Authorization: Bearer TOKEN
{
  "student_id": 5,
  "plan_id": 2,
  "start_date": "2025-11-01",
  "class_ids": [1, 3]
}

# 5. Gerar faturas do mês
POST /api/invoices/generate
Authorization: Bearer TOKEN
{
  "reference_month": "2025-11"
}
```

---

## 🚀 Testando a API

### Via cURL

```bash
# Login
curl -X POST https://gerenciai-backend-798546007335.us-east1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gerenciai.com","password":"admin123"}'

# Listar alunos
curl https://gerenciai-backend-798546007335.us-east1.run.app/api/students \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Via Postman

Importe a collection `GerenciAi.postman_collection.json` e o environment `GerenciAi.postman_environment.json`.

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Logs: https://console.cloud.google.com/logs?project=gerenciai-476500
- Console Cloud Run: https://console.cloud.google.com/run?project=gerenciai-476500

---

**Documentação gerada em 28/10/2025** 📚
