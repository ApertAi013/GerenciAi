import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { rentalService } from '../services/rentalService';
import type { CourtRental } from '../types/rentalTypes';
import '../styles/Schedule.css';

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const generateTimeSlots = () => {
  const slots: { time: string; isHourStart: boolean }[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push({
        time,
        isHourStart: min === 0
      });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const calculateOffset = (startTime: string, hourStartTime: string): number => {
  const startMin = timeToMinutes(startTime);
  const hourMin = timeToMinutes(hourStartTime);
  const offsetMin = startMin - hourMin;
  return (offsetMin / 60) * 100;
};

const calculateHeight = (startTime: string, endTime: string): number => {
  const durationMin = timeToMinutes(endTime) - timeToMinutes(startTime);
  return (durationMin / 60) * 100;
};

export default function RentalsSchedule() {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [rentals, setRentals] = useState<CourtRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  useEffect(() => {
    fetchRentals();
  }, [currentWeek]);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const response = await rentalService.getRentals({
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success) {
        setRentals(response.data.filter(r => r.status !== 'cancelada'));
      }
    } catch (error) {
      console.error('Erro ao buscar locações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRentalsForDayAndHour = (date: Date, hour: string): CourtRental[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hourNum = parseInt(hour.split(':')[0]);

    return rentals.filter((rental) => {
      if (rental.rental_date !== dateStr) return false;
      const startHour = parseInt(rental.start_time.split(':')[0]);
      return startHour === hourNum;
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paga':
        return '#10B981';
      case 'pendente':
        return '#F59E0B';
      default:
        return '#EF4444';
    }
  };

  const previousWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-title-section">
          <h1>Agenda de Locações</h1>
          <div className="schedule-nav">
            <button type="button" className="nav-btn" onClick={previousWeek}>
              ← Anterior
            </button>
            <button type="button" className="today-btn" onClick={goToToday}>
              Hoje
            </button>
            <button type="button" className="nav-btn" onClick={nextWeek}>
              Próxima →
            </button>
          </div>
        </div>

        <div className="schedule-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/locacoes')}>
            ← Voltar para Locações
          </button>
        </div>
      </div>

      {/* Week info */}
      <div style={{ textAlign: 'center', marginBottom: '20px', color: '#737373', fontSize: '14px' }}>
        {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: ptBR })}
      </div>

      {/* Grid */}
      <div className="schedule-grid-container">
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: `80px repeat(7, 200px)`
          }}
        >
          {/* Time column */}
          <div className="time-column">
            <div className="time-header"></div>
            {TIME_SLOTS.map((slot) => (
              <div key={slot.time} className={`time-cell ${slot.isHourStart ? 'hour-label' : 'sub-label'}`}>
                {slot.isHourStart ? slot.time : ''}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {[1, 2, 3, 4, 5, 6, 0].map((dayOffset, index) => {
            const currentDay = addDays(weekStart, index);
            const isToday = format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={dayOffset}
                className="day-column"
                style={{ width: '200px' }}
              >
                <div className={`day-header ${isToday ? 'today' : ''}`}>
                  <div className="day-name">{DAYS_OF_WEEK[index]}</div>
                  <div className="day-number">{format(currentDay, 'd')}</div>
                </div>

                {HOURS.map((hour) => {
                  const rentalsInHour = getRentalsForDayAndHour(currentDay, hour);

                  return (
                    <div key={`${dayOffset}-${hour}`} style={{ position: 'relative', height: '240px' }}>
                      {/* Renderizar locações desta hora */}
                      {rentalsInHour.map((rental) => {
                        const hourStart = `${hour.split(':')[0]}:00`;
                        const topOffset = calculateOffset(rental.start_time, hourStart);
                        const height = calculateHeight(rental.start_time, rental.end_time);
                        const bgColor = getPaymentStatusColor(rental.payment_status);

                        return (
                          <div
                            key={rental.id}
                            className="class-card"
                            style={{
                              position: 'absolute',
                              top: `${topOffset}%`,
                              left: '0',
                              right: '0',
                              height: `${height}%`,
                              backgroundColor: bgColor,
                              border: `2px solid ${bgColor}`,
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              zIndex: 1,
                            }}
                            onClick={() => navigate('/locacoes')}
                            title={`${rental.renter_name} - ${rental.court_name}`}
                          >
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'white',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: 'white',
                              marginBottom: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {rental.court_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.95)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {rental.renter_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'white',
                              marginTop: '4px'
                            }}>
                              {formatCurrency(rental.price_cents)}
                            </div>
                            {rental.payment_status === 'pendente' && (
                              <div style={{
                                fontSize: '10px',
                                background: 'rgba(255, 255, 255, 0.3)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginTop: '4px',
                                color: 'white',
                                fontWeight: '600'
                              }}>
                                Pendente
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Slots de 10 em 10 minutos (invisíveis, apenas para estrutura) */}
                      {TIME_SLOTS.filter(slot => slot.time.startsWith(hour.substring(0, 2))).map((slot) => (
                        <div
                          key={slot.time}
                          className={`time-slot ${slot.isHourStart ? 'hour-start' : 'sub-slot'}`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        marginTop: '32px',
        paddingBottom: '32px',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#10B981' }}></div>
          <span>Paga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F59E0B' }}></div>
          <span>Pendente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#EF4444' }}></div>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
}
