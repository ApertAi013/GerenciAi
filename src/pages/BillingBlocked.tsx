import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCopy,
  faCheckCircle,
  faSpinner,
  faSignOutAlt,
  faSync,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/BillingBlocked.css';

interface PendingInvoice {
  id: number;
  reference_month: string;
  due_date: string;
  final_amount_cents: number;
  status: string;
  asaas_pix_payload: string | null;
  asaas_pix_qr_image: string | null;
}

export default function BillingBlocked() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [invoice, setInvoice] = useState<PendingInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If user is not blocked, redirect to dashboard
    if (user && user.billing_status && user.billing_status !== 'blocked' && user.billing_status !== 'past_due') {
      navigate('/dashboard');
      return;
    }
    fetchPendingInvoice();
  }, [user, navigate]);

  const fetchPendingInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/platform-billing/my-pending-invoice');
      if (response.data?.data) {
        setInvoice(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!invoice?.asaas_pix_payload) return;
    try {
      await navigator.clipboard.writeText(invoice.asaas_pix_payload);
      setCopied(true);
      toast.success('Codigo PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleCheckPayment = async () => {
    setChecking(true);
    try {
      // Re-fetch user data to check if billing_status changed
      const response = await authService.getMe();
      const userData = response.data || (response as any).user;

      if (userData && (userData.billing_status === 'active' || userData.billing_status === 'trial')) {
        toast.success('Pagamento confirmado! Redirecionando...');
        const token = authService.getToken();
        if (token) {
          useAuthStore.getState().setAuth(userData, token);
        }
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast('Pagamento ainda nao confirmado. Aguarde alguns minutos apos o pagamento.', {
          icon: '⏳',
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error('Erro ao verificar pagamento');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    authService.removeToken();
    navigate('/login');
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]}/${year}`;
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="billing-blocked-page">
        <div className="billing-blocked-card">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="billing-blocked-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-blocked-page">
      <div className="billing-blocked-card">
        <div className="billing-blocked-icon">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>

        <h1>Conta Suspensa</h1>
        <p className="billing-blocked-subtitle">
          Sua conta esta suspensa por pendencia financeira. Realize o pagamento para liberar o acesso.
        </p>

        {invoice ? (
          <div className="billing-blocked-invoice">
            <div className="billing-blocked-invoice-details">
              <div className="billing-blocked-detail-row">
                <span>Referencia</span>
                <strong>{formatMonth(invoice.reference_month)}</strong>
              </div>
              <div className="billing-blocked-detail-row">
                <span>Vencimento</span>
                <strong>{formatDate(invoice.due_date)}</strong>
              </div>
              <div className="billing-blocked-detail-row billing-blocked-total">
                <span>Valor</span>
                <strong>{formatCurrency(invoice.final_amount_cents)}</strong>
              </div>
            </div>

            {invoice.asaas_pix_qr_image && (
              <div className="billing-blocked-qr">
                <p className="billing-blocked-qr-label">Escaneie o QR Code para pagar via PIX</p>
                <img
                  src={`data:image/png;base64,${invoice.asaas_pix_qr_image}`}
                  alt="QR Code PIX"
                  className="billing-blocked-qr-image"
                />
              </div>
            )}

            {invoice.asaas_pix_payload && (
              <button
                className="billing-blocked-btn billing-blocked-btn-copy"
                onClick={handleCopyPix}
              >
                <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
                {copied ? 'Copiado!' : 'Copiar codigo PIX'}
              </button>
            )}
          </div>
        ) : (
          <div className="billing-blocked-no-invoice">
            <p>Nenhuma fatura pendente encontrada. Entre em contato com o suporte.</p>
          </div>
        )}

        <div className="billing-blocked-info">
          Apos o pagamento, o acesso e liberado automaticamente em ate 5 minutos.
        </div>

        <div className="billing-blocked-actions">
          <button
            className="billing-blocked-btn billing-blocked-btn-check"
            onClick={handleCheckPayment}
            disabled={checking}
          >
            <FontAwesomeIcon icon={checking ? faSpinner : faSync} spin={checking} />
            {checking ? 'Verificando...' : 'Ja paguei, verificar'}
          </button>

          <button
            className="billing-blocked-btn billing-blocked-btn-logout"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
