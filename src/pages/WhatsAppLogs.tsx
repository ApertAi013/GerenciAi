import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faFilter,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { WhatsAppMessageLog, MessageType, MessageStatus } from '../types/whatsappTypes';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsAppLogs.css';

export default function WhatsAppLogs() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    messageType: '' as MessageType | '',
    status: '' as MessageStatus | '',
  });

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await whatsappService.getLogs({
        messageType: filters.messageType || undefined,
        status: filters.status || undefined,
        limit: 100,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        setLogs(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sent':
        return { icon: faEnvelope, color: '#3B82F6' };
      case 'delivered':
        return { icon: faCheckCircle, color: '#10B981' };
      case 'read':
        return { icon: faCheckCircle, color: '#22C55E' };
      case 'failed':
        return { icon: faTimesCircle, color: '#EF4444' };
      default:
        return { icon: faClock, color: '#6B7280' };
    }
  };

  const getStatusLabel = (status: MessageStatus) => {
    const labels = {
      sent: 'Enviado',
      delivered: 'Entregue',
      read: 'Lido',
      failed: 'Falhou',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: MessageType) => {
    const labels = {
      due_reminder: 'Lembrete de Vencimento',
      overdue_reminder: 'Lembrete de Atraso',
      payment_confirmation: 'Confirmação de Pagamento',
      test: 'Teste',
    };
    return labels[type] || type;
  };

  const formatAmount = (cents: number | null) => {
    if (!cents) return '-';
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  if (!user || loading) {
    return (
      <div className="whatsapp-logs-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="whatsapp-logs-container">
      <div className="logs-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>
            Histórico de Mensagens <PremiumBadge />
          </h1>
          <p>Visualize todas as mensagens enviadas via WhatsApp</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="logs-filters">
        <div className="filter-header">
          <FontAwesomeIcon icon={faFilter} />
          <h3>Filtros</h3>
        </div>
        <div className="filter-group">
          <select
            value={filters.messageType}
            onChange={(e) => setFilters({ ...filters, messageType: e.target.value as MessageType | '' })}
          >
            <option value="">Todos os tipos</option>
            <option value="due_reminder">Lembrete de Vencimento</option>
            <option value="overdue_reminder">Lembrete de Atraso</option>
            <option value="payment_confirmation">Confirmação de Pagamento</option>
            <option value="test">Teste</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as MessageStatus | '' })}
          >
            <option value="">Todos os status</option>
            <option value="sent">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="read">Lido</option>
            <option value="failed">Falhou</option>
          </select>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="logs-list">
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma mensagem encontrada</p>
          </div>
        ) : (
          logs.map((log) => {
            const statusInfo = getStatusIcon(log.status);
            return (
              <div key={log.id} className={`log-card ${log.status}`}>
                <div className="log-header">
                  <div className="log-student">
                    <strong>{log.student_name || 'N/A'}</strong>
                    <small>{log.phone_number}</small>
                  </div>
                  <div className="log-status" style={{ color: statusInfo.color }}>
                    <FontAwesomeIcon icon={statusInfo.icon} />
                    <span>{getStatusLabel(log.status)}</span>
                  </div>
                </div>

                <div className="log-type">
                  <span className="type-badge">{getTypeLabel(log.message_type)}</span>
                  <span className="log-date">{new Date(log.sent_at).toLocaleString()}</span>
                </div>

                {log.invoice_id && (
                  <div className="log-invoice">
                    <span>Fatura: {log.reference_month}</span>
                    <span>Vencimento: {log.due_date ? new Date(log.due_date).toLocaleDateString() : '-'}</span>
                    <span>Valor: {formatAmount(log.final_amount_cents)}</span>
                  </div>
                )}

                <div className="log-message">
                  <pre>{log.message_content}</pre>
                </div>

                {log.error_message && (
                  <div className="log-error">
                    <strong>Erro:</strong> {log.error_message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
