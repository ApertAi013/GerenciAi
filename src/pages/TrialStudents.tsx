import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Search,
  Filter,
  Mail,
  Eye,
  Trash2,
  AlertCircle,
  Calendar,
  Settings,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { trialStudentService } from '../services/trialStudentService';
import CreateTrialStudentModal from '../components/CreateTrialStudentModal';
import ConvertTrialStudentModal from '../components/ConvertTrialStudentModal';
import type { TrialStudent, TrialMetrics } from '../types/trialStudentTypes';
import '../styles/TrialStudents.css';

export default function TrialStudents() {
  const [students, setStudents] = useState<TrialStudent[]>([]);
  const [metrics, setMetrics] = useState<TrialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'inativo' | ''>('');
  const [expiredFilter, setExpiredFilter] = useState<'all' | 'expired' | 'active'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [studentToConvert, setStudentToConvert] = useState<TrialStudent | null>(null);
  const [studentToView, setStudentToView] = useState<TrialStudent | null>(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchMetrics();
  }, [statusFilter, expiredFilter]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params: any = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (expiredFilter === 'expired') {
        params.expired = true;
      } else if (expiredFilter === 'active') {
        params.expired = false;
      }

      const response = await trialStudentService.getAll(params);

      if (response.status === 'success') {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching trial students:', error);
      toast.error('Erro ao carregar alunos experimentais');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await trialStudentService.getMetrics();

      if (response.status === 'success') {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o aluno experimental "${name}"?`)) {
      return;
    }

    try {
      const response = await trialStudentService.delete(id);

      if (response.status === 'success') {
        toast.success('Aluno experimental excluído com sucesso');
        fetchStudents();
        fetchMetrics();
      }
    } catch (error: any) {
      console.error('Error deleting trial student:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao excluir aluno experimental'
      );
    }
  };

  const handleSendFollowup = async (student: TrialStudent) => {
    if (!student.email && !student.phone) {
      toast.error('Aluno não possui e-mail nem telefone cadastrado');
      return;
    }

    try {
      const response = await trialStudentService.sendFollowup({
        trial_student_id: student.id,
        followup_type: student.email ? 'email' : 'whatsapp',
      });

      if (response.status === 'success') {
        toast.success('Follow-up enviado com sucesso!');
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error sending followup:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao enviar follow-up'
      );
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getDaysRemaining = (student: TrialStudent): string | null => {
    if (!student.trial_expiration_date || !student.trial_retention_days) {
      return null;
    }

    const today = new Date();
    const expiration = new Date(student.trial_expiration_date);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expirado há ${Math.abs(diffDays)} dias`;
    } else if (diffDays === 0) {
      return 'Expira hoje';
    } else {
      return `${diffDays} dias restantes`;
    }
  };

  const getExpirationClass = (student: TrialStudent): string => {
    if (!student.trial_expiration_date || !student.trial_retention_days) {
      return 'unlimited';
    }

    if (student.is_expired) {
      return 'danger';
    }

    const today = new Date();
    const expiration = new Date(student.trial_expiration_date);
    const diffDays = Math.ceil(
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 3) {
      return 'danger';
    } else if (diffDays <= 7) {
      return 'warning';
    }

    return 'normal';
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="trial-metrics-grid">
        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">{metrics.active_trial_students}</h3>
              <p className="trial-metric-label">Alunos Ativos</p>
            </div>
            <div className="trial-metric-icon active">
              <Users />
            </div>
          </div>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">{metrics.converted_students}</h3>
              <p className="trial-metric-label">Conversões</p>
            </div>
            <div className="trial-metric-icon converted">
              <CheckCircle />
            </div>
          </div>
          <span className="trial-metric-change positive">
            De {metrics.total_trial_students} alunos experimentais
          </span>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                {metrics.conversion_rate_percentage.toFixed(1)}%
              </h3>
              <p className="trial-metric-label">Taxa de Conversão</p>
            </div>
            <div className="trial-metric-icon rate">
              <TrendingUp />
            </div>
          </div>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                {metrics.avg_days_to_convert.toFixed(0)}
              </h3>
              <p className="trial-metric-label">Dias até Conversão</p>
            </div>
            <div className="trial-metric-icon days">
              <Clock />
            </div>
          </div>
          <span className="trial-metric-change positive">Média</span>
        </div>

        <div className="trial-metric-card">
          <div className="trial-metric-header">
            <div>
              <h3 className="trial-metric-value">
                R${' '}
                {(metrics.total_conversion_value_cents / 100).toLocaleString(
                  'pt-BR',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
              <p className="trial-metric-label">Receita das Conversões</p>
            </div>
            <div className="trial-metric-icon converted">
              <DollarSign />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trial-students-page">
      {/* Header */}
      <div className="trial-students-header">
        <h1>
          Alunos Experimentais
          <span className="trial-badge">Experimental</span>
        </h1>

        <div className="trial-students-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowEmailConfig(true)}
            title="Configurar Emails Automáticos"
          >
            <Settings size={18} style={{ marginRight: '0.5rem' }} />
            Configurações
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
            Novo Aluno Experimental
          </button>
        </div>
      </div>

      {/* Metrics */}
      {renderMetrics()}

      {/* Filters */}
      <div className="trial-filters">
        <div className="trial-filters-row">
          <div className="trial-filter-item">
            <label>
              <Search size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="trial-filter-item">
            <label>
              <Filter size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div className="trial-filter-item">
            <label>
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Expiração
            </label>
            <select
              value={expiredFilter}
              onChange={(e) => setExpiredFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="active">Não Expirados</option>
              <option value="expired">Expirados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="trial-students-table-container">
        {isLoading ? (
          <div className="trial-loading">
            <div className="trial-loading-spinner"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="trial-empty-state">
            <div className="trial-empty-state-icon">
              <Users size={80} />
            </div>
            <h3>Nenhum aluno experimental encontrado</h3>
            <p>
              {searchTerm
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro aluno experimental'}
            </p>
            {!searchTerm && (
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '1rem' }}
              >
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                Criar Primeiro Aluno
              </button>
            )}
          </div>
        ) : (
          <table className="trial-students-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Nível</th>
                <th>Aulas</th>
                <th>Expiração</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const daysRemaining = getDaysRemaining(student);
                const expirationClass = getExpirationClass(student);

                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                      {student.trial_converted_to_regular && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#1976d2',
                            marginTop: '0.25rem',
                          }}
                        >
                          ✓ Convertido
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {student.phone && (
                          <div>
                            📱 {student.phone}
                          </div>
                        )}
                        {student.email && (
                          <div style={{ color: '#666' }}>
                            ✉️ {student.email}
                          </div>
                        )}
                        {!student.phone && !student.email && (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {student.level ? (
                        <span
                          style={{
                            textTransform: 'capitalize',
                            fontSize: '0.875rem',
                          }}
                        >
                          {student.level}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {student.trial_classes_count || 0}
                      </span>
                    </td>
                    <td>
                      {daysRemaining ? (
                        <div
                          className={`trial-expiration ${expirationClass}`}
                        >
                          <span className="trial-expiration-icon">
                            {expirationClass === 'danger' ? (
                              <AlertCircle size={16} />
                            ) : expirationClass === 'warning' ? (
                              <Clock size={16} />
                            ) : (
                              <Calendar size={16} />
                            )}
                          </span>
                          {daysRemaining}
                        </div>
                      ) : (
                        <div className="trial-expiration unlimited">
                          <CheckCircle size={16} />
                          Ilimitado
                        </div>
                      )}
                    </td>
                    <td>
                      {student.trial_converted_to_regular ? (
                        <span className="trial-status-badge converted">
                          Convertido
                        </span>
                      ) : student.is_expired ? (
                        <span className="trial-status-badge expired">
                          Expirado
                        </span>
                      ) : student.status === 'ativo' ? (
                        <span className="trial-status-badge active">Ativo</span>
                      ) : (
                        <span className="trial-status-badge inactive">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="trial-actions">
                        {!student.trial_converted_to_regular && (
                          <>
                            <button
                              className="trial-action-btn convert"
                              onClick={() => setStudentToConvert(student)}
                              title="Converter para Aluno Regular"
                            >
                              <CheckCircle size={18} />
                            </button>
                            {(student.email || student.phone) && (
                              <button
                                className="trial-action-btn"
                                onClick={() => handleSendFollowup(student)}
                                title="Enviar Follow-up"
                              >
                                <Mail size={18} />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="trial-action-btn"
                          onClick={() => setStudentToView(student)}
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {!student.trial_converted_to_regular && (
                          <button
                            className="trial-action-btn delete"
                            onClick={() =>
                              handleDelete(student.id, student.full_name)
                            }
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTrialStudentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchStudents();
            fetchMetrics();
          }}
        />
      )}

      {studentToConvert && (
        <ConvertTrialStudentModal
          trialStudent={studentToConvert}
          onClose={() => setStudentToConvert(null)}
          onSuccess={() => {
            fetchStudents();
            fetchMetrics();
          }}
        />
      )}

      {studentToView && (
        <TrialStudentDetailsModal
          student={studentToView}
          onClose={() => setStudentToView(null)}
          onRefresh={fetchStudents}
        />
      )}

      {showEmailConfig && (
        <EmailAutomationConfigModal
          onClose={() => setShowEmailConfig(false)}
        />
      )}
    </div>
  );
}

// Modal de Detalhes do Aluno
interface TrialStudentDetailsModalProps {
  student: TrialStudent;
  onClose: () => void;
  onRefresh: () => void;
}

function TrialStudentDetailsModal({
  student,
  onClose,
  onRefresh,
}: TrialStudentDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [student.id]);

  const fetchDetails = async () => {
    try {
      const response = await trialStudentService.getById(student.id);
      if (response.status === 'success') {
        setDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div
        className="trial-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px' }}
      >
        <div className="trial-modal-header">
          <h2>
            <Eye size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Detalhes do Aluno Experimental
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          {isLoading ? (
            <div className="trial-loading">
              <div className="trial-loading-spinner"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Personal Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                  Informações Pessoais
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <strong>Nome:</strong> {student.full_name}
                  </div>
                  {student.phone && (
                    <div>
                      <strong>Telefone:</strong> {student.phone}
                    </div>
                  )}
                  {student.email && (
                    <div>
                      <strong>E-mail:</strong> {student.email}
                    </div>
                  )}
                  {student.level && (
                    <div>
                      <strong>Nível:</strong>{' '}
                      <span style={{ textTransform: 'capitalize' }}>
                        {student.level}
                      </span>
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`trial-status-badge ${
                        student.status === 'ativo' ? 'active' : 'inactive'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                  <div>
                    <strong>Criado em:</strong>{' '}
                    {new Date(student.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Trial Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                  Informações do Período Experimental
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  {student.trial_start_date && (
                    <div>
                      <strong>Início:</strong>{' '}
                      {new Date(student.trial_start_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {student.trial_expiration_date && student.trial_retention_days ? (
                    <div>
                      <strong>Expiração:</strong>{' '}
                      {new Date(student.trial_expiration_date).toLocaleDateString(
                        'pt-BR'
                      )}{' '}
                      ({student.trial_retention_days} dias)
                    </div>
                  ) : (
                    <div>
                      <strong>Período:</strong> Ilimitado
                    </div>
                  )}
                  {student.trial_notes && (
                    <div>
                      <strong>Observações:</strong>
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          background: 'white',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                        }}
                      >
                        {student.trial_notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Classes */}
              {details?.trial_classes && details.trial_classes.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                    Aulas Experimentais ({details.trial_classes.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.trial_classes.map((classItem: any) => (
                      <div
                        key={classItem.id}
                        style={{
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {classItem.class_name}
                        </div>
                        <div style={{ color: '#666' }}>
                          Data: {new Date(classItem.attendance_date).toLocaleDateString('pt-BR')}
                          {' · '}
                          {classItem.attended ? (
                            <span style={{ color: '#11998e' }}>✓ Presente</span>
                          ) : (
                            <span style={{ color: '#f5576c' }}>✗ Ausente</span>
                          )}
                        </div>
                        {classItem.notes && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'white',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            {classItem.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followups */}
              {details?.followups && details.followups.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                    Follow-ups Enviados ({details.followups.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.followups.map((followup: any) => (
                      <div
                        key={followup.id}
                        style={{
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {followup.followup_type}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color:
                                followup.status === 'sent' || followup.status === 'delivered'
                                  ? '#11998e'
                                  : followup.status === 'failed'
                                  ? '#f5576c'
                                  : '#999',
                            }}
                          >
                            {followup.status}
                          </span>
                        </div>
                        <div style={{ color: '#666', marginTop: '0.25rem' }}>
                          {new Date(followup.followup_date).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="trial-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Configuração de Email Automático
interface EmailAutomationConfigModalProps {
  onClose: () => void;
}

function EmailAutomationConfigModal({ onClose }: EmailAutomationConfigModalProps) {
  const [config, setConfig] = useState({
    enabled: false,
    days_after_first_class: 3,
    send_time: '10:00',
    template_message:
      'Olá {nome}!\n\nComo foi sua experiência conosco?\n\nGostaríamos de saber sua opinião e te convidar para continuar fazendo parte da nossa equipe!\n\nEntre em contato para mais informações.',
  });

  const handleSave = () => {
    // TODO: Implement save logic to backend
    toast.success('Configurações salvas com sucesso!');
    onClose();
  };

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div
        className="trial-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="trial-modal-header">
          <h2>
            <Settings size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Configuração de E-mails Automáticos
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          <div className="trial-email-config">
            <div className="trial-email-config-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Envio Automático de Follow-ups
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#666' }}>
                  Envie automaticamente e-mails para alunos experimentais
                </p>
              </div>
              <label className="trial-toggle">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) =>
                    setConfig({ ...config, enabled: e.target.checked })
                  }
                />
                <span className="trial-toggle-slider"></span>
              </label>
            </div>
          </div>

          {config.enabled && (
            <>
              <div className="trial-form-row">
                <div className="trial-form-group">
                  <label htmlFor="days_after">Enviar após (dias)</label>
                  <input
                    id="days_after"
                    type="number"
                    min="1"
                    max="30"
                    value={config.days_after_first_class}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        days_after_first_class: parseInt(e.target.value),
                      })
                    }
                  />
                  <small>Dias após a primeira aula experimental</small>
                </div>

                <div className="trial-form-group">
                  <label htmlFor="send_time">Horário de Envio</label>
                  <input
                    id="send_time"
                    type="time"
                    value={config.send_time}
                    onChange={(e) =>
                      setConfig({ ...config, send_time: e.target.value })
                    }
                  />
                  <small>Horário preferido para envio</small>
                </div>
              </div>

              <div className="trial-form-group">
                <label htmlFor="template">Mensagem do E-mail</label>
                <textarea
                  id="template"
                  value={config.template_message}
                  onChange={(e) =>
                    setConfig({ ...config, template_message: e.target.value })
                  }
                  rows={8}
                />
                <small>
                  Use {'{nome}'} para inserir o nome do aluno automaticamente
                </small>
              </div>

              <div
                style={{
                  background: '#fff3cd',
                  borderLeft: '4px solid #ffc107',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#856404',
                }}
              >
                <strong>ℹ️ Dica:</strong> E-mails só serão enviados para alunos
                experimentais que possuam e-mail cadastrado e não tenham sido
                convertidos.
              </div>
            </>
          )}
        </div>

        <div className="trial-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
