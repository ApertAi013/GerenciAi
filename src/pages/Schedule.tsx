import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addWeeks, subWeeks, addDays, addMonths, subMonths, addDays as addDaysUtil, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { classService } from '../services/classService';
import { enrollmentService } from '../services/enrollmentService';
import { rentalService } from '../services/rentalService';
import type { Class, Modality } from '../types/classTypes';
import type { CourtRental } from '../types/rentalTypes';
import CreateClassModal from '../components/CreateClassModal';
import MonthView from '../components/schedule/MonthView';
import DayView from '../components/schedule/DayView';
import WeekView from '../components/schedule/WeekView';
import FilterDropdown from '../components/schedule/FilterDropdown';
import '../styles/Schedule.css';

interface Student {
  id: string;
  name: string;
  enrollmentId?: number;
}

interface ClassSchedule {
  id: string;
  type: 'class' | 'rental'; // Novo: diferenciar turmas de locações
  name: string;
  sport: string;
  day: number; // 0-6 (domingo-sábado)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  students: Student[];
  color: string;
  modality_id: number;
  level?: string;
  // Campos específicos de locação
  rentalDate?: string; // Para locações: data específica
  renterName?: string;
  courtName?: string;
  paymentStatus?: string;
}

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
    type: 'class',
    name: dbClass.name || dbClass.modality_name || 'Turma sem nome',
    sport: dbClass.modality_name || '',
    day: WEEKDAY_TO_NUMBER[dbClass.weekday] || 0,
    startTime: startTime,
    endTime: endTime,
    capacity: dbClass.capacity || 0,
    students: dbClass.students || [],
    color: color,
    modality_id: dbClass.modality_id,
    level: dbClass.level,
  };
};

// Função para converter locação do banco para formato da agenda
const convertRentalToSchedule = (rental: CourtRental): ClassSchedule => {
  // Cor baseada no status de pagamento
  const color = rental.payment_status === 'paga' ? '#10B981' : rental.payment_status === 'pendente' ? '#F59E0B' : '#EF4444';

  // Obter dia da semana da data - com parse robusto
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();

    // Se for formato YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateString + 'T00:00:00');
    }
    // Tenta parse direto
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    // Fallback para data atual
    console.error('Data inválida no Schedule:', dateString);
    return new Date();
  };

  const rentalDate = parseDate(rental.rental_date);
  const day = rentalDate.getDay();

  return {
    id: `rental-${rental.id}`,
    type: 'rental',
    name: rental.court_name,
    sport: `Locação - ${rental.renter_name}`,
    day: day,
    startTime: rental.start_time.substring(0, 5),
    endTime: rental.end_time.substring(0, 5),
    capacity: 1,
    students: [],
    color: color,
    modality_id: -1, // ID especial para locações
    rentalDate: rental.rental_date,
    renterName: rental.renter_name,
    courtName: rental.court_name,
    paymentStatus: rental.payment_status,
  };
};

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedModalities, setSelectedModalities] = useState<number[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // Aplicar filtros nas turmas
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Filtrar por modalidade
    if (selectedModalities.length > 0) {
      filtered = filtered.filter(cls =>
        selectedModalities.includes(cls.modality_id)
      );
    }

    // Filtrar por nível
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(cls =>
        cls.level && selectedLevels.includes(cls.level)
      );
    }

    return filtered;
  }, [classes, selectedModalities, selectedLevels]);

  const handleFilterChange = (modalities: number[], levels: string[]) => {
    setSelectedModalities(modalities);
    setSelectedLevels(levels);
  };

  // Buscar turmas e alunos da API
  const fetchClassesAndStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Buscar modalidades
      try {
        const modalitiesRes = await classService.getModalities();
        setModalities(modalitiesRes.data || []);
      } catch (err) {
        console.error('Erro ao buscar modalidades:', err);
        setModalities([]);
      }

      // 2. Buscar turmas
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

      // 3. Converter turmas para formato da agenda
      const scheduleClasses = classesWithStudents.map((dbClass) =>
        convertClassToSchedule(dbClass)
      );

      // 4. Buscar locações da semana/mês/dia atual
      let rentals: CourtRental[] = [];
      try {
        // Calcular período baseado no viewMode e currentWeek
        const startDate = format(
          viewMode === 'month'
            ? new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1)
            : viewMode === 'week'
            ? addDays(currentWeek, -currentWeek.getDay()) // Domingo da semana
            : currentWeek,
          'yyyy-MM-dd'
        );

        const endDate = format(
          viewMode === 'month'
            ? new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0)
            : viewMode === 'week'
            ? addDays(currentWeek, 6 - currentWeek.getDay()) // Sábado da semana
            : currentWeek,
          'yyyy-MM-dd'
        );

        const rentalsResponse = await rentalService.getRentals({
          start_date: startDate,
          end_date: endDate,
        });

        if (rentalsResponse.success && rentalsResponse.data) {
          // Filtrar locações não canceladas
          rentals = rentalsResponse.data.filter(r => r.status !== 'cancelada');
        }
      } catch (err) {
        console.error('Erro ao buscar locações:', err);
        // Continuar mesmo se falhar ao buscar locações
      }

      // 5. Converter locações para formato da agenda
      const scheduleRentals = rentals.map((rental) =>
        convertRentalToSchedule(rental)
      );

      // 6. Combinar turmas e locações
      const combinedSchedule = [...scheduleClasses, ...scheduleRentals];

      setClasses(combinedSchedule);
    } catch (err) {
      console.error('Erro ao buscar turmas:', err);
      setError('Erro ao carregar turmas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek, viewMode]);

  useEffect(() => {
    fetchClassesAndStudents();
  }, [fetchClassesAndStudents]);

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else if (viewMode === 'month') {
      setCurrentWeek(subMonths(currentWeek, 1));
    } else if (viewMode === 'day') {
      setCurrentWeek(subDays(currentWeek, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentWeek(addWeeks(currentWeek, 1));
    } else if (viewMode === 'month') {
      setCurrentWeek(addMonths(currentWeek, 1));
    } else if (viewMode === 'day') {
      setCurrentWeek(addDaysUtil(currentWeek, 1));
    }
  };

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
            // Calcular duração original em minutos
            const [oldStartH, oldStartM] = cls.startTime.split(':').map(Number);
            const [oldEndH, oldEndM] = cls.endTime.split(':').map(Number);
            const oldStartMinutes = oldStartH * 60 + oldStartM;
            const oldEndMinutes = oldEndH * 60 + oldEndM;
            const durationMinutes = oldEndMinutes - oldStartMinutes;

            console.log('Drag - Turma original:', {
              startTime: cls.startTime,
              endTime: cls.endTime,
              oldStartMinutes,
              oldEndMinutes,
              durationMinutes
            });

            // Calcular novo endTime mantendo a duração
            const [newStartH, newStartM] = newStartTime.split(':').map(Number);
            const newStartMinutes = newStartH * 60 + newStartM;
            const newEndMinutes = newStartMinutes + durationMinutes;
            const newEndH = Math.floor(newEndMinutes / 60);
            const newEndM = newEndMinutes % 60;
            const newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`;

            console.log('Drag - Novo horário:', {
              newStartTime,
              newEndTime,
              newStartMinutes,
              newEndMinutes,
              durationMinutes
            });

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

        // Calcular duração em minutos
        const [oldStartH, oldStartM] = originalClass.startTime.split(':').map(Number);
        const [oldEndH, oldEndM] = originalClass.endTime.split(':').map(Number);
        const oldStartMinutes = oldStartH * 60 + oldStartM;
        const oldEndMinutes = oldEndH * 60 + oldEndM;
        const durationMinutes = oldEndMinutes - oldStartMinutes;

        // Aplicar duração ao novo horário
        const [newStartH, newStartM] = newStartTime.split(':').map(Number);
        const newStartMinutes = newStartH * 60 + newStartM;
        const newEndMinutes = newStartMinutes + durationMinutes;
        const newEndH = Math.floor(newEndMinutes / 60);
        const newEndM = newEndMinutes % 60;
        const newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`;

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

        // Não precisa refetch - já atualizamos o estado otimisticamente
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

        // Não precisa refetch - já atualizamos o estado otimisticamente
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
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Mês
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
            <button type="button" onClick={handlePrevious} className="nav-button">
              ←
            </button>
            <button type="button" onClick={handleToday} className="today-button">
              Hoje
            </button>
            <button type="button" onClick={handleNext} className="nav-button">
              →
            </button>
          </div>

          <div className="month-year">
            {format(currentWeek, 'MMMM, yyyy', { locale: ptBR }).toUpperCase()}
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              title="Filtrar turmas"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FontAwesomeIcon icon={faFilter} />
              FILTRAR TURMAS
              {(selectedModalities.length > 0 || selectedLevels.length > 0) && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {selectedModalities.length + selectedLevels.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowCreateModal(true)}
              title="Criar nova turma"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => alert('Funcionalidade de limpar agenda em desenvolvimento')}
              title="Limpar seleção"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' ? (
        <MonthView currentDate={currentWeek} classes={filteredClasses} />
      ) : viewMode === 'day' ? (
        <DayView currentDate={currentWeek} classes={filteredClasses} />
      ) : (
        <WeekView
          currentWeek={currentWeek}
          classes={filteredClasses}
          activeId={activeId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          isSaving={isSaving}
        />
      )}

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <FilterDropdown
          modalities={modalities}
          selectedModalities={selectedModalities}
          selectedLevels={selectedLevels}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilterDropdown(false)}
        />
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          modalities={modalities}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchClassesAndStudents();
          }}
        />
      )}
    </div>
  );
}
