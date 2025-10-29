import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import '../../styles/PremiumBadge.css';

export default function PremiumBadge() {
  return (
    <div className="premium-badge" title="Usuário PRO com acesso ilimitado">
      <FontAwesomeIcon icon={faCrown} className="crown-icon" />
      <span className="pro-text">PRO</span>
    </div>
  );
}
