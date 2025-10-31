import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { rentalService } from '../services/rentalService';
import { studentService } from '../services/studentService';
import type { CourtRental, CreateRentalData, RentalFilters, PaymentMethod } from '../types/rentalTypes';
import type { Student } from '../types/studentTypes';
import '../styles/Rentals.css';

export default function Rentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<CourtRental[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<CourtRental | null>(null);

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Stats
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    revenue: 0,
  });

  // Filters
  const [filters, setFilters] = useState<RentalFilters>({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Create Rental Form
  const [rentalType, setRentalType] = useState<'student' | 'guest'>('student');
  const [formData, setFormData] = useState<CreateRentalData>({
    renter_name: '',
    renter_phone: '',
    renter_email: '',
    renter_cpf: '',
    court_name: '',
    rental_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00',
    price_cents: 0,
    notes: '',
  });

  // Payment Form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  useEffect(() => {
    fetchRentals();
    fetchStudents();
    fetchStats();
  }, [filters]);

  // Filter students based on search
  useEffect(() => {
    if (studentSearch.trim() === '') {
      setFilteredStudents(students);
    } else {
      const searchLower = studentSearch.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchLower) ||
          student.phone.includes(searchLower) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearch, students]);

  const fetchRentals = async () => {
    try {
      const response = await rentalService.getRentals(filters);
      if (response.success) {
        setRentals(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar locações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentService.getStudents();
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [todayRes, pendingRes] = await Promise.all([
        rentalService.getTodayRentals(),
        rentalService.getPendingPayments(),
      ]);

      const revenue = rentals
        .filter(r => r.payment_status === 'paga')
        .reduce((sum, r) => sum + r.price_cents, 0);

      setStats({
        today: todayRes.success ? todayRes.data.length : 0,
        pending: pendingRes.success ? pendingRes.data.length : 0,
        revenue: revenue,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar disponibilidade
      const availabilityRes = await rentalService.checkAvailability(
        formData.court_name,
        formData.rental_date,
        formData.start_time,
        formData.end_time
      );

      if (!availabilityRes.data.available) {
        const conflicts = availabilityRes.data.conflicts
          .map(c => `${c.renter_name} (${c.start_time}-${c.end_time})`)
          .join(', ');
        alert(`Quadra indisponível! Conflitos: ${conflicts}`);
        return;
      }

      // Criar locação
      const response = await rentalService.createRental(formData);
      if (response.success) {
        alert('Locação criada com sucesso!');
        setShowCreateModal(false);
        resetForm();
        fetchRentals();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Erro ao criar locação:', error);
      alert(error.response?.data?.message || 'Erro ao criar locação');
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedRental) return;

    try {
      const response = await rentalService.registerPayment(selectedRental.id, {
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
      });

      if (response.success) {
        alert('Pagamento registrado com sucesso!');
        setShowPaymentModal(false);
        setSelectedRental(null);
        fetchRentals();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      alert(error.response?.data?.message || 'Erro ao registrar pagamento');
    }
  };

  const handleCancelRental = async (id: number) => {
    if (!confirm('Deseja realmente cancelar esta locação?')) return;

    try {
      const response = await rentalService.cancelRental(id);
      if (response.success) {
        alert('Locação cancelada com sucesso!');
        fetchRentals();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar locação:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar locação');
    }
  };

  const handleStudentChange = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({
        ...formData,
        student_id: student.id,
        renter_name: student.full_name,
        renter_phone: student.phone,
        renter_email: student.email || '',
      });
    }
  };

  const handleSelectStudent = (student: Student) => {
    setFormData({
      ...formData,
      student_id: student.id,
      renter_name: student.full_name,
      renter_phone: student.phone,
      renter_email: student.email || '',
    });
    setStudentSearch('');
    setShowStudentDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      renter_name: '',
      renter_phone: '',
      renter_email: '',
      renter_cpf: '',
      court_name: '',
      rental_date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '09:00',
      price_cents: 0,
      notes: '',
    });
    setRentalType('student');
    setStudentSearch('');
    setShowStudentDropdown(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="rentals-page">
      {/* Header */}
      <div className="rentals-header">
        <h1>Locações de Quadra</h1>
        <div className="rentals-header-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/locacoes/agenda')}>
            📅 Ver Agenda
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Nova Locação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rentals-stats">
        <div className="rental-stat-card today">
          <h3>Locações Hoje</h3>
          <p className="value">{stats.today}</p>
        </div>
        <div className="rental-stat-card pending">
          <h3>Pagamentos Pendentes</h3>
          <p className="value">{stats.pending}</p>
        </div>
        <div className="rental-stat-card revenue">
          <h3>Receita Total</h3>
          <p className="value">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rentals-filters">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Quadra</label>
            <select
              value={filters.court_name || ''}
              onChange={(e) => setFilters({ ...filters, court_name: e.target.value })}
            >
              <option value="">Todas as quadras</option>
              <option value="Quadra 1">Quadra 1</option>
              <option value="Quadra 2">Quadra 2</option>
              <option value="Beach Tennis">Beach Tennis</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            >
              <option value="">Todos</option>
              <option value="agendada">Agendadas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Pagamento</label>
            <select
              value={filters.payment_status || ''}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value as any })}
            >
              <option value="">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="paga">Pagas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rentals List */}
      <div className="rentals-list">
        <h3>Locações ({rentals.length})</h3>

        {rentals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>Nenhuma locação encontrada</p>
            <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Criar primeira locação
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="rentals-table-container">
              <table className="rentals-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Quadra</th>
                    <th>Locatário</th>
                    <th>Telefone</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Pagamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => (
                    <tr key={rental.id}>
                      <td>{formatDate(rental.rental_date)}</td>
                      <td>
                        {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                      </td>
                      <td>{rental.court_name}</td>
                      <td>
                        {rental.renter_name}
                        {rental.student_id && <span style={{ color: '#10B981', marginLeft: '4px' }}>●</span>}
                      </td>
                      <td>{rental.renter_phone}</td>
                      <td>{formatCurrency(rental.price_cents)}</td>
                      <td>
                        <span className={`status-badge status-${rental.status}`}>{rental.status}</span>
                      </td>
                      <td>
                        <span className={`status-badge payment-${rental.payment_status}`}>
                          {rental.payment_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {rental.payment_status === 'pendente' && rental.status !== 'cancelada' && (
                            <button
                              type="button"
                              className="btn-sm btn-success"
                              onClick={() => {
                                setSelectedRental(rental);
                                setShowPaymentModal(true);
                              }}
                            >
                              Pagar
                            </button>
                          )}
                          {rental.status !== 'cancelada' && (
                            <button
                              type="button"
                              className="btn-sm btn-danger"
                              onClick={() => handleCancelRental(rental.id)}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            {rentals.map((rental) => (
              <div key={rental.id} className="rental-card">
                <div className="rental-card-header">
                  <div>
                    <h4 className="rental-card-title">{rental.renter_name}</h4>
                    <p className="rental-card-court">{rental.court_name}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className={`status-badge status-${rental.status}`}>{rental.status}</span>
                    <span className={`status-badge payment-${rental.payment_status}`}>
                      {rental.payment_status}
                    </span>
                  </div>
                </div>

                <div className="rental-card-details">
                  <div className="rental-detail-item">
                    <label>Data</label>
                    <span>{formatDate(rental.rental_date)}</span>
                  </div>
                  <div className="rental-detail-item">
                    <label>Horário</label>
                    <span>
                      {formatTime(rental.start_time)} - {formatTime(rental.end_time)}
                    </span>
                  </div>
                  <div className="rental-detail-item">
                    <label>Telefone</label>
                    <span>{rental.renter_phone}</span>
                  </div>
                  <div className="rental-detail-item">
                    <label>Valor</label>
                    <span>{formatCurrency(rental.price_cents)}</span>
                  </div>
                </div>

                <div className="rental-card-actions">
                  {rental.payment_status === 'pendente' && rental.status !== 'cancelada' && (
                    <button
                      type="button"
                      className="btn-sm btn-success"
                      onClick={() => {
                        setSelectedRental(rental);
                        setShowPaymentModal(true);
                      }}
                    >
                      Registrar Pagamento
                    </button>
                  )}
                  {rental.status !== 'cancelada' && (
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() => handleCancelRental(rental.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create Rental Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Locação</h2>
              <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRental}>
              <div className="modal-body">
                {/* Rental Type */}
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="type-student"
                      name="rentalType"
                      value="student"
                      checked={rentalType === 'student'}
                      onChange={() => {
                        setRentalType('student');
                        setFormData({ ...formData, student_id: undefined, renter_cpf: '' });
                      }}
                    />
                    <label htmlFor="type-student">Aluno Cadastrado</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="type-guest"
                      name="rentalType"
                      value="guest"
                      checked={rentalType === 'guest'}
                      onChange={() => {
                        setRentalType('guest');
                        setFormData({
                          ...formData,
                          student_id: undefined,
                          renter_name: '',
                          renter_phone: '',
                          renter_email: '',
                        });
                      }}
                    />
                    <label htmlFor="type-guest">Cliente Avulso</label>
                  </div>
                </div>

                {/* Student Selection */}
                {rentalType === 'student' && (
                  <div className="form-group">
                    <label>Aluno *</label>
                    <div className="student-autocomplete">
                      <input
                        type="text"
                        className="student-search-input"
                        placeholder="Digite o nome, telefone ou email do aluno..."
                        value={formData.student_id ? formData.renter_name : studentSearch}
                        onChange={(e) => {
                          // Se já tem aluno selecionado, limpa a seleção ao começar a digitar
                          if (formData.student_id) {
                            setFormData({
                              ...formData,
                              student_id: undefined,
                              renter_name: '',
                              renter_phone: '',
                              renter_email: '',
                            });
                          }
                          setStudentSearch(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        onBlur={() => {
                          // Delay para permitir clique no dropdown
                          setTimeout(() => setShowStudentDropdown(false), 200);
                        }}
                      />
                      {showStudentDropdown && filteredStudents.length > 0 && (
                        <div className="student-dropdown">
                          {filteredStudents.slice(0, 10).map((student) => (
                            <div
                              key={student.id}
                              className="student-dropdown-item"
                              onClick={() => handleSelectStudent(student)}
                            >
                              <div className="student-dropdown-name">{student.full_name}</div>
                              <div className="student-dropdown-info">
                                Telefone: {student.phone}
                                {student.email && ` | Email: ${student.email}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showStudentDropdown && studentSearch && filteredStudents.length === 0 && (
                        <div className="student-dropdown">
                          <div className="student-dropdown-empty">Nenhum aluno encontrado</div>
                        </div>
                      )}
                    </div>
                    {formData.student_id && (
                      <div className="selected-student-badge">
                        ✓ {formData.renter_name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              student_id: undefined,
                              renter_name: '',
                              renter_phone: '',
                              renter_email: '',
                            });
                            setStudentSearch('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Renter Info */}
                <div className="form-group">
                  <label>Nome do Locatário *</label>
                  <input
                    type="text"
                    required
                    value={formData.renter_name}
                    onChange={(e) => setFormData({ ...formData, renter_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label>Telefone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.renter_phone}
                      onChange={(e) => setFormData({ ...formData, renter_phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {rentalType === 'guest' && (
                    <div className="form-group">
                      <label>CPF</label>
                      <input
                        type="text"
                        value={formData.renter_cpf}
                        onChange={(e) => setFormData({ ...formData, renter_cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.renter_email}
                    onChange={(e) => setFormData({ ...formData, renter_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Rental Details */}
                <div className="form-group">
                  <label>Quadra *</label>
                  <select
                    required
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  >
                    <option value="">Selecione a quadra...</option>
                    <option value="Quadra 1">Quadra 1</option>
                    <option value="Quadra 2">Quadra 2</option>
                    <option value="Beach Tennis">Beach Tennis</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.rental_date}
                    onChange={(e) => setFormData({ ...formData, rental_date: e.target.value })}
                  />
                </div>

                <div className="form-group-inline">
                  <div className="form-group">
                    <label>Hora Início *</label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Hora Fim *</label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_cents ? formData.price_cents / 100 : ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Locação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRental && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowPaymentModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#737373' }}>
                  <strong>Locatário:</strong> {selectedRental.renter_name}
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#737373' }}>
                  <strong>Valor:</strong> {formatCurrency(selectedRental.price_cents)}
                </p>
                <p style={{ margin: '0', color: '#737373' }}>
                  <strong>Data:</strong> {formatDate(selectedRental.rental_date)} •{' '}
                  {formatTime(selectedRental.start_time)} - {formatTime(selectedRental.end_time)}
                </p>
              </div>

              <div className="form-group">
                <label>Método de Pagamento *</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-success" onClick={handleRegisterPayment}>
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
