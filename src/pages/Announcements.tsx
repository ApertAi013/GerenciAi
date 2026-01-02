import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { announcementService, Announcement, CreateAnnouncementRequest } from '../services/announcementService';
import { modalityService } from '../services/modalityService';
import { levelService } from '../services/levelService';
import { studentService } from '../services/studentService';
import '../styles/Settings.css';

const TYPE_OPTIONS = [
  { value: 'info', label: 'Informativo', color: '#2196f3' },
  { value: 'warning', label: 'Atenção', color: '#ff9800' },
  { value: 'urgent', label: 'Urgente', color: '#f44336' },
  { value: 'event', label: 'Evento', color: '#4caf50' }
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'Todos os Alunos' },
  { value: 'modality', label: 'Por Modalidade' },
  { value: 'level', label: 'Por Nível' },
  { value: 'specific', label: 'Alunos Específicos' }
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await announcementService.getAnnouncements(page, 20);
      // Handle both response formats: { success: true, data } or { status: 'success', data }
      const isSuccess = response.success === true || (response as any).status === 'success';
      if (isSuccess && response.data) {
        setAnnouncements(response.data.announcements || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      setError('Erro ao carregar avisos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      await announcementService.deleteAnnouncement(id);
      toast.success('Aviso excluído com sucesso!');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir aviso');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await announcementService.updateAnnouncement(announcement.id, {
        is_active: !announcement.is_active
      });
      toast.success(announcement.is_active ? 'Aviso desativado!' : 'Aviso ativado!');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar aviso');
    }
  };

  const getTypeConfig = (type: string) => {
    return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
  };

  const getTargetLabel = (announcement: Announcement) => {
    switch (announcement.target_type) {
      case 'all':
        return 'Todos os Alunos';
      case 'modality':
        return `Modalidade: ${announcement.modality_name || 'N/A'}`;
      case 'level':
        return `Nível: ${announcement.target_level || 'N/A'}`;
      case 'specific':
        return `${announcement.target_count || 0} alunos específicos`;
      default:
        return 'N/A';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (announcement: Announcement) => {
    if (!announcement.expires_at) return false;
    return new Date(announcement.expires_at) < new Date();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Gerenciar Avisos</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingAnnouncement(null);
            setShowCreateModal(true);
          }}
        >
          + Novo Aviso
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-content">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum aviso cadastrado</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Criar Primeiro Aviso
            </button>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((announcement) => {
              const typeConfig = getTypeConfig(announcement.type);
              const expired = isExpired(announcement);

              return (
                <div
                  key={announcement.id}
                  className={`announcement-card ${!announcement.is_active || expired ? 'inactive' : ''}`}
                  style={{ borderLeft: `4px solid ${typeConfig.color}` }}
                >
                  <div className="announcement-header">
                    <div className="announcement-title-row">
                      <h3>{announcement.title}</h3>
                      <div className="announcement-badges">
                        <span
                          className="badge"
                          style={{ backgroundColor: typeConfig.color, color: '#fff' }}
                        >
                          {typeConfig.label}
                        </span>
                        {!announcement.is_active && (
                          <span className="badge badge-inactive">Inativo</span>
                        )}
                        {expired && (
                          <span className="badge badge-expired">Expirado</span>
                        )}
                      </div>
                    </div>
                    <p className="announcement-target">{getTargetLabel(announcement)}</p>
                  </div>

                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>

                  <div className="announcement-meta">
                    <div className="meta-row">
                      <span>Início: {formatDate(announcement.starts_at)}</span>
                      {announcement.expires_at && (
                        <span>Expira: {formatDate(announcement.expires_at)}</span>
                      )}
                    </div>
                    <div className="meta-row">
                      <span>Visualizações: {announcement.read_count || 0}</span>
                      <span>Criado por: {announcement.created_by_name}</span>
                    </div>
                  </div>

                  <div className="announcement-actions">
                    <button
                      type="button"
                      className={announcement.is_active ? 'btn-warning' : 'btn-success'}
                      onClick={() => handleToggleActive(announcement)}
                    >
                      {announcement.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingAnnouncement(announcement);
                        setShowCreateModal(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingAnnouncement(null);
            fetchAnnouncements();
          }}
        />
      )}

      <style>{`
        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .announcement-card {
          background: #fff;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: opacity 0.2s;
        }

        .announcement-card.inactive {
          opacity: 0.6;
        }

        .announcement-header {
          margin-bottom: 1rem;
        }

        .announcement-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .announcement-title-row h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #1a1a2e;
        }

        .announcement-badges {
          display: flex;
          gap: 0.5rem;
        }

        .announcement-target {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          color: #666;
        }

        .announcement-content {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .announcement-content p {
          margin: 0;
          white-space: pre-wrap;
        }

        .announcement-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #888;
        }

        .meta-row {
          display: flex;
          gap: 2rem;
        }

        .announcement-actions {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-inactive {
          background: #9e9e9e;
          color: #fff;
        }

        .badge-expired {
          background: #757575;
          color: #fff;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-warning {
          background-color: #ff9800;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-warning:hover {
          background-color: #f57c00;
        }

        .btn-success {
          background-color: #4caf50;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-success:hover {
          background-color: #388e3c;
        }
      `}</style>
    </div>
  );
}

function AnnouncementModal({
  announcement,
  onClose,
  onSuccess,
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditMode = !!announcement;
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'info',
    target_type: announcement?.target_type || 'all',
    target_modality_id: announcement?.target_modality_id || null,
    target_level: announcement?.target_level || null,
    target_student_ids: [],
    starts_at: announcement?.starts_at ? announcement.starts_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
    expires_at: announcement?.expires_at ? announcement.expires_at.slice(0, 16) : null,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalities, setModalities] = useState<Array<{ id: number; name: string }>>([]);
  const [levels, setLevels] = useState<Array<{ id: number; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: number; full_name: string; email: string }>>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>(
    announcement?.target_students?.map(s => s.id) || []
  );
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [modalitiesRes, levelsRes, studentsRes] = await Promise.all([
        modalityService.getModalities(),
        levelService.getLevels(),
        studentService.getAllStudents()
      ]);

      if (modalitiesRes.data) setModalities(modalitiesRes.data);
      if (levelsRes.data) setLevels(levelsRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.content) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    if (!formData.starts_at) {
      setError('Data de início é obrigatória');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        target_student_ids: formData.target_type === 'specific' ? selectedStudents : undefined
      };

      if (isEditMode && announcement) {
        await announcementService.updateAnnouncement(announcement.id, payload);
        toast.success('Aviso atualizado com sucesso!');
      } else {
        await announcementService.createAnnouncement(payload);
        toast.success('Aviso criado com sucesso!');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} aviso`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Aviso' : 'Criar Novo Aviso'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="announcement-form">
          <div className="form-group">
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Conteúdo *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Tipo</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target_type">Destinatários</label>
              <select
                id="target_type"
                value={formData.target_type}
                onChange={(e) => setFormData({
                  ...formData,
                  target_type: e.target.value as any,
                  target_modality_id: null,
                  target_level: null
                })}
              >
                {TARGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.target_type === 'modality' && (
            <div className="form-group">
              <label htmlFor="target_modality_id">Modalidade</label>
              <select
                id="target_modality_id"
                value={formData.target_modality_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  target_modality_id: e.target.value ? parseInt(e.target.value) : null
                })}
              >
                <option value="">Selecione uma modalidade</option>
                {modalities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.target_type === 'level' && (
            <div className="form-group">
              <label htmlFor="target_level">Nível</label>
              <select
                id="target_level"
                value={formData.target_level || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  target_level: e.target.value || null
                })}
              >
                <option value="">Selecione um nível</option>
                {levels.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.target_type === 'specific' && (
            <div className="form-group">
              <label>Alunos ({selectedStudents.length} selecionados)</label>
              <input
                type="text"
                placeholder="Buscar alunos..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div className="students-selector">
                {filteredStudents.slice(0, 50).map(student => (
                  <label key={student.id} className="student-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span>{student.full_name}</span>
                    <small>{student.email}</small>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="starts_at">Data de Início *</label>
              <input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expires_at">Data de Expiração (opcional)</label>
              <input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at || ''}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
              />
            </div>
          </div>

          <div className="modal-actions">
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
              {isSubmitting
                ? isEditMode ? 'Salvando...' : 'Criando...'
                : isEditMode ? 'Salvar Alterações' : 'Criar Aviso'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-large {
            max-width: 700px;
            width: 90%;
          }

          .announcement-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .students-selector {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 0.5rem;
          }

          .student-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
          }

          .student-checkbox:hover {
            background: #f5f5f5;
          }

          .student-checkbox small {
            color: #888;
            margin-left: auto;
          }
        `}</style>
      </div>
    </div>
  );
}
