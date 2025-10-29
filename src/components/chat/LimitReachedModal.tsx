import type { UsageInfo } from '../../types/premiumFeaturesTypes';
import '../../styles/LimitReachedModal.css';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  usageInfo: UsageInfo;
}

export default function LimitReachedModal({
  isOpen,
  onClose,
  onUpgrade,
  usageInfo,
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  const { resetDate, monthlyLimit } = usageInfo;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🚫</div>

        <h2 className="modal-title">Limite Atingido</h2>

        <p className="modal-description">
          Você utilizou todas as suas <strong>{monthlyLimit} conversas gratuitas</strong> deste mês.
        </p>

        {resetDate && (
          <p className="modal-reset">
            Seu limite será renovado em:{' '}
            <strong>{new Date(resetDate).toLocaleDateString('pt-BR')}</strong>
          </p>
        )}

        <div className="modal-benefits">
          <h3>Contrate o Plano PRO e tenha:</h3>
          <ul>
            <li>
              <span className="benefit-icon">✅</span>
              <span>Conversas ilimitadas com a IA</span>
            </li>
            <li>
              <span className="benefit-icon">✅</span>
              <span>Acesso prioritário a novos recursos</span>
            </li>
            <li>
              <span className="benefit-icon">✅</span>
              <span>Suporte dedicado</span>
            </li>
            <li>
              <span className="benefit-icon">✅</span>
              <span>Relatórios avançados</span>
            </li>
          </ul>
        </div>

        <div className="modal-actions">
          <button onClick={onUpgrade} className="btn-modal-upgrade">
            <span>💎</span>
            <span>Contratar Plano PRO</span>
          </button>
          <button onClick={onClose} className="btn-modal-close">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
