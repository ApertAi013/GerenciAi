import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { publicBookingService } from '../services/publicBookingService';
import type { PublicRental } from '../services/publicBookingService';
import '../styles/PublicBooking.css';

export default function PublicRentalStatus() {
  const { rentalToken } = useParams<{ rentalToken: string }>();
  const [rental, setRental] = useState<PublicRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelResult, setCancelResult] = useState<any>(null);

  useEffect(() => {
    if (!rentalToken) return;
    loadRental();
  }, [rentalToken]);

  const loadRental = async () => {
    try {
      setLoading(true);
      const response = await publicBookingService.getRentalByToken(rentalToken!);
      setRental(response.data);
    } catch {
      setError('Reserva não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await publicBookingService.cancelRental(rentalToken!);
      setCancelResult(response.data);
      setShowCancelConfirm(false);
      loadRental();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cancelar');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'confirmada': return 'Confirmada';
      case 'cancelada': return 'Cancelada';
      case 'concluida': return 'Concluída';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return { bg: '#DBEAFE', color: '#1D4ED8' };
      case 'confirmada': return { bg: '#D1FAE5', color: '#065F46' };
      case 'cancelada': return { bg: '#FEE2E2', color: '#991B1B' };
      case 'concluida': return { bg: '#E5E7EB', color: '#374151' };
      default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (t: string) => t ? t.substring(0, 5) : '';

  if (loading) {
    return <div className="pb-page"><div className="pb-loading">Carregando...</div></div>;
  }

  if (error || !rental) {
    return (
      <div className="pb-page">
        <div className="pb-error-card">
          <h2>Ops!</h2>
          <p>{error || 'Reserva não encontrada.'}</p>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusColor(rental.status);
  const rentalDate = typeof rental.rental_date === 'string'
    ? rental.rental_date.split('T')[0]
    : new Date(rental.rental_date).toISOString().split('T')[0];
  const canCancel = rental.status === 'agendada' || rental.status === 'confirmada';

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-header">
          <h1>Detalhes da Reserva</h1>
        </div>

        <div className="pb-step">
          {/* Status badge */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}>
              {getStatusLabel(rental.status)}
            </span>
          </div>

          {cancelResult && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: cancelResult.cancellation_fee_cents > 0 ? '#FEF3C7' : '#D1FAE5',
              color: cancelResult.cancellation_fee_cents > 0 ? '#92400E' : '#065F46',
              marginBottom: '16px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}>
              {cancelResult.cancellation_fee_cents > 0
                ? `Reserva cancelada com taxa de R$${(cancelResult.cancellation_fee_cents / 100).toFixed(2)}`
                : 'Reserva cancelada com sucesso!'}
            </div>
          )}

          <div className="pb-confirm-card">
            <div className="pb-confirm-row">
              <span className="pb-confirm-label">Quadra</span>
              <span className="pb-confirm-value">{rental.court_name}</span>
            </div>
            <div className="pb-confirm-row">
              <span className="pb-confirm-label">Data</span>
              <span className="pb-confirm-value">{formatDate(rentalDate)}</span>
            </div>
            <div className="pb-confirm-row">
              <span className="pb-confirm-label">Horário</span>
              <span className="pb-confirm-value">
                {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
              </span>
            </div>
            <div className="pb-confirm-row">
              <span className="pb-confirm-label">Reservante</span>
              <span className="pb-confirm-value">{rental.renter_name}</span>
            </div>
            {rental.price_cents > 0 && (
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Valor</span>
                <span className="pb-confirm-value pb-confirm-price">
                  R$ {(rental.price_cents / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="pb-confirm-row">
              <span className="pb-confirm-label">Pagamento</span>
              <span className="pb-confirm-value">
                {rental.payment_status === 'paga' ? 'Pago' : rental.payment_status === 'pendente' ? 'Pendente' : rental.payment_status}
              </span>
            </div>
          </div>

          {/* Cancellation policy info */}
          {canCancel && rental.cancellation_deadline_hours != null && (
            <div className="pb-confirm-policy" style={{ marginTop: '16px' }}>
              Cancelamento gratuito até {rental.cancellation_deadline_hours}h antes do horário.
              {rental.court_cancellation_fee ? ` Após: taxa de R$${(rental.court_cancellation_fee / 100).toFixed(2)}.` : ''}
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div style={{ marginTop: '20px' }}>
              {!showCancelConfirm ? (
                <button
                  className="pb-btn pb-btn-danger pb-btn-full"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancelar Reserva
                </button>
              ) : (
                <div style={{ background: '#FEE2E2', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 12px', color: '#991B1B', fontWeight: 500 }}>
                    Tem certeza que deseja cancelar esta reserva?
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="pb-btn pb-btn-secondary"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Não
                    </button>
                    <button
                      className="pb-btn pb-btn-danger"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
