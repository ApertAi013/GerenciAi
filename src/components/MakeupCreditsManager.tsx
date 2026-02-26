import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicket,
  faPlus,
  faMinus,
  faClockRotateLeft,
  faKey,
  faCircleCheck,
  faCalendarCheck,
  faHandHoldingDollar,
  faTriangleExclamation,
  faMobileScreenButton,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { courtReservationService } from '../services/courtReservationService';
import type { CreditHistoryItem } from '../services/courtReservationService';
import '../styles/MakeupCreditsManager.css';
import '../styles/ModernModal.css';

interface MakeupCreditsManagerProps {
  studentId: number;
  studentName: string;
}

export default function MakeupCreditsManager({ studentId, studentName }: MakeupCreditsManagerProps) {
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form states
  const [creditsToAdd, setCreditsToAdd] = useState(1);
  const [creditsToRemove, setCreditsToRemove] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [removeNotes, setRemoveNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadCreditsData();
  }, [studentId]);

  const loadCreditsData = async () => {
    try {
      setIsLoading(true);
      const response = await courtReservationService.getStudentCredits(studentId);
      if ((response as any).status === 'success' || (response as any).success === true) {
        setCredits(response.data.student.makeup_credits);
        setHistory(response.data.history);
      }
    } catch (error: any) {
      console.error('Erro ao carregar créditos:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (creditsToAdd <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    try {
      const response = await courtReservationService.addCredits(studentId, {
        credits: creditsToAdd,
        notes: addNotes || undefined,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(response.message);
        setShowAddModal(false);
        setCreditsToAdd(1);
        setAddNotes('');
        loadCreditsData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar créditos');
    }
  };

  const handleRemoveCredits = async () => {
    if (creditsToRemove <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    if (creditsToRemove > credits) {
      toast.error('Aluno não possui créditos suficientes');
      return;
    }

    try {
      const response = await courtReservationService.removeCredits(studentId, {
        credits: creditsToRemove,
        notes: removeNotes || undefined,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(response.message);
        setShowRemoveModal(false);
        setCreditsToRemove(1);
        setRemoveNotes('');
        loadCreditsData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover créditos');
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      const response = await courtReservationService.setStudentPassword(studentId, {
        password: newPassword,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success(response.message);
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao definir senha');
    }
  };

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      cancel_8h: 'Cancelamento antecipado',
      use_reservation: 'Usado em reserva',
      manual_add: 'Adicionado manualmente',
      manual_remove: 'Removido manualmente',
    };
    return labels[reason] || reason;
  };

  const getReasonIcon = (reason: string): IconDefinition => {
    const icons: Record<string, IconDefinition> = {
      cancel_8h: faCircleCheck,
      use_reservation: faCalendarCheck,
      manual_add: faPlus,
      manual_remove: faMinus,
    };
    return icons[reason] || faClockRotateLeft;
  };

  if (isLoading) {
    return (
      <div className="makeup-credits-card">
        <div className="loading-spinner">Carregando créditos...</div>
      </div>
    );
  }

  return (
    <>
      <div className="makeup-credits-card">
        <div className="makeup-credits-header">
          <div className="makeup-credits-title">
            <span className="makeup-credits-icon">
              <FontAwesomeIcon icon={faTicket} />
            </span>
            <h3>Créditos de Remarcação</h3>
          </div>
          <div className="makeup-credits-balance">
            <span className="balance-label">Saldo:</span>
            <span className="balance-value">{credits}</span>
          </div>
        </div>

        <div className="makeup-credits-description">
          <p>
            Alunos ganham créditos ao cancelar aulas com 8+ horas de antecedência.
            Créditos podem ser usados para remarcar aulas no aplicativo mobile.
          </p>
        </div>

        <div className="makeup-credits-actions">
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Adicionar Créditos
          </button>
          <button
            type="button"
            className="btn btn-warning btn-sm"
            onClick={() => setShowRemoveModal(true)}
            disabled={credits === 0}
          >
            <FontAwesomeIcon icon={faMinus} /> Remover Créditos
          </button>
          <button
            type="button"
            className="btn btn-info btn-sm"
            onClick={() => setShowHistoryModal(true)}
          >
            <FontAwesomeIcon icon={faClockRotateLeft} /> Ver Histórico
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowPasswordModal(true)}
          >
            <FontAwesomeIcon icon={faKey} /> Definir Senha App
          </button>
        </div>
      </div>

      {/* Add Credits Modal */}
      {showAddModal && (
        <div className="mm-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Adicionar Créditos</h2>
              <button type="button" className="mm-close" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              <div className="mm-field">
                <label>Quantidade de Créditos</label>
                <input
                  type="number"
                  min="1"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
                  className="form-control"
                />
              </div>
              <div className="mm-field">
                <label>Observação (opcional)</label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Ex: Recompensa por bom comportamento"
                />
              </div>
              <div className="preview-box">
                <strong>Resumo:</strong>
                <p>Aluno terá {credits + creditsToAdd} créditos após esta operação</p>
              </div>
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-success" onClick={handleAddCredits}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Credits Modal */}
      {showRemoveModal && (
        <div className="mm-overlay" onClick={() => setShowRemoveModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Remover Créditos</h2>
              <button type="button" className="mm-close" onClick={() => setShowRemoveModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              <div className="mm-field">
                <label>Quantidade de Créditos</label>
                <input
                  type="number"
                  min="1"
                  max={credits}
                  value={creditsToRemove}
                  onChange={(e) => setCreditsToRemove(parseInt(e.target.value) || 0)}
                  className="form-control"
                />
                <small>Máximo: {credits} créditos</small>
              </div>
              <div className="mm-field">
                <label>Motivo (opcional)</label>
                <textarea
                  value={removeNotes}
                  onChange={(e) => setRemoveNotes(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Ex: Correção de erro"
                />
              </div>
              <div className="preview-box warning">
                <strong><FontAwesomeIcon icon={faTriangleExclamation} /> Atenção:</strong>
                <p>Aluno ficará com {credits - creditsToRemove} créditos após esta operação</p>
              </div>
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowRemoveModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-warning" onClick={handleRemoveCredits}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showPasswordModal && (
        <div className="mm-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Definir Senha do App Mobile</h2>
              <button type="button" className="mm-close" onClick={() => setShowPasswordModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              <div className="alert alert-info">
                <p>
                  <strong><FontAwesomeIcon icon={faMobileScreenButton} /> Informação:</strong> Esta senha permitirá que <strong>{studentName}</strong> faça
                  login no aplicativo mobile para gerenciar suas reservas e créditos.
                </p>
              </div>
              <div className="mm-field">
                <label>Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div className="mm-field">
                <label>Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  placeholder="Digite a senha novamente"
                  minLength={6}
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-danger">As senhas não coincidem</p>
              )}
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="mm-btn mm-btn-primary"
                onClick={handleSetPassword}
                disabled={!newPassword || newPassword !== confirmPassword}
              >
                Definir Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="mm-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-header">
              <h2>Histórico de Créditos</h2>
              <button type="button" className="mm-close" onClick={() => setShowHistoryModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="mm-content">
              {history.length === 0 ? (
                <p className="empty-state">Nenhum histórico de créditos encontrado</p>
              ) : (
                <div className="history-list">
                  {history.map((item) => (
                    <div key={item.id} className={`history-item ${item.credit_change > 0 ? 'gain' : 'use'}`}>
                      <div className="history-icon">
                        <FontAwesomeIcon icon={getReasonIcon(item.reason)} />
                      </div>
                      <div className="history-content">
                        <div className="history-header">
                          <strong>{getReasonLabel(item.reason)}</strong>
                          <span className={`history-badge ${item.credit_change > 0 ? 'badge-success' : 'badge-warning'}`}>
                            {item.credit_change > 0 ? '+' : ''}
                            {item.credit_change}
                          </span>
                        </div>
                        {item.notes && <p className="history-notes">{item.notes}</p>}
                        {item.court_name && (
                          <p className="history-details">
                            {item.court_name} - {new Date(item.reservation_date!).toLocaleDateString('pt-BR')} às{' '}
                            {item.start_time}
                          </p>
                        )}
                        <p className="history-date">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mm-footer">
              <button type="button" className="mm-btn mm-btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
