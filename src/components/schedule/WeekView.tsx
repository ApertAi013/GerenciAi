import { DndContext, DragOverlay, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, startOfWeek, addDays } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUsers, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface Student {
  id: string;
  name: string;
  enrollmentId?: number;
  isMakeup?: boolean;
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

interface WeekViewProps {
  currentWeek: Date;
  classes: ClassSchedule[];
  activeId: string | null;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  isSaving: boolean;
  onSlotClick?: (day: number, hour: string) => void;
  onStudentClick?: (studentId: number) => void;
}

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Gerar slots de 10 em 10 minutos
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

// Componente de aluno arrastável
function DraggableStudent({ student, classId, allowedLevels, onStudentClick }: { student: Student; classId: string; allowedLevels?: string[]; onStudentClick?: (studentId: number) => void }) {
  const uniqueId = `student-${student.id}-class-${classId}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: uniqueId,
    data: { type: 'student', studentId: student.id, classId },
    disabled: student.isMakeup // Disable dragging for makeup students
  });

  const levelMismatch = allowedLevels && allowedLevels.length > 0 && student.level_name && !allowedLevels.includes(student.level_name);

  const baseStyle: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : {};

  // Style for makeup students (yellow)
  const makeupStyle: React.CSSProperties = student.isMakeup
    ? {
        backgroundColor: '#FFB300',
        color: '#1a1a1a',
        border: '1px solid #FF8F00',
        fontWeight: 500,
      }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStudentClick && !student.isMakeup) {
      onStudentClick(parseInt(student.id));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...baseStyle, ...makeupStyle }}
      {...(student.isMakeup ? {} : { ...listeners, ...attributes })}
      className={`student-chip ${student.isMakeup ? 'makeup' : 'draggable'}`}
      onClick={handleClick}
      title={student.isMakeup ? 'Aluno de remarcação' : student.name}
    >
      {student.isMakeup && '↻ '}
      {levelMismatch && (
        <span
          className="level-warning"
          title={`Nível do aluno (${student.level_name}) não corresponde ao nível da turma (${allowedLevels!.join(', ')})`}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </span>
      )}
      {student.name}
    </div>
  );
}

// Funções auxiliares para cálculo de tempo
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Detectar se duas turmas se sobrepõem temporalmente
const classesOverlap = (cls1: ClassSchedule, cls2: ClassSchedule): boolean => {
  if (cls1.day !== cls2.day) return false;
  const start1 = timeToMinutes(cls1.startTime);
  const end1 = timeToMinutes(cls1.endTime);
  const start2 = timeToMinutes(cls2.startTime);
  const end2 = timeToMinutes(cls2.endTime);
  return start1 < end2 && start2 < end1;
};

// Atribuir posições horizontais (lanes) para turmas sobrepostas
const assignLanes = (classes: ClassSchedule[]): Map<string, { lane: number; totalLanes: number }> => {
  const laneMap = new Map<string, { lane: number; totalLanes: number }>();

  // Ordenar por horário de início
  const sortedClasses = [...classes].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  sortedClasses.forEach((cls) => {
    // Encontrar todas as turmas que se sobrepõem com esta
    const overlapping = sortedClasses.filter((other) =>
      other.id !== cls.id && classesOverlap(cls, other)
    );

    // Encontrar lanes já ocupadas pelas turmas sobrepostas
    const occupiedLanes = new Set<number>();
    overlapping.forEach((other) => {
      const otherLane = laneMap.get(other.id);
      if (otherLane) occupiedLanes.add(otherLane.lane);
    });

    // Atribuir a primeira lane disponível
    let lane = 0;
    while (occupiedLanes.has(lane)) {
      lane++;
    }

    // Calcular total de lanes necessárias para este grupo
    const totalLanes = Math.max(lane + 1, ...overlapping.map((other) => {
      const otherLane = laneMap.get(other.id);
      return otherLane ? otherLane.totalLanes : 1;
    }));

    // Atualizar todas as turmas do grupo com o novo totalLanes
    laneMap.set(cls.id, { lane, totalLanes });
    overlapping.forEach((other) => {
      const otherLane = laneMap.get(other.id);
      if (otherLane) {
        laneMap.set(other.id, { lane: otherLane.lane, totalLanes });
      }
    });
  });

  return laneMap;
};

const calculateOffset = (startTime: string, hourStartTime: string): number => {
  const startMin = timeToMinutes(startTime);
  const hourMin = timeToMinutes(hourStartTime);
  const offsetMin = startMin - hourMin; // minutos desde o início da hora
  return (offsetMin / 60) * 100; // % da hora completa (60 min = 100%)
};

const calculateHeight = (startTime: string, endTime: string): number => {
  const durationMin = timeToMinutes(endTime) - timeToMinutes(startTime);
  return (durationMin / 60) * 100; // % em relação a 1 hora (60 min = 100% = 240px)
};

// Componente de card de turma (draggable e droppable)
function ClassCard({
  classSchedule,
  slotHour,
  lane = 0,
  totalLanes = 1,
  onStudentClick
}: {
  classSchedule: ClassSchedule;
  slotHour: string;
  lane?: number;
  totalLanes?: number;
  onStudentClick?: (studentId: number) => void;
}) {
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

  // Calcular posicionamento baseado em minutos
  // Encontrar o início da hora que contém este slot
  const slotMinutes = timeToMinutes(slotHour);
  const hourStart = Math.floor(slotMinutes / 60) * 60;
  const hourStartTime = `${String(Math.floor(hourStart / 60)).padStart(2, '0')}:00`;

  const topOffset = calculateOffset(classSchedule.startTime, hourStartTime);
  const height = calculateHeight(classSchedule.startTime, classSchedule.endTime);

  // Calcular posição e largura horizontal baseado na lane
  const widthPercent = (100 / totalLanes);
  const leftPercent = (lane * widthPercent);

  const cardStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: classSchedule.color,
        position: 'absolute' as const,
        top: `${topOffset}%`,
        height: `${height}%`,
        minHeight: '80px',
        left: `calc(${leftPercent}% + ${lane > 0 ? '2px' : '4px'})`,
        width: `calc(${widthPercent}% - ${lane === 0 && totalLanes > 1 ? '6px' : lane === totalLanes - 1 ? '6px' : '8px'})`,
        pointerEvents: 'none' as const,
      }
    : {
        backgroundColor: classSchedule.color,
        position: 'absolute' as const,
        top: `${topOffset}%`,
        height: `${height}%`,
        minHeight: '80px',
        left: `calc(${leftPercent}% + ${lane > 0 ? '2px' : '4px'})`,
        width: `calc(${widthPercent}% - ${lane === 0 && totalLanes > 1 ? '6px' : lane === totalLanes - 1 ? '6px' : '8px'})`,
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
          <FontAwesomeIcon icon={faClock} style={{ fontSize: '10px', marginRight: '4px', opacity: 0.8, color: 'white' }} />
          {classSchedule.startTime} - {classSchedule.endTime}
        </span>
        <span className={`class-capacity ${isFull ? 'full' : ''}`}>
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: '10px', marginRight: '3px', color: 'white' }} />
          {filled}/{capacity}
        </span>
      </div>

      <div className="class-card-body">
        <div className="class-name">{classSchedule.name}</div>

        {classSchedule.students.length > 0 && (
          <div className="class-students">
            {classSchedule.students.map((student) => (
              <DraggableStudent
                key={student.id}
                student={student}
                classId={classSchedule.id}
                allowedLevels={classSchedule.allowed_levels}
                onStudentClick={onStudentClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de slot de horário que aceita drops
function DroppableTimeSlot({
  day,
  hour,
  isHourStart,
  children,
  onClick
}: {
  day: number;
  hour: string;
  isHourStart: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${day}-${hour}`,
    data: { type: 'timeslot', day, hour }
  });

  return (
    <div
      ref={setNodeRef}
      className={`time-slot ${isOver ? 'drag-over' : ''} ${isHourStart ? 'hour-start' : 'sub-slot'}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={onClick ? 'Clique para criar turma' : ''}
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
  isSaving,
  onSlotClick,
  onStudentClick
}: WeekViewProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  // Calcular próximo slot de 10 minutos
  const getNextTimeSlot = (time: string): string => {
    const minutes = timeToMinutes(time);
    const nextMinutes = minutes + 10;
    const hours = Math.floor(nextMinutes / 60);
    const mins = nextMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Pegar turmas que COMEÇAM dentro do slot de 10 minutos
  const getClassesForDayAndTime = (day: number, time: string) => {
    // Encontrar a hora completa anterior ou igual ao time
    const timeMinutes = timeToMinutes(time);
    const hourStart = Math.floor(timeMinutes / 60) * 60; // minutos do início da hora
    const hourEnd = hourStart + 60; // minutos do fim da hora

    return classes.filter((cls) => {
      const classStartMin = timeToMinutes(cls.startTime);
      return cls.day === day && classStartMin >= hourStart && classStartMin < hourEnd;
    });
  };

  // Calcular o número máximo de lanes necessárias para cada dia
  const getMaxLanesForDay = (day: number) => {
    const dayClasses = classes.filter((cls) => cls.day === day);
    if (dayClasses.length === 0) return 1;

    const laneMap = assignLanes(dayClasses);
    let maxLanes = 1;

    laneMap.forEach((info) => {
      if (info.totalLanes > maxLanes) {
        maxLanes = info.totalLanes;
      }
    });

    return maxLanes;
  };

  // Calcular largura da coluna baseado no número máximo de lanes
  // Largura base: 200px
  // Cada lane adicional: +100px (50% da base)
  const getColumnWidth = (day: number) => {
    const maxLanes = getMaxLanesForDay(day);
    const baseWidth = 200;
    const additionalWidth = (maxLanes - 1) * 100;
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
              const columnWidth = getColumnWidth(dayOffset);

              // Calcular lanes para este dia
              const dayClasses = classes.filter((cls) => cls.day === dayOffset);
              const laneMap = assignLanes(dayClasses);

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
                    // Pegar todos os slots de 10 min desta hora
                    const hourSlots = TIME_SLOTS.filter((slot) => slot.time.startsWith(hour.substring(0, 2)));
                    // Pegar turmas que começam nesta hora
                    const classesInHour = getClassesForDayAndTime(dayOffset, hour);

                    return (
                      <div key={`${dayOffset}-${hour}`} style={{ position: 'relative', height: '240px' }}>
                        {/* Renderizar cards desta hora */}
                        {classesInHour.map((cls) => {
                          const laneInfo = laneMap.get(cls.id) || { lane: 0, totalLanes: 1 };
                          return (
                            <ClassCard
                              key={cls.id}
                              classSchedule={cls}
                              slotHour={hour}
                              lane={laneInfo.lane}
                              totalLanes={laneInfo.totalLanes}
                              onStudentClick={onStudentClick}
                            />
                          );
                        })}

                        {/* Renderizar slots de 10 min para drop */}
                        {hourSlots.map((slot) => (
                          <DroppableTimeSlot
                            key={`${dayOffset}-${slot.time}`}
                            day={dayOffset}
                            hour={slot.time}
                            isHourStart={slot.isHourStart}
                            onClick={onSlotClick ? () => onSlotClick(dayOffset, slot.time) : undefined}
                          >
                            {/* Vazio - cards são renderizados no nível da hora */}
                          </DroppableTimeSlot>
                        ))}
                      </div>
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
                minHeight: '60px',
                maxHeight: '80px',
                opacity: 1,
                cursor: 'grabbing',
                width: '140px',
                padding: '6px 8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="class-card-header" style={{ marginBottom: '2px' }}>
                <span className="class-time" style={{ fontSize: '9px', color: 'white' }}>
                  {activeClass.startTime} - {activeClass.endTime}
                </span>
                <span className="class-capacity" style={{ fontSize: '8px', padding: '2px 6px', color: 'white' }}>
                  {activeClass.students.length}/{activeClass.capacity}
                </span>
              </div>
              <div className="class-name" style={{ fontSize: '11px', lineHeight: '1.2', color: 'white' }}>
                {activeClass.name}
              </div>
            </div>
          ) : activeId && activeId.startsWith('student-') ? (
            <div className="student-chip" style={{ opacity: 1, cursor: 'grabbing', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}>
              Movendo aluno...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
