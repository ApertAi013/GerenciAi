import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { courtService } from '../services/courtService';
import type { Court, CreateCourtData, UpdateCourtData, CourtStatus } from '../types/courtTypes';
import '../styles/Courts.css';

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
      });
    } else {
      setEditingCourt(null);
      setFormData({
        name: '',
        description: '',
        status: 'ativa',
        default_price_cents: undefined,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourt(null);
    setFormData({
      name: '',
      description: '',
      status: 'ativa',
      default_price_cents: undefined,
    });
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

  const getStatusBadgeClass = (status: CourtStatus) => {
    switch (status) {
      case 'ativa':
        return 'status-badge status-active';
      case 'inativa':
        return 'status-badge status-inactive';
      case 'manutencao':
        return 'status-badge status-maintenance';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: CourtStatus) => {
    switch (status) {
      case 'ativa':
        return 'Ativa';
      case 'inativa':
        return 'Inativa';
      case 'manutencao':
        return 'Manutenção';
      default:
        return status;
    }
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
              {court.default_price_cents && (
                <p className="court-price">
                  Preço padrão: R$ {(court.default_price_cents / 100).toFixed(2)}
                </p>
              )}
              <div className="court-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleOpenModal(court)}
                >
                  Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteClick(court)}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCourt ? 'Editar Quadra' : 'Nova Quadra'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da quadra"
                  rows={3}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
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

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingCourt ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && deletingCourt && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content confirm-delete" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja deletar a quadra <strong>"{deletingCourt.name}"</strong>?</p>
            <p className="warning-text">Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={handleDeleteCancel}>
                Cancelar
              </button>
              <button type="button" className="btn-delete" onClick={handleDeleteConfirm}>
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
