import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { publicTrialBookingService } from '../services/publicTrialBookingService';
import type { TrialModality, TrialClass, TrialAvailability } from '../services/publicTrialBookingService';
import '../styles/PublicTrialBooking.css';

const WEEKDAY_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
  sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};
const WEEKDAY_MAP: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

export default function PublicTrialBooking() {
  const { bookingToken } = useParams<{ bookingToken: string }>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Business info
  const [businessName, setBusinessName] = useState('');

  // Step 1: Identification
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Modality
  const [modalities, setModalities] = useState<TrialModality[]>([]);
  const [selectedModality, setSelectedModality] = useState<TrialModality | null>(null);

  // Step 3: Class + Date
  const [classes, setClasses] = useState<TrialClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TrialClass | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<TrialAvailability | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Step 5: Success
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    if (!bookingToken) return;
    loadInfo();
  }, [bookingToken]);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const response = await publicTrialBookingService.getBookingInfo(bookingToken!);
      setBusinessName(response.data?.business_name || '');

      const modResponse = await publicTrialBookingService.getAvailableModalities(bookingToken!);
      setModalities(modResponse.data || []);
    } catch {
      setError('Link de agendamento inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModality = async (mod: TrialModality) => {
    setSelectedModality(mod);
    setSelectedClass(null);
    setSelectedDate('');
    setAvailability(null);
    setLoadingClasses(true);
    try {
      const response = await publicTrialBookingService.getAvailableClasses(bookingToken!, mod.id);
      setClasses(response.data || []);
    } catch {
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
    setStep(3);
  };

  const handleSelectClass = (cls: TrialClass) => {
    setSelectedClass(cls);
    setSelectedDate('');
    setAvailability(null);
  };

  const getNextDatesForWeekday = (weekday: string, count: number = 8): string[] => {
    const targetDay = WEEKDAY_MAP[weekday];
    const dates: string[] = [];
    const d = new Date();
    d.setHours(12, 0, 0, 0);

    for (let i = 0; i < 60 && dates.length < count; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() + i);
      if (check.getDay() === targetDay) {
        dates.push(check.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setAvailability(null);
    if (!selectedClass) return;

    setCheckingAvailability(true);
    try {
      const response = await publicTrialBookingService.getClassAvailability(
        bookingToken!, selectedClass.id, date
      );
      setAvailability(response.data);
    } catch {
      setAvailability(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate || !availability?.is_available) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await publicTrialBookingService.createTrialBooking(bookingToken!, {
        full_name: fullName,
        phone,
        email: email || undefined,
        class_id: selectedClass.id,
        attendance_date: selectedDate,
      });
      setBookingResult(response.data);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao agendar aula experimental.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
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

  if (error && step < 5) {
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
        {/* Header */}
        <div className="ptb-header">
          <h1>{businessName || 'Aula Experimental'}</h1>
          <p className="ptb-subtitle">Agende sua aula experimental</p>
        </div>

        {/* Progress */}
        {step < 5 && (
          <div className="ptb-progress">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`ptb-progress-step ${s <= step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
                <div className="ptb-progress-dot">{s < step ? '✓' : s}</div>
                <span className="ptb-progress-label">
                  {s === 1 ? 'Dados' : s === 2 ? 'Modalidade' : s === 3 ? 'Turma' : 'Confirmar'}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && step < 5 && (
          <div className="ptb-error-inline">
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Step 1: Identification */}
        {step === 1 && (
          <div className="ptb-step">
            <h2>Seus Dados</h2>
            <div className="ptb-form-group">
              <label>Nome completo *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="ptb-form-group">
              <label>Telefone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="ptb-form-group">
              <label>E-mail (opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <button
              className="ptb-btn ptb-btn-primary"
              disabled={!fullName.trim() || !phone.trim()}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Modality Selection */}
        {step === 2 && (
          <div className="ptb-step">
            <h2>Escolha a Modalidade</h2>
            {modalities.length === 0 ? (
              <p className="ptb-empty">Nenhuma modalidade disponível no momento.</p>
            ) : (
              <div className="ptb-cards-grid">
                {modalities.map((mod) => (
                  <div
                    key={mod.id}
                    className="ptb-card"
                    onClick={() => handleSelectModality(mod)}
                  >
                    <h3>{mod.name}</h3>
                    {mod.description && <p>{mod.description}</p>}
                    <span className="ptb-card-badge">{mod.classes_count} turma{mod.classes_count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="ptb-btn ptb-btn-secondary" onClick={() => setStep(1)}>
              Voltar
            </button>
          </div>
        )}

        {/* Step 3: Class + Date Selection */}
        {step === 3 && (
          <div className="ptb-step">
            <h2>Escolha a Turma e Data</h2>

            {loadingClasses ? (
              <div className="ptb-loading">Carregando turmas...</div>
            ) : classes.length === 0 ? (
              <p className="ptb-empty">Nenhuma turma disponível para esta modalidade.</p>
            ) : (
              <>
                {/* Class selection */}
                <div className="ptb-classes-list">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`ptb-class-card ${selectedClass?.id === cls.id ? 'selected' : ''} ${cls.is_full ? 'full' : ''}`}
                      onClick={() => !cls.is_full && handleSelectClass(cls)}
                    >
                      <div className="ptb-class-color" style={{ background: cls.color || '#3B82F6' }} />
                      <div className="ptb-class-info">
                        <div className="ptb-class-name">{cls.name || cls.modality_name}</div>
                        <div className="ptb-class-details">
                          {WEEKDAY_LABELS[cls.weekday]} · {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                          {cls.location && ` · ${cls.location}`}
                        </div>
                      </div>
                      <div className="ptb-class-spots">
                        {cls.is_full ? (
                          <span className="ptb-spots-full">Lotada</span>
                        ) : (
                          <span className="ptb-spots-available">
                            {cls.available_spots} vaga{cls.available_spots > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Date selection */}
                {selectedClass && (
                  <div className="ptb-date-section">
                    <h3>Escolha a data</h3>
                    <div className="ptb-date-scroll">
                      {getNextDatesForWeekday(selectedClass.weekday).map((date) => (
                        <div
                          key={date}
                          className={`ptb-date-card ${selectedDate === date ? 'selected' : ''}`}
                          onClick={() => handleSelectDate(date)}
                        >
                          <span className="ptb-date-day">{formatDate(date)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Availability result */}
                    {checkingAvailability && (
                      <div className="ptb-loading" style={{ padding: '20px' }}>Verificando disponibilidade...</div>
                    )}

                    {availability && !checkingAvailability && (
                      <div className={`ptb-availability ${availability.is_available ? 'available' : 'unavailable'}`}>
                        {availability.is_available ? (
                          <>
                            <span className="ptb-avail-icon">✓</span>
                            <span>Horário disponível! {availability.start_time?.slice(0,5)} - {availability.end_time?.slice(0,5)}</span>
                          </>
                        ) : (
                          <>
                            <span className="ptb-avail-icon">✕</span>
                            <span>{availability.reason}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="ptb-btn-row">
              <button className="ptb-btn ptb-btn-secondary" onClick={() => { setStep(2); setSelectedClass(null); }}>
                Voltar
              </button>
              <button
                className="ptb-btn ptb-btn-primary"
                disabled={!selectedClass || !selectedDate || !availability?.is_available}
                onClick={() => setStep(4)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedClass && availability && (
          <div className="ptb-step">
            <h2>Confirme seu Agendamento</h2>

            <div className="ptb-confirm-card">
              <div className="ptb-confirm-row">
                <span>Nome</span>
                <strong>{fullName}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Telefone</span>
                <strong>{phone}</strong>
              </div>
              {email && (
                <div className="ptb-confirm-row">
                  <span>E-mail</span>
                  <strong>{email}</strong>
                </div>
              )}
              <div className="ptb-confirm-divider" />
              <div className="ptb-confirm-row">
                <span>Modalidade</span>
                <strong>{selectedModality?.name}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Turma</span>
                <strong>{selectedClass.name || selectedClass.modality_name}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Data</span>
                <strong>{formatDateFull(selectedDate)}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Horário</span>
                <strong>{selectedClass.start_time?.slice(0, 5)} - {selectedClass.end_time?.slice(0, 5)}</strong>
              </div>
              {selectedClass.location && (
                <div className="ptb-confirm-row">
                  <span>Local</span>
                  <strong>{selectedClass.location}</strong>
                </div>
              )}
            </div>

            {error && (
              <div className="ptb-error-inline">
                {error}
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700 }}>✕</button>
              </div>
            )}

            <div className="ptb-btn-row">
              <button className="ptb-btn ptb-btn-secondary" onClick={() => setStep(3)}>
                Voltar
              </button>
              <button
                className="ptb-btn ptb-btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && bookingResult && (
          <div className="ptb-step ptb-success">
            <div className="ptb-success-icon">✓</div>
            <h2>Agendamento Confirmado!</h2>
            <p>Sua aula experimental foi agendada com sucesso.</p>

            <div className="ptb-confirm-card">
              <div className="ptb-confirm-row">
                <span>Turma</span>
                <strong>{bookingResult.class_name}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Modalidade</span>
                <strong>{bookingResult.modality_name}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Data</span>
                <strong>{formatDateFull(bookingResult.attendance_date)}</strong>
              </div>
              <div className="ptb-confirm-row">
                <span>Horário</span>
                <strong>{bookingResult.start_time?.slice(0, 5)} - {bookingResult.end_time?.slice(0, 5)}</strong>
              </div>
            </div>

            {/* Tracking link */}
            <div className="ptb-tracking-box">
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.9rem' }}>Link para acompanhar seu agendamento:</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/aula-experimental/status/${bookingResult.booking_token}`}
                  className="ptb-tracking-input"
                />
                <button
                  className="ptb-btn ptb-btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/aula-experimental/status/${bookingResult.booking_token}`);
                  }}
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="ptb-success-links">
              <a href={`/aula-experimental/status/${bookingResult.booking_token}`} className="ptb-btn ptb-btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Ver Detalhes
              </a>
              <a href={`/aula-experimental/meus-agendamentos/${bookingResult.access_token}`} className="ptb-btn ptb-btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Meus Agendamentos
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
