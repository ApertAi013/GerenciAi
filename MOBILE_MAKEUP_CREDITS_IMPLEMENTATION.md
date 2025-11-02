# 📱 Implementação do Sistema de Créditos de Remarcação - App Mobile

## 🎯 Visão Geral

Este documento fornece instruções completas para implementar o sistema de créditos de remarcação no aplicativo mobile GerenciAi. O sistema permite que alunos ganhem créditos ao cancelar aulas com antecedência e usem esses créditos para remarcar aulas.

---

## 📋 Índice

1. [Funcionalidades a Implementar](#funcionalidades)
2. [Endpoints da API](#endpoints-da-api)
3. [Modelos de Dados](#modelos-de-dados)
4. [Fluxo de Usuário](#fluxo-de-usuário)
5. [Implementação Passo a Passo](#implementação)
6. [Exemplos de Código](#exemplos-de-código)
7. [Testes](#testes)

---

## 🎯 Funcionalidades a Implementar

### 1. Visualizar Créditos Disponíveis
- Mostrar saldo de créditos do aluno
- Exibir badge/indicador com número de créditos
- Atualizar em tempo real após operações

### 2. Histórico de Créditos
- Lista de todos os ganhos e usos de créditos
- Filtro por tipo (ganho/uso)
- Detalhes de cada transação

### 3. Cancelar Aula com Ganho de Crédito
- Calcular horas de antecedência
- Mostrar aviso se ganhará crédito (8+ horas)
- Exibir mensagem de confirmação com informação do crédito

### 4. Usar Crédito ao Criar Reserva
- Checkbox para usar crédito de remarcação
- Validar se tem créditos disponíveis
- Mostrar economia ao usar crédito

---

## 🌐 Endpoints da API

### Base URL
```
https://gerenciai-backend-798546007335.us-east1.run.app/api/mobile
```

### Autenticação
Todos os endpoints requerem token JWT no header:
```http
Authorization: Bearer <seu_token_jwt>
```

### 1. Ver Créditos Disponíveis

```http
GET /court-reservations/credits
```

**Response 200 OK:**
```json
{
  "status": "success",
  "data": {
    "makeup_credits": 3
  },
  "message": "Créditos obtidos com sucesso"
}
```

---

### 2. Ver Histórico de Créditos

```http
GET /court-reservations/credits/history?limit=20
```

**Query Parameters:**
- `limit` (optional): Número máximo de registros (padrão: 20)

**Response 200 OK:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 15,
      "credit_change": 1,
      "reason": "cancel_8h",
      "notes": "Cancelamento com 12h de antecedência",
      "created_at": "2025-11-02T10:30:00.000Z",
      "court_name": "Quadra 1",
      "reservation_date": "2025-11-03",
      "start_time": "18:00:00"
    },
    {
      "id": 14,
      "credit_change": -1,
      "reason": "use_reservation",
      "notes": "Usado ao criar reserva",
      "created_at": "2025-11-01T15:20:00.000Z",
      "court_name": "Quadra 2",
      "reservation_date": "2025-11-02",
      "start_time": "19:00:00"
    }
  ],
  "message": "Histórico obtido com sucesso"
}
```

**Tipos de `reason`:**
- `cancel_8h`: Ganhou crédito ao cancelar com 8+ horas
- `use_reservation`: Usou crédito ao criar reserva
- `manual_add`: Adicionado manualmente pelo gestor
- `manual_remove`: Removido manualmente pelo gestor

---

### 3. Criar Reserva (com opção de usar crédito)

```http
POST /court-reservations
```

**Request Body:**
```json
{
  "court_name": "Quadra 1",
  "reservation_date": "2025-11-05",
  "start_time": "18:00",
  "end_time": "19:00",
  "duration_minutes": 60,
  "request_reason": "Aula regular",
  "use_makeup_credit": true
}
```

**Campos:**
- `use_makeup_credit` (optional, boolean): Se true, usa 1 crédito de remarcação

**Response 201 Created:**
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "student_id": 45,
    "court_name": "Quadra 1",
    "reservation_date": "2025-11-05",
    "start_time": "18:00:00",
    "end_time": "19:00:00",
    "duration_minutes": 60,
    "status": "pending",
    "used_makeup_credit": true,
    "created_at": "2025-11-02T14:30:00.000Z"
  },
  "message": "Reserva criada com sucesso usando crédito de remarcação"
}
```

**Error 400 (sem créditos):**
```json
{
  "status": "fail",
  "message": "Você não possui créditos de remarcação disponíveis"
}
```

---

### 4. Cancelar Reserva (pode ganhar crédito)

```http
DELETE /court-reservations/:reservationId
```

**Response 200 OK (com crédito):**
```json
{
  "status": "success",
  "data": {
    "reservation_id": 123,
    "cancellation_hours_notice": 12,
    "earned_credit": true,
    "new_credit_balance": 4
  },
  "message": "Reserva cancelada com sucesso. Você ganhou 1 crédito de remarcação!"
}
```

**Response 200 OK (sem crédito):**
```json
{
  "status": "success",
  "data": {
    "reservation_id": 123,
    "cancellation_hours_notice": 5,
    "earned_credit": false
  },
  "message": "Reserva cancelada com sucesso"
}
```

---

## 📊 Modelos de Dados

### Student (atualizado)
```typescript
interface Student {
  id: number;
  full_name: string;
  email: string;
  makeup_credits: number;  // ← NOVO
  // ... outros campos
}
```

### CourtReservation (atualizado)
```typescript
interface CourtReservation {
  id: number;
  student_id: number;
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  request_reason?: string;
  used_makeup_credit?: boolean;  // ← NOVO
  earned_makeup_credit?: boolean;  // ← NOVO
  cancellation_hours_notice?: number;  // ← NOVO
  created_at: string;
}
```

### CreditHistory
```typescript
interface CreditHistory {
  id: number;
  credit_change: number;  // +1 para ganho, -1 para uso
  reason: 'cancel_8h' | 'use_reservation' | 'manual_add' | 'manual_remove';
  notes?: string;
  created_at: string;
  // Dados da reserva relacionada (se houver)
  court_name?: string;
  reservation_date?: string;
  start_time?: string;
}
```

---

## 🔄 Fluxo de Usuário

### Fluxo 1: Visualizar Créditos

```
1. Usuário abre o app
2. Na tela principal, exibir badge com número de créditos
3. Clicar no badge abre tela de "Meus Créditos"
4. Mostrar:
   - Saldo atual em destaque
   - Explicação do sistema
   - Botão para ver histórico
```

### Fluxo 2: Cancelar Aula e Ganhar Crédito

```
1. Usuário vai em "Minhas Reservas"
2. Seleciona uma reserva futura
3. Clica em "Cancelar"
4. Sistema calcula horas de antecedência
5. Se >= 8 horas:
   ✅ Mostrar alerta: "Você ganhará 1 crédito de remarcação"
6. Se < 8 horas:
   ⚠️ Mostrar alerta: "Não ganhará crédito (menos de 8h)"
7. Confirma cancelamento
8. Sistema mostra: "Cancelado! +1 crédito (total: X)"
```

### Fluxo 3: Usar Crédito para Remarcar

```
1. Usuário vai em "Nova Reserva"
2. Preenche dados (quadra, data, horário)
3. Se tem créditos disponíveis:
   ☑️ Mostrar checkbox: "Usar crédito de remarcação (você tem X)"
4. Se marcar checkbox:
   - Mostrar preview: "Você usará 1 crédito. Restará: X"
5. Confirma reserva
6. Sistema mostra: "Reserva criada! -1 crédito (total: X)"
```

---

## 💻 Implementação Passo a Passo

### Passo 1: Criar Service de Créditos

```typescript
// services/creditService.ts
import api from './api';

export interface CreditBalance {
  makeup_credits: number;
}

export interface CreditHistoryItem {
  id: number;
  credit_change: number;
  reason: string;
  notes?: string;
  created_at: string;
  court_name?: string;
  reservation_date?: string;
  start_time?: string;
}

export const creditService = {
  /**
   * Buscar saldo de créditos do aluno
   */
  async getBalance(): Promise<CreditBalance> {
    const response = await api.get<{data: CreditBalance}>('/court-reservations/credits');
    return response.data.data;
  },

  /**
   * Buscar histórico de créditos
   */
  async getHistory(limit = 20): Promise<CreditHistoryItem[]> {
    const response = await api.get<{data: CreditHistoryItem[]}>(
      `/court-reservations/credits/history?limit=${limit}`
    );
    return response.data.data;
  }
};
```

---

### Passo 2: Atualizar Service de Reservas

```typescript
// services/reservationService.ts
import api from './api';

export interface CreateReservationData {
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  request_reason?: string;
  use_makeup_credit?: boolean;  // ← NOVO
}

export const reservationService = {
  /**
   * Criar nova reserva (com opção de usar crédito)
   */
  async create(data: CreateReservationData) {
    const response = await api.post('/court-reservations', data);
    return response.data;
  },

  /**
   * Cancelar reserva (pode ganhar crédito)
   */
  async cancel(reservationId: number) {
    const response = await api.delete(`/court-reservations/${reservationId}`);
    return response.data;
  },

  /**
   * Listar reservas do aluno
   */
  async list() {
    const response = await api.get('/court-reservations');
    return response.data.data;
  }
};
```

---

### Passo 3: Criar Componente de Badge de Créditos

```tsx
// components/CreditBadge.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { creditService } from '../services/creditService';
import { useNavigation } from '@react-navigation/native';

export const CreditBadge: React.FC = () => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { makeup_credits } = await creditService.getBalance();
      setCredits(makeup_credits);
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || credits === 0) return null;

  return (
    <TouchableOpacity
      style={styles.badge}
      onPress={() => navigation.navigate('Credits')}
    >
      <Text style={styles.icon}>🎫</Text>
      <Text style={styles.count}>{credits}</Text>
      <Text style={styles.label}>créditos</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  count: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 4,
  },
  label: {
    color: 'white',
    fontSize: 14,
  }
});
```

---

### Passo 4: Criar Tela de Créditos

```tsx
// screens/CreditsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { creditService, CreditHistoryItem } from '../services/creditService';

export const CreditsScreen: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, historyData] = await Promise.all([
        creditService.getBalance(),
        creditService.getHistory(50)
      ]);
      setBalance(balanceData.makeup_credits);
      setHistory(historyData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderItem = ({ item }: { item: CreditHistoryItem }) => {
    const isGain = item.credit_change > 0;

    return (
      <View style={styles.historyItem}>
        <View style={[styles.badge, isGain ? styles.gainBadge : styles.useBadge]}>
          <Text style={styles.badgeText}>
            {isGain ? '+' : ''}{item.credit_change}
          </Text>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>
            {getReasonLabel(item.reason)}
          </Text>
          {item.notes && (
            <Text style={styles.itemNotes}>{item.notes}</Text>
          )}
          {item.court_name && (
            <Text style={styles.itemDetails}>
              {item.court_name} - {formatDate(item.reservation_date)} às {item.start_time}
            </Text>
          )}
          <Text style={styles.itemDate}>
            {formatDateTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com saldo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Créditos</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Créditos Disponíveis</Text>
          <Text style={styles.balanceValue}>{balance}</Text>
          <Text style={styles.balanceDescription}>
            Ganhe créditos cancelando aulas com 8+ horas de antecedência
          </Text>
        </View>
      </View>

      {/* Histórico */}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum histórico de créditos</Text>
        }
      />
    </View>
  );
};

const getReasonLabel = (reason: string): string => {
  const labels: Record<string, string> = {
    cancel_8h: 'Cancelamento antecipado',
    use_reservation: 'Usado em reserva',
    manual_add: 'Adicionado pelo gestor',
    manual_remove: 'Removido pelo gestor'
  };
  return labels[reason] || reason;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceDescription: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  list: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gainBadge: {
    backgroundColor: '#4CAF50',
  },
  useBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 16,
  },
});
```

---

### Passo 5: Atualizar Tela de Criar Reserva

```tsx
// screens/CreateReservationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch
} from 'react-native';
import { reservationService, CreateReservationData } from '../services/reservationService';
import { creditService } from '../services/creditService';

export const CreateReservationScreen: React.FC = ({ navigation }) => {
  const [courtName, setCourtName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [useCredit, setUseCredit] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { makeup_credits } = await creditService.getBalance();
      setCredits(makeup_credits);
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!courtName || !date || !startTime || !endTime) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (useCredit && credits < 1) {
      Alert.alert('Erro', 'Você não possui créditos disponíveis');
      return;
    }

    try {
      setLoading(true);

      const data: CreateReservationData = {
        court_name: courtName,
        reservation_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: 60,
        request_reason: reason,
        use_makeup_credit: useCredit
      };

      const response = await reservationService.create(data);

      Alert.alert(
        'Sucesso!',
        useCredit
          ? `Reserva criada usando 1 crédito! Você tem ${credits - 1} créditos restantes.`
          : 'Reserva criada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova Reserva</Text>

      {/* Campos do formulário */}
      <TextInput
        style={styles.input}
        placeholder="Nome da Quadra"
        value={courtName}
        onChangeText={setCourtName}
      />

      <TextInput
        style={styles.input}
        placeholder="Data (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Hora Início (HH:MM)"
        value={startTime}
        onChangeText={setStartTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Hora Fim (HH:MM)"
        value={endTime}
        onChangeText={setEndTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Motivo (opcional)"
        value={reason}
        onChangeText={setReason}
        multiline
      />

      {/* Opção de usar crédito */}
      {credits > 0 && (
        <View style={styles.creditOption}>
          <View style={styles.creditInfo}>
            <Text style={styles.creditText}>Usar crédito de remarcação</Text>
            <Text style={styles.creditSubtext}>
              Você tem {credits} crédito{credits > 1 ? 's' : ''}
            </Text>
          </View>
          <Switch
            value={useCredit}
            onValueChange={setUseCredit}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor={useCredit ? '#fff' : '#fff'}
          />
        </View>
      )}

      {useCredit && (
        <View style={styles.creditPreview}>
          <Text style={styles.previewText}>
            ✓ Você usará 1 crédito. Restará: {credits - 1}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Criando...' : 'Criar Reserva'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  creditOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  creditInfo: {
    flex: 1,
  },
  creditText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  creditSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  creditPreview: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

---

### Passo 6: Atualizar Cancelamento de Reserva

```tsx
// screens/MyReservationsScreen.tsx - adicionar ao componente de cancelamento

const handleCancelReservation = async (reservation: Reservation) => {
  // Calcular horas de antecedência
  const now = new Date();
  const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
  const hoursNotice = Math.floor((reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  const willEarnCredit = hoursNotice >= 8;

  Alert.alert(
    'Cancelar Reserva',
    willEarnCredit
      ? `Você cancelará com ${hoursNotice} horas de antecedência e GANHARÁ 1 crédito de remarcação! ✓`
      : `Você cancelará com ${hoursNotice} horas de antecedência (menos de 8h, não ganhará crédito).`,
    [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await reservationService.cancel(reservation.id);

            const message = response.data.earned_credit
              ? `Reserva cancelada! Você ganhou 1 crédito. Total: ${response.data.new_credit_balance}`
              : 'Reserva cancelada com sucesso';

            Alert.alert('Sucesso', message);
            loadReservations(); // Recarregar lista
          } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao cancelar reserva');
          }
        }
      }
    ]
  );
};
```

---

## 🧪 Testes

### Teste 1: Ganhar Crédito

1. Criar uma reserva para daqui a 2 dias
2. Cancelar imediatamente
3. ✅ Verificar que ganhou 1 crédito
4. ✅ Verificar que aparece no histórico

### Teste 2: Usar Crédito

1. Ter pelo menos 1 crédito
2. Criar nova reserva marcando "Usar crédito"
3. ✅ Verificar que crédito foi debitado
4. ✅ Verificar que aparece no histórico

### Teste 3: Sem Créditos

1. Ter 0 créditos
2. Tentar criar reserva usando crédito
3. ✅ Verificar mensagem de erro
4. ✅ Checkbox deve estar desabilitado

### Teste 4: Cancelamento sem Crédito

1. Criar reserva para daqui a 4 horas
2. Cancelar
3. ✅ Verificar que NÃO ganhou crédito
4. ✅ Mensagem deve indicar que não ganhou

---

## 📝 Checklist de Implementação

- [ ] Criar `services/creditService.ts`
- [ ] Atualizar `services/reservationService.ts`
- [ ] Criar componente `CreditBadge.tsx`
- [ ] Criar tela `CreditsScreen.tsx`
- [ ] Atualizar tela de criar reserva com checkbox de crédito
- [ ] Atualizar lógica de cancelamento com alerta de crédito
- [ ] Adicionar rota para tela de créditos
- [ ] Testar todos os fluxos
- [ ] Atualizar documentação do app
- [ ] Treinar usuários

---

## 🎨 Sugestões de UI/UX

1. **Badge de Créditos**
   - Exibir sempre visível no header/menu
   - Animação ao ganhar/usar crédito
   - Badge pulsante quando tem créditos novos

2. **Histórico**
   - Cores diferentes para ganho (verde) e uso (laranja)
   - Pull to refresh
   - Infinite scroll para histórico longo

3. **Alertas**
   - Toast/Snackbar ao ganhar crédito
   - Confirmação visual ao usar crédito
   - Tutorial na primeira vez que ganha crédito

4. **Indicadores**
   - Progress bar se próximo de ganhar mais créditos
   - Estatísticas: "Você economizou X reais com créditos"
   - Ranking de alunos com mais créditos (gamification)

---

## 🆘 Suporte

Se tiver dúvidas durante a implementação:

1. **Backend API:** https://gerenciai-backend-798546007335.us-east1.run.app/api/mobile
2. **Documentação do Backend:** Ver arquivos `backend/src/controllers/courtReservationsController.js`
3. **Teste de Endpoints:** Use Postman/Insomnia com o token JWT

---

## 🚀 Deploy

Após implementar e testar:

1. Atualizar versão do app
2. Testar em ambiente de staging
3. Criar release notes mencionando nova funcionalidade
4. Deploy gradual (A/B testing se possível)
5. Monitorar logs e feedback dos usuários

---

**Boa sorte com a implementação! 🎉**
