import { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import { levelService } from '../services/levelService';
import type { Modality, Class } from '../types/classTypes';
import type { Level } from '../types/levelTypes';
import '../styles/Classes.css';
import '../styles/ModernModal.css';

interface ScheduleSlot {
  weekday: '' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  start_time: string;
  end_time: string;
}

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
    weekday: '' as '' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
    start_time: '',
    end_time: ''
  }]);

  // Duração padrão
  const [duration, setDuration] = useState<30 | 60 | 90>(60);

  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch levels on mount
  useEffect(() => {
    fetchLevels();
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

  // Aplicar dados pré-preenchidos da agenda
  useEffect(() => {
    if (prefilledData && !isEditMode) {
      setSchedules([{
        weekday: prefilledData.weekday as any,
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
        weekday: editClass.weekday,
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
    setSchedules([...schedules, { weekday: '', start_time: '', end_time: '' }]);
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
        if (!schedule.weekday || !schedule.start_time) {
          setError('Todos os horários devem ter dia da semana e horário de início');
          setIsSubmitting(false);
          return;
        }
      }

      if (isEditMode && editClass) {
        // Modo de edição - apenas um horário
        const payload: any = {
          modality_id: parseInt(formData.modality_id),
          weekday: schedules[0].weekday,
          start_time: schedules[0].start_time,
          capacity: parseInt(formData.capacity),
        };

        if (formData.name) payload.name = formData.name;
        if (schedules[0].end_time) payload.end_time = schedules[0].end_time;
        if (formData.location) payload.location = formData.location;
        payload.level = 'todos'; // backward compat fallback
        if (formData.color) payload.color = formData.color;
        payload.allowed_levels = selectedLevels.length > 0 ? selectedLevels : null;

        const response = await classService.updateClass(editClass.id, payload);

        // Verificar resposta (suporta ambos formatos: success e status)
        const isSuccess = (response as any).status === 'success' || (response as any).success === true;
        if (!isSuccess) {
          throw new Error((response as any).message || 'Erro ao atualizar turma');
        }
      } else {
        // Modo de criação - criar uma turma para cada horário
        for (const schedule of schedules) {
          const payload: any = {
            modality_id: parseInt(formData.modality_id),
            weekday: schedule.weekday,
            start_time: schedule.start_time,
            capacity: parseInt(formData.capacity),
          };

          if (formData.name) payload.name = formData.name;
          if (schedule.end_time) payload.end_time = schedule.end_time;
          if (formData.location) payload.location = formData.location;
          payload.level = 'todos'; // backward compat fallback
          if (formData.color) payload.color = formData.color;
          payload.allowed_levels = selectedLevels.length > 0 ? selectedLevels : null;

          const response = await classService.createClass(payload);

          // Verificar resposta (suporta ambos formatos: success e status)
          const isSuccess = (response as any).status === 'success' || (response as any).success === true;
          if (!isSuccess) {
            throw new Error((response as any).message || 'Erro ao criar turma');
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
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
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
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#f9f9f9'
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

                <div className="mm-field-row">
                  <div className="mm-field" style={{ margin: 0 }}>
                    <label>Dia da Semana *</label>
                    <select
                      value={schedule.weekday}
                      onChange={(e) => {
                        const newSchedules = [...schedules];
                        newSchedules[index].weekday = e.target.value as any;
                        setSchedules(newSchedules);
                      }}
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="seg">Segunda-feira</option>
                      <option value="ter">Terça-feira</option>
                      <option value="qua">Quarta-feira</option>
                      <option value="qui">Quinta-feira</option>
                      <option value="sex">Sexta-feira</option>
                      <option value="sab">Sábado</option>
                      <option value="dom">Domingo</option>
                    </select>
                  </div>

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
                      style={{ backgroundColor: '#f0f0f0' }}
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
                      borderColor: selectedLevels.includes(level.name) ? '#10b981' : '#ddd',
                      borderRadius: '6px',
                      backgroundColor: selectedLevels.includes(level.name) ? '#d1fae5' : 'white',
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
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
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
                      border: formData.color === color ? '3px solid #000' : '2px solid #ddd',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: formData.color === color ? '0 0 0 2px white, 0 0 0 4px ' + color : 'none'
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
                    border: '2px solid #ddd',
                    cursor: 'pointer'
                  }}
                  title="Escolher cor customizada"
                />
                <small style={{ fontSize: '0.7rem', color: '#666' }}>Custom</small>
              </div>
            </div>
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Esta cor será usada no calendário e na visualização de matrículas
            </small>
          </div>

          <div className="mm-field-row">
            <div className="mm-field">
              <label htmlFor="location">Local</label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Quadra 1"
              />
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
