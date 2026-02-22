import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { rentalService } from '../services/rentalService';
import { courtService } from '../services/courtService';
import type { CourtRental } from '../types/rentalTypes';
import '../styles/Schedule.css';

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

const DAYS_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const COURT_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#A78BFA'];

const generateTimeSlots = () => {
  const slots: { time: string; isHourStart: boolean }[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push({ time, isHourStart: min === 0 });
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
  return ((startMin - hourMin) / 60) * 100;
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
  const [courtNames, setCourtNames] = useState<string[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [courtColorMap, setCourtColorMap] = useState<Record<string, string>>({});

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [currentWeek]);

  const loadCourts = async () => {
    try {
      const response = await courtService.getCourts();
      if (response.success && response.data) {
        const names = response.data.map((c: any) => c.name);
        setCourtNames(names);
        const colorMap: Record<string, string> = {};
        names.forEach((name: string, i: number) => {
          colorMap[name] = COURT_COLORS[i % COURT_COLORS.length];
        });
        setCourtColorMap(colorMap);
      }
    } catch {
      // ignore
    }
  };

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const response = await rentalService.getRentals({
        start_date: startDate,
        end_date: endDate,
      });

      if ((response as any).success === true || (response as any).status === 'success') {
        const data = response.data.filter((r: CourtRental) => r.status !== 'cancelada');
        setRentals(data);

        // Build color map for any courts not in the list
        const newColorMap = { ...courtColorMap };
        let colorIdx = Object.keys(newColorMap).length;
        data.forEach((r: CourtRental) => {
          if (!newColorMap[r.court_name]) {
            newColorMap[r.court_name] = COURT_COLORS[colorIdx % COURT_COLORS.length];
            colorIdx++;
          }
        });
        setCourtColorMap(newColorMap);
      }
    } catch (error) {
      console.error('Erro ao buscar locações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseRentalDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
      return '';
    } catch {
      return '';
    }
  };

  const filteredRentals = selectedCourt === 'all'
    ? rentals
    : rentals.filter(r => r.court_name === selectedCourt);

  const getRentalsForDayAndHour = (date: Date, hour: string): CourtRental[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hourNum = parseInt(hour.split(':')[0]);

    return filteredRentals.filter((rental) => {
      const rentalDateStr = parseRentalDate(rental.rental_date);
      if (rentalDateStr !== dateStr) return false;
      const startHour = parseInt(rental.start_time.split(':')[0]);
      return startHour === hourNum;
    });
  };

  // Assign lanes for overlapping rentals
  const assignLanes = (dayRentals: CourtRental[]) => {
    const laneMap = new Map<number, { lane: number; totalLanes: number }>();

    const sorted = [...dayRentals].sort((a, b) =>
      timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    sorted.forEach((rental) => {
      const rStart = timeToMinutes(rental.start_time);
      const rEnd = timeToMinutes(rental.end_time);

      const overlapping = sorted.filter((other) => {
        if (other.id === rental.id) return false;
        const oStart = timeToMinutes(other.start_time);
        const oEnd = timeToMinutes(other.end_time);
        return rStart < oEnd && rEnd > oStart;
      });

      const occupiedLanes = new Set<number>();
      overlapping.forEach((other) => {
        const otherLane = laneMap.get(other.id);
        if (otherLane) occupiedLanes.add(otherLane.lane);
      });

      let lane = 0;
      while (occupiedLanes.has(lane)) lane++;

      const totalLanes = Math.max(lane + 1, ...overlapping.map((other) => {
        const otherLane = laneMap.get(other.id);
        return otherLane ? otherLane.totalLanes : 1;
      }));

      laneMap.set(rental.id, { lane, totalLanes });
      overlapping.forEach((other) => {
        const otherLane = laneMap.get(other.id);
        if (otherLane) {
          laneMap.set(other.id, { lane: otherLane.lane, totalLanes });
        }
      });
    });

    return laneMap;
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const formatTime = (timeString: string) => timeString.substring(0, 5);

  const getCourtColor = (courtName: string) => courtColorMap[courtName] || '#6B7280';

  const getPaymentBadgeStyle = (status: string) => {
    switch (status) {
      case 'paga': return { background: 'rgba(255,255,255,0.3)', color: 'white' };
      case 'pendente': return { background: 'rgba(255,255,255,0.9)', color: '#92400E' };
      default: return { background: 'rgba(255,255,255,0.3)', color: 'white' };
    }
  };

  const previousWeek = () => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000));
  const nextWeek = () => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000));
  const goToToday = () => setCurrentWeek(new Date());

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Get all unique courts from this week's data
  const allCourts = Array.from(new Set(rentals.map(r => r.court_name))).sort();

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-controls">
          <div className="date-navigation">
            <button type="button" className="nav-button" onClick={previousWeek}>
              ←
            </button>
            <button type="button" className="today-button" onClick={goToToday}>
              Hoje
            </button>
            <button type="button" className="nav-button" onClick={nextWeek}>
              →
            </button>
            <span className="month-year">
              {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: ptBR })}
            </span>
          </div>

          {/* Court filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: `2px solid ${selectedCourt === 'all' ? '#22C55E' : '#E5E7EB'}`,
                background: selectedCourt === 'all' ? '#22C55E' : 'white',
                color: selectedCourt === 'all' ? 'white' : '#374151',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedCourt('all')}
            >
              Todas
            </button>
            {(courtNames.length > 0 ? courtNames : allCourts).map((name) => (
              <button
                key={name}
                type="button"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: `2px solid ${selectedCourt === name ? getCourtColor(name) : '#E5E7EB'}`,
                  background: selectedCourt === name ? getCourtColor(name) : 'white',
                  color: selectedCourt === name ? 'white' : '#374151',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedCourt(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="nav-button"
              onClick={() => navigate('/locacoes')}
            >
              ← Lista
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="schedule-grid-container">
        <div
          className="schedule-grid"
          style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
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
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const currentDay = addDays(weekStart, index);
            const isToday = format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            // Get all rentals for this day
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            const dayRentals = filteredRentals.filter(r => parseRentalDate(r.rental_date) === dateStr);
            const laneMap = assignLanes(dayRentals);

            return (
              <div key={index} className="day-column">
                <div className={`day-header ${isToday ? 'today' : ''}`}>
                  <div className="day-name">{DAYS_LABELS[index]}</div>
                  <div className="day-number">{format(currentDay, 'd')}</div>
                </div>

                {HOURS.map((hour) => {
                  const rentalsInHour = getRentalsForDayAndHour(currentDay, hour);

                  return (
                    <div key={`${index}-${hour}`} style={{ position: 'relative', height: '240px' }}>
                      {/* Rental cards */}
                      {rentalsInHour.map((rental) => {
                        const hourStart = `${hour.split(':')[0]}:00`;
                        const topOffset = calculateOffset(rental.start_time, hourStart);
                        const height = calculateHeight(rental.start_time, rental.end_time);
                        const bgColor = getCourtColor(rental.court_name);
                        const laneInfo = laneMap.get(rental.id) || { lane: 0, totalLanes: 1 };
                        const widthPercent = 100 / laneInfo.totalLanes;
                        const leftPercent = laneInfo.lane * widthPercent;
                        const payBadge = getPaymentBadgeStyle(rental.payment_status);

                        return (
                          <div
                            key={rental.id}
                            className="class-card"
                            style={{
                              position: 'absolute',
                              top: `${topOffset}%`,
                              left: `calc(${leftPercent}% + 2px)`,
                              width: `calc(${widthPercent}% - 4px)`,
                              height: `${height}%`,
                              minHeight: '60px',
                              backgroundColor: bgColor,
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              zIndex: 1,
                            }}
                            onClick={() => navigate('/locacoes')}
                            title={`${rental.renter_name} | ${rental.court_name} | ${formatTime(rental.start_time)}-${formatTime(rental.end_time)}`}
                          >
                            <div className="class-card-header" style={{ marginBottom: '2px' }}>
                              <span className="class-time" style={{ fontSize: '10px', color: 'white' }}>
                                {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                              </span>
                            </div>
                            <div className="class-name" style={{ fontSize: '12px', lineHeight: '1.3', color: 'white', marginBottom: '2px' }}>
                              {rental.court_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {rental.renter_name}
                            </div>
                            {height >= 80 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>
                                  {formatCurrency(rental.price_cents)}
                                </span>
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  ...payBadge,
                                }}>
                                  {rental.payment_status === 'paga' ? 'Pago' : 'Pendente'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Time slot lines */}
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
        gap: '20px',
        padding: '16px 0 32px',
        fontSize: '13px',
        flexWrap: 'wrap',
      }}>
        {(courtNames.length > 0 ? courtNames : allCourts).map((name) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: getCourtColor(name) }}></div>
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
