import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { studentService } from '../services/studentService';
import { levelService } from '../services/levelService';
import { financialService } from '../services/financialService';
import type { Student } from '../types/studentTypes';
import type { Level } from '../types/levelTypes';
import ComprehensiveEnrollmentForm from '../components/ComprehensiveEnrollmentForm';
import '../styles/Students.css';

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
  const itemsPerPage = 20;

  useEffect(() => {
    fetchStudents();
    fetchLevels();
  }, [statusFilter]);

  const fetchLevels = async () => {
    try {
      const response = await levelService.getLevels();
      if (response.success) {
        // Filtrar apenas níveis não-padrão (criados pelo usuário)
        const userLevels = response.data.filter((level: Level) => !level.is_default);
        setLevels(userLevels);
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

          if (invoicesRes.success && invoicesRes.data.length > 0) {
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

    const matchesLevel = !levelFilter || student.level === levelFilter;

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
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="button" className="search-icon">🔍</button>
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

          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + ALUNO
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowComprehensiveEnrollmentModal(true)}>
            + MATRÍCULA COMPLETA
          </button>
        </div>
      </div>

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
                <td>{student.level || '-'}</td>
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
                            ✏️ Editar
                          </button>
                          <button
                            className="dropdown-item danger"
                            onClick={() => {
                              handleDeleteStudent(student.id);
                              setOpenDropdown(null);
                            }}
                          >
                            🗑️ Excluir
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
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await levelService.getLevels();
      if (response.success) {
        // Filtrar apenas níveis não-padrão (criados pelo usuário)
        const userLevels = response.data.filter((level: Level) => !level.is_default);
        setLevels(userLevels);
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
      if (formData.level) payload.level = formData.level;

      await studentService.createStudent(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar aluno');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Novo Aluno</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-group">
            <label htmlFor="full_name">Nome Completo *</label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="birth_date">Data de Nascimento</label>
              <input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="level">Nível</label>
            <select
              id="level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="">Selecione...</option>
              {levels.map((level) => (
                <option key={level.id} value={level.name}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Perfil do Aluno</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

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
                {student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>

            <div className="profile-info-item">
              <span className="profile-label">Sexo</span>
              <span className="profile-value">{student.sex || '-'}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-label">Nível</span>
              <span className="profile-value">{student.level || '-'}</span>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Aluno</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-group">
            <label htmlFor="full_name">Nome Completo</label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="form-group">
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
