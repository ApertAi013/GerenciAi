import { useState, useEffect } from 'react';
import { financialService } from '../services/financialService';
import type { Invoice, RegisterPaymentRequest } from '../types/financialTypes';
import '../styles/Financial.css';

export default function Financial() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'aberta' | 'paga' | 'vencida'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState<RegisterPaymentRequest>({
    invoice_id: 0,
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix',
    amount_cents: 0,
    notes: '',
  });

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await financialService.getInvoices(params);

      if (response.status === 'success' && response.data?.invoices) {
        setInvoices(response.data.invoices);
      }
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

      if (response.status === 'success') {
        alert('Faturas geradas com sucesso!');
        loadInvoices();
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

    try {
      const response = await financialService.registerPayment(paymentData);

      if (response.status === 'success') {
        alert('Pagamento registrado com sucesso!');
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      alert(error.response?.data?.message || 'Erro ao registrar pagamento');
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) return;

    try {
      const response = await financialService.cancelInvoice(invoiceId);

      if (response.status === 'success') {
        alert('Fatura cancelada com sucesso!');
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar fatura:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar fatura');
    }
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.final_amount_cents, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paga')
    .reduce((sum, inv) => sum + inv.final_amount_cents, 0);
  const overdueAmount = invoices
    .filter(inv => inv.status === 'vencida')
    .reduce((sum, inv) => sum + inv.final_amount_cents, 0);

  if (loading) {
    return <div className="loading">Carregando informações financeiras...</div>;
  }

  return (
    <div className="financial-container">
      <div className="page-header">
        <h1>Financeiro</h1>
        <button type="button" className="btn-primary" onClick={handleGenerateInvoices}>
          Gerar Faturas do Mês
        </button>
      </div>

      <div className="financial-stats">
        <div className="stat-card stat-total">
          <h3>Total</h3>
          <p className="stat-value">{formatPrice(totalAmount)}</p>
          <small>{invoices.length} faturas</small>
        </div>
        <div className="stat-card stat-paid">
          <h3>Recebido</h3>
          <p className="stat-value">{formatPrice(paidAmount)}</p>
          <small>{invoices.filter(i => i.status === 'paga').length} pagas</small>
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
          className={`filter-btn ${filter === 'paga' ? 'active' : ''}`}
          onClick={() => setFilter('paga')}
        >
          Pagas
        </button>
        <button
          className={`filter-btn ${filter === 'vencida' ? 'active' : ''}`}
          onClick={() => setFilter('vencida')}
        >
          Vencidas
        </button>
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
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  {filter === 'all'
                    ? 'Nenhuma fatura encontrada. Clique em "Gerar Faturas do Mês" para começar.'
                    : `Nenhuma fatura ${filter} encontrada.`
                  }
                </td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>#{invoice.id}</td>
                  <td>{invoice.student_name || `ID ${invoice.student_id}`}</td>
                  <td>{invoice.plan_name || '-'}</td>
                  <td>{invoice.reference_month}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td className="amount-cell">
                    {invoice.discount_cents ? (
                      <>
                        <span className="original-amount">{formatPrice(invoice.amount_cents)}</span>
                        <span className="final-amount">{formatPrice(invoice.final_amount_cents)}</span>
                      </>
                    ) : (
                      formatPrice(invoice.final_amount_cents)
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
            )}
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
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
