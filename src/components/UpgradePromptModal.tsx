import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faTimes, faUsers, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { platformBillingService } from '../services/platformBillingService';
import toast from 'react-hot-toast';

interface Props {
  type: 'students' | 'classes';
  current: number;
  max: number;
  planName: string;
  onClose: () => void;
}

export default function UpgradePromptModal({ type, current, max, planName, onClose }: Props) {
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);

  const isStudents = type === 'students';
  const label = isStudents ? 'alunos' : 'turmas';
  const icon = isStudents ? faUsers : faUserGroup;

  const handleQuickUpgrade = async () => {
    setRequesting(true);
    try {
      // Request upgrade to next plan (we don't know the exact plan ID, so navigate to MyPlan)
      navigate('/meu-plano');
      onClose();
    } catch (error: any) {
      toast.error('Erro ao solicitar upgrade');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420,
          width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: 0 }}>
            Limite Atingido
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div style={{
          background: '#FEF3C7', borderRadius: 12, padding: 20, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FontAwesomeIcon icon={icon} style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#92400E', margin: '0 0 4px' }}>
              {current}/{max} {label}
            </p>
            <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
              Seu plano <strong>{planName}</strong> permite ate {max} {label}.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
          Para cadastrar mais {label}, faca upgrade do seu plano. Veja as opcoes disponiveis.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 8,
              border: '1px solid #D1D5DB', background: '#fff',
              color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Fechar
          </button>
          <button
            onClick={handleQuickUpgrade}
            disabled={requesting}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 8,
              border: 'none', background: '#FF9900', color: '#fff',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              opacity: requesting ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: 6 }} />
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}
