import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { publicTrialBookingService } from '../services/publicTrialBookingService';
import type { TrialBookingDetails } from '../services/publicTrialBookingService';
import '../styles/PublicTrialBooking.css';

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
};

const STATUS_COLORS: Record<string, string> = {
  agendada: '#3B82F6',
  confirmada: '#22C55E',
  cancelada: '#EF4444',
  concluida: '#6B7280',
};

const WEEKDAY_LABELS: Record<string, string> = {
  seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira', qui: 'Quinta-feira',
  sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo',
};

export default function PublicTrialBookingStatus() {
  const { bookingToken } = useParams<{ bookingToken: string }>();
  const [booking, setBooking] = useState<TrialBookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingToken) return;
    loadBooking();
  }, [bookingToken]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await publicTrialBookingService.getTrialBookingByToken(bookingToken!);
      setBooking(response.data);
    } catch {
      setError('Agendamento não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingToken) return;
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    setCancelling(true);
    try {
      await publicTrialBookingService.cancelTrialBooking(bookingToken);
      loadBooking();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cancelar agendamento.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-error-card">
            <h2>Ops!</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="ptb-page">
      <div className="ptb-container">
        <div className="ptb-header">
          <h1>Detalhes do Agendamento</h1>
          <p className="ptb-subtitle">Aula Experimental</p>
        </div>

        <div className="ptb-step">
          {/* Status badge */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span
              className="ptb-status-badge"
              style={{ background: STATUS_COLORS[booking.status] || '#6B7280' }}
            >
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
          </div>

          <div className="ptb-confirm-card">
            <div className="ptb-confirm-row">
              <span>Aluno</span>
              <strong>{booking.student_name}</strong>
            </div>
            <div className="ptb-confirm-row">
              <span>Telefone</span>
              <strong>{booking.student_phone}</strong>
            </div>
            {booking.student_email && (
              <div className="ptb-confirm-row">
                <span>E-mail</span>
                <strong>{booking.student_email}</strong>
              </div>
            )}
            <div className="ptb-confirm-divider" />
            <div className="ptb-confirm-row">
              <span>Modalidade</span>
              <strong>{booking.modality_name}</strong>
            </div>
            <div className="ptb-confirm-row">
              <span>Turma</span>
              <strong>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: booking.color || '#3B82F6', marginRight: 6 }} />
                {booking.class_name}
              </strong>
            </div>
            <div className="ptb-confirm-row">
              <span>Dia</span>
              <strong>{WEEKDAY_LABELS[booking.weekday] || booking.weekday}</strong>
            </div>
            <div className="ptb-confirm-row">
              <span>Data</span>
              <strong>{formatDate(booking.attendance_date)}</strong>
            </div>
            <div className="ptb-confirm-row">
              <span>Horário</span>
              <strong>{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</strong>
            </div>
            {booking.location && (
              <div className="ptb-confirm-row">
                <span>Local</span>
                <strong>{booking.location}</strong>
              </div>
            )}
            {booking.notes && (
              <>
                <div className="ptb-confirm-divider" />
                <div className="ptb-confirm-row">
                  <span>Observações</span>
                  <strong>{booking.notes}</strong>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="ptb-error-inline" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          {/* Cancel button */}
          {(booking.status === 'agendada' || booking.status === 'confirmada') && (
            <button
              className="ptb-btn ptb-btn-danger"
              onClick={handleCancel}
              disabled={cancelling}
              style={{ width: '100%', marginTop: 16 }}
            >
              {cancelling ? 'Cancelando...' : 'Cancelar Agendamento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
