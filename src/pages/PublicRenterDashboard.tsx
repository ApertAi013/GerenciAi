import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { publicBookingService } from '../services/publicBookingService';
import '../styles/PublicBooking.css';

interface RentalItem {
  id: number;
  court_name: string;
  rental_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  payment_status: string;
  rental_token: string;
  created_at: string;
}

export default function PublicRenterDashboard() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [renterName, setRenterName] = useState('');
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    loadRentals();
  }, [accessToken]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const response = await publicBookingService.getRenterRentals(accessToken!);
      setRenterName(response.data?.renter_name || '');
      setRentals(response.data?.rentals || []);
    } catch {
      setError('Não foi possível carregar suas reservas.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (t: string) => t ? t.substring(0, 5) : '';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'agendada': return { bg: '#DBEAFE', color: '#1D4ED8', label: 'Agendada' };
      case 'confirmada': return { bg: '#D1FAE5', color: '#065F46', label: 'Confirmada' };
      case 'cancelada': return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada' };
      case 'concluida': return { bg: '#E5E7EB', color: '#374151', label: 'Concluída' };
      default: return { bg: '#F3F4F6', color: '#6B7280', label: status };
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingRentals = rentals.filter(r => {
    const rDate = typeof r.rental_date === 'string' ? r.rental_date.split('T')[0] : '';
    return rDate >= today && r.status !== 'cancelada';
  });
  const pastRentals = rentals.filter(r => {
    const rDate = typeof r.rental_date === 'string' ? r.rental_date.split('T')[0] : '';
    return rDate < today || r.status === 'cancelada';
  });

  if (loading) {
    return <div className="pb-page"><div className="pb-loading">Carregando...</div></div>;
  }

  if (error) {
    return (
      <div className="pb-page">
        <div className="pb-error-card">
          <h2>Ops!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-header">
          <h1>Minhas Reservas</h1>
          {renterName && <p className="pb-subtitle">Olá, {renterName}!</p>}
        </div>

        {/* Upcoming */}
        <div className="pb-step" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem' }}>Próximas Reservas</h2>
          {upcomingRentals.length === 0 ? (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>
              Nenhuma reserva futura.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {upcomingRentals.map((rental) => {
                const st = getStatusStyle(rental.status);
                const rDate = typeof rental.rental_date === 'string' ? rental.rental_date.split('T')[0] : '';
                return (
                  <Link
                    key={rental.id}
                    to={`/reserva/${rental.rental_token}`}
                    style={{
                      display: 'block',
                      padding: '14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                          {rental.court_name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                          {formatDate(rDate)} | {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: st.bg,
                          color: st.color,
                        }}>
                          {st.label}
                        </span>
                        {rental.price_cents > 0 && (
                          <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                            R$ {(rental.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Past */}
        {pastRentals.length > 0 && (
          <div className="pb-step">
            <h2 style={{ fontSize: '1.1rem', color: '#6B7280' }}>Reservas Anteriores</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {pastRentals.map((rental) => {
                const st = getStatusStyle(rental.status);
                const rDate = typeof rental.rental_date === 'string' ? rental.rental_date.split('T')[0] : '';
                return (
                  <Link
                    key={rental.id}
                    to={`/reserva/${rental.rental_token}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                        {rental.court_name}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: '0.8rem', marginLeft: '8px' }}>
                        {formatDate(rDate)} {formatTime(rental.start_time)}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      background: st.bg,
                      color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
