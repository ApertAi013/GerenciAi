import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassSchedule {
  id: string;
  name: string;
  sport: string;
  day: number;
  startTime: string;
  endTime: string;
  capacity: number;
  students: any[];
  color: string;
}

interface MonthViewProps {
  currentDate: Date;
  classes: ClassSchedule[];
  onSlotClick?: (day: number, hour: string) => void;
}

const WEEKDAY_TO_NUMBER: Record<number, number> = {
  0: 0, // Sunday
  1: 1, // Monday
  2: 2, // Tuesday
  3: 3, // Wednesday
  4: 4, // Thursday
  5: 5, // Friday
  6: 6, // Saturday
};

export default function MonthView({ currentDate, classes, onSlotClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getClassesForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return classes.filter(cls => cls.day === dayOfWeek);
  };

  return (
    <div className="month-view">
      {/* Header com dias da semana */}
      <div className="month-view-header">
        <div className="month-day-name">Segunda</div>
        <div className="month-day-name">Terça</div>
        <div className="month-day-name">Quarta</div>
        <div className="month-day-name">Quinta</div>
        <div className="month-day-name">Sexta</div>
        <div className="month-day-name">Sábado</div>
        <div className="month-day-name">Domingo</div>
      </div>

      {/* Grid de dias */}
      <div className="month-view-grid">
        {days.map((day, index) => {
          const dayClasses = getClassesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={`month-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={onSlotClick ? () => onSlotClick(day.getDay(), '06:00') : undefined}
              style={{ cursor: onSlotClick ? 'pointer' : 'default' }}
              title={onSlotClick ? 'Clique para criar turma' : ''}
            >
              <div className="month-day-number">{format(day, 'd')}</div>
              <div className="month-day-classes">
                {dayClasses.map(cls => (
                  <div key={cls.id} className="month-class-item">
                    <span className="month-class-dot" style={{ backgroundColor: cls.color }}></span>
                    <span className="month-class-time">{cls.startTime}</span>
                    <span className="month-class-name">{cls.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
