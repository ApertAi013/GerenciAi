import { useNavigate } from 'react-router';
import '../styles/AI.css';

export default function AI() {
  const navigate = useNavigate();

  return (
    <div className="ai-container">
      <div className="ai-header">
        <h1>Inteligência Artificial</h1>
        <p>Gerencie configurações e visualize sugestões inteligentes do sistema</p>
      </div>

      <div className="ai-cards">
        <div className="ai-card" onClick={() => navigate('/ia/sugestoes')}>
          <div className="ai-card-icon suggestions">💡</div>
          <h2>Sugestões</h2>
          <p>Visualize e gerencie sugestões inteligentes geradas pela IA</p>
          <button className="ai-card-button">Acessar Sugestões →</button>
        </div>

        <div className="ai-card" onClick={() => navigate('/ia/configuracoes')}>
          <div className="ai-card-icon settings">⚙️</div>
          <h2>Configurações</h2>
          <p>Configure tipos de análises, frequências e horários da IA</p>
          <button className="ai-card-button">Acessar Configurações →</button>
        </div>
      </div>

      <div className="ai-info">
        <h3>Como funciona?</h3>
        <div className="ai-info-grid">
          <div className="ai-info-item">
            <strong>1. Configure</strong>
            <p>Escolha quais tipos de análises a IA deve fazer e com qual frequência</p>
          </div>
          <div className="ai-info-item">
            <strong>2. IA Analisa</strong>
            <p>O sistema analisa seus dados automaticamente e gera sugestões personalizadas</p>
          </div>
          <div className="ai-info-item">
            <strong>3. Ação</strong>
            <p>Visualize as sugestões e tome ações para otimizar sua gestão</p>
          </div>
        </div>
      </div>
    </div>
  );
}
