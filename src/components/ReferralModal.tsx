import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCopy,
  faCheck,
  faGift,
  faLink,
  faUserPlus,
  faHandshake,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { referralService } from '../services/referralService';
import type { ReferralCode, Referral } from '../types/referralTypes';
import '../styles/ReferralModal.css';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FRONTEND_URL = import.meta.env.DEV ? 'http://localhost:5173' : 'https://arenai.com.br';

export default function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [data, setData] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await referralService.getMyReferralCode();
      setData(result);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = data ? `${FRONTEND_URL}/contratar?ref=${data.code}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Olá! Estou usando o ArenaAi para gerenciar minha arena e recomendo! Cadastre-se pelo meu link e aproveite: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusLabel = (status: Referral['status']) => {
    switch (status) {
      case 'signed_up': return 'Cadastrado';
      case 'converted': return 'Convertido';
      case 'rewarded': return 'Recompensado';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status: Referral['status']) => {
    switch (status) {
      case 'signed_up': return '#3B82F6';
      case 'converted': return '#F59E0B';
      case 'rewarded': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ref-modal-overlay" onClick={onClose}>
      <div className="ref-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ref-modal-header">
          <div className="ref-modal-header-icon">
            <FontAwesomeIcon icon={faGift} />
          </div>
          <div>
            <h2>Indique e Ganhe!</h2>
            <p>Ganhe 1 mês grátis por cada indicação convertida</p>
          </div>
          <button className="ref-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="ref-modal-body">
          {loading ? (
            <div className="ref-modal-loading">Carregando...</div>
          ) : (
            <>
              {/* How it works */}
              <div className="ref-how-it-works">
                <h3>Como funciona</h3>
                <div className="ref-steps">
                  <div className="ref-step">
                    <div className="ref-step-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
                      <FontAwesomeIcon icon={faLink} />
                    </div>
                    <div>
                      <strong>1. Compartilhe</strong>
                      <p>Envie seu link exclusivo para outros gestores de quadras</p>
                    </div>
                  </div>
                  <div className="ref-step">
                    <div className="ref-step-icon" style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                      <FontAwesomeIcon icon={faUserPlus} />
                    </div>
                    <div>
                      <strong>2. Cadastro</strong>
                      <p>Quando alguém se cadastrar pelo seu link, contabilizamos</p>
                    </div>
                  </div>
                  <div className="ref-step">
                    <div className="ref-step-icon" style={{ background: '#10B98120', color: '#10B981' }}>
                      <FontAwesomeIcon icon={faHandshake} />
                    </div>
                    <div>
                      <strong>3. Conversão</strong>
                      <p>Se a pessoa ficar 1 mês e fizer o primeiro pagamento, conta como conversão</p>
                    </div>
                  </div>
                  <div className="ref-step">
                    <div className="ref-step-icon" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                    </div>
                    <div>
                      <strong>4. Recompensa</strong>
                      <p>Você ganha <strong>1 mês grátis</strong> de desconto na próxima fatura!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share link */}
              <div className="ref-share-section">
                <h3>Seu link de indicação</h3>
                <div className="ref-link-box">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="ref-link-input"
                  />
                  <button className={`ref-copy-btn ${copied ? 'copied' : ''}`} onClick={copyLink}>
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <button className="ref-whatsapp-btn" onClick={shareWhatsApp}>
                  <FontAwesomeIcon icon={faWhatsapp} />
                  Compartilhar no WhatsApp
                </button>
              </div>

              {/* Stats */}
              {data && (
                <div className="ref-stats-section">
                  <h3>Suas estatísticas</h3>
                  <div className="ref-stats-grid">
                    <div className="ref-stat-card">
                      <span className="ref-stat-value">{data.clicks}</span>
                      <span className="ref-stat-label">Cliques</span>
                    </div>
                    <div className="ref-stat-card">
                      <span className="ref-stat-value">{data.signups}</span>
                      <span className="ref-stat-label">Cadastros</span>
                    </div>
                    <div className="ref-stat-card">
                      <span className="ref-stat-value">{data.conversions}</span>
                      <span className="ref-stat-label">Conversões</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral list */}
              {data && data.referrals.length > 0 && (
                <div className="ref-list-section">
                  <h3>Indicações recentes</h3>
                  <div className="ref-list">
                    {data.referrals.map(ref => (
                      <div key={ref.id} className="ref-list-item">
                        <div className="ref-list-info">
                          <span className="ref-list-name">
                            {ref.referee_name || ref.referee_email}
                          </span>
                          <span className="ref-list-date">
                            {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span
                          className="ref-list-status"
                          style={{ background: getStatusColor(ref.status) + '20', color: getStatusColor(ref.status) }}
                        >
                          {getStatusLabel(ref.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
