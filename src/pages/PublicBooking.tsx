import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import { publicBookingService } from '../services/publicBookingService';
import type { PublicCourt, TimeSlot } from '../services/publicBookingService';
import '../styles/PublicBooking.css';

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function PublicBooking() {
  // Public pages always use light theme
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => { if (prev) document.documentElement.setAttribute('data-theme', prev); };
  }, []);

  const { bookingToken } = useParams<{ bookingToken: string }>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [courts, setCourts] = useState<PublicCourt[]>([]);

  // Step 1: Identification
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');

  // Step 2: Court selection
  const [selectedCourt, setSelectedCourt] = useState<PublicCourt | null>(null);

  // Step 3: Date & time
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 5: Success
  const [submitting, setSubmitting] = useState(false);
  const [rentalToken, setRentalToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (!bookingToken) return;
    loadBookingInfo();
  }, [bookingToken]);

  const loadBookingInfo = async () => {
    try {
      setLoading(true);
      const response = await publicBookingService.getAvailableCourts(bookingToken!);
      setCourts(response.data || []);
      const infoResponse = await publicBookingService.getBookingInfo(bookingToken!);
      setBusinessName(infoResponse.data?.business_name || '');
      setBusinessDescription(infoResponse.data?.business_description || '');
      setLogoUrl(infoResponse.data?.logo_url || '');
    } catch {
      setError('Link de reserva inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (!selectedCourt || !date) return;

    setLoadingSlots(true);
    try {
      const response = await publicBookingService.getAvailableSlots(bookingToken!, selectedCourt.id, date);
      setSlots(response.data?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmitReservation = async () => {
    if (!selectedCourt || !selectedSlot || !selectedDate) return;

    setSubmitting(true);
    try {
      const response = await publicBookingService.createReservation(bookingToken!, {
        name,
        phone,
        cpf: cpf || undefined,
        court_id: selectedCourt.id,
        rental_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      });
      setRentalToken(response.data?.rental_token || '');
      setAccessToken(response.data?.access_token || '');
      setStep(5);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao criar reserva';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate next 14 days for date picker
  const getDateOptions = () => {
    const dates = [];
    const maxDays = selectedCourt?.max_advance_booking_days || 30;
    const limit = Math.min(maxDays, 30);
    for (let i = 0; i < limit; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  if (loading) {
    return (
      <div className="pb-page">
        <div className="pb-loading">Carregando...</div>
      </div>
    );
  }

  if (error && step !== 4) {
    return (
      <div className="pb-page">
        <div className="pb-error-card">
          <h2>Ops!</h2>
          <p>{error}</p>
          {step > 1 && (
            <button className="pb-btn pb-btn-primary" onClick={() => { setError(''); setStep(step); }}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-page">
      <div className="pb-container">
        {/* Header */}
        <div className="pb-header">
          {logoUrl && <img src={logoUrl} alt="" className="pb-logo" />}
          <h1>{businessName || 'Reserva de Quadra'}</h1>
          <p className="pb-subtitle">{businessDescription || 'Reserve seu horário online'}</p>
        </div>

        {/* Progress */}
        {step < 5 && (
          <div className="pb-progress">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`pb-progress-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
                <div className="pb-progress-dot">{s}</div>
                <span className="pb-progress-label">
                  {s === 1 ? 'Dados' : s === 2 ? 'Quadra' : s === 3 ? 'Horário' : 'Confirmar'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Identification */}
        {step === 1 && (
          <div className="pb-step">
            <h2>Seus dados</h2>
            <p className="pb-step-desc">Informe seus dados para realizar a reserva.</p>

            <div className="pb-form-group">
              <label>Nome completo *</label>
              <input
                type="text" value={name} required
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="pb-form-group">
              <label>Telefone *</label>
              <input
                type="tel" value={phone} required
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="pb-form-group">
              <label>CPF (opcional)</label>
              <input
                type="text" value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <button
              className="pb-btn pb-btn-primary pb-btn-full"
              disabled={!name.trim() || !phone.trim()}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Court Selection */}
        {step === 2 && (
          <div className="pb-step">
            <h2>Escolha a quadra</h2>
            <p className="pb-step-desc">Selecione a quadra que deseja reservar.</p>

            <div className="pb-courts-grid">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className={`pb-court-card ${selectedCourt?.id === court.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCourt(court)}
                >
                  <h3>{court.name}</h3>
                  {court.description && <p>{court.description}</p>}
                  {court.default_price_cents != null && court.default_price_cents > 0 && (
                    <span className="pb-court-price">
                      R$ {(court.default_price_cents / 100).toFixed(2)}/hora
                    </span>
                  )}
                  {/* Show active days */}
                  {court.operating_hours && court.operating_hours.length > 0 && (
                    <div className="pb-court-days">
                      {DAY_NAMES_SHORT.map((day, i) => {
                        const h = court.operating_hours?.find(oh => oh.day_of_week === i);
                        const active = h?.is_active;
                        return (
                          <span key={i} className={`pb-day-chip ${active ? 'active' : ''}`}>
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pb-step-actions">
              <button className="pb-btn pb-btn-secondary" onClick={() => setStep(1)}>Voltar</button>
              <button
                className="pb-btn pb-btn-primary"
                disabled={!selectedCourt}
                onClick={() => { setStep(3); setSelectedDate(''); setSlots([]); setSelectedSlot(null); }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {step === 3 && selectedCourt && (
          <div className="pb-step">
            <h2>Data e Horário</h2>
            <p className="pb-step-desc">
              Quadra: <strong>{selectedCourt.name}</strong>
            </p>

            {/* Date picker */}
            <div className="pb-date-scroll">
              {getDateOptions().map((d) => {
                const dateStr = d.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const dayName = DAY_NAMES_SHORT[d.getDay()];
                return (
                  <div
                    key={dateStr}
                    className={`pb-date-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateChange(dateStr)}
                  >
                    <span className="pb-date-day">{dayName}</span>
                    <span className="pb-date-num">{d.getDate()}</span>
                    <span className="pb-date-month">{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '12px' }}>
                  Horários disponíveis
                </h3>
                {loadingSlots ? (
                  <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>Carregando horários...</p>
                ) : slots.length === 0 ? (
                  <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>
                    Nenhum horário disponível nesta data.
                  </p>
                ) : (
                  <div className="pb-slots-grid">
                    {slots.map((slot, i) => (
                      <div
                        key={i}
                        className={`pb-slot ${!slot.is_available ? 'unavailable' : ''} ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => slot.is_available && setSelectedSlot(slot)}
                      >
                        <span className="pb-slot-time">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {slot.is_available && slot.price_cents > 0 && (
                          <span className="pb-slot-price">
                            R$ {(slot.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                        {!slot.is_available && <span className="pb-slot-label">Ocupado</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pb-step-actions">
              <button className="pb-btn pb-btn-secondary" onClick={() => setStep(2)}>Voltar</button>
              <button
                className="pb-btn pb-btn-primary"
                disabled={!selectedSlot}
                onClick={() => setStep(4)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedCourt && selectedSlot && (
          <div className="pb-step">
            <h2>Confirmar Reserva</h2>

            {error && (
              <div className="pb-error-inline">
                {error}
                <button onClick={() => setError('')} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  x
                </button>
              </div>
            )}

            <div className="pb-confirm-card">
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Quadra</span>
                <span className="pb-confirm-value">{selectedCourt.name}</span>
              </div>
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Data</span>
                <span className="pb-confirm-value">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </span>
              </div>
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Horário</span>
                <span className="pb-confirm-value">{selectedSlot.start_time} - {selectedSlot.end_time}</span>
              </div>
              {selectedSlot.price_cents > 0 && (
                <div className="pb-confirm-row">
                  <span className="pb-confirm-label">Valor</span>
                  <span className="pb-confirm-value pb-confirm-price">
                    R$ {(selectedSlot.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Reservante</span>
                <span className="pb-confirm-value">{name} | {phone}</span>
              </div>
              {selectedCourt.cancellation_deadline_hours != null && (
                <div className="pb-confirm-policy">
                  Cancelamento gratuito até {selectedCourt.cancellation_deadline_hours}h antes do horário.
                  {selectedCourt.cancellation_fee_cents ? ` Após: taxa de R$${(selectedCourt.cancellation_fee_cents / 100).toFixed(2)}.` : ''}
                </div>
              )}
            </div>

            <div className="pb-step-actions">
              <button className="pb-btn pb-btn-secondary" onClick={() => setStep(3)}>Voltar</button>
              <button
                className="pb-btn pb-btn-primary"
                onClick={handleSubmitReservation}
                disabled={submitting}
              >
                {submitting ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="pb-step pb-success-step">
            <div className="pb-success-icon">✓</div>
            <h2>Reserva Confirmada!</h2>
            <p className="pb-step-desc">
              Sua reserva foi realizada com sucesso.
            </p>

            <div className="pb-confirm-card">
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Quadra</span>
                <span className="pb-confirm-value">{selectedCourt?.name}</span>
              </div>
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Data</span>
                <span className="pb-confirm-value">
                  {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </span>
              </div>
              <div className="pb-confirm-row">
                <span className="pb-confirm-label">Horário</span>
                <span className="pb-confirm-value">{selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
              </div>
            </div>

            {/* Tracking link - copiável */}
            {rentalToken && (
              <div style={{
                marginTop: '20px', padding: '14px', background: '#F0FDF4',
                borderRadius: '10px', border: '1px solid #BBF7D0',
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>
                  Link para acompanhar sua reserva:
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text" readOnly
                    value={`${window.location.origin}/reserva/${rentalToken}`}
                    style={{
                      flex: 1, padding: '8px 12px', border: '1px solid #BBF7D0',
                      borderRadius: '6px', fontSize: '0.8rem', background: 'white',
                      color: '#1F2937', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/reserva/${rentalToken}`);
                      alert('Link copiado!');
                    }}
                    style={{
                      padding: '8px 14px', background: '#22C55E', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap',
                    }}
                  >
                    Copiar
                  </button>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                  Salve este link para ver status, cancelar ou reagendar.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {selectedDate && selectedSlot && selectedCourt && (
                <a
                  href={(() => {
                    const dateStr = selectedDate.replace(/-/g, '');
                    const startStr = selectedSlot.start_time.replace(':', '') + '00';
                    const endStr = selectedSlot.end_time.replace(':', '') + '00';
                    const title = encodeURIComponent(`Reserva Quadra - ${selectedCourt.name}`);
                    const details = encodeURIComponent(`Quadra: ${selectedCourt.name}\nHorário: ${selectedSlot.start_time} - ${selectedSlot.end_time}`);
                    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${startStr}/${dateStr}T${endStr}&details=${details}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pb-btn pb-btn-secondary pb-btn-full"
                  style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <FontAwesomeIcon icon={faCalendarPlus} /> Adicionar ao Google Calendar
                </a>
              )}
              {rentalToken && (
                <a
                  href={`/reserva/${rentalToken}`}
                  className="pb-btn pb-btn-primary pb-btn-full"
                  style={{ textAlign: 'center', textDecoration: 'none' }}
                >
                  Ver Detalhes da Reserva
                </a>
              )}
              {accessToken && (
                <a
                  href={`/minhas-reservas/${accessToken}`}
                  className="pb-btn pb-btn-secondary pb-btn-full"
                  style={{ textAlign: 'center', textDecoration: 'none' }}
                >
                  Ver Todas as Minhas Reservas
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
