# GerenciAi Mobile API Documentation

## Base URL
```
Production: https://gerenciai-backend-798546007335.us-east1.run.app
```

## Authentication

All student endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Gestor/Admin endpoints require a user JWT token (different from student token).

---

## 📱 STUDENT ENDPOINTS

### 1. Authentication

#### POST `/api/mobile/auth/login`
Student login

**Request:**
```json
{
  "email": "aluno@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "id": 1,
      "full_name": "João Silva",
      "email": "joao@example.com",
      "phone": "11999999999",
      "cpf": "12345678900",
      "birth_date": "1990-01-15",
      "sex": "M",
      "user_id": 2
    }
  }
}
```

**Errors:**
- 400: Email e senha são obrigatórios
- 401: Email ou senha incorretos
- 403: Aluno inativo ou senha não cadastrada

---

#### GET `/api/mobile/auth/me`
Get authenticated student profile

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpf": "12345678900",
    "birth_date": "1990-01-15",
    "sex": "M",
    "status": "ativo",
    "credits_balance": 3,
    "credits_earned": 5,
    "credits_spent": 2
  }
}
```

---

### 2. Credits System

#### GET `/api/mobile/credits/balance`
Get student credit balance

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "current_balance": 3,
    "total_earned": 5,
    "total_spent": 2,
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-10T15:30:00.000Z"
  }
}
```

---

#### GET `/api/mobile/credits/transactions`
Get credit transaction history

**Headers:**
```
Authorization: Bearer <student_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 10,
        "amount": 1,
        "transaction_type": "earned",
        "reason": "Crédito por cancelamento da aula 2025-01-15",
        "reference_type": "class_cancellation",
        "reference_id": 5,
        "balance_before": 2,
        "balance_after": 3,
        "created_at": "2025-01-10T15:30:00.000Z"
      },
      {
        "id": 9,
        "amount": -1,
        "transaction_type": "spent",
        "reason": "Crédito usado para agendar aula 2025-01-20",
        "reference_type": "class_booking",
        "reference_id": 12,
        "balance_before": 3,
        "balance_after": 2,
        "created_at": "2025-01-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Class Schedule & Bookings

#### GET `/api/mobile/schedule`
Get student's upcoming class schedule

**Headers:**
```
Authorization: Bearer <student_token>
```

**Query Parameters:**
- `startDate` (optional): Start date (default: today) - Format: YYYY-MM-DD
- `endDate` (optional): End date - Format: YYYY-MM-DD
- `status` (optional): Filter by status (scheduled, attended, cancelled, rescheduled, all)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "booking_date": "2025-01-15",
      "booking_time": "10:00:00",
      "status": "scheduled",
      "booking_type": "regular",
      "used_credit": false,
      "notes": null,
      "class_id": 5,
      "class_name": "Tênis Iniciante",
      "weekday": "Segunda-feira",
      "start_time": "10:00:00",
      "max_students": 8,
      "modality_name": "Tênis",
      "level_name": "Iniciante"
    }
  ]
}
```

---

#### GET `/api/mobile/classes/available`
Get available classes for booking (based on student's level)

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Tênis Iniciante - Segunda 10h",
      "weekday": "Segunda-feira",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "max_students": 8,
      "allowed_levels": ["iniciante", "intermediario"],
      "modality_name": "Tênis",
      "level_name": "Iniciante",
      "current_enrollments": 5,
      "available_slots": 3,
      "is_full": false
    }
  ]
}
```

---

#### POST `/api/mobile/bookings`
Create a new class booking

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request:**
```json
{
  "class_id": 5,
  "booking_date": "2025-01-20",
  "use_credit": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Agendamento criado com sucesso",
  "data": {
    "id": 15,
    "student_id": 1,
    "class_id": 5,
    "booking_date": "2025-01-20",
    "booking_time": "10:00:00",
    "status": "scheduled",
    "booking_type": "regular",
    "used_credit": true,
    "class_name": "Tênis Iniciante - Segunda 10h",
    "weekday": "Segunda-feira",
    "created_at": "2025-01-10T16:00:00.000Z"
  }
}
```

**Errors:**
- 400: Validation errors, class full, already booked, insufficient credits
- 403: Level not allowed for this class
- 404: Class not found

---

#### GET `/api/mobile/bookings/:bookingId`
Get booking details

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "student_id": 1,
    "class_id": 5,
    "booking_date": "2025-01-20",
    "booking_time": "10:00:00",
    "status": "scheduled",
    "booking_type": "regular",
    "used_credit": true,
    "class_name": "Tênis Iniciante - Segunda 10h",
    "weekday": "Segunda-feira",
    "class_start_time": "10:00:00",
    "class_end_time": "11:00:00",
    "modality_name": "Tênis",
    "level_name": "Iniciante",
    "created_at": "2025-01-10T16:00:00.000Z"
  }
}
```

---

#### PUT `/api/mobile/bookings/:bookingId/cancel`
Cancel a booking (generates 1 credit)

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request:**
```json
{
  "cancellation_reason": "Não poderei comparecer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Agendamento cancelado com sucesso. Você ganhou 1 crédito!",
  "data": {
    "booking_id": 15,
    "class_name": "Tênis Iniciante - Segunda 10h",
    "booking_date": "2025-01-20",
    "credit_earned": 1
  }
}
```

**Errors:**
- 400: Already cancelled, already attended, booking in the past
- 404: Booking not found

---

#### PUT `/api/mobile/bookings/:bookingId/reschedule`
Reschedule a booking to a new date

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request:**
```json
{
  "new_date": "2025-01-22"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Agendamento remarcado com sucesso",
  "data": {
    "booking_id": 15,
    "class_name": "Tênis Iniciante - Segunda 10h",
    "old_date": "2025-01-20",
    "new_date": "2025-01-22"
  }
}
```

**Errors:**
- 400: Only active bookings can be rescheduled, already have booking on new date
- 404: Booking not found

---

### 4. Court Reservations

#### GET `/api/mobile/court-reservations`
Get student's court reservations

**Headers:**
```
Authorization: Bearer <student_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected, cancelled, all)
- `startDate` (optional): Start date (default: today)
- `endDate` (optional): End date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "court_name": "Quadra 1",
      "reservation_date": "2025-01-18",
      "start_time": "14:00:00",
      "end_time": "15:00:00",
      "duration_minutes": 60,
      "status": "pending",
      "request_reason": "Treino extra com amigos",
      "rejection_reason": null,
      "approved_at": null,
      "cancelled_at": null,
      "created_at": "2025-01-10T10:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/mobile/court-reservations`
Create a court reservation request

**Headers:**
```
Authorization: Bearer <student_token>
```

**Request:**
```json
{
  "court_name": "Quadra 1",
  "reservation_date": "2025-01-18",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "duration_minutes": 60,
  "request_reason": "Treino extra com amigos"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Solicitação de reserva criada com sucesso. Aguarde aprovação.",
  "data": {
    "id": 1,
    "student_id": 1,
    "court_name": "Quadra 1",
    "reservation_date": "2025-01-18",
    "start_time": "14:00:00",
    "end_time": "15:00:00",
    "duration_minutes": 60,
    "status": "pending",
    "request_reason": "Treino extra com amigos",
    "created_at": "2025-01-10T10:00:00.000Z"
  }
}
```

**Errors:**
- 400: Validation errors, reservation in the past, time conflict
- 404: Court not found

---

#### GET `/api/mobile/court-reservations/:reservationId`
Get reservation details

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 1,
    "court_name": "Quadra 1",
    "reservation_date": "2025-01-18",
    "start_time": "14:00:00",
    "end_time": "15:00:00",
    "duration_minutes": 60,
    "status": "approved",
    "request_reason": "Treino extra com amigos",
    "rejection_reason": null,
    "approved_by": 2,
    "approved_at": "2025-01-10T12:00:00.000Z",
    "created_at": "2025-01-10T10:00:00.000Z"
  }
}
```

---

#### PUT `/api/mobile/court-reservations/:reservationId/cancel`
Cancel a court reservation

**Headers:**
```
Authorization: Bearer <student_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reserva cancelada com sucesso",
  "data": {
    "reservation_id": 1,
    "court_name": "Quadra 1",
    "reservation_date": "2025-01-18"
  }
}
```

**Errors:**
- 400: Already cancelled, already rejected, reservation in the past
- 404: Reservation not found

---

## 🔐 GESTOR/ADMIN ENDPOINTS

### 1. Password Management

#### PUT `/api/students/:studentId/password`
Set/reset student password

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Request:**
```json
{
  "password": "novaSenha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Senha atualizada com sucesso",
  "data": {
    "student_id": 1,
    "student_name": "João Silva",
    "student_email": "joao@example.com"
  }
}
```

---

#### POST `/api/students/bulk-password-reset`
Bulk password reset for multiple students

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Request:**
```json
{
  "student_ids": [1, 2, 3],
  "default_password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "3 senha(s) redefinida(s) com sucesso",
  "data": {
    "updated_count": 3,
    "student_ids": [1, 2, 3]
  }
}
```

---

#### GET `/api/students/:studentId/has-password`
Check if student has password set

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "student_name": "João Silva",
    "student_email": "joao@example.com",
    "has_password": true
  }
}
```

---

### 2. Credits Management

#### POST `/api/students/:studentId/credits/adjust`
Manual credit adjustment for a student

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Request:**
```json
{
  "amount": 5,
  "reason": "Bônus de boas-vindas"
}
```
*Note: amount can be negative to deduct credits*

**Response (200):**
```json
{
  "success": true,
  "message": "Créditos ajustados com sucesso",
  "data": {
    "student_id": 1,
    "student_name": "João Silva",
    "amount": 5,
    "balance_before": 3,
    "balance_after": 8,
    "reason": "Bônus de boas-vindas"
  }
}
```

---

#### GET `/api/students/credits/summary`
Get credits summary for all students

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "João Silva",
      "email": "joao@example.com",
      "current_balance": 8,
      "total_earned": 10,
      "total_spent": 2
    },
    {
      "id": 2,
      "full_name": "Maria Santos",
      "email": "maria@example.com",
      "current_balance": 2,
      "total_earned": 5,
      "total_spent": 3
    }
  ]
}
```

---

### 3. Court Reservations Management

#### GET `/api/court-reservations/pending`
Get all pending court reservations

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "court_name": "Quadra 1",
      "reservation_date": "2025-01-18",
      "start_time": "14:00:00",
      "end_time": "15:00:00",
      "duration_minutes": 60,
      "status": "pending",
      "request_reason": "Treino extra",
      "created_at": "2025-01-10T10:00:00.000Z",
      "student_id": 1,
      "student_name": "João Silva",
      "student_email": "joao@example.com",
      "student_phone": "11999999999"
    }
  ]
}
```

---

#### GET `/api/court-reservations/all`
Get all court reservations

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Query Parameters:**
- `status` (optional): Filter by status
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Response:** Similar to `/pending` but includes all statuses

---

#### PUT `/api/court-reservations/:reservationId/approve`
Approve a court reservation

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Response (200):**
```json
{
  "success": true,
  "message": "Reserva aprovada com sucesso",
  "data": {
    "reservation_id": 1,
    "student_name": "João Silva",
    "court_name": "Quadra 1",
    "reservation_date": "2025-01-18",
    "start_time": "14:00:00",
    "end_time": "15:00:00"
  }
}
```

---

#### PUT `/api/court-reservations/:reservationId/reject`
Reject a court reservation

**Headers:**
```
Authorization: Bearer <user_token>
```

**Roles:** gestor, admin

**Request:**
```json
{
  "rejection_reason": "Quadra em manutenção neste horário"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reserva rejeitada",
  "data": {
    "reservation_id": 1,
    "student_name": "João Silva",
    "rejection_reason": "Quadra em manutenção neste horário"
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Você precisa estar logado para acessar este recurso"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Você não tem permissão para acessar este recurso"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Token Expiration

Student tokens expire after 30 days by default. When a token expires, the API will return a 401 error with message "Token expirado. Faça login novamente".

The mobile app should handle this by redirecting to the login screen.

---

## Rate Limiting

Currently, there is no rate limiting implemented. This may be added in the future.

---

## Database Triggers

The following actions happen automatically via database triggers:

1. **Credit Earning on Cancellation**: When a booking is cancelled (status changed to 'cancelled'), the student automatically receives 1 credit
2. **Credit Balance Updates**: When a credit transaction is created, the student_credits balance is automatically updated

These are handled by the database triggers created in migration 007.
