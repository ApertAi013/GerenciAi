import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, FileText, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { trialStudentService } from '../services/trialStudentService';
import { levelService } from '../services/levelService';
import type { CreateTrialStudentRequest } from '../types/trialStudentTypes';
import type { Level } from '../types/levelTypes';
import '../styles/TrialStudents.css';

interface CreateTrialStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTrialStudentModal({
  onClose,
  onSuccess,
}: CreateTrialStudentModalProps) {
  const [formData, setFormData] = useState<CreateTrialStudentRequest>({
    full_name: '',
    phone: '',
    email: '',
    retention_days: 30,
    notes: '',
    level: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await levelService.getLevels();
        if (response.success && response.data) {
          setLevels(response.data);
          // Set first level as default
          if (response.data.length > 0) {
            setFormData((prev) => ({ ...prev, level: response.data[0].name }));
          }
        }
      } catch (error) {
        console.error('Error loading levels:', error);
        toast.error('Erro ao carregar níveis');
      } finally {
        setIsLoadingLevels(false);
      }
    };

    fetchLevels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      // Remove empty strings to allow optional fields to be null
      const payload = {
        ...formData,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      const response = await trialStudentService.create(payload);

      if (response.status === 'success') {
        toast.success('Aluno experimental criado com sucesso!');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating trial student:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao criar aluno experimental'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div className="trial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trial-modal-header">
          <h2>
            <User size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Novo Aluno Experimental
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="trial-modal-body">
            {/* Nome Completo */}
            <div className="trial-form-group">
              <label htmlFor="full_name" className="required">
                <User size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Nome Completo
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>

            {/* Telefone e Email */}
            <div className="trial-form-row">
              <div className="trial-form-group">
                <label htmlFor="phone">
                  <Phone size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <small>Opcional - útil para envio de follow-ups via WhatsApp</small>
              </div>

              <div className="trial-form-group">
                <label htmlFor="email">
                  <Mail size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <small>Opcional - útil para envio de follow-ups via e-mail</small>
              </div>
            </div>

            {/* Nível e Período de Retenção */}
            <div className="trial-form-row">
              <div className="trial-form-group">
                <label htmlFor="level">
                  <TrendingUp size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Nível
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value,
                    })
                  }
                  disabled={isLoadingLevels}
                >
                  {isLoadingLevels ? (
                    <option value="">Carregando...</option>
                  ) : levels.length === 0 ? (
                    <option value="">Nenhum nível cadastrado</option>
                  ) : (
                    levels.map((level) => (
                      <option key={level.id} value={level.name}>
                        {level.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="trial-form-group">
                <label htmlFor="retention_days">
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Período de Retenção
                </label>
                <select
                  id="retention_days"
                  value={formData.retention_days || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retention_days: e.target.value
                        ? (parseInt(e.target.value) as 30 | 60 | 90)
                        : null,
                    })
                  }
                >
                  <option value="30">30 dias</option>
                  <option value="60">60 dias</option>
                  <option value="90">90 dias</option>
                  <option value="">Ilimitado</option>
                </select>
                <small>
                  Tempo que o aluno ficará no sistema antes de expirar
                </small>
              </div>
            </div>

            {/* Observações */}
            <div className="trial-form-group">
              <label htmlFor="notes">
                <FileText size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Observações
              </label>
              <textarea
                id="notes"
                placeholder="Adicione observações sobre o aluno experimental..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
              <small>
                Ex: Interesse específico, como conheceu a academia, etc.
              </small>
            </div>

            {/* Info Box */}
            <div
              style={{
                background: '#e3f2fd',
                borderLeft: '4px solid #1976d2',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1565c0',
              }}
            >
              <strong>ℹ️ Sobre Alunos Experimentais:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li>Não requer CPF nem data de nascimento</li>
                <li>Pode ser adicionado a turmas e ter presença registrada</li>
                <li>Você pode enviar follow-ups automáticos</li>
                <li>Pode ser convertido para aluno regular a qualquer momento</li>
              </ul>
            </div>
          </div>

          <div className="trial-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar Aluno Experimental'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
