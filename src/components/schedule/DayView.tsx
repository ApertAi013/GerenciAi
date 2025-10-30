import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Student {
  id: string;
  name: string;
  enrollmentId?: number;
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
}

interface DayViewProps {
  currentDate: Date;
  classes: ClassSchedule[];
}

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export default function DayView({ currentDate, classes }: DayViewProps) {
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
            return (
              <div key={hour} className="day-time-slot">
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
                          {cls.students.map((student) => (
                            <div key={student.id} className="day-student-chip">
                              {student.name}
                            </div>
                          ))}
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
