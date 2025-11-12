import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faArrowRight, faCircleCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { financialService } from '../../services/financialService';
import type { Invoice } from '../../types/financialTypes';

export default function FinancialPreviewWidget() {
  const [stats, setStats] = useState({
    pending: 0,
    overdue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await financialService.getInvoices();

        if ((response as any).status === 'success' || (response as any).success === true) {
          const invoices = response.data.invoices;

          const pending = invoices.filter((inv: Invoice) => inv.status === 'aberta');
          const overdue = invoices.filter((inv: Invoice) =>
            inv.status === 'vencida'
          );

          setStats({
            pending: pending.length,
            overdue: overdue.length,
            pendingAmount: pending.reduce((sum: number, inv: Invoice) => sum + inv.final_amount_cents / 100, 0),
            overdueAmount: overdue.reduce((sum: number, inv: Invoice) => sum + inv.final_amount_cents / 100, 0),
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: '#38f9d7', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Financeiro</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/financeiro')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38f9d7',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Ver tudo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '16px',
          borderRadius: '12px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faCircleCheck} />
            <span style={{ fontSize: '12px', opacity: 0.9 }}>A RECEBER</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            {formatCurrency(stats.pendingAmount)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            {stats.pending} {stats.pending === 1 ? 'fatura' : 'faturas'}
          </div>
        </div>

        <div style={{
          background: stats.overdue > 0
            ? 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
            : 'linear-gradient(135deg, #a8a8a8 0%, #d0d0d0 100%)',
          padding: '16px',
          borderRadius: '12px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faCircleExclamation} />
            <span style={{ fontSize: '12px', opacity: 0.9 }}>VENCIDAS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            {formatCurrency(stats.overdueAmount)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            {stats.overdue} {stats.overdue === 1 ? 'fatura' : 'faturas'}
          </div>
        </div>
      </div>
    </div>
  );
}
