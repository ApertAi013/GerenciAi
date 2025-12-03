import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faArrowRight, faCalendarXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { financialService } from '../../services/financialService';
import type { Invoice } from '../../types/financialTypes';

export default function OverdueInvoicesWidget() {
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverdueInvoices = async () => {
      try {
        const response = await financialService.getInvoices({ status: 'vencida' });

        if ((response as any).status === 'success' || (response as any).success === true) {
          // Ordenar por data de vencimento (mais antigo primeiro)
          const sorted = response.data.invoices
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5);

          setOverdueInvoices(sorted);
        }
      } catch (error) {
        console.error('Erro ao buscar faturas vencidas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverdueInvoices();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    // Adiciona T00:00:00 para interpretar como meia-noite local, não UTC
    const dateOnly = dateString.split('T')[0];
    const date = new Date(dateOnly + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getDaysOverdue = (dateString: string) => {
    const dateOnly = dateString.split('T')[0];
    const dueDate = new Date(dateOnly + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza para meia-noite local
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#f5576c', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Faturas Vencidas</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/financeiro')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f5576c',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Ver tudo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {overdueInvoices.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#f0f9ff',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ color: '#38f9d7', fontWeight: 600, fontSize: '14px' }}>
            Nenhuma fatura vencida
          </div>
          <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
            Todas as cobranças estão em dia
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {overdueInvoices.map((invoice) => {
            const daysOverdue = getDaysOverdue(invoice.due_date);

            return (
              <div
                key={invoice.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#fff5f7',
                  borderRadius: '8px',
                  borderLeft: '3px solid #f5576c',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffe8ec';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff5f7';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                onClick={() => navigate('/financeiro')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      {invoice.student_name || `Matrícula #${invoice.enrollment_id}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      {invoice.plan_name || 'Plano não especificado'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#f5576c',
                    textAlign: 'right',
                  }}>
                    {formatCurrency(invoice.final_amount_cents)}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #ffe0e6',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <FontAwesomeIcon icon={faCalendarXmark} />
                    Venceu em {formatDate(invoice.due_date)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#f5576c',
                    background: '#ffe0e6',
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}>
                    {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} atraso
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
