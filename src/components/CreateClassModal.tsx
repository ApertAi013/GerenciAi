import { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import { courtService } from '../services/courtService';
import { levelService } from '../services/levelService';
import type { Modality, Class } from '../types/classTypes';
import type { Level } from '../types/levelTypes';
import { useThemeStore } from '../store/themeStore';
import '../styles/Classes.css';
import '../styles/ModernModal.css';

interface ScheduleSlot {
  weekdays: string[];
  start_time: string;
  end_time: string;
}

const WEEKDAY_OPTIONS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

interface CreateClassModalProps {
  modalities: Modality[];
  onClose: () => void;
  onSuccess: () => void;
  editClass?: Class;
  prefilledData?: { weekday: string; start_time: string } | null;
}

export default function CreateClassModal({
  modalities,
  onClose,
  onSuccess,
  editClass,
  prefilledData,
}: CreateClassModalProps) {
  const isEditMode = !!editClass;
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    modality_id: '',
    name: '',
    location: '',
    capacity: '20',
    level: '' as '' | 'iniciante' | 'intermediario' | 'avancado' | 'todos',
    color: '#3B82F6', // Default blue color
  });

  // Múltiplos horários
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([{
    weekdays: [],
    start_time: '',
    end_time: ''
  }]);

  // Duração padrão
  const [duration, setDuration] = useState<30 | 60 | 90>(60);

  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [courts, setCourts] = useState<{ id: number; name: string }[]>([]);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch levels and courts on mount
  useEffect(() => {
    fetchLevels();
    fetchCourts();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await levelService.getLevels();
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        // Mostrar todos os níveis (padrão + customizados)
        setLevels(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar níveis:', error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await courtService.getCourts();
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setCourts(response.data.filter((c: any) => c.status === 'ativa').map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
    }
  };

  // Se editando e o location não bate com nenhuma quadra, habilitar texto livre
  useEffect(() => {
    if (editClass && editClass.location && courts.length > 0) {
      const matchesCourt = courts.some(c => c.name === editClass.location);
      if (!matchesCourt) {
        setUseCustomLocation(true);
      }
    }
  }, [editClass, courts]);

  // Aplicar dados pré-preenchidos da agenda
  useEffect(() => {
    if (prefilledData && !isEditMode) {
      setSchedules([{
        weekdays: [prefilledData.weekday],
        start_time: prefilledData.start_time,
        end_time: calculateEndTime(prefilledData.start_time, duration)
      }]);
    }
  }, [prefilledData, duration, isEditMode]);

  // Preencher formulário quando estiver em modo de edição
  useEffect(() => {
    if (editClass) {
      setFormData({
        modality_id: editClass.modality_id.toString(),
        name: editClass.name || '',
        location: editClass.location || '',
        capacity: editClass.capacity.toString(),
        level: editClass.level || '',
        color: editClass.color || '#3B82F6',
      });

      // Em modo de edição, apenas um horário
      setSchedules([{
        weekdays: [editClass.weekday],
        start_time: editClass.start_time.substring(0, 5),
        end_time: editClass.end_time ? editClass.end_time.substring(0, 5) : '',
      }]);

      if (editClass.allowed_levels && editClass.allowed_levels.length > 0) {
        setSelectedLevels(editClass.allowed_levels);
      }
    }
  }, [editClass]);

  // Calcular horário de término baseado na duração
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    let endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    // Limitar para 23:59 (não permitir horários >= 24:00)
    if (endHours >= 24) {
      endHours = 23;
      return '23:59';
    }

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Atualizar end_time quando mudar start_time ou duration
  const handleStartTimeChange = (index: number, startTime: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].start_time = startTime;
    newSchedules[index].end_time = calculateEndTime(startTime, duration);
    setSchedules(newSchedules);
  };

  const handleDurationChange = (newDuration: 30 | 60 | 90) => {
    setDuration(newDuration);
    // Atualizar todos os end_times
    const updatedSchedules = schedules.map(schedule => ({
      ...schedule,
      end_time: schedule.start_time ? calculateEndTime(schedule.start_time, newDuration) : ''
    }));
    setSchedules(updatedSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { weekdays: [], start_time: '', end_time: '' }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleLevelToggle = (levelName: string) => {
    setSelectedLevels((prev) =>
      prev.includes(levelName)
        ? prev.filter((l) => l !== levelName)
        : [...prev, levelName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validar
      if (!formData.modality_id) {
        setError('Modalidade é obrigatória');
        setIsSubmitting(false);
        return;
      }

      // Validar horários
      for (const schedule of schedules) {
        if (schedule.weekdays.length === 0 || !schedule.start_time) {
          setError('Todos os horários devem ter dia(s) da semana e horário de início');
          setIsSubmitting(false);
          return;
        }
      }

      if (isEditMode && editClass) {
        // Modo de edição - apenas um horário/dia
        const payload: any = {
          modality_id: parseInt(formData.modality_id),
          weekday: schedules[0].weekdays[0],
          start_time: schedules[0].start_time,
          capacity: parseInt(formData.capacity),
        };

        if (formData.name) payload.name = formData.name;
        if (schedules[0].end_time) payload.end_time = schedules[0].end_time;
        if (formData.location) payload.location = formData.location;
        payload.level = 'todos';
        if (formData.color) payload.color = formData.color;
        payload.allowed_levels = selectedLevels.length > 0 ? selectedLevels : null;

        const response = await classService.updateClass(editClass.id, payload);

        const isSuccess = (response as any).status === 'success' || (response as any).success === true;
        if (!isSuccess) {
          throw new Error((response as any).message || 'Erro ao atualizar turma');
        }
      } else {
        // Modo de criação - criar uma turma para cada dia selecionado em cada horário
        for (const schedule of schedules) {
          for (const weekday of schedule.weekdays) {
            const payload: any = {
              modality_id: parseInt(formData.modality_id),
              weekday,
              start_time: schedule.start_time,
              capacity: parseInt(formData.capacity),
            };

            if (formData.name) payload.name = formData.name;
            if (schedule.end_time) payload.end_time = schedule.end_time;
            if (formData.location) payload.location = formData.location;
            payload.level = 'todos';
            if (formData.color) payload.color = formData.color;
            payload.allowed_levels = selectedLevels.length > 0 ? selectedLevels : null;

            const response = await classService.createClass(payload);

            const isSuccess = (response as any).status === 'success' || (response as any).success === true;
            if (!isSuccess) {
              throw new Error((response as any).message || 'Erro ao criar turma');
            }
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      if (err.response?.data?.code === 'PLAN_LIMIT_EXCEEDED') {
        setError(`Limite de turmas atingido (${err.response.data.current}/${err.response.data.max}). Acesse "Meu Plano" para fazer upgrade.`);
      } else {
        setError(err.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} turma`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{isEditMode ? 'Editar Turma' : 'Criar Nova Turma'}</h2>
          <button type="button" className="mm-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mm-content">
          <div className="mm-field">
            <label htmlFor="modality_id">Modalidade *</label>
            <select
              id="modality_id"
              value={formData.modality_id}
              onChange={(e) => setFormData({ ...formData, modality_id: e.target.value })}
              required
            >
              <option value="">Selecione uma modalidade...</option>
              {modalities.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mm-field">
            <label htmlFor="name">Nome da Turma (opcional)</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Futevôlei Iniciante - Segunda"
            />
          </div>

          {/* Duração da Aula */}
          <div className="mm-field">
            <label>Duração da Aula *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[30, 60, 90].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={duration === mins ? 'mm-btn mm-btn-primary' : 'mm-btn mm-btn-secondary'}
                  onClick={() => handleDurationChange(mins as 30 | 60 | 90)}
                  style={{ flex: 1 }}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <small style={{ color: isDark ? '#6b6b6b' : '#666', marginTop: '0.5rem', display: 'block' }}>
              O horário de término será calculado automaticamente
            </small>
          </div>

          {/* Horários Múltiplos */}
          <div className="mm-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Horários da Turma *</label>
              {!isEditMode && (
                <button
                  type="button"
                  className="mm-btn mm-btn-secondary"
                  onClick={addSchedule}
                  style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                >
                  + Adicionar Horário
                </button>
              )}
            </div>

            {schedules.map((schedule, index) => (
              <div key={index} style={{
                border: `1px solid ${isDark ? '#262626' : '#ddd'}`,
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: isDark ? '#141414' : '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong>Horário {index + 1}</strong>
                  {!isEditMode && schedules.length > 1 && (
                    <button
                      type="button"
                      className="mm-btn mm-btn-danger"
                      onClick={() => removeSchedule(index)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="mm-field" style={{ margin: '0 0 0.75rem' }}>
                  <label>{isEditMode ? 'Dia da Semana *' : 'Dias da Semana * (selecione um ou mais)'}</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {WEEKDAY_OPTIONS.map(w => (
                      <div
                        key={w.key}
                        onClick={() => {
                          if (isEditMode) {
                            const newSchedules = [...schedules];
                            newSchedules[index].weekdays = [w.key];
                            setSchedules(newSchedules);
                          } else {
                            const newSchedules = [...schedules];
                            const days = newSchedules[index].weekdays;
                            newSchedules[index].weekdays = days.includes(w.key)
                              ? days.filter(d => d !== w.key)
                              : [...days, w.key];
                            setSchedules(newSchedules);
                          }
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s',
                          background: schedule.weekdays.includes(w.key) ? '#22C55E' : (isDark ? '#262626' : '#F3F4F6'),
                          color: schedule.weekdays.includes(w.key) ? 'white' : (isDark ? '#f0f0f0' : '#374151'),
                          border: `1.5px solid ${schedule.weekdays.includes(w.key) ? '#16A34A' : (isDark ? '#333' : '#D1D5DB')}`,
                        }}
                      >
                        {w.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mm-field-row">
                  <div className="mm-field" style={{ margin: 0 }}>
                    <label>Horário Início *</label>
                    <input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => handleStartTimeChange(index, e.target.value)}
                      required
                    />
                  </div>

                  <div className="mm-field" style={{ margin: 0 }}>
                    <label>Horário Fim</label>
                    <input
                      type="time"
                      value={schedule.end_time}
                      readOnly
                      style={{ backgroundColor: isDark ? '#0f0f0f' : '#f0f0f0' }}
                      title="Calculado automaticamente baseado na duração"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Multi-Level Selection */}
          {levels.length > 0 && (
            <div className="mm-field">
              <label>Níveis Permitidos (Múltipla Escolha)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                {levels.map((level) => (
                  <label
                    key={level.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      border: '2px solid',
                      borderColor: selectedLevels.includes(level.name) ? '#10b981' : (isDark ? '#333' : '#ddd'),
                      borderRadius: '6px',
                      backgroundColor: selectedLevels.includes(level.name) ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5') : (isDark ? '#1a1a1a' : 'white'),
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level.name)}
                      onChange={() => handleLevelToggle(level.name)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: selectedLevels.includes(level.name) ? 600 : 400 }}>
                      {level.name}
                    </span>
                  </label>
                ))}
              </div>
              <small style={{ color: isDark ? '#6b6b6b' : '#666', marginTop: '0.5rem', display: 'block' }}>
                Selecione os níveis de alunos que podem participar desta turma
              </small>
            </div>
          )}

          {/* Color Picker */}
          <div className="mm-field">
            <label>Cor da Turma *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Preset Colors */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
                {[
                  { color: '#3B82F6', name: 'Azul' },
                  { color: '#10B981', name: 'Verde' },
                  { color: '#F59E0B', name: 'Laranja' },
                  { color: '#EF4444', name: 'Vermelho' },
                  { color: '#8B5CF6', name: 'Roxo' },
                  { color: '#EC4899', name: 'Rosa' },
                  { color: '#06B6D4', name: 'Ciano' },
                  { color: '#F97316', name: 'Amber' },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: color,
                      border: formData.color === color ? `3px solid ${isDark ? '#fff' : '#000'}` : `2px solid ${isDark ? '#333' : '#ddd'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: formData.color === color ? `0 0 0 2px ${isDark ? '#1a1a1a' : 'white'}, 0 0 0 4px ${color}` : 'none'
                    }}
                    title={name}
                  />
                ))}
              </div>

              {/* Custom Color Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '50px',
                    height: '40px',
                    borderRadius: '8px',
                    border: `2px solid ${isDark ? '#333' : '#ddd'}`,
                    cursor: 'pointer'
                  }}
                  title="Escolher cor customizada"
                />
                <small style={{ fontSize: '0.7rem', color: isDark ? '#6b6b6b' : '#666' }}>Custom</small>
              </div>
            </div>
            <small style={{ color: isDark ? '#6b6b6b' : '#666', marginTop: '0.5rem', display: 'block' }}>
              Esta cor será usada no calendário e na visualização de matrículas
            </small>
          </div>

          <div className="mm-field-row">
            <div className="mm-field">
              <label htmlFor="location">Local (Quadra)</label>
              {courts.length > 0 && !useCustomLocation ? (
                <>
                  <select
                    id="location"
                    value={formData.location}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setUseCustomLocation(true);
                        setFormData({ ...formData, location: '' });
                      } else {
                        setFormData({ ...formData, location: e.target.value });
                      }
                    }}
                  >
                    <option value="">Selecione a quadra</option>
                    {courts.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="__custom__">Outro local...</option>
                  </select>
                </>
              ) : (
                <>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Quadra 1"
                  />
                  {courts.length > 0 && (
                    <small
                      style={{ color: 'var(--accent)', cursor: 'pointer', marginTop: '0.25rem', display: 'block' }}
                      onClick={() => { setUseCustomLocation(false); setFormData({ ...formData, location: '' }); }}
                    >
                      Selecionar quadra cadastrada
                    </small>
                  )}
                </>
              )}
            </div>

            <div className="mm-field">
              <label htmlFor="capacity">Capacidade</label>
              <input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                min="1"
              />
            </div>
          </div>

          </div>
          <div className="mm-footer">
            <button type="button" className="mm-btn mm-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="mm-btn mm-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? 'Salvando...' : 'Criando...')
                : (isEditMode ? 'Salvar Alterações' : `Criar ${schedules.length > 1 ? `${schedules.length} Turmas` : 'Turma'}`)
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
