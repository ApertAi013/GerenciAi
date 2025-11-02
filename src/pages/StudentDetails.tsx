import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { studentService } from '../services/studentService';
import { enrollmentService } from '../services/enrollmentService';
import { financialService } from '../services/financialService';
import { levelService } from '../services/levelService';
import type { Student } from '../types/studentTypes';
import type { Enrollment } from '../types/enrollmentTypes';
import type { Invoice } from '../types/financialTypes';
import type { Level } from '../types/levelTypes';
import MakeupCreditsManager from '../components/MakeupCreditsManager';
import '../styles/StudentDetails.css';

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Financial stats
  const [financialStats, setFinancialStats] = useState({
    saldo_devedor: 0,
    creditos: 0,
    proximo_vencimento: null as Date | null,
    valor_proximo_vencimento: 0,
  });

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);

      const [studentRes, enrollmentsRes, invoicesRes, levelsRes] = await Promise.all([
        studentService.getStudentById(parseInt(id!)),
        enrollmentService.getEnrollments({ student_id: parseInt(id!) }),
        financialService.getInvoices({ student_id: parseInt(id!) }),
        levelService.getLevels(),
      ]);

      if (studentRes.success && studentRes.data) {
        setStudent(studentRes.data);
        // Define o nível selecionado (prioriza level_id, senão busca pelo nome)
        if (studentRes.data.level_id) {
          setSelectedLevel(studentRes.data.level_id);
        } else if (studentRes.data.level) {
          const levelMatch = levelsRes.success
            ? levelsRes.data.find(l => l.name.toLowerCase() === studentRes.data.level?.toLowerCase())
            : null;
          setSelectedLevel(levelMatch?.id || null);
        }
      }

      if (enrollmentsRes.success) {
        setEnrollments(enrollmentsRes.data);
      }

      if (invoicesRes.success) {
        setInvoices(invoicesRes.data);
        calculateFinancialStats(invoicesRes.data);
      }

      if (levelsRes.success) {
        setLevels(levelsRes.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do aluno:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinancialStats = (invoicesList: Invoice[]) => {
    const overdue = invoicesList.filter(
      (inv) => inv.status === 'vencida' || (inv.status === 'aberta' && new Date(inv.due_date) < new Date())
    );
    const saldo_devedor = overdue.reduce((sum, inv) => sum + inv.final_amount_cents, 0);

    // Find next due invoice
    const upcoming = invoicesList
      .filter((inv) => inv.status === 'aberta' && new Date(inv.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    setFinancialStats({
      saldo_devedor,
      creditos: 0, // TODO: implement credits
      proximo_vencimento: upcoming ? new Date(upcoming.due_date) : null,
      valor_proximo_vencimento: upcoming?.final_amount_cents || 0,
    });
  };

  const handleUpdateLevel = async () => {
    if (!student || !selectedLevel) return;

    try {
      // Encontra o nível selecionado para pegar o nome
      const selectedLevelObj = levels.find(l => l.id === selectedLevel);
      if (!selectedLevelObj) {
        toast.error('Nível selecionado não encontrado');
        return;
      }

      // Tenta atualizar usando ambos os campos para compatibilidade
      const response = await studentService.updateStudent(student.id, {
        level_id: selectedLevel,
        level: selectedLevelObj.name
      } as any);

      if (response.success) {
        toast.success('Nível do aluno atualizado com sucesso!');
        setShowLevelModal(false);
        fetchStudentData();
      } else {
        toast.error(response.message || 'Erro ao atualizar nível do aluno');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar nível:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar nível do aluno';
      toast.error(errorMessage);
    }
  };

  const handleWhatsAppClick = () => {
    if (!student) return;

    const phone = student.phone.replace(/\D/g, '');
    const valorMensalidade = (financialStats.valor_proximo_vencimento / 100).toFixed(2).replace('.', ',');
    const vencimento = financialStats.proximo_vencimento?.toLocaleDateString('pt-BR') || 'em breve';

    const message = `Olá ${student.full_name}!

Passando para lembrar sobre sua mensalidade de *R$ ${valorMensalidade}* com vencimento em *${vencimento}*.

Qualquer dúvida, estou à disposição!`;

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <p>Aluno não encontrado</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/alunos')}>
          Voltar para alunos
        </button>
      </div>
    );
  }

  // Tenta encontrar o nível por ID (novo sistema) ou por nome (sistema antigo)
  const currentLevel = student.level_id
    ? levels.find((l) => l.id === student.level_id)
    : levels.find((l) => l.name.toLowerCase() === student.level?.toLowerCase());

  return (
    <div className="student-details">
      {/* Header */}
      <div className="student-header">
        <button type="button" className="btn-back" onClick={() => navigate('/alunos')}>
          ← Voltar
        </button>

        <div className="student-header-content">
          <div className="student-avatar-section">
            <div className="student-avatar-large">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="student-info">
              <h1>{student.full_name}</h1>
              <div className="student-meta">
                <span className={`status-badge status-${student.status}`}>
                  {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                {currentLevel && (
                  <span className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                    {currentLevel.name}
                  </span>
                )}
              </div>
              <p className="student-subtitle">
                {student.birth_date && `${calculateAge(student.birth_date)} anos`}
                {student.gender && ` | ${student.gender === 'M' ? 'Masculino' : student.gender === 'F' ? 'Feminino' : 'Outro'}`}
                {student.responsible_name && ` | Responsável: ${student.responsible_name}`}
              </p>
            </div>
          </div>

          <div className="student-header-actions">
            <button
              type="button"
              className="btn-whatsapp"
              onClick={handleWhatsAppClick}
              title="Enviar mensagem de cobrança"
            >
              <span className="whatsapp-icon">📱</span>
              WHATSAPP
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
              ✏️ EDITAR
            </button>
          </div>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="financial-cards">
        <div className="financial-card financial-card-danger">
          <div className="financial-card-icon">💳</div>
          <div className="financial-card-content">
            <p className="financial-card-label">Saldo devedor</p>
            <h2 className="financial-card-value">{formatCurrency(financialStats.saldo_devedor)}</h2>
          </div>
        </div>

        <div className="financial-card financial-card-success">
          <div className="financial-card-icon">💰</div>
          <div className="financial-card-content">
            <p className="financial-card-label">Créditos</p>
            <h2 className="financial-card-value">{formatCurrency(financialStats.creditos)}</h2>
          </div>
        </div>

        <div className="financial-card financial-card-warning">
          <div className="financial-card-icon">📅</div>
          <div className="financial-card-content">
            <p className="financial-card-label">Próx. vencimento</p>
            <h2 className="financial-card-value">
              {financialStats.proximo_vencimento?.toLocaleDateString('pt-BR') || '--'}
            </h2>
            {financialStats.valor_proximo_vencimento > 0 && (
              <p className="financial-card-subtitle">
                {formatCurrency(financialStats.valor_proximo_vencimento)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="student-content-grid">
        {/* Enrollments Section */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>📋 Matrículas</h3>
            <button
              type="button"
              className="btn-icon"
              onClick={() => navigate('/matriculas')}
              title="Ver todas as matrículas"
            >
              ➕
            </button>
          </div>
          <div className="content-card-body">
            {enrollments.length === 0 ? (
              <p className="empty-state">Nenhuma matrícula encontrada</p>
            ) : (
              <div className="enrollments-list">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="enrollment-item">
                    <div className="enrollment-header">
                      <h4>{enrollment.plan_name}</h4>
                      <span className={`status-badge status-${enrollment.status}`}>
                        {enrollment.status}
                      </span>
                    </div>
                    <div className="enrollment-details">
                      <p>
                        <strong>Início:</strong> {new Date(enrollment.start_date).toLocaleDateString('pt-BR')}
                      </p>
                      {enrollment.end_date && (
                        <p>
                          <strong>Fim:</strong> {new Date(enrollment.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <p>
                        <strong>Vencimento:</strong> Dia {enrollment.due_day}
                      </p>
                      {enrollment.class_names && enrollment.class_names.length > 0 && (
                        <p>
                          <strong>Turmas:</strong> {enrollment.class_names.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-sm btn-secondary"
                      onClick={() => navigate(`/matriculas?student=${student.id}`)}
                    >
                      Editar matrícula
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Info Section */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>👤 Informações Pessoais</h3>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowLevelModal(true)}
              title="Alterar nível"
            >
              ⬆️
            </button>
          </div>
          <div className="content-card-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{student.email || '--'}</p>
              </div>
              <div className="info-item">
                <label>Telefone</label>
                <p>{student.phone || '--'}</p>
              </div>
              <div className="info-item">
                <label>CPF</label>
                <p>{student.cpf || '--'}</p>
              </div>
              <div className="info-item">
                <label>Data de Nascimento</label>
                <p>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : '--'}</p>
              </div>
              <div className="info-item">
                <label>Endereço</label>
                <p>{student.address || '--'}</p>
              </div>
              <div className="info-item">
                <label>Nível Atual</label>
                <p>
                  {currentLevel ? (
                    <span className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                      {currentLevel.name}
                    </span>
                  ) : (
                    '--'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Makeup Credits Section */}
        <div className="content-card content-card-full">
          <MakeupCreditsManager studentId={parseInt(id!)} studentName={student.full_name} />
        </div>

        {/* Invoices Section */}
        <div className="content-card content-card-full">
          <div className="content-card-header">
            <h3>💵 Histórico Financeiro</h3>
            <button
              type="button"
              className="btn-icon"
              onClick={() => navigate(`/financeiro?student=${student.id}`)}
              title="Ver financeiro completo"
            >
              📊
            </button>
          </div>
          <div className="content-card-body">
            {invoices.length === 0 ? (
              <p className="empty-state">Nenhuma fatura encontrada</p>
            ) : (
              <div className="invoices-table-container">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Referência</th>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 10).map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.reference_month}</td>
                        <td>{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</td>
                        <td>{formatCurrency(invoice.final_amount_cents)}</td>
                        <td>
                          <span className={`status-badge status-${invoice.status}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-sm btn-primary"
                            onClick={() => navigate(`/financeiro?invoice=${invoice.id}`)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level Change Modal */}
      {showLevelModal && (
        <div className="modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Alterar Nível do Aluno</h2>
              <button type="button" className="modal-close" onClick={() => setShowLevelModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nível Atual</label>
                <p className="current-level">
                  {currentLevel ? (
                    <span className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                      {currentLevel.name}
                    </span>
                  ) : (
                    'Nenhum'
                  )}
                </p>
              </div>
              <div className="form-group">
                <label>Novo Nível</label>
                <select
                  value={selectedLevel || ''}
                  onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Selecione um nível</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowLevelModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUpdateLevel}
                disabled={!selectedLevel || selectedLevel === student.level_id}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
