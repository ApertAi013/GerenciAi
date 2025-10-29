import type { UsageInfo } from '../../types/premiumFeaturesTypes';
import '../../styles/UsageCounter.css';

interface UsageCounterProps {
  usageInfo: UsageInfo;
  isUnlimited: boolean;
  onUpgrade: () => void;
}

export default function UsageCounter({ usageInfo, isUnlimited, onUpgrade }: UsageCounterProps) {
  if (isUnlimited) {
    return null; // Não mostrar contador para usuários premium
  }

  const { remainingUses = 0, usedThisMonth = 0, monthlyLimit = 5, resetDate } = usageInfo;
  const percentage = monthlyLimit > 0 ? (usedThisMonth / monthlyLimit) * 100 : 0;
  const isLow = remainingUses <= 1;
  const isOut = remainingUses === 0;

  return (
    <div className="usage-counter-container">
      <div className={`usage-counter ${isLow ? 'warning' : ''} ${isOut ? 'danger' : ''}`}>
        <div className="usage-header">
          <span className="usage-label">Conversas Gratuitas</span>
          <span className="usage-count">
            {remainingUses} de {monthlyLimit} restantes
          </span>
        </div>

        <div className="usage-progress-bar">
          <div
            className="usage-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {resetDate && (
          <div className="usage-reset">
            Renova em: {new Date(resetDate).toLocaleDateString('pt-BR')}
          </div>
        )}

        {isLow && (
          <div className="usage-warning">
            {isOut ? (
              <span>⚠️ Você atingiu o limite mensal!</span>
            ) : (
              <span>⚠️ Última conversa disponível!</span>
            )}
          </div>
        )}
      </div>

      <button onClick={onUpgrade} className="btn-upgrade">
        <span className="upgrade-icon">💎</span>
        <span>Contratar Plano PRO</span>
      </button>
    </div>
  );
}
