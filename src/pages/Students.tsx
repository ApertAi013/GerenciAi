import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faLink, faCopy, faCheck, faTimes, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../services/studentService';
import type { PendingRegistration } from '../services/studentService';
import { levelService } from '../services/levelService';
import { financialService } from '../services/financialService';
import type { Student } from '../types/studentTypes';
import type { Level } from '../types/levelTypes';
import ComprehensiveEnrollmentForm from '../components/ComprehensiveEnrollmentForm';
import '../styles/Students.css';
import '../styles/ModernModal.css';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'inativo' | 'pendente' | ''>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComprehensiveEnrollmentModal, setShowComprehensiveEnrollmentModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingStudent, setApprovingStudent] = useState<PendingRegistration | null>(null);
  const [approveLevel, setApproveLevel] = useState<number | undefined>(undefined);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchStudents();
    fetchLevels();
    fetchPendingRegistrations();
  }, [statusFilter]);

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

  const fetchStudents = async () => {
    try {
      setIsLoading(true);

      // Sempre buscar todos os alunos para contagem correta
      const allResponse = await studentService.getStudents({});
      setAllStudents(allResponse.data);

      // Buscar alunos filtrados se houver filtro
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const response = await studentService.getStudents(params);
      setStudents(response.data);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const response = await studentService.getPendingRegistrations();
      setPendingRegistrations(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar cadastros pendentes:', error);
    }
  };

  const handleGetLink = async () => {
    try {
      // Always generate a fresh token to ensure it's valid
      const genResponse = await studentService.generateRegistrationToken();
      if (genResponse.data?.token) {
        setRegistrationToken(genResponse.data.token);
        setShowLinkModal(true);
      } else {
        alert('Erro ao gerar link de cadastro.');
      }
    } catch (error) {
      console.error('Erro ao obter link:', error);
      alert('Erro ao gerar link de cadastro. Tente novamente.');
    }
  };

  const handleCopyLink = () => {
    if (!registrationToken) return;
    const link = `${window.location.origin}/cadastro-aluno/${registrationToken}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleApproveRegistration = async () => {
    if (!approvingStudent || !approveLevel) return;
    try {
      await studentService.approveRegistration(approvingStudent.id, approveLevel);
      setShowApproveModal(false);
      setApprovingStudent(null);
      setApproveLevel(undefined);
      fetchPendingRegistrations();
      fetchStudents();
    } catch (error) {
      console.error('Erro ao aprovar cadastro:', error);
      alert('Erro ao aprovar cadastro');
    }
  };

  const handleRejectRegistration = async (id: number) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) return;
    try {
      await studentService.rejectRegistration(id);
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Erro ao rejeitar cadastro:', error);
      alert('Erro ao rejeitar cadastro');
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    try {
      await studentService.deleteStudent(id);
      fetchStudents();
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      alert('Erro ao excluir aluno');
    }
  };

  const handleToggleSelectStudent = (studentId: number) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudentIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === paginatedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(paginatedStudents.map((s) => s.id)));
    }
  };

  const handleBatchPaymentReceipt = async () => {
    if (selectedStudentIds.size === 0) {
      alert('Selecione pelo menos um aluno');
      return;
    }

    const confirmMsg = `Tem certeza que deseja dar baixa nas faturas pendentes de ${selectedStudentIds.size} aluno(s)?`;
    if (!confirm(confirmMsg)) return;

    setIsProcessingBatch(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const studentId of selectedStudentIds) {
        try {
          // Get pending invoices for this student
          const invoicesRes = await financialService.getInvoices({
            student_id: studentId,
            status: 'aberta',
          });

          if (invoicesRes.status === 'success' && invoicesRes.data.length > 0) {
            // Register payment for the first pending invoice
            const invoice = invoicesRes.data[0];
            await financialService.registerPayment({
              invoice_id: invoice.id,
              amount_cents: invoice.final_amount_cents,
              method: 'dinheiro',
              paid_at: new Date().toISOString().split('T')[0],
            });
            successCount++;
          }
        } catch (err) {
          console.error(`Erro ao processar aluno ${studentId}:`, err);
          errorCount++;
        }
      }

      alert(`Baixa processada!\n✅ Sucesso: ${successCount}\n❌ Erros: ${errorCount}`);
      setSelectedStudentIds(new Set());
      fetchStudents();
    } catch (error) {
      console.error('Erro ao processar baixa em lote:', error);
      alert('Erro ao processar baixa em lote');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cpf.includes(searchTerm);

    const matchesLevel = !levelFilter || student.level_name === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ativo': return 'status-badge status-active';
      case 'inativo': return 'status-badge status-inactive';
      case 'pendente': return 'status-badge status-pending';
      default: return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="students-page">
      {/* Header */}
      <div className="students-header">
        <h1>Alunos</h1>

        <div className="students-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Pesquisar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedStudentIds.size > 0 && (
            <button
              type="button"
              className="btn-success"
              onClick={handleBatchPaymentReceipt}
              disabled={isProcessingBatch}
            >
              {isProcessingBatch
                ? '⏳ Processando...'
                : `💵 Dar Baixa (${selectedStudentIds.size})`}
            </button>
          )}

          <button type="button" className="btn-primary" onClick={handleGetLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faLink} /> Link
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + ALUNO
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowComprehensiveEnrollmentModal(true)}>
            + MATRÍCULA COMPLETA
          </button>
        </div>
      </div>

      {/* Pending Registrations Banner */}
      {pendingRegistrations.length > 0 && (
        <div className="pending-registrations-banner">
          <div className="pending-registrations-header">
            <FontAwesomeIcon icon={faUserPlus} />
            <strong>
              {pendingRegistrations.length} cadastro{pendingRegistrations.length > 1 ? 's' : ''} pendente{pendingRegistrations.length > 1 ? 's' : ''} de aprovacao
            </strong>
          </div>
          <div className="pending-registrations-list">
            {pendingRegistrations.map((reg) => (
              <div key={reg.id} className="pending-registration-card">
                <div className="pending-reg-name">{reg.full_name}</div>
                <div className="pending-reg-info">{reg.email}</div>
                {reg.phone && <div className="pending-reg-info">{reg.phone}</div>}
                <div className="pending-reg-date">
                  {new Date(reg.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="pending-reg-actions">
                  <button
                    type="button"
                    className="pending-reg-btn approve"
                    onClick={() => {
                      setApprovingStudent(reg);
                      setApproveLevel(undefined);
                      setShowApproveModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Aprovar
                  </button>
                  <button
                    type="button"
                    className="pending-reg-btn reject"
                    onClick={() => handleRejectRegistration(reg.id)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-tabs">
        <button
          className={statusFilter === '' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => {
            setStatusFilter('');
            setCurrentPage(1);
          }}
        >
          Todos ({allStudents.length})
        </button>
        <button
          className={statusFilter === 'ativo' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => {
            setStatusFilter('ativo');
            setCurrentPage(1);
          }}
        >
          Ativos ({allStudents.filter(s => s.status === 'ativo').length})
        </button>
        <button
          className={statusFilter === 'inativo' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => {
            setStatusFilter('inativo');
            setCurrentPage(1);
          }}
        >
          Inativos ({allStudents.filter(s => s.status === 'inativo').length})
        </button>
        <button
          className={statusFilter === 'pendente' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => {
            setStatusFilter('pendente');
            setCurrentPage(1);
          }}
        >
          Pendentes ({allStudents.filter(s => s.status === 'pendente').length})
        </button>
      </div>

      {/* Level Filter */}
      {levels.length > 0 && (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <label htmlFor="level-filter" style={{ marginRight: '0.5rem', fontWeight: 500 }}>
            Filtrar por nível:
          </label>
          <select
            id="level-filter"
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minWidth: '200px'
            }}
          >
            <option value="">Todos os níveis</option>
            {levels.map((level) => (
              <option key={level.id} value={level.name}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  checked={paginatedStudents.length > 0 && selectedStudentIds.size === paginatedStudents.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
              </th>
              <th>Nome</th>
              <th>Situação</th>
              <th>Nível</th>
              <th>Idade</th>
              <th>Sexo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(student.id)}
                    onChange={() => handleToggleSelectStudent(student.id)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                </td>
                <td>
                  <div className="student-name-cell">
                    <div className="student-avatar">
                      👤
                    </div>
                    <span
                      onClick={() => navigate(`/alunos/${student.id}`)}
                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {student.full_name}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={getStatusBadgeClass(student.status)}>
                    {getStatusLabel(student.status)}
                  </span>
                </td>
                <td>{student.level_name || '-'}</td>
                <td>{calculateAge(student.birth_date)}</td>
                <td>{student.sex || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <div className="dropdown-container">
                      <button
                        className="btn-icon"
                        onClick={() => setOpenDropdown(openDropdown === student.id ? null : student.id)}
                      >
                        ⋮
                      </button>
                      {openDropdown === student.id && (
                        <div className="dropdown-menu">
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/alunos/${student.id}`);
                              setOpenDropdown(null);
                            }}
                          >
                            👁️ Ver perfil
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowEditModal(true);
                              setOpenDropdown(null);
                            }}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} style={{ marginRight: '8px' }} /> Editar
                          </button>
                          <button
                            className="dropdown-item danger"
                            onClick={() => {
                              handleDeleteStudent(student.id);
                              setOpenDropdown(null);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ marginRight: '8px' }} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Página {currentPage} de {totalPages || 1} • {filteredStudents.length} aluno(s)
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          <span>{currentPage}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
        <div className="pagination-per-page">
          Exibir:
          <select value={itemsPerPage} disabled>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreateModal && (
        <CreateStudentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchStudents();
          }}
        />
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <ViewStudentModal
          student={selectedStudent}
          onClose={() => {
            setShowViewModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
            fetchStudents();
          }}
        />
      )}

      {/* Comprehensive Enrollment Modal */}
      {showComprehensiveEnrollmentModal && (
        <ComprehensiveEnrollmentForm
          onClose={() => setShowComprehensiveEnrollmentModal(false)}
          onSuccess={() => {
            setShowComprehensiveEnrollmentModal(false);
            fetchStudents();
          }}
        />
      )}

      {/* Registration Link Modal */}
      {showLinkModal && registrationToken && (
        <div className="mm-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Link de Cadastro de Aluno</h2>
              <button type="button" className="mm-close" onClick={() => setShowLinkModal(false)}>&#10005;</button>
            </div>
            <div className="mm-content">
              <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                Compartilhe este link para que alunos preencham seus proprios dados de cadastro.
              </p>
              <div style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                padding: '10px 12px',
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/cadastro-aluno/${registrationToken}`}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.85rem',
                    outline: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    background: linkCopied ? '#10B981' : '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <FontAwesomeIcon icon={linkCopied ? faCheck : faCopy} />
                  {linkCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowLinkModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Registration Modal */}
      {showApproveModal && approvingStudent && (
        <div className="mm-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Aprovar Cadastro</h2>
              <button type="button" className="mm-close" onClick={() => setShowApproveModal(false)}>&#10005;</button>
            </div>
            <div className="mm-content">
              <div style={{ marginBottom: '16px' }}>
                <strong>{approvingStudent.full_name}</strong>
                <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>{approvingStudent.email}</div>
                {approvingStudent.phone && <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>{approvingStudent.phone}</div>}
                {approvingStudent.cpf && <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>CPF: {approvingStudent.cpf}</div>}
              </div>
              <div className="mm-field">
                <label htmlFor="approve-level">Nivel do Aluno *</label>
                <select
                  id="approve-level"
                  value={approveLevel || ''}
                  onChange={(e) => setApproveLevel(Number(e.target.value) || undefined)}
                  required
                >
                  <option value="">Selecione o nivel...</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowApproveModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="mm-btn mm-btn-primary"
                onClick={handleApproveRegistration}
                disabled={!approveLevel}
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Student Modal Component
function CreateStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    sex: '' as 'Masculino' | 'Feminino' | 'Outro' | 'N/I' | '',
    level: '',
    level_id: undefined as number | undefined,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.full_name || !formData.cpf || !formData.email) {
        setError('Nome, CPF e email são obrigatórios');
        setIsSubmitting(false);
        return;
      }

      // Remover formatação do CPF se houver
      const cpfClean = formData.cpf.replace(/\D/g, '');

      const payload: any = {
        full_name: formData.full_name,
        cpf: cpfClean,
        email: formData.email,
      };

      if (formData.phone) payload.phone = formData.phone.replace(/\D/g, '');
      if (formData.birth_date) payload.birth_date = formData.birth_date;
      if (formData.sex) payload.sex = formData.sex;
      if (formData.level_id) payload.level_id = formData.level_id;
      else if (formData.level) payload.level = formData.level;

      // Enviar senha padrão se configurada nas preferências
      const savedDefaultPassword = localStorage.getItem('default_student_password');
      if (savedDefaultPassword) payload.default_password = savedDefaultPassword;

      await studentService.createStudent(payload);
      onSuccess();
    } catch (err: any) {
      if (err.response?.data?.code === 'PLAN_LIMIT_EXCEEDED') {
        setError(`Limite de alunos atingido (${err.response.data.current}/${err.response.data.max}). Acesse "Meu Plano" para fazer upgrade.`);
      } else {
        setError(err.response?.data?.message || 'Erro ao criar aluno');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Criar Novo Aluno</h2>
          <button type="button" className="mm-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit} className="student-form">
          <div className="mm-content">
            <div className="mm-field">
              <label htmlFor="full_name">Nome Completo *</label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="mm-field-row">
              <div className="mm-field">
                <label htmlFor="cpf">CPF *</label>
                <input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="mm-field">
                <label htmlFor="birth_date">Data de Nascimento</label>
                <input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>

            <div className="mm-field">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="mm-field-row">
              <div className="mm-field">
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="mm-field">
                <label htmlFor="sex">Sexo</label>
                <select
                  id="sex"
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="N/I">Prefiro não informar</option>
                </select>
              </div>
            </div>

            <div className="mm-field">
              <label htmlFor="level">Nível</label>
              <select
                id="level"
                value={formData.level_id || ''}
                onChange={(e) => {
                  const sel = levels.find(l => l.id === Number(e.target.value));
                  setFormData({ ...formData, level_id: sel?.id, level: sel?.name || '' });
                }}
              >
                <option value="">Selecione...</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mm-footer">
            <button type="button" className="mm-btn mm-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="mm-btn mm-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Student Modal Component
function ViewStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Perfil do Aluno</h2>
          <button type="button" className="mm-close" onClick={onClose}>✕</button>
        </div>

        <div className="mm-content">
          <div className="student-profile">
            <div className="profile-avatar-large">
              👤
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-label">Nome Completo</span>
                <span className="profile-value">{student.full_name}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">CPF</span>
                <span className="profile-value">{student.cpf}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Email</span>
                <span className="profile-value">{student.email}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Telefone</span>
                <span className="profile-value">{student.phone || '-'}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Data de Nascimento</span>
                <span className="profile-value">
                  {student.birth_date ? new Date(student.birth_date.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Sexo</span>
                <span className="profile-value">{student.sex || '-'}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Nível</span>
                <span className="profile-value">{student.level_name || '-'}</span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Status</span>
                <span className="profile-value">
                  <span className={`status-badge status-${student.status}`}>
                    {student.status === 'ativo' ? 'Ativo' : student.status === 'inativo' ? 'Inativo' : 'Pendente'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Student Modal Component
function EditStudentModal({
  student,
  onClose,
  onSuccess,
}: {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: student.full_name,
    email: student.email,
    phone: student.phone || '',
    status: student.status,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await studentService.updateStudent(student.id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar aluno');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Editar Aluno</h2>
          <button type="button" className="mm-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit} className="student-form">
          <div className="mm-content">
            <div className="mm-field">
              <label htmlFor="full_name">Nome Completo</label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="mm-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="mm-field">
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="mm-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          <div className="mm-footer">
            <button type="button" className="mm-btn mm-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="mm-btn mm-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
