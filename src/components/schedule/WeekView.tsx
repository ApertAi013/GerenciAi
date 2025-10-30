import { DndContext, DragOverlay, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, startOfWeek, addDays } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUsers } from '@fortawesome/free-solid-svg-icons';

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

interface WeekViewProps {
  currentWeek: Date;
  classes: ClassSchedule[];
  activeId: string | null;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  isSaving: boolean;
}

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Componente de aluno arrastável
function DraggableStudent({ student, classId }: { student: Student; classId: string }) {
  const uniqueId = `student-${student.id}-class-${classId}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: uniqueId,
    data: { type: 'student', studentId: student.id, classId }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="student-chip draggable"
    >
      {student.name}
    </div>
  );
}

// Componente de card de turma (draggable e droppable)
function ClassCard({ classSchedule }: { classSchedule: ClassSchedule }) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `class-${classSchedule.id}`,
    data: { type: 'class', classId: classSchedule.id }
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `class-drop-${classSchedule.id}`,
    data: { type: 'class-drop', classId: classSchedule.id }
  });

  const filled = classSchedule.students.length;
  const capacity = classSchedule.capacity;
  const isFull = filled >= capacity;

  const cardStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: classSchedule.color,
      }
    : {
        backgroundColor: classSchedule.color,
      };

  return (
    <div
      ref={setDropRef}
      style={cardStyle}
      className={`class-card ${isOver ? 'drag-over-class' : ''}`}
    >
      {isOver && <div className="drop-overlay" />}

      <div
        ref={setDragRef}
        className="class-card-header"
        {...listeners}
        {...attributes}
      >
        <span className="class-time">
          <FontAwesomeIcon icon={faClock} style={{ fontSize: '10px', marginRight: '4px', opacity: 0.8 }} />
          {classSchedule.startTime} - {classSchedule.endTime}
        </span>
        <span className={`class-capacity ${isFull ? 'full' : ''}`}>
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: '10px', marginRight: '3px' }} />
          {filled}/{capacity}
        </span>
      </div>
      <div className="class-name">{classSchedule.name}</div>

      {classSchedule.students.length > 0 && (
        <div className="class-students">
          {classSchedule.students.map((student) => (
            <DraggableStudent key={student.id} student={student} classId={classSchedule.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente de slot de horário que aceita drops
function DroppableTimeSlot({
  day,
  hour,
  children
}: {
  day: number;
  hour: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${day}-${hour}`,
    data: { type: 'timeslot', day, hour }
  });

  return (
    <div
      ref={setNodeRef}
      className={`time-slot ${isOver ? 'drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

export default function WeekView({
  currentWeek,
  classes,
  activeId,
  onDragStart,
  onDragEnd,
  isSaving
}: WeekViewProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const getClassesForDayAndTime = (day: number, hour: string) => {
    return classes.filter(
      (cls) => cls.day === day && cls.startTime === hour
    );
  };

  // Calcular o número máximo de turmas em qualquer horário para cada dia
  const getMaxClassesForDay = (day: number) => {
    let maxClasses = 1;
    HOURS.forEach((hour) => {
      const classesInSlot = getClassesForDayAndTime(day, hour);
      if (classesInSlot.length > maxClasses) {
        maxClasses = classesInSlot.length;
      }
    });
    return maxClasses;
  };

  // Calcular largura da coluna baseado no número máximo de turmas
  // Largura base: 200px
  // Cada turma adicional: +100px (50% da base)
  const getColumnWidth = (day: number) => {
    const maxClasses = getMaxClassesForDay(day);
    const baseWidth = 200;
    const additionalWidth = (maxClasses - 1) * 100;
    return baseWidth + additionalWidth;
  };

  const activeClass = activeId
    ? classes.find((c) => `class-${c.id}` === activeId)
    : null;

  return (
    <>
      {/* Saving indicator */}
      {isSaving && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#F97316',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Salvando...
        </div>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="schedule-grid-container">
          <div
            className="schedule-grid"
            style={{
              gridTemplateColumns: `80px ${[1, 2, 3, 4, 5, 6, 0]
                .map((day) => `${getColumnWidth(day)}px`)
                .join(' ')}`
            }}
          >
            {/* Time column */}
            <div className="time-column">
              <div className="time-header"></div>
              {HOURS.map((hour) => (
                <div key={hour} className="time-cell">
                  {hour}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {[1, 2, 3, 4, 5, 6, 0].map((dayOffset, index) => {
              const currentDay = addDays(weekStart, index);
              const isToday = format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const columnWidth = getColumnWidth(dayOffset);

              return (
                <div
                  key={dayOffset}
                  className="day-column"
                  style={{ width: `${columnWidth}px` }}
                >
                  <div className={`day-header ${isToday ? 'today' : ''}`}>
                    <div className="day-name">{DAYS_OF_WEEK[index + 1] || 'Dom'}</div>
                    <div className="day-number">{format(currentDay, 'd')}</div>
                  </div>

                  {HOURS.map((hour) => {
                    const classesInSlot = getClassesForDayAndTime(dayOffset, hour);

                    return (
                      <DroppableTimeSlot key={`${dayOffset}-${hour}`} day={dayOffset} hour={hour}>
                        {classesInSlot.map((cls) => (
                          <ClassCard key={cls.id} classSchedule={cls} />
                        ))}
                      </DroppableTimeSlot>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeId && activeId.startsWith('class-') && activeClass ? (
            <div
              className="class-card"
              style={{
                backgroundColor: activeClass.color,
                minHeight: '100px',
                opacity: 0.9,
                cursor: 'grabbing',
                width: '200px'
              }}
            >
              <div className="class-card-header">
                <span className="class-time">
                  {activeClass.startTime} - {activeClass.endTime}
                </span>
                <span className="class-capacity">
                  {activeClass.students.length}/{activeClass.capacity}
                </span>
              </div>
              <div className="class-name">{activeClass.name}</div>
            </div>
          ) : activeId && activeId.startsWith('student-') ? (
            <div className="student-chip" style={{ opacity: 0.9, cursor: 'grabbing' }}>
              Movendo aluno...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
