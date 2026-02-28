import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableTennis, faClock, faPen, faTrash, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { courtService } from '../services/courtService';
import { useThemeStore } from '../store/themeStore';
import type { Court, CreateCourtData, UpdateCourtData, CourtStatus, OperatingHour } from '../types/courtTypes';
import '../styles/Courts.css';
import '../styles/ModernModal.css';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const Courts: React.FC = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {courts.length === 0 ? (
          <div className="no-courts">
            <p>Nenhuma quadra cadastrada</p>
            <button className="btn-secondary" onClick={() => handleOpenModal()}>
              Cadastrar primeira quadra
            </button>
          </div>
        ) : (
          courts.map((court) => {
            const statusColor = court.status === 'ativa' ? '#10b981' : court.status === 'inativa' ? '#ef4444' : '#f59e0b';
            const statusLabel = getStatusLabel(court.status);
            return (
            <div key={court.id} style={{
              background: isDark ? '#1a1a1a' : 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column' as const,
              opacity: court.status === 'inativa' ? 0.6 : 1,
            }}>
              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: statusColor }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: isDark ? 'rgba(255,153,0,0.15)' : '#FFF3E0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FontAwesomeIcon icon={faTableTennis} style={{ fontSize: '20px', color: '#FF9900' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0, fontSize: '18px', fontWeight: 700, color: isDark ? '#f0f0f0' : '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{court.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: statusColor,
                      background: isDark ? `${statusColor}20` : `${statusColor}15`,
                      padding: '2px 8px', borderRadius: '4px',
                    }}>{statusLabel}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {court.description && (
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: isDark ? '#a0a0a0' : '#737373', lineHeight: '1.5' }}>
                  {court.description}
                </p>
              )}

              {/* Info box */}
              {(court.default_price_cents != null && court.default_price_cents > 0 || court.cancellation_deadline_hours != null) && (
                <div style={{
                  background: isDark ? '#141414' : '#FAFAFA', borderRadius: '10px',
                  padding: '12px 14px', marginBottom: '16px', fontSize: '13px',
                  color: isDark ? '#a0a0a0' : '#737373', display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  {court.default_price_cents != null && court.default_price_cents > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faDollarSign} style={{ fontSize: '12px', color: '#10B981' }} />
                      <span>Preço: <strong style={{ color: isDark ? '#f0f0f0' : '#1a1a1a' }}>R$ {(court.default_price_cents / 100).toFixed(2)}</strong></span>
                    </div>
                  )}
                  {court.cancellation_deadline_hours != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                      <span>Cancelamento: {court.cancellation_deadline_hours}h
                        {court.cancellation_fee_cents ? ` · Taxa: R$${(court.cancellation_fee_cents / 100).toFixed(2)}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => handleOpenHoursModal(court)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? '#262626' : 'white',
                    color: isDark ? '#d0d0d0' : '#404040', border: isDark ? '1px solid #333' : '1px solid #E5E5E5',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#333' : '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#262626' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                  Horários
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal(court)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? '#262626' : 'white',
                    color: isDark ? '#d0d0d0' : '#404040', border: isDark ? '1px solid #333' : '1px solid #E5E5E5',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#333' : '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#262626' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: '11px' }} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(court)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', background: isDark ? 'rgba(239,68,68,0.06)' : 'white',
                    color: isDark ? '#f87171' : '#ef4444', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.06)' : 'white'; }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '11px' }} />
                  Deletar
                </button>
              </div>
            </div>
            );
          })
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
