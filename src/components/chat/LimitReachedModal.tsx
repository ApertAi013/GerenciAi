import type { UsageInfo } from '../../types/premiumFeaturesTypes';
import '../../styles/LimitReachedModal.css';
import '../../styles/ModernModal.css';

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
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>Limite Atingido</h2>
          <button type="button" className="mm-close" onClick={onClose}>✕</button>
        </div>

        <div className="mm-content">
          <div className="modal-icon">🚫</div>

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
        </div>

        <div className="mm-footer">
          <button type="button" onClick={onClose} className="mm-btn mm-btn-secondary">
            Fechar
          </button>
          <button type="button" onClick={onUpgrade} className="btn-modal-upgrade">
            <span>💎</span>
            <span>Contratar Plano PRO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
