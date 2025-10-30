import { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import { levelService } from '../services/levelService';
import type { Modality, Class } from '../types/classTypes';
import type { Level } from '../types/levelTypes';
import '../styles/Classes.css';

interface CreateClassModalProps {
  modalities: Modality[];
  onClose: () => void;
  onSuccess: () => void;
  editClass?: Class; // Prop opcional para modo de edição
}

export default function CreateClassModal({
  modalities,
  onClose,
  onSuccess,
  editClass,
}: CreateClassModalProps) {
  const isEditMode = !!editClass;

  const [formData, setFormData] = useState({
    modality_id: '',
    name: '',
    weekday: '' as '' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
    start_time: '',
    end_time: '',
    location: '',
    capacity: '20',
    level: '' as '' | 'iniciante' | 'intermediario' | 'avancado' | 'todos',
  });
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
      if (response.success) {
        setLevels(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar níveis:', error);
    }
  };

  // Preencher formulário quando estiver em modo de edição
  useEffect(() => {
    if (editClass) {
      setFormData({
        modality_id: editClass.modality_id.toString(),
        name: editClass.name || '',
        weekday: editClass.weekday,
        start_time: editClass.start_time.substring(0, 5), // Remove segundos
        end_time: editClass.end_time ? editClass.end_time.substring(0, 5) : '',
        location: editClass.location || '',
        capacity: editClass.capacity.toString(),
        level: editClass.level || '',
      });
      // Set selected levels from allowed_levels
      if (editClass.allowed_levels && editClass.allowed_levels.length > 0) {
        setSelectedLevels(editClass.allowed_levels);
      }
    }
  }, [editClass]);

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
      if (!formData.modality_id || !formData.weekday || !formData.start_time) {
        setError('Modalidade, dia e horário de início são obrigatórios');
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        modality_id: parseInt(formData.modality_id),
        weekday: formData.weekday,
        start_time: formData.start_time,
        capacity: parseInt(formData.capacity),
      };

      if (formData.name) payload.name = formData.name;
      if (formData.end_time) payload.end_time = formData.end_time;
      if (formData.location) payload.location = formData.location;
      if (formData.level) payload.level = formData.level;

      // Add allowed levels if any are selected
      if (selectedLevels.length > 0) {
        payload.allowed_levels = selectedLevels;
      }

      if (isEditMode && editClass) {
        // Modo de edição
        await classService.updateClass(editClass.id, payload);
      } else {
        // Modo de criação
        await classService.createClass(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} turma`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Turma' : 'Criar Nova Turma'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="class-form">
          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="name">Nome da Turma (opcional)</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Futevôlei Iniciante - Segunda"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weekday">Dia da Semana *</label>
              <select
                id="weekday"
                value={formData.weekday}
                onChange={(e) => setFormData({ ...formData, weekday: e.target.value as any })}
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

            <div className="form-group">
              <label htmlFor="level">Nível (Legado)</label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
              >
                <option value="">Selecione...</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          {/* Multi-Level Selection */}
          {levels.length > 0 && (
            <div className="form-group">
              <label>Níveis Permitidos (Múltipla Escolha)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                {levels.map((level) => (
                  <label
                    key={level.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: selectedLevels.includes(level.name) ? '#e3f2fd' : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(level.name)}
                      onChange={() => handleLevelToggle(level.name)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{level.name}</span>
                  </label>
                ))}
              </div>
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                Selecione os níveis de alunos que podem participar desta turma
              </small>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">Horário Início *</label>
              <input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time">Horário Fim</label>
              <input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Local</label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Quadra 1"
              />
            </div>

            <div className="form-group">
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? 'Salvando...' : 'Criando...')
                : (isEditMode ? 'Salvar Alterações' : 'Criar Turma')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
