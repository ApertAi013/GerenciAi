import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { rentalService } from '../services/rentalService';
import { studentService } from '../services/studentService';
import { courtService } from '../services/courtService';
import type { CourtRental, CreateRentalData, RentalFilters, PaymentMethod } from '../types/rentalTypes';
import type { Student } from '../types/studentTypes';
import type { Court, OperatingHour } from '../types/courtTypes';
import '../styles/Rentals.css';
import '../styles/ModernModal.css';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Rentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<CourtRental[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
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

  // Share link
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingLink, setBookingLink] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [showRentalPrices, setShowRentalPrices] = useState(true);
  const [loadingPriceSettings, setLoadingPriceSettings] = useState(false);

  // Operating hours modal
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursCourt, setHoursCourt] = useState<Court | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [savingHours, setSavingHours] = useState(false);
  const [priceTexts, setPriceTexts] = useState<Record<number, string>>({});
  const [showCourtsSection, setShowCourtsSection] = useState(true);

  useEffect(() => {
    fetchRentals();
    fetchStudents();
    fetchCourts();
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
          (student.phone && student.phone.includes(searchLower)) ||
          (student.email && student.email.toLowerCase().includes(searchLower))
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearch, students]);

  const fetchRentals = async () => {
    try {
      const response = await rentalService.getRentals(filters);
      if ((response as any).status === 'success' || (response as any).success === true) {
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
      if ((response as any).status === 'success' || (response as any).success === true) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await courtService.getCourts();
      if ((response as any).status === 'success' || (response as any).success === true) {
        // Filtra apenas quadras ativas
        setCourts(response.data.filter((court: Court) => court.status === 'ativa'));
      }
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
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
        today: ((todayRes as any).status === 'success' || (todayRes as any).success === true) ? todayRes.data.length : 0,
        pending: ((pendingRes as any).status === 'success' || (pendingRes as any).success === true) ? pendingRes.data.length : 0,
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

      // Verificar conflitos com turmas
      try {
        const classConflictRes = await rentalService.checkClassConflicts(
          formData.court_name,
          formData.rental_date,
          formData.start_time,
          formData.end_time
        );

        if (classConflictRes.data.has_conflicts) {
          const classConflicts = classConflictRes.data.conflicts
            .map(c => `${c.name} (${c.modality}) - ${c.start_time.substring(0, 5)} às ${c.end_time.substring(0, 5)}`)
            .join('\n');

          const shouldContinue = window.confirm(
            `Atenção: Esta locação conflita com turmas ativas:\n\n${classConflicts}\n\nDeseja continuar mesmo assim?`
          );

          if (!shouldContinue) return;
        }
      } catch (conflictErr) {
        console.error('Erro ao verificar conflitos com turmas:', conflictErr);
      }

      // Criar locação
      const response = await rentalService.createRental(formData);
      if ((response as any).status === 'success' || (response as any).success === true) {
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

      if ((response as any).status === 'success' || (response as any).success === true) {
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
      if ((response as any).status === 'success' || (response as any).success === true) {
        alert('Locação cancelada com sucesso!');
        fetchRentals();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar locação:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar locação');
    }
  };

  const handleSelectStudent = (student: Student) => {
    setFormData({
      ...formData,
      student_id: student.id,
      renter_name: student.full_name,
      renter_phone: student.phone || '',
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
    if (!dateString) return 'Data inválida';

    try {
      let date: Date;

      // Se for formato YYYY-MM-DD (prioridade: evitar timezone UTC)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T12:00:00');
      }
      // Se for formato YYYY-MM-DDT... (ISO com timezone)
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const datePart = dateString.substring(0, 10);
        date = new Date(datePart + 'T12:00:00');
      }
      // Se for formato DD/MM/YYYY
      else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      else {
        date = new Date(dateString);
      }

      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', dateString);
        return 'Data inválida';
      }

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const handleShareLink = async () => {
    setLoadingLink(true);
    try {
      let response = await courtService.getBookingToken();
      let token = response.data?.booking_token;
      if (!token) {
        response = await courtService.generateBookingToken();
        token = response.data?.booking_token;
      }
      const baseUrl = window.location.origin;
      setBookingLink(`${baseUrl}/reservar/${token}`);

      // Load price settings
      try {
        const priceRes = await courtService.getRentalPriceSettings();
        setShowRentalPrices(priceRes.data?.show_rental_prices ?? true);
      } catch { /* default to true */ }

      setShowShareModal(true);
    } catch {
      toast.error('Erro ao gerar link de reserva');
    } finally {
      setLoadingLink(false);
    }
  };

  const handleToggleRentalPrices = async (value: boolean) => {
    setLoadingPriceSettings(true);
    try {
      await courtService.updateRentalPriceSettings(value);
      setShowRentalPrices(value);
      toast.success(value ? 'Preços visíveis no link' : 'Preços ocultos no link');
    } catch {
      toast.error('Erro ao atualizar configuração');
    } finally {
      setLoadingPriceSettings(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    toast.success('Link copiado!');
  };

  const initPriceTexts = (hours: OperatingHour[]) => {
    const texts: Record<number, string> = {};
    hours.forEach((h) => {
      texts[h.day_of_week] = h.price_cents ? (h.price_cents / 100).toFixed(2).replace('.', ',') : '';
    });
    setPriceTexts(texts);
  };

  const handleOpenHoursModal = async (court: Court) => {
    setHoursCourt(court);
    try {
      const response = await courtService.getOperatingHours(court.id);
      if (response.data) {
        setOperatingHours(response.data);
        initPriceTexts(response.data);
      }
    } catch {
      const defaults: OperatingHour[] = [];
      for (let i = 0; i < 7; i++) {
        defaults.push({
          court_id: court.id,
          day_of_week: i,
          open_time: '08:00',
          close_time: '22:00',
          slot_duration_minutes: 60,
          price_cents: null,
          is_active: i >= 1 && i <= 5,
        });
      }
      setOperatingHours(defaults);
      initPriceTexts(defaults);
    }
    setShowHoursModal(true);
  };

  const handleSaveHours = async () => {
    if (!hoursCourt) return;
    setSavingHours(true);
    try {
      await courtService.setOperatingHours(hoursCourt.id, operatingHours);
      toast.success('Horários salvos com sucesso!');
      setShowHoursModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar horários');
    } finally {
      setSavingHours(false);
    }
  };

  const updateHour = (dayOfWeek: number, field: string, value: any) => {
    setOperatingHours(prev =>
      prev.map(h => h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h)
    );
  };

  const copyToAllDays = (sourceDayOfWeek: number) => {
    const source = operatingHours.find(h => h.day_of_week === sourceDayOfWeek);
    if (!source) return;
    setOperatingHours(prev =>
      prev.map(h => ({
        ...h,
        open_time: source.open_time,
        close_time: source.close_time,
        slot_duration_minutes: source.slot_duration_minutes,
        price_cents: source.price_cents,
        is_active: source.is_active,
      }))
    );
    const sourceText = priceTexts[sourceDayOfWeek] || '';
    setPriceTexts(prev => {
      const next = { ...prev };
      for (let i = 0; i < 7; i++) next[i] = sourceText;
      return next;
    });
    toast.success('Horário copiado para todos os dias');
  };

  const formatTimeHour = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
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
          <button
            type="button"
            className="btn-secondary"
            onClick={handleShareLink}
            disabled={loadingLink}
            style={{ backgroundColor: '#8B5CF6', color: 'white', border: 'none' }}
          >
            {loadingLink ? '...' : '🔗 Compartilhar Link'}
          </button>
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

      {/* Courts Quick Config */}
      <div className="courts-config-section">
        <div
          className="courts-config-header"
          onClick={() => setShowCourtsSection(!showCourtsSection)}
          style={{ borderBottom: showCourtsSection ? undefined : 'none' }}
        >
          <h3>Quadras e Horários de Funcionamento</h3>
          <span className="courts-config-toggle">
            {showCourtsSection ? 'Recolher' : 'Expandir'} {showCourtsSection ? '▲' : '▼'}
          </span>
        </div>
        {showCourtsSection && (
          <div className="courts-config-grid">
            {courts.length === 0 ? (
              <p className="courts-config-empty">Nenhuma quadra cadastrada. Acesse "Quadras" para criar.</p>
            ) : (
              courts.map((court) => (
                <div key={court.id} className="courts-config-card">
                  <div className="courts-config-card-header">
                    <h4>{court.name}</h4>
                    <span className={`courts-config-status ${court.status === 'ativa' ? 'active' : 'inactive'}`}>
                      {court.status === 'ativa' ? 'Ativa' : court.status}
                    </span>
                  </div>
                  {court.default_price_cents != null && court.default_price_cents > 0 && (
                    <p className="courts-config-price">
                      R$ {(court.default_price_cents / 100).toFixed(2)}/hora
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenHoursModal(court)}
                    className="courts-config-btn"
                  >
                    Configurar Horários
                  </button>
                </div>
              ))
            )}
          </div>
        )}
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
              {courts.map((court) => (
                <option key={court.id} value={court.name}>
                  {court.name}
                </option>
              ))}
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

      {/* Mini Calendar - Today's Schedule */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayRentals = rentals
          .filter(r => {
            const rd = r.rental_date?.substring(0, 10);
            return rd === today && r.status !== 'cancelada';
          })
          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

        const COURT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
        const courtColorMap: Record<string, string> = {};
        courts.forEach((c, i) => { courtColorMap[c.name] = COURT_COLORS[i % COURT_COLORS.length]; });

        const hours: number[] = [];
        if (todayRentals.length > 0) {
          const minH = Math.min(...todayRentals.map(r => parseInt((r.start_time || '08:00').split(':')[0])));
          const maxH = Math.max(...todayRentals.map(r => parseInt((r.end_time || '22:00').split(':')[0])));
          for (let h = Math.max(0, minH); h <= Math.min(23, maxH); h++) hours.push(h);
        } else {
          for (let h = 8; h <= 22; h++) hours.push(h);
        }

        return (
          <div style={{
            background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB',
            padding: '16px', marginTop: '16px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#374151' }}>
              Agenda de Hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {todayRentals.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                Nenhuma locação agendada para hoje
              </p>
            ) : (
              <div style={{ position: 'relative', display: 'flex', gap: '0' }}>
                {/* Time labels */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '45px', flexShrink: 0 }}>
                  {hours.map(h => (
                    <div key={h} style={{
                      height: '48px', fontSize: '0.75rem', color: '#9CA3AF',
                      display: 'flex', alignItems: 'flex-start', paddingTop: '2px',
                    }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Grid with rentals */}
                <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid #E5E7EB' }}>
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div key={h} style={{
                      height: '48px', borderBottom: '1px solid #F3F4F6',
                    }} />
                  ))}

                  {/* Rental blocks */}
                  {todayRentals.map((rental) => {
                    const startParts = (rental.start_time || '08:00').split(':');
                    const endParts = (rental.end_time || '09:00').split(':');
                    const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                    const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                    const baseMin = hours[0] * 60;
                    const topPx = ((startMin - baseMin) / 60) * 48;
                    const heightPx = Math.max(20, ((endMin - startMin) / 60) * 48 - 2);
                    const color = courtColorMap[rental.court_name] || '#3B82F6';

                    return (
                      <div
                        key={rental.id}
                        style={{
                          position: 'absolute', top: `${topPx}px`, left: '4px', right: '4px',
                          height: `${heightPx}px`, background: `${color}15`,
                          borderLeft: `3px solid ${color}`, borderRadius: '4px',
                          padding: '4px 8px', overflow: 'hidden', fontSize: '0.75rem',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        }}
                        title={`${rental.renter_name} — ${rental.court_name} (${formatTime(rental.start_time)}-${formatTime(rental.end_time)})`}
                      >
                        <span style={{ fontWeight: 600, color: color, lineHeight: 1.2 }}>
                          {formatTime(rental.start_time)}-{formatTime(rental.end_time)} {rental.court_name}
                        </span>
                        {heightPx > 28 && (
                          <span style={{ color: '#6B7280', lineHeight: 1.2 }}>
                            {rental.renter_name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Court legend */}
            {todayRentals.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                {courts.filter(c => todayRentals.some(r => r.court_name === c.name)).map(c => (
                  <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6B7280' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: courtColorMap[c.name] }} />
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Create Rental Modal */}
      {showCreateModal && (
        <div className="mm-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Nova Locação</h2>
              <button type="button" className="mm-close" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRental}>
              <div className="mm-content">
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
                  <div className="mm-field">
                    <label>Aluno *</label>
                    <div className="student-autocomplete">
                      <input
                        type="text"
                        className="student-search-input"
                        placeholder="Digite o nome, telefone ou email do aluno..."
                        value={formData.student_id ? formData.renter_name : studentSearch}
                        onChange={(e) => {
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
                <div className="mm-field">
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
                  <div className="mm-field">
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
                    <div className="mm-field">
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

                <div className="mm-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.renter_email}
                    onChange={(e) => setFormData({ ...formData, renter_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Rental Details */}
                <div className="mm-field">
                  <label>Quadra *</label>
                  <select
                    required
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  >
                    <option value="">Selecione a quadra...</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.name}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mm-field">
                  <label>Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.rental_date}
                    onChange={(e) => setFormData({ ...formData, rental_date: e.target.value })}
                  />
                </div>

                <div className="form-group-inline">
                  <div className="mm-field">
                    <label>Hora Início *</label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="mm-field">
                    <label>Hora Fim *</label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mm-field">
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

                <div className="mm-field">
                  <label>Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="mm-footer">
                <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="mm-btn mm-btn-primary">
                  Criar Locação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRental && (
        <div className="mm-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="mm-close" onClick={() => setShowPaymentModal(false)}>
                ✕
              </button>
            </div>

            <div className="mm-content">
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

              <div className="mm-field">
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

            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
              <button type="button" className="mm-btn mm-btn-primary" onClick={handleRegisterPayment}>
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operating Hours Modal */}
      {showHoursModal && hoursCourt && (
        <div className="mm-overlay" onClick={() => setShowHoursModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Horários — {hoursCourt.name}</h2>
              <button type="button" className="mm-close" onClick={() => setShowHoursModal(false)}>✕</button>
            </div>
            <div className="mm-content">
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '16px' }}>
                Configure os dias, horários e preços disponíveis para locação pública. O valor definido em cada dia será exibido no link de reserva para os clientes.
              </p>
              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {operatingHours.map((h) => (
                  <div
                    key={h.day_of_week}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 0', borderBottom: '1px solid #F3F4F6',
                      opacity: h.is_active ? 1 : 0.5, flexWrap: 'wrap',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={h.is_active}
                        onChange={(e) => updateHour(h.day_of_week, 'is_active', e.target.checked)}
                        style={{ width: 'auto' }}
                      />
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{DAY_NAMES[h.day_of_week]}</span>
                    </label>
                    {h.is_active && (
                      <>
                        <input
                          type="time" value={formatTimeHour(h.open_time)}
                          onChange={(e) => updateHour(h.day_of_week, 'open_time', e.target.value)}
                          style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <span style={{ color: '#9CA3AF' }}>às</span>
                        <input
                          type="time" value={formatTimeHour(h.close_time)}
                          onChange={(e) => updateHour(h.day_of_week, 'close_time', e.target.value)}
                          style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <select
                          value={h.slot_duration_minutes}
                          onChange={(e) => updateHour(h.day_of_week, 'slot_duration_minutes', parseInt(e.target.value))}
                          style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}
                        >
                          <option value={30}>30min</option>
                          <option value={60}>1h</option>
                          <option value={90}>1h30</option>
                          <option value={120}>2h</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={priceTexts[h.day_of_week] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d,.]/, '');
                              setPriceTexts(prev => ({ ...prev, [h.day_of_week]: val }));
                            }}
                            onBlur={() => {
                              const raw = (priceTexts[h.day_of_week] || '').replace(',', '.');
                              const parsed = parseFloat(raw);
                              const cents = !isNaN(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
                              updateHour(h.day_of_week, 'price_cents', cents);
                              setPriceTexts(prev => ({ ...prev, [h.day_of_week]: cents ? (cents / 100).toFixed(2).replace('.', ',') : '' }));
                            }}
                            style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', width: '80px' }}
                          />
                        </div>
                        <button
                          type="button" onClick={() => copyToAllDays(h.day_of_week)}
                          title="Copiar para todos"
                          style={{
                            background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px',
                            padding: '6px 8px', cursor: 'pointer', fontSize: '0.75rem',
                            color: '#6B7280', whiteSpace: 'nowrap',
                          }}
                        >
                          Copiar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowHoursModal(false)}>Cancelar</button>
              <button type="button" className="mm-btn mm-btn-primary" onClick={handleSaveHours} disabled={savingHours}>
                {savingHours ? 'Salvando...' : 'Salvar Horários'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="mm-overlay" onClick={() => setShowShareModal(false)}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Link de Reserva Online</h2>
              <button type="button" className="mm-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="mm-content">
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '20px' }}>
                Compartilhe este link para que seus clientes possam reservar horários diretamente.
              </p>
              <div style={{
                display: 'flex', gap: '8px', padding: '12px', background: '#F3F4F6',
                borderRadius: '8px', alignItems: 'center',
              }}>
                <input
                  type="text"
                  readOnly
                  value={bookingLink}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    fontSize: '0.85rem', color: '#1F2937', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  style={{
                    padding: '8px 16px', background: '#22C55E', color: 'white',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Copiar
                </button>
              </div>
              {/* Price toggle */}
              <div style={{
                marginTop: '20px', padding: '16px', background: showRentalPrices ? '#F0FDF4' : '#F9FAFB',
                borderRadius: '10px', border: `1.5px solid ${showRentalPrices ? '#22C55E' : '#E5E7EB'}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1F2937', marginBottom: '4px' }}>
                      Exibir preços no link
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {showRentalPrices
                        ? 'Os valores dos horários estão visíveis para quem acessar o link.'
                        : 'Os valores dos horários estão ocultos no link de reserva.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRentalPrices(!showRentalPrices)}
                    disabled={loadingPriceSettings}
                    style={{
                      width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                      background: showRentalPrices ? '#22C55E' : '#D1D5DB',
                      cursor: loadingPriceSettings ? 'wait' : 'pointer',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      position: 'absolute', top: '3px',
                      left: showRentalPrices ? '27px' : '3px',
                      transition: 'left 0.2s ease',
                    }} />
                  </button>
                </div>
              </div>

              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '12px' }}>
                Envie via WhatsApp, redes sociais ou onde preferir. Qualquer pessoa pode reservar sem precisar de cadastro.
              </p>
            </div>
            <div className="mm-footer">
              <button
                type="button"
                className="mm-btn mm-btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
