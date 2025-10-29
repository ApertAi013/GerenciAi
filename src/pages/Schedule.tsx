import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { classService } from '../services/classService';
import { enrollmentService } from '../services/enrollmentService';
import type { Class } from '../types/classTypes';
import '../styles/Schedule.css';

interface Student {
  id: string;
  name: string;
  enrollmentId?: number;
}

interface ClassSchedule {
  id: string;
  name: string;
  sport: string;
  day: number; // 0-6 (domingo-sábado)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  students: Student[];
  color: string;
}

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Mapeamento de dias da semana do banco para números
const WEEKDAY_TO_NUMBER: Record<string, number> = {
  'dom': 0,
  'seg': 1,
  'ter': 2,
  'qua': 3,
  'qui': 4,
  'sex': 5,
  'sab': 6,
};

// Mapeamento reverso: número para weekday
const NUMBER_TO_WEEKDAY: Record<number, 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
};

// Função para converter turma do banco para formato da agenda
const convertClassToSchedule = (dbClass: Class & { students?: any[] }): ClassSchedule => {
  // Cores predefinidas baseadas no ID da modalidade
  const colors = ['#8B5CF6', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#A78BFA'];
  const color = colors[dbClass.modality_id % colors.length];

  // Remover segundos do horário (18:00:00 -> 18:00)
  const startTime = dbClass.start_time.substring(0, 5);
  const endTime = dbClass.end_time ? dbClass.end_time.substring(0, 5) : startTime;

  return {
    id: dbClass.id.toString(),
    name: dbClass.name || dbClass.modality_name || 'Turma sem nome',
    sport: dbClass.modality_name || '',
    day: WEEKDAY_TO_NUMBER[dbClass.weekday] || 0,
    startTime: startTime,
    endTime: endTime,
    capacity: dbClass.capacity || 0,
    students: dbClass.students || [],
    color: color,
  };
};

// Componente de aluno arrastável
function DraggableStudent({ student, classId }: { student: Student; classId: string }) {
  // ID único combinando student.id + classId para evitar conflitos quando aluno está em múltiplas turmas
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
  // Draggable para mover a turma inteira
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `class-${classSchedule.id}`,
    data: { type: 'class', classId: classSchedule.id }
  });

  // Droppable para aceitar alunos
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `class-drop-${classSchedule.id}`,
    data: { type: 'class-drop', classId: classSchedule.id }
  });

  const filled = classSchedule.students.length;
  const capacity = classSchedule.capacity;
  const isFull = filled >= capacity;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: classSchedule.color,
      }
    : {
        backgroundColor: classSchedule.color,
      };

  // Combinar refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`class-card ${isOver ? 'drag-over-class' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="class-card-header">
        <span className="class-time">
          {classSchedule.startTime} - {classSchedule.endTime}
        </span>
        <span className={`class-capacity ${isFull ? 'full' : ''}`}>
          {filled}/{capacity}
        </span>
      </div>
      <div className="class-name">{classSchedule.name}</div>

      {classSchedule.students.length > 0 && (
        <div className="class-students" onClick={(e) => e.stopPropagation()}>
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

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Começa na segunda

  // Buscar turmas e alunos da API
  const fetchClassesAndStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Buscar turmas
      const classesResponse = await classService.getClasses({ status: 'ativa' });

      if (!classesResponse.success || !classesResponse.data) {
        setError('Erro ao carregar turmas');
        return;
      }

      // 2. Buscar detalhes de cada turma (incluindo alunos)
      const classesWithStudents = await Promise.all(
        classesResponse.data.map(async (dbClass) => {
          try {
            // Buscar turma por ID para obter os alunos
            const classDetailsResponse = await classService.getClassById(dbClass.id);

            if (!classDetailsResponse.success || !classDetailsResponse.data) {
              return {
                ...dbClass,
                students: []
              };
            }

            const classDetails = classDetailsResponse.data;
            console.log(`Detalhes da turma ${dbClass.id}:`, classDetails);

            const students = classDetails.students
              ? classDetails.students.map((s: any) => {
                  console.log('Mapeando aluno:', s);
                  return {
                    id: s.student_id.toString(),
                    name: s.student_name,
                    enrollmentId: s.enrollment_id
                  };
                })
              : [];

            return {
              ...dbClass,
              students
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes da turma ${dbClass.id}:`, error);
            return {
              ...dbClass,
              students: []
            };
          }
        })
      );

      // 3. Converter para formato da agenda
      const scheduleClasses = classesWithStudents.map((dbClass) =>
        convertClassToSchedule(dbClass)
      );

      setClasses(scheduleClasses);
    } catch (err) {
      console.error('Erro ao buscar turmas:', err);
      setError('Erro ao carregar turmas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassesAndStudents();
  }, [fetchClassesAndStudents]);

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Arrastar turma para novo horário
    if (activeData?.type === 'class' && overData?.type === 'timeslot') {
      const classId = activeData.classId;
      const newDay = overData.day;
      const newStartTime = overData.hour;

      // Atualizar UI otimisticamente
      const previousClasses = classes;
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === classId) {
            // Calcular duração original
            const originalStart = parseInt(cls.startTime.split(':')[0]);
            const originalEnd = parseInt(cls.endTime.split(':')[0]);
            const duration = originalEnd - originalStart;

            // Calcular novo endTime mantendo a duração
            const newStart = parseInt(newStartTime.split(':')[0]);
            const newEnd = newStart + duration;
            const newEndTime = `${String(newEnd).padStart(2, '0')}:00`;

            return { ...cls, day: newDay, startTime: newStartTime, endTime: newEndTime };
          }
          return cls;
        })
      );

      // Persistir no backend
      try {
        setIsSaving(true);
        const weekday = NUMBER_TO_WEEKDAY[newDay];
        const classIdNum = parseInt(classId);

        // Calcular end_time mantendo a duração
        const originalClass = previousClasses.find((c) => c.id === classId);
        if (!originalClass) return;

        const originalStart = parseInt(originalClass.startTime.split(':')[0]);
        const originalEnd = parseInt(originalClass.endTime.split(':')[0]);
        const duration = originalEnd - originalStart;

        const newStart = parseInt(newStartTime.split(':')[0]);
        const newEnd = newStart + duration;
        const newEndTime = `${String(newEnd).padStart(2, '0')}:00`;

        // Adicionar segundos no formato esperado pelo backend (HH:MM:SS)
        const startTimeWithSeconds = `${newStartTime}:00`;
        const endTimeWithSeconds = `${newEndTime}:00`;

        console.log('Atualizando turma no backend:', {
          classId: classIdNum,
          weekday,
          start_time: startTimeWithSeconds,
          end_time: endTimeWithSeconds
        });

        await classService.updateClass(classIdNum, {
          weekday,
          start_time: startTimeWithSeconds,
          end_time: endTimeWithSeconds
        });

        console.log('Turma atualizada com sucesso!');

        // Re-buscar dados atualizados
        await fetchClassesAndStudents();
      } catch (error) {
        console.error('Erro ao atualizar turma:', error);
        alert('Erro ao mover turma. Revertendo alteração.');
        setClasses(previousClasses);
      } finally {
        setIsSaving(false);
      }
    }

    // Arrastar aluno entre turmas
    if (activeData?.type === 'student' && overData?.type === 'class-drop') {
      const studentId = activeData.studentId;
      const fromClassId = activeData.classId;
      const toClassId = overData.classId;

      if (fromClassId === toClassId) {
        setActiveId(null);
        return;
      }

      const previousClasses = classes;
      const fromClass = previousClasses.find((c) => c.id === fromClassId);
      const toClass = previousClasses.find((c) => c.id === toClassId);

      if (!fromClass || !toClass) {
        setActiveId(null);
        return;
      }

      const student = fromClass.students.find((s) => s.id === studentId);
      if (!student || !student.enrollmentId) {
        setActiveId(null);
        return;
      }

      // Verificar se a turma de destino está cheia
      if (toClass.students.length >= toClass.capacity) {
        alert('Turma está cheia!');
        setActiveId(null);
        return;
      }

      // Atualizar UI otimisticamente
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === fromClassId) {
            return {
              ...cls,
              students: cls.students.filter((s) => s.id !== studentId)
            };
          }
          if (cls.id === toClassId) {
            return {
              ...cls,
              students: [...cls.students, student]
            };
          }
          return cls;
        })
      );

      // Persistir no backend
      try {
        setIsSaving(true);

        console.log('Iniciando transferência de aluno:', {
          studentId: student.id,
          studentName: student.name,
          enrollmentId: student.enrollmentId,
          fromClassId: fromClassId,
          toClassId: toClassId
        });

        // Verificar se temos enrollment_id
        if (!student.enrollmentId) {
          console.error('Aluno sem enrollment_id:', student);
          alert('Erro: Dados da matrícula não encontrados. Recarregue a página.');
          setClasses(previousClasses);
          setIsSaving(false);
          setActiveId(null);
          return;
        }

        // Buscar todas as turmas onde o aluno está matriculado (usando dados em memória)
        const studentClassIds = previousClasses
          .filter(cls => cls.students.some(s => s.id === studentId))
          .map(cls => parseInt(cls.id));

        console.log('Turmas atuais do aluno:', studentClassIds);

        // Verificar se o aluno já está na turma de destino
        if (studentClassIds.includes(parseInt(toClassId))) {
          alert('Aluno já está matriculado nesta turma!');
          setClasses(previousClasses);
          setIsSaving(false);
          setActiveId(null);
          return;
        }

        // Atualizar array de turmas: remover turma antiga, adicionar nova
        const updatedClassIds = studentClassIds
          .filter(id => id !== parseInt(fromClassId))  // Remove turma antiga
          .concat(parseInt(toClassId));                 // Adiciona turma nova

        console.log('Array de turmas atualizado:', {
          antes: studentClassIds,
          depois: updatedClassIds
        });

        // Enviar array atualizado ao backend
        const updateResponse = await enrollmentService.updateEnrollmentClasses(student.enrollmentId, {
          class_ids: updatedClassIds
        });

        console.log('Resposta da atualização:', updateResponse);

        if (!updateResponse.success) {
          throw new Error(updateResponse.message || 'Erro ao atualizar matrícula');
        }

        console.log('Aluno transferido com sucesso!');

        // Re-buscar dados atualizados
        await fetchClassesAndStudents();
      } catch (error: any) {
        console.error('Erro ao transferir aluno:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
        alert(`Erro ao transferir aluno: ${errorMessage}`);
        setClasses(previousClasses);
      } finally {
        setIsSaving(false);
      }
    }

    setActiveId(null);
  };

  const getClassesForDayAndTime = (day: number, hour: string) => {
    return classes.filter(
      (cls) => cls.day === day && cls.startTime === hour
    );
  };

  const activeClass = activeId
    ? classes.find((c) => `class-${c.id}` === activeId)
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="schedule-page">
        <div className="schedule-header">
          <div className="schedule-title">
            <h1>Agenda</h1>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#666'
        }}>
          <div>Carregando turmas...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="schedule-page">
        <div className="schedule-header">
          <div className="schedule-title">
            <h1>Agenda</h1>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          gap: '20px'
        }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>{error}</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#F97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
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

      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-title">
          <h1>Agenda</h1>
        </div>

        <div className="schedule-controls">
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Semana
            </button>
            <button
              type="button"
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Dia
            </button>
          </div>

          <div className="date-navigation">
            <button type="button" onClick={handlePreviousWeek} className="nav-button">
              ←
            </button>
            <button type="button" onClick={handleToday} className="today-button">
              Hoje
            </button>
            <button type="button" onClick={handleNextWeek} className="nav-button">
              →
            </button>
          </div>

          <div className="month-year">
            {format(currentWeek, 'MMMM, yyyy', { locale: ptBR }).toUpperCase()}
          </div>

          <div className="action-buttons">
            <button type="button" className="btn-primary">
              📅 BUSCAR HORÁRIOS
            </button>
            <button type="button" className="btn-icon">+</button>
            <button type="button" className="btn-icon">🗑️</button>
            <button type="button" className="btn-icon">🔍</button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="schedule-grid-container">
          <div className="schedule-grid">
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

              return (
                <div key={dayOffset} className="day-column">
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
    </div>
  );
}
