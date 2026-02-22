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

export default function PublicTrialStudentDashboard() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [studentName, setStudentName] = useState('');
  const [bookings, setBookings] = useState<TrialBookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadBookings();
  }, [accessToken]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await publicTrialBookingService.getTrialStudentBookings(accessToken!);
      setStudentName(response.data?.student_name || '');
      setBookings(response.data?.bookings || []);
    } catch {
      setError('Aluno não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = bookings.filter((b) => {
    const d = new Date(b.attendance_date.split('T')[0] + 'T12:00:00');
    return d >= now && b.status !== 'cancelada';
  });

  const past = bookings.filter((b) => {
    const d = new Date(b.attendance_date.split('T')[0] + 'T12:00:00');
    return d < now || b.status === 'cancelada';
  });

  if (loading) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="ptb-page">
      <div className="ptb-container">
        <div className="ptb-header">
          <h1>Meus Agendamentos</h1>
          <p className="ptb-subtitle">{studentName}</p>
        </div>

        {bookings.length === 0 ? (
          <div className="ptb-step">
            <p className="ptb-empty" style={{ textAlign: 'center' }}>Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="ptb-step">
                <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Próximas Aulas ({upcoming.length})</h2>
                <div className="ptb-bookings-list">
                  {upcoming.map((b) => (
                    <a
                      key={b.id}
                      href={`/aula-experimental/status/${b.booking_token}`}
                      className="ptb-booking-card"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="ptb-booking-color" style={{ background: b.color || '#3B82F6' }} />
                      <div className="ptb-booking-info">
                        <div className="ptb-booking-title">{b.class_name} — {b.modality_name}</div>
                        <div className="ptb-booking-meta">
                          {formatDate(b.attendance_date)} · {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                        </div>
                      </div>
                      <span
                        className="ptb-status-badge-sm"
                        style={{ background: STATUS_COLORS[b.status] || '#6B7280' }}
                      >
                        {STATUS_LABELS[b.status]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="ptb-step" style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#6B7280' }}>Histórico ({past.length})</h2>
                <div className="ptb-bookings-list">
                  {past.map((b) => (
                    <a
                      key={b.id}
                      href={`/aula-experimental/status/${b.booking_token}`}
                      className="ptb-booking-card past"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="ptb-booking-color" style={{ background: b.color || '#3B82F6', opacity: 0.4 }} />
                      <div className="ptb-booking-info">
                        <div className="ptb-booking-title">{b.class_name} — {b.modality_name}</div>
                        <div className="ptb-booking-meta">
                          {formatDate(b.attendance_date)} · {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                        </div>
                      </div>
                      <span
                        className="ptb-status-badge-sm"
                        style={{ background: STATUS_COLORS[b.status] || '#6B7280' }}
                      >
                        {STATUS_LABELS[b.status]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
