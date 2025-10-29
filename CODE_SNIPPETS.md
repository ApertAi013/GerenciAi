# Code Snippets Reference - GerenciAi Project

## 1. Common Page Template (Use as Base for Reports)

```typescript
import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import type { ReportData } from '../types/reportTypes';
import '../styles/Reports.css';

export default function Reports() {
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await reportService.getRevenueSummary(selectedMonth);
      setData(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar relatórios:', error);
      setError(error.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <h1>Relatórios Financeiros</h1>
        <div className="header-actions">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="filter-input"
          />
          <button className="btn-primary" onClick={fetchData}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Content */}
      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-title">Sem dados disponíveis</p>
          <p className="empty-subtitle">Nenhum relatório encontrado para este período</p>
        </div>
      ) : (
        <div className="reports-grid">
          {/* Add content here */}
        </div>
      )}
    </div>
  );
}
```

---

## 2. Service Pattern (reportService.ts)

```typescript
import { api } from './api';
import type {
  RevenueSummaryResponse,
  RevenueReceivedResponse,
  OverdueStudentsResponse,
  InvoicesResponse,
  PaymentHistoryResponse,
} from '../types/reportTypes';

export const reportService = {
  // Revenue Summary
  async getRevenueSummary(month: string): Promise<RevenueSummaryResponse> {
    const response = await api.get<RevenueSummaryResponse>(
      '/api/reports/revenue/summary',
      { params: { month } }
    );
    return response.data;
  },

  // Received Revenue
  async getReceivedRevenue(
    startDate: string,
    endDate: string
  ): Promise<RevenueReceivedResponse> {
    const response = await api.get<RevenueReceivedResponse>(
      '/api/reports/revenue/received',
      { params: { start_date: startDate, end_date: endDate } }
    );
    return response.data;
  },

  // Overdue Students
  async getOverdueStudents(minDays?: number): Promise<OverdueStudentsResponse> {
    const response = await api.get<OverdueStudentsResponse>(
      '/api/reports/overdue/all',
      { params: minDays ? { min_days: minDays } : {} }
    );
    return response.data;
  },

  // List Invoices
  async getInvoices(params?: {
    status?: 'aberta' | 'paga' | 'vencida' | 'cancelada';
    reference_month?: string;
    student_id?: number;
  }): Promise<InvoicesResponse> {
    const response = await api.get<InvoicesResponse>('/api/invoices', {
      params,
    });
    return response.data;
  },

  // Student Payment History
  async getStudentPaymentHistory(
    studentId: number
  ): Promise<PaymentHistoryResponse> {
    const response = await api.get<PaymentHistoryResponse>(
      `/api/reports/student/${studentId}/payment-history`
    );
    return response.data;
  },
};
```

---

## 3. Type Definitions (reportTypes.ts)

```typescript
// Response from revenue/summary endpoint
export interface RevenueSummaryResponse {
  success: boolean;
  month: string;
  summary: {
    received_cents: number;
    received: string;
    to_receive_cents: number;
    to_receive: string;
    overdue_cents: number;
    overdue: string;
    total_expected_cents: number;
    total_expected: string;
  };
}

// Response from revenue/received endpoint
export interface RevenueReceivedResponse {
  success: boolean;
  period: {
    start: string;
    end: string;
  };
  total_cents: number;
  total: string;
  count: number;
}

// Response from overdue/all endpoint
export interface OverdueStudentsResponse {
  success: boolean;
  overdue_students: Array<{
    student_id: number;
    student_name: string;
    overdue_count: number;
    total_overdue_cents: number;
    total_overdue: string;
  }>;
}

// Invoice item
export interface Invoice {
  id: number;
  enrollment_id: number;
  student_name: string;
  reference_month: string;
  due_date: string;
  amount_cents: number;
  amount: string;
  discount_cents: number;
  final_amount_cents: number;
  final_amount: string;
  status: 'aberta' | 'paga' | 'vencida' | 'cancelada';
}

// Response from invoices endpoint
export interface InvoicesResponse {
  success: boolean;
  invoices: Invoice[];
}

// Payment item
export interface Payment {
  invoice_id: number;
  reference_month: string;
  paid_at: string;
  amount_cents: number;
  amount: string;
  method: 'pix' | 'cartao' | 'dinheiro' | 'boleto' | 'outro';
}

// Response from payment-history endpoint
export interface PaymentHistoryResponse {
  success: boolean;
  student_id: number;
  student_name: string;
  payments: Payment[];
}
```

---

## 4. Card Component Pattern

```tsx
<div className="report-card">
  <div className="card-header">
    <h3>Card Title</h3>
    <span className="card-icon">📊</span>
  </div>

  <div className="card-content">
    <div className="metric">
      <span className="label">Label</span>
      <span className="value">Value</span>
    </div>
  </div>

  <div className="card-footer">
    <small>Footer text</small>
  </div>
</div>
```

### Corresponding CSS

```css
.report-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E5E5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.report-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.card-icon {
  font-size: 1.5rem;
}

.card-content {
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #E5E5E5;
}

.metric:last-child {
  border-bottom: none;
}

.metric .label {
  font-size: 0.875rem;
  color: #737373;
  font-weight: 500;
}

.metric .value {
  font-size: 1.125rem;
  color: #262626;
  font-weight: 600;
}

.card-footer {
  color: #A3A3A3;
  font-size: 0.875rem;
}
```

---

## 5. Modal Pattern (For Filter Modals)

```tsx
{showFiltersModal && (
  <div className="modal-overlay" onClick={() => setShowFiltersModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Filtros Avançados</h2>
        <button 
          className="modal-close" 
          onClick={() => setShowFiltersModal(false)}
        >
          ✕
        </button>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        setShowFiltersModal(false);
        fetchData();
      }}>
        <div className="form-group">
          <label htmlFor="status">Status da Fatura</label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          >
            <option value="">Todos</option>
            <option value="aberta">Aberta</option>
            <option value="paga">Paga</option>
            <option value="vencida">Vencida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="month">Mês de Referência</label>
          <input
            id="month"
            type="month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowFiltersModal(false)}>
            Fechar
          </button>
          <button type="submit" className="btn-primary">
            Aplicar Filtros
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## 6. Table Pattern (For Overdue/Invoices)

```tsx
<div className="reports-table-container">
  <table className="reports-table">
    <thead>
      <tr>
        <th>Aluno</th>
        <th>Mês Referência</th>
        <th>Valor</th>
        <th>Situação</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {data.map((item) => (
        <tr key={item.id}>
          <td>{item.student_name}</td>
          <td>{item.reference_month}</td>
          <td>{item.amount}</td>
          <td>
            <span className={`status-badge status-${item.status}`}>
              {getStatusLabel(item.status)}
            </span>
          </td>
          <td>
            <button className="btn-icon">👁️</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Table CSS

```css
.reports-table-container {
  overflow-x: auto;
  margin-top: 1.5rem;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.reports-table thead {
  background: #F5F5F5;
}

.reports-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #262626;
  border-bottom: 2px solid #E5E5E5;
}

.reports-table td {
  padding: 1rem;
  border-bottom: 1px solid #E5E5E5;
}

.reports-table tbody tr:hover {
  background: #FAFAFA;
}
```

---

## 7. Grid Layout Pattern

```tsx
<div className="reports-grid">
  <div className="report-card">
    {/* Card 1 */}
  </div>
  <div className="report-card">
    {/* Card 2 */}
  </div>
  <div className="report-card">
    {/* Card 3 */}
  </div>
  <div className="report-card">
    {/* Card 4 */}
  </div>
</div>
```

### Grid CSS

```css
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 8. Date Formatting Utilities

```typescript
// Display format (PT-BR)
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// API format (YYYY-MM-DD)
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Month format (YYYY-MM)
export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

// Currency format
export const formatCurrency = (amount: string): string => {
  return amount; // API already returns formatted
};

// Status label
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    aberta: 'Aberta',
    paga: 'Paga',
    vencida: 'Vencida',
    cancelada: 'Cancelada',
    ativa: 'Ativa',
    suspensa: 'Suspensa',
  };
  return labels[status] || status;
};
```

---

## 9. Error and Success Handling

```typescript
// In component
const [error, setError] = useState('');

try {
  setError('');
  setIsLoading(true);
  const response = await reportService.getRevenueSummary(month);
  setData(response.data);
} catch (error: any) {
  const errorMsg = error.response?.data?.message || 'Erro ao carregar dados';
  setError(errorMsg);
  console.error('Error:', error);
} finally {
  setIsLoading(false);
}

// Display error
{error && (
  <div className="error-message">
    <span className="error-icon">⚠️</span>
    {error}
    <button onClick={() => setError('')} className="error-close">✕</button>
  </div>
)}

// Success message (if needed)
{successMessage && (
  <div className="success-message">
    <span className="success-icon">✓</span>
    {successMessage}
  </div>
)}
```

### CSS for Messages

```css
.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-icon {
  margin-right: 0.5rem;
}

.error-close {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 1rem;
}

.success-message {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.success-icon {
  margin-right: 0.5rem;
}
```

---

## 10. Complete CSS Skeleton for Reports Page

```css
.reports-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.reports-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-input {
  padding: 0.75rem;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #262626;
}

.filter-input:focus {
  outline: none;
  border-color: #FF9900;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.report-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E5E5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.report-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E5E5;
  border-top-color: #FF9900;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E5E5;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #737373;
  margin: 0 0 0.5rem 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: #A3A3A3;
  margin: 0;
}

@media (max-width: 768px) {
  .reports-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }
}
```

