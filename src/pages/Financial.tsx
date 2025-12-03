import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { financialService } from '../services/financialService';
import type { Invoice, RegisterPaymentRequest } from '../types/financialTypes';
import '../styles/Financial.css';

export default function Financial() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'aberta' | 'paga' | 'vencida' | 'due_soon'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState<RegisterPaymentRequest>({
    invoice_id: 0,
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix',
    amount_cents: 0,
    notes: '',
  });

  // Estado para edição de pagamento
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editPaymentData, setEditPaymentData] = useState({
    amount_cents: 0,
    paid_at: '',
    notes: '',
  });

  // Estado para evitar duplo clique nos botões de submit
  const [submitting, setSubmitting] = useState(false);

  // New filter states
  const [instructorFilter, setInstructorFilter] = useState<string>('');
  const [modalityFilter, setModalityFilter] = useState<string>('');
  const [instructors, setInstructors] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [modalities, setModalities] = useState<Array<{ id: number; name: string }>>([]);

  // Filtro de mês - padrão é o mês atual
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    // Load filters on mount
    const loadFilters = async () => {
      try {
        const response = await financialService.getFilters();
        const data = response.data || response;
        setInstructors(data.instructors || []);
        setModalities(data.modalities || []);
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    // Log current user info for debugging
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        console.log('Current logged in user:', userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check if there's a student_id in URL params
    const studentIdParam = searchParams.get('student_id');
    if (studentIdParam) {
      // Find the student name from invoices to set searchTerm
      loadInvoices().then(() => {
        const studentInvoice = invoices.find(inv => inv.student_id === Number(studentIdParam));
        if (studentInvoice?.student_name) {
          setSearchTerm(studentInvoice.student_name);
        }
      });
    } else {
      loadInvoices();
    }
  }, [filter, instructorFilter, modalityFilter, selectedMonth]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Build params object
      const params: {
        status?: string;
        instructor_id?: number;
        modality_id?: number;
        reference_month?: string;
      } = {};

      // Don't pass status parameter for "all" or "due_soon" filters
      // "due_soon" will be filtered client-side
      if (filter !== 'all' && filter !== 'due_soon') {
        params.status = filter;
      }

      // Add instructor filter
      if (instructorFilter) {
        params.instructor_id = Number(instructorFilter);
      }

      // Add modality filter
      if (modalityFilter) {
        params.modality_id = Number(modalityFilter);
      }

      // Add month filter
      if (selectedMonth) {
        params.reference_month = selectedMonth;
      }

      console.log('Loading invoices with params:', params);
      const response = await financialService.getInvoices(Object.keys(params).length > 0 ? params : undefined);

      console.log('Load invoices response:', response);
      console.log('Filter:', filter);

      // Backend returns either { status: 'success', data: { invoices: [] } }
      // or { success: true, data: [] } depending on the endpoint
      const invoiceList = response.data?.invoices || response.data || [];

      console.log('Invoices loaded:', invoiceList.length);
      if (invoiceList.length > 0) {
        console.log('Invoice details:', invoiceList.map((inv: Invoice) => ({
          id: inv.id,
          status: inv.status,
          student_id: inv.student_id,
          amount: inv.final_amount_cents
        })));
      }

      setInvoices(invoiceList);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      alert('Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const confirmMsg = `Gerar faturas para o mês ${currentMonth}?\n\nIsso criará faturas para todas as matrículas ativas.`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await financialService.generateInvoices({
        reference_month: currentMonth,
      });

      console.log('Generate invoices response:', response);

      // A resposta pode vir como { status: 'success' } ou { message: 'success' }
      if ((response as any).status === 'success' || (response as any).success === true || response.message) {
        alert(response.message || 'Faturas geradas com sucesso!');
        // Aguardar um momento antes de recarregar para garantir que o backend processou
        setTimeout(() => {
          loadInvoices();
        }, 500);
      }
    } catch (error: any) {
      console.error('Erro ao gerar faturas:', error);
      alert(error.response?.data?.message || 'Erro ao gerar faturas');
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      invoice_id: invoice.id,
      paid_at: new Date().toISOString().split('T')[0],
      method: 'pix',
      amount_cents: invoice.final_amount_cents,
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Evita duplo clique
    setSubmitting(true);

    try {
      const response = await financialService.registerPayment(paymentData);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Pagamento registrado com sucesso!');
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) return;

    try {
      const response = await financialService.cancelInvoice(invoiceId);

      if ((response as any).status === 'success' || (response as any).success === true) {
        alert('Fatura cancelada com sucesso!');
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar fatura:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar fatura');
    }
  };

  const openEditPaymentModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    // Formata a data para o input date (YYYY-MM-DD)
    const paidAtDate = invoice.paid_at
      ? new Date(invoice.paid_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEditPaymentData({
      amount_cents: invoice.paid_amount_cents || invoice.final_amount_cents,
      paid_at: paidAtDate,
      notes: '',
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Evita duplo clique

    if (!editingInvoice || !editingInvoice.payment_id) {
      toast.error('Não foi possível identificar o pagamento');
      return;
    }

    const changes = [];
    if (editPaymentData.amount_cents !== (editingInvoice.paid_amount_cents || 0)) {
      changes.push(`Valor: ${formatPrice(editingInvoice.paid_amount_cents || 0)} → ${formatPrice(editPaymentData.amount_cents)}`);
    }
    const originalDate = editingInvoice.paid_at ? new Date(editingInvoice.paid_at).toISOString().split('T')[0] : '';
    if (editPaymentData.paid_at !== originalDate) {
      changes.push(`Data: ${formatDate(originalDate)} → ${formatDate(editPaymentData.paid_at)}`);
    }

    if (changes.length === 0) {
      toast.error('Nenhuma alteração foi feita');
      return;
    }

    const confirmMessage = `Confirma as seguintes alterações?\n\n${changes.join('\n')}\n\nIsso irá alterar o registro do pagamento.`;

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);

    try {
      const response = await financialService.updatePayment(editingInvoice.payment_id, {
        amount_cents: editPaymentData.amount_cents,
        paid_at: editPaymentData.paid_at,
        notes: editPaymentData.notes || undefined,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        const diff = response.data?.difference_cents || 0;
        const diffText = diff > 0 ? `+${formatPrice(diff)}` : diff < 0 ? formatPrice(diff) : 'sem alteração';
        toast.success(`Pagamento atualizado! Diferença no balanço: ${diffText}`);
        setShowEditPaymentModal(false);
        setEditingInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao editar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao editar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Adiciona T00:00:00 para interpretar como meia-noite local, não UTC
    // Isso evita o bug de mostrar 1 dia antes devido ao fuso horário
    const dateOnly = dateString.split('T')[0]; // Remove qualquer horário existente
    return new Date(dateOnly + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      aberta: { label: 'Aberta', class: 'status-open' },
      paga: { label: 'Paga', class: 'status-paid' },
      vencida: { label: 'Vencida', class: 'status-overdue' },
      cancelada: { label: 'Cancelada', class: 'status-cancelled' },
    };
    const info = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };

  // Total SEM desconto: soma o valor bruto (amount_cents) das faturas não canceladas
  const totalAmountGross = invoices
    .filter(inv => inv.status !== 'cancelada')
    .reduce((sum, inv) => sum + Number(inv.amount_cents || 0), 0);

  // Total COM desconto: soma o valor final (final_amount_cents) das faturas não canceladas
  const totalAmountNet = invoices
    .filter(inv => inv.status !== 'cancelada')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // Recebido: soma o valor REAL pago nas faturas pagas
  const paidAmount = invoices
    .filter(inv => inv.status === 'paga')
    .reduce((sum, inv) => sum + Number(inv.paid_amount_cents || 0), 0);

  // Previsto (valor das faturas pagas, sem considerar diferenças de pagamento)
  const expectedPaidAmount = invoices
    .filter(inv => inv.status === 'paga')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // A Vencer: soma faturas abertas (ainda não venceram e não foram pagas)
  const pendingAmount = invoices
    .filter(inv => inv.status === 'aberta')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // Inadimplente: soma apenas faturas vencidas
  const overdueAmount = invoices
    .filter(inv => inv.status === 'vencida')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  if (loading) {
    return <div className="loading">Carregando informações financeiras...</div>;
  }

  // Função para formatar o nome do mês
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Gerar lista de meses (últimos 12 meses + próximos 2)
  const getMonthOptions = () => {
    const months = [];
    const today = new Date();

    // 12 meses anteriores
    for (let i = 12; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      months.push({
        value,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    // 2 meses futuros
    for (let i = 1; i <= 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      months.push({
        value,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    return months;
  };

  return (
    <div className="financial-container">
      <div className="page-header">
        <h1>Financeiro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Seletor de Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const months = getMonthOptions();
                const currentIndex = months.findIndex(m => m.value === selectedMonth);
                if (currentIndex > 0) {
                  setSelectedMonth(months[currentIndex - 1].value);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Mês anterior"
            >
              ◀
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '200px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {getMonthOptions().map(month => (
                <option key={month.value} value={month.value} style={{ textTransform: 'capitalize' }}>
                  {month.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const months = getMonthOptions();
                const currentIndex = months.findIndex(m => m.value === selectedMonth);
                if (currentIndex < months.length - 1) {
                  setSelectedMonth(months[currentIndex + 1].value);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Próximo mês"
            >
              ▶
            </button>
          </div>
          <button type="button" className="btn-primary" onClick={handleGenerateInvoices}>
            Gerar Faturas do Mês
          </button>
        </div>
      </div>

      <div className="financial-stats">
        <div className="stat-card stat-total">
          <h3>Total (sem desconto)</h3>
          <p className="stat-value">{formatPrice(totalAmountGross)}</p>
          <small>{invoices.filter(i => i.status !== 'cancelada').length} faturas</small>
          {totalAmountGross !== totalAmountNet && (
            <small style={{ display: 'block', marginTop: '4px', color: '#27ae60' }}>
              Com desconto: {formatPrice(totalAmountNet)}
            </small>
          )}
        </div>
        <div className="stat-card stat-paid">
          <h3>Recebido</h3>
          <p className="stat-value">{formatPrice(paidAmount)}</p>
          <small>{invoices.filter(i => i.status === 'paga').length} pagas</small>
          {paidAmount !== expectedPaidAmount && (
            <small style={{ display: 'block', marginTop: '4px', color: '#7f8c8d' }}>
              Previsto: {formatPrice(expectedPaidAmount)}
            </small>
          )}
        </div>
        <div className="stat-card stat-pending">
          <h3>A Vencer</h3>
          <p className="stat-value">{formatPrice(pendingAmount)}</p>
          <small>{invoices.filter(i => i.status === 'aberta').length} abertas</small>
        </div>
        <div className="stat-card stat-overdue">
          <h3>Inadimplente</h3>
          <p className="stat-value">{formatPrice(overdueAmount)}</p>
          <small>{invoices.filter(i => i.status === 'vencida').length} vencidas</small>
        </div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          className={`filter-btn ${filter === 'aberta' ? 'active' : ''}`}
          onClick={() => setFilter('aberta')}
        >
          Abertas
        </button>
        <button
          className={`filter-btn ${filter === 'due_soon' ? 'active' : ''}`}
          onClick={() => setFilter('due_soon')}
        >
          Próximas a Vencer
        </button>
        <button
          className={`filter-btn ${filter === 'vencida' ? 'active' : ''}`}
          onClick={() => setFilter('vencida')}
        >
          Vencidas
        </button>
        <button
          className={`filter-btn ${filter === 'paga' ? 'active' : ''}`}
          onClick={() => setFilter('paga')}
        >
          Pagas
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="financial-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="advanced-filters">
        <div className="filter-group">
          <label htmlFor="instructor-filter">Instrutor:</label>
          <select
            id="instructor-filter"
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="modality-filter">Modalidade:</label>
          <select
            id="modality-filter"
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas</option>
            {modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>

        {(instructorFilter || modalityFilter) && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={() => {
              setInstructorFilter('');
              setModalityFilter('');
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Aluno</th>
              <th>Plano</th>
              <th>Referência</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Pago</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Filter invoices by search term and "due soon"
              let filteredInvoices = invoices;

              // Apply "due soon" filter (next 7 days)
              if (filter === 'due_soon') {
                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 7);

                filteredInvoices = filteredInvoices.filter(invoice => {
                  if (invoice.status !== 'aberta') return false;
                  const dueDate = new Date(invoice.due_date);
                  return dueDate >= today && dueDate <= sevenDaysFromNow;
                });
              }

              // Apply search filter
              if (searchTerm.trim()) {
                filteredInvoices = filteredInvoices.filter(invoice =>
                  (invoice.student_name || '')
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                );
              }

              return filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {searchTerm
                      ? `Nenhuma fatura encontrada para "${searchTerm}"`
                      : filter === 'all'
                      ? 'Nenhuma fatura encontrada. Clique em "Gerar Faturas do Mês" para começar.'
                      : filter === 'due_soon'
                      ? 'Nenhuma fatura próxima a vencer (próximos 7 dias).'
                      : `Nenhuma fatura ${filter} encontrada.`
                    }
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>#{invoice.id}</td>
                    <td>
                      <span
                        onClick={() => navigate(`/alunos/${invoice.student_id}`)}
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {invoice.student_name || `ID ${invoice.student_id}`}
                      </span>
                    </td>
                  <td>{invoice.plan_name || '-'}</td>
                  <td>{invoice.reference_month}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td className="amount-cell">
                    {invoice.discount_cents && invoice.discount_cents > 0 ? (
                      <>
                        <span className="original-amount">{formatPrice(invoice.amount_cents)}</span>
                        <span className="final-amount">{formatPrice(invoice.final_amount_cents)}</span>
                      </>
                    ) : (
                      formatPrice(invoice.final_amount_cents)
                    )}
                  </td>
                  <td className="amount-cell">
                    {invoice.status === 'paga' && invoice.paid_amount_cents ? (
                      <span
                        onClick={() => openEditPaymentModal(invoice)}
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Clique para editar o valor pago"
                      >
                        {formatPrice(invoice.paid_amount_cents)}
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>✏️</span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {invoice.status === 'aberta' || invoice.status === 'vencida' ? (
                        <>
                          <button
                            className="btn-action btn-pay"
                            onClick={() => openPaymentModal(invoice)}
                            title="Dar baixa"
                          >
                            💰
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() => handleCancelInvoice(invoice.id)}
                            title="Cancelar"
                          >
                            ❌
                          </button>
                        </>
                      ) : invoice.status === 'paga' ? (
                        <span className="paid-indicator" title={`Pago em ${formatDate(invoice.paid_at!)}`}>
                          ✅
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
              );
            })()}
          </tbody>
        </table>
      </div>

      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <h3>Detalhes da Fatura</h3>
              <p><strong>Aluno:</strong> {selectedInvoice.student_name}</p>
              <p><strong>Valor:</strong> {formatPrice(selectedInvoice.final_amount_cents)}</p>
              <p><strong>Vencimento:</strong> {formatDate(selectedInvoice.due_date)}</p>
            </div>

            <form onSubmit={handleRegisterPayment} className="payment-form">
              <div className="form-group">
                <label htmlFor="paid_at">Data do Pagamento *</label>
                <input
                  type="date"
                  id="paid_at"
                  value={paymentData.paid_at}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_at: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="method">Método de Pagamento *</label>
                <select
                  id="method"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as any })}
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount_cents">Valor Pago (R$) *</label>
                <input
                  type="number"
                  id="amount_cents"
                  step="0.01"
                  value={(paymentData.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    amount_cents: Math.round(parseFloat(e.target.value) * 100)
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Adicione observações sobre o pagamento (opcional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Pagamento */}
      {showEditPaymentModal && editingInvoice && (
        <div className="modal-overlay" onClick={() => setShowEditPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowEditPaymentModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <h3>Detalhes da Fatura</h3>
              <p><strong>Aluno:</strong> {editingInvoice.student_name}</p>
              <p><strong>Valor da fatura:</strong> {formatPrice(editingInvoice.final_amount_cents)}</p>
              <p><strong>Valor pago atual:</strong> {formatPrice(editingInvoice.paid_amount_cents || 0)}</p>
              <p><strong>Pago em:</strong> {editingInvoice.paid_at ? formatDate(editingInvoice.paid_at) : '-'}</p>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#856404'
            }}>
              ⚠️ <strong>Atenção:</strong> Alterar o valor do pagamento irá afetar o balanço financeiro.
            </div>

            <form onSubmit={handleEditPayment} className="payment-form">
              <div className="form-group">
                <label htmlFor="edit_paid_at">Data do Pagamento *</label>
                <input
                  type="date"
                  id="edit_paid_at"
                  value={editPaymentData.paid_at}
                  onChange={(e) => setEditPaymentData({
                    ...editPaymentData,
                    paid_at: e.target.value
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_amount_cents">Valor Pago (R$) *</label>
                <input
                  type="number"
                  id="edit_amount_cents"
                  step="0.01"
                  value={(editPaymentData.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setEditPaymentData({
                    ...editPaymentData,
                    amount_cents: Math.round(parseFloat(e.target.value) * 100)
                  })}
                  required
                />
                {editPaymentData.amount_cents !== (editingInvoice.paid_amount_cents || 0) && (
                  <small style={{
                    color: editPaymentData.amount_cents > (editingInvoice.paid_amount_cents || 0) ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    Diferença: {formatPrice(editPaymentData.amount_cents - (editingInvoice.paid_amount_cents || 0))}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit_notes">Motivo da alteração</label>
                <textarea
                  id="edit_notes"
                  rows={3}
                  value={editPaymentData.notes}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, notes: e.target.value })}
                  placeholder="Descreva o motivo da alteração (opcional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditPaymentModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Processando...' : 'Confirmar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
