import { useState, useEffect } from 'react';
import { rentalService } from '../services/rentalService';
import type { CourtRental } from '../types/rentalTypes';
import '../styles/Schedule.css';

export default function RentalsSchedule() {
  const [rentals, setRentals] = useState<CourtRental[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, [selectedDate, viewMode]);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const startDate = getWeekStart(selectedDate);
      const endDate = getWeekEnd(selectedDate);

      const response = await rentalService.getRentals({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
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

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const getWeekDays = () => {
    const start = getWeekStart(selectedDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getRentalsForDayAndTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return rentals.filter((rental) => {
      if (rental.rental_date !== dateStr) return false;
      const startHour = parseInt(rental.start_time.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      const endHour = parseInt(rental.end_time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const calculateRentalHeight = (rental: CourtRental) => {
    const start = parseInt(rental.start_time.split(':')[0]) * 60 + parseInt(rental.start_time.split(':')[1]);
    const end = parseInt(rental.end_time.split(':')[0]) * 60 + parseInt(rental.end_time.split(':')[1]);
    const duration = end - start;
    return (duration / 60) * 60; // 60px per hour
  };

  const calculateRentalTop = (rental: CourtRental) => {
    const startMinute = parseInt(rental.start_time.split(':')[1]);
    return (startMinute / 60) * 60;
  };

  const previousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
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

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();

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
        <h1>Agenda de Locações</h1>
        <div className="schedule-controls">
          <button type="button" className="btn-secondary" onClick={previousWeek}>
            ← Semana Anterior
          </button>
          <button type="button" className="btn-primary" onClick={goToToday}>
            Hoje
          </button>
          <button type="button" className="btn-secondary" onClick={nextWeek}>
            Próxima Semana →
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div style={{ textAlign: 'center', marginBottom: '24px', color: '#737373' }}>
        {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} -{' '}
        {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      {/* Weekly View */}
      {viewMode === 'week' && (
        <div className="schedule-container">
          <div className="schedule-grid">
            {/* Time Column */}
            <div className="schedule-time-column">
              <div className="schedule-header-cell"></div>
              {timeSlots.map((time) => (
                <div key={time} className="schedule-time-cell">
                  {time}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const isToday =
                day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

              return (
                <div key={day.toISOString()} className="schedule-day-column">
                  <div className={`schedule-header-cell ${isToday ? 'today' : ''}`}>
                    <div className="day-name">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className="day-number">
                      {day.getDate()}
                    </div>
                  </div>

                  <div className="schedule-day-slots">
                    {timeSlots.map((time, idx) => {
                      const dayRentals = getRentalsForDayAndTime(day, time);
                      const isFirstSlot = idx === 0 || getRentalsForDayAndTime(day, timeSlots[idx - 1]).length === 0;

                      return (
                        <div key={time} className="schedule-slot">
                          {isFirstSlot &&
                            dayRentals.map((rental) => {
                              const isFirst =
                                parseInt(rental.start_time.split(':')[0]) === parseInt(time.split(':')[0]);

                              if (!isFirst) return null;

                              return (
                                <div
                                  key={rental.id}
                                  className="schedule-rental-card"
                                  style={{
                                    height: `${calculateRentalHeight(rental)}px`,
                                    top: `${calculateRentalTop(rental)}px`,
                                    backgroundColor: getPaymentStatusColor(rental.payment_status),
                                  }}
                                  title={`${rental.renter_name} - ${rental.court_name}`}
                                >
                                  <div className="rental-card-time">
                                    {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                                  </div>
                                  <div className="rental-card-title">{rental.court_name}</div>
                                  <div className="rental-card-subtitle">{rental.renter_name}</div>
                                  <div className="rental-card-value">{formatCurrency(rental.price_cents)}</div>
                                  {rental.payment_status === 'pendente' && (
                                    <div className="rental-card-badge">Pendente</div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#10B981' }}></div>
          <span>Paga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#F59E0B' }}></div>
          <span>Pendente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#EF4444' }}></div>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
}
