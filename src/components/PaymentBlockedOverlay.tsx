import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faClock, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { platformBillingService } from '../services/platformBillingService';
import toast from 'react-hot-toast';

interface Props {
  billingStatus: string;
  onDismiss?: () => void;
}

export default function PaymentBlockedOverlay({ billingStatus, onDismiss }: Props) {
  const navigate = useNavigate();
  const [promising, setPromising] = useState(false);

  if (billingStatus !== 'blocked' && billingStatus !== 'past_due') return null;

  const isBlocked = billingStatus === 'blocked';

  const handlePromise = async () => {
    if (!window.confirm('Voce tera mais 3 dias para realizar o pagamento. Deseja continuar?')) return;
    setPromising(true);
    try {
      const res = await platformBillingService.promisePayment();
      const until = res.data?.promise_until ? new Date(res.data.promise_until).toLocaleDateString('pt-BR') : '';
      toast.success(`Acesso liberado ate ${until}`);
      onDismiss?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar promessa');
    } finally {
      setPromising(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, maxWidth: 480,
        width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32, margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isBlocked ? '#FEE2E2' : '#FEF3C7',
        }}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ fontSize: 28, color: isBlocked ? '#EF4444' : '#F59E0B' }}
          />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
          {isBlocked ? 'Acesso Bloqueado' : 'Pagamento Pendente'}
        </h2>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
          {isBlocked
            ? 'Sua conta esta bloqueada por pendencia financeira. Realize o pagamento para liberar o acesso.'
            : 'Voce possui faturas vencidas. Regularize para evitar o bloqueio do sistema.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/meu-plano')}
            style={{
              padding: '14px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#FF9900', color: '#fff', fontWeight: 600, fontSize: 15,
            }}
          >
            <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 8 }} />
            Ver Faturas e Pagar
          </button>

          {isBlocked && (
            <button
              onClick={handlePromise}
              disabled={promising}
              style={{
                padding: '14px 24px', borderRadius: 8, border: '2px solid #D1D5DB', cursor: 'pointer',
                background: '#fff', color: '#374151', fontWeight: 600, fontSize: 15,
                opacity: promising ? 0.6 : 1,
              }}
            >
              <FontAwesomeIcon icon={faClock} style={{ marginRight: 8 }} />
              {promising ? 'Processando...' : 'Prometer Pagamento (+3 dias)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
