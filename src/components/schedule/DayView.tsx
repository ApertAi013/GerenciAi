import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface Student {
  id: string;
  name: string;
  enrollmentId?: number;
  level_name?: string;
}

interface ClassSchedule {
  id: string;
  name: string;
  sport: string;
  day: number;
  startTime: string;
  endTime: string;
  capacity: number;
  students: Student[];
  color: string;
  allowed_levels?: string[];
}

interface DayViewProps {
  currentDate: Date;
  classes: ClassSchedule[];
  onSlotClick?: (day: number, hour: string) => void;
}

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export default function DayView({ currentDate, classes, onSlotClick }: DayViewProps) {
  const dayOfWeek = currentDate.getDay();
  const classesForDay = classes.filter(cls => cls.day === dayOfWeek);

  const getClassesForHour = (hour: string) => {
    return classesForDay.filter(cls => cls.startTime === hour);
  };

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h2>{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</h2>
      </div>

      <div className="day-view-grid">
        {/* Time column */}
        <div className="day-time-column">
          <div className="day-time-header"></div>
          {HOURS.map((hour) => (
            <div key={hour} className="day-time-cell">
              {hour}
            </div>
          ))}
        </div>

        {/* Classes column */}
        <div className="day-classes-column">
          <div className="day-classes-header">Turmas</div>
          {HOURS.map((hour) => {
            const hourClasses = getClassesForHour(hour);
            const isEmpty = hourClasses.length === 0;
            return (
              <div
                key={hour}
                className="day-time-slot"
                onClick={isEmpty && onSlotClick ? () => onSlotClick(dayOfWeek, hour) : undefined}
                style={{
                  cursor: isEmpty && onSlotClick ? 'pointer' : 'default',
                  minHeight: '80px'
                }}
                title={isEmpty && onSlotClick ? 'Clique para criar turma' : ''}
              >
                {hourClasses.map((cls) => {
                  const filled = cls.students.length;
                  const capacity = cls.capacity;
                  const isFull = filled >= capacity;

                  return (
                    <div
                      key={cls.id}
                      className="day-class-card"
                      style={{ backgroundColor: cls.color }}
                    >
                      <div className="day-class-header">
                        <span className="day-class-time">
                          {cls.startTime} - {cls.endTime}
                        </span>
                        <span className={`day-class-capacity ${isFull ? 'full' : ''}`}>
                          {filled}/{capacity}
                        </span>
                      </div>
                      <div className="day-class-name">{cls.name}</div>
                      {cls.students.length > 0 && (
                        <div className="day-class-students">
                          {cls.students.map((student) => {
                            const levelMismatch = cls.allowed_levels && cls.allowed_levels.length > 0 && student.level_name && !cls.allowed_levels.includes(student.level_name);
                            return (
                              <div key={student.id} className="day-student-chip">
                                {levelMismatch && (
                                  <span
                                    className="level-warning"
                                    title={`Nível do aluno (${student.level_name}) não corresponde ao nível da turma (${cls.allowed_levels!.join(', ')})`}
                                  >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                  </span>
                                )}
                                {student.name}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
