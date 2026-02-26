import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { courtService } from '../services/courtService';
import type { Court, CreateCourtData, UpdateCourtData, CourtStatus, OperatingHour } from '../types/courtTypes';
import '../styles/Courts.css';
import '../styles/ModernModal.css';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const Courts: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCourt, setDeletingCourt] = useState<Court | null>(null);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [formData, setFormData] = useState<CreateCourtData>({
    name: '',
    description: '',
    status: 'ativa',
    default_price_cents: undefined,
  });

  // Operating hours state
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursCourt, setHoursCourt] = useState<Court | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const response = await courtService.getCourts();
      if ((response as any).status === 'success' || (response as any).success === true) {
        setCourts(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
      toast.error('Erro ao buscar quadras');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (court?: Court) => {
    if (court) {
      setEditingCourt(court);
      setFormData({
        name: court.name,
        description: court.description || '',
        status: court.status,
        default_price_cents: court.default_price_cents,
        cancellation_deadline_hours: court.cancellation_deadline_hours,
        cancellation_fee_cents: court.cancellation_fee_cents,
        allow_public_booking: court.allow_public_booking,
        min_advance_booking_hours: court.min_advance_booking_hours,
        max_advance_booking_days: court.max_advance_booking_days,
      });
    } else {
      setEditingCourt(null);
      setFormData({
        name: '',
        description: '',
        status: 'ativa',
        default_price_cents: undefined,
        cancellation_deadline_hours: 24,
        cancellation_fee_cents: 0,
        allow_public_booking: true,
        min_advance_booking_hours: 1,
        max_advance_booking_days: 30,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCourt) {
        const updateData: UpdateCourtData = {
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          default_price_cents: formData.default_price_cents,
          cancellation_deadline_hours: formData.cancellation_deadline_hours,
          cancellation_fee_cents: formData.cancellation_fee_cents,
          allow_public_booking: formData.allow_public_booking,
          min_advance_booking_hours: formData.min_advance_booking_hours,
          max_advance_booking_days: formData.max_advance_booking_days,
        };
        await courtService.updateCourt(editingCourt.id, updateData);
        toast.success('Quadra atualizada com sucesso!');
      } else {
        await courtService.createCourt(formData);
        toast.success('Quadra criada com sucesso!');
      }
      handleCloseModal();
      fetchCourts();
    } catch (error: any) {
      console.error('Erro ao salvar quadra:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar quadra');
    }
  };

  const handleDeleteClick = (court: Court) => {
    setDeletingCourt(court);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourt) return;

    try {
      await courtService.deleteCourt(deletingCourt.id);
      toast.success('Quadra deletada com sucesso!');
      setShowDeleteConfirm(false);
      setDeletingCourt(null);
      fetchCourts();
    } catch (error: any) {
      console.error('Erro ao deletar quadra:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar quadra');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingCourt(null);
  };

  // Operating hours
  const handleOpenHoursModal = async (court: Court) => {
    setHoursCourt(court);
    try {
      const response = await courtService.getOperatingHours(court.id);
      if (response.data) {
        setOperatingHours(response.data);
      }
    } catch {
      // Default hours
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
    toast.success('Horário copiado para todos os dias');
  };

  const getStatusBadgeClass = (status: CourtStatus) => {
    switch (status) {
      case 'ativa': return 'status-badge status-active';
      case 'inativa': return 'status-badge status-inactive';
      case 'manutencao': return 'status-badge status-maintenance';
      default: return 'status-badge';
    }
  };

  const getStatusLabel = (status: CourtStatus) => {
    switch (status) {
      case 'ativa': return 'Ativa';
      case 'inativa': return 'Inativa';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  if (loading) {
    return <div className="courts-container"><div className="loading">Carregando...</div></div>;
  }

  return (
    <div className="courts-container">
      <div className="courts-header">
        <h1>Quadras</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Nova Quadra
        </button>
      </div>

      <div className="courts-grid">
        {courts.length === 0 ? (
          <div className="no-courts">
            <p>Nenhuma quadra cadastrada</p>
            <button className="btn-secondary" onClick={() => handleOpenModal()}>
              Cadastrar primeira quadra
            </button>
          </div>
        ) : (
          courts.map((court) => (
            <div key={court.id} className="court-card">
              <div className="court-card-header">
                <h3>{court.name}</h3>
                <span className={getStatusBadgeClass(court.status)}>
                  {getStatusLabel(court.status)}
                </span>
              </div>
              {court.description && (
                <p className="court-description">{court.description}</p>
              )}
              {court.default_price_cents != null && court.default_price_cents > 0 && (
                <p className="court-price">
                  Preço padrão: R$ {(court.default_price_cents / 100).toFixed(2)}
                </p>
              )}
              {court.cancellation_deadline_hours != null && (
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '4px 0' }}>
                  Cancelamento: {court.cancellation_deadline_hours}h de antecedência
                  {court.cancellation_fee_cents ? ` | Taxa: R$${(court.cancellation_fee_cents / 100).toFixed(2)}` : ''}
                </p>
              )}
              <div className="court-actions">
                <button className="btn-hours" onClick={() => handleOpenHoursModal(court)}>
                  Horários
                </button>
                <button className="btn-edit" onClick={() => handleOpenModal(court)}>
                  Editar
                </button>
                <button className="btn-delete" onClick={() => handleDeleteClick(court)}>
                  Deletar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Court Modal */}
      {showModal && (
        <div className="mm-overlay" onClick={handleCloseModal}>
          <div className="mm-modal mm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>{editingCourt ? 'Editar Quadra' : 'Nova Quadra'}</h2>
              <button type="button" className="mm-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mm-content">
                <div className="mm-field">
                  <label htmlFor="name">Nome *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Quadra 1, Beach, FTV"
                  />
                </div>

                <div className="mm-field">
                  <label htmlFor="description">Descrição</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional da quadra"
                    rows={2}
                  />
                </div>

                <div className="mm-field-row">
                  <div className="mm-field">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CourtStatus })}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                      <option value="manutencao">Manutenção</option>
                    </select>
                  </div>

                  <div className="mm-field">
                    <label htmlFor="price">Preço Padrão (R$)</label>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      value={formData.default_price_cents ? (formData.default_price_cents / 100).toFixed(2) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          default_price_cents: value ? Math.round(parseFloat(value) * 100) : undefined,
                        });
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Cancellation Policy Section */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#374151' }}>Política de Cancelamento</h4>
                  <div className="mm-field-row">
                    <div className="mm-field">
                      <label>Prazo Cancelamento (horas)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.cancellation_deadline_hours ?? 24}
                        onChange={(e) => setFormData({ ...formData, cancellation_deadline_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="mm-field">
                      <label>Taxa Cancelamento (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cancellation_fee_cents ? (formData.cancellation_fee_cents / 100).toFixed(2) : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData({ ...formData, cancellation_fee_cents: v ? Math.round(parseFloat(v) * 100) : 0 });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Config */}
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#374151' }}>Reserva Online</h4>
                  <div className="mm-field" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.allow_public_booking !== false}
                        onChange={(e) => setFormData({ ...formData, allow_public_booking: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      Permitir reserva pelo link público
                    </label>
                  </div>
                  <div className="mm-field-row">
                    <div className="mm-field">
                      <label>Antecedência mínima (horas)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.min_advance_booking_hours ?? 1}
                        onChange={(e) => setFormData({ ...formData, min_advance_booking_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="mm-field">
                      <label>Antecedência máxima (dias)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_advance_booking_days ?? 30}
                        onChange={(e) => setFormData({ ...formData, max_advance_booking_days: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mm-footer">
                <button type="button" className="mm-btn mm-btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="mm-btn mm-btn-primary">
                  {editingCourt ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operating Hours Modal */}
      {showHoursModal && hoursCourt && (
        <div className="mm-overlay" onClick={() => setShowHoursModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Horários de Funcionamento — {hoursCourt.name}</h2>
              <button type="button" className="mm-close" onClick={() => setShowHoursModal(false)}>×</button>
            </div>

            <div className="mm-content">
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '16px' }}>
                Configure os dias e horários em que esta quadra estará disponível para locação.
              </p>

              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {operatingHours.map((h) => (
                  <div
                    key={h.day_of_week}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: '1px solid #F3F4F6',
                      opacity: h.is_active ? 1 : 0.5,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px', cursor: 'pointer' }}>
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
                          type="time"
                          value={formatTime(h.open_time)}
                          onChange={(e) => updateHour(h.day_of_week, 'open_time', e.target.value)}
                          style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <span style={{ color: '#9CA3AF' }}>às</span>
                        <input
                          type="time"
                          value={formatTime(h.close_time)}
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
                        <button
                          type="button"
                          onClick={() => copyToAllDays(h.day_of_week)}
                          title="Copiar para todos"
                          style={{
                            background: 'none',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            whiteSpace: 'nowrap',
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
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowHoursModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="mm-btn mm-btn-primary"
                onClick={handleSaveHours}
                disabled={savingHours}
              >
                {savingHours ? 'Salvando...' : 'Salvar Horários'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingCourt && (
        <div className="mm-overlay" onClick={handleDeleteCancel}>
          <div className="mm-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja deletar a quadra <strong>"{deletingCourt.name}"</strong>?</p>
            <p className="warning-text">Esta ação não pode ser desfeita.</p>
            <div className="mm-confirm-actions">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button type="button" className="mm-btn mm-btn-danger" onClick={handleDeleteConfirm}>
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;
