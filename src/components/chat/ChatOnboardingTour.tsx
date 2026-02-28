import { useCallback } from 'react';
import Joyride, { type CallBackProps, type Step, STATUS } from 'react-joyride';
import { useThemeStore } from '../../store/themeStore';

interface ChatOnboardingTourProps {
  run: boolean;
  onFinish: () => void;
  isPremiumUser: boolean;
}

export default function ChatOnboardingTour({ run, onFinish, isPremiumUser }: ChatOnboardingTourProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const steps: Step[] = [
    {
      target: '.chat-sidebar',
      content: (
        <div>
          <h3>📂 Suas Conversas</h3>
          <p>Aqui você encontra todas as suas conversas anteriores com a IA.</p>
          <p>Cada conversa fica salva para você poder revisitar depois.</p>
        </div>
      ),
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '.btn-new-conversation',
      content: (
        <div>
          <h3>✨ Nova Conversa</h3>
          <p>Clique aqui para criar uma nova conversa com a IA.</p>
          {!isPremiumUser && (
            <p className="premium-warning">
              <strong>⚠️ Atenção:</strong> Você tem <strong>5 conversas gratuitas</strong> por mês.
            </p>
          )}
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.chat-header',
      content: (
        <div>
          <h3>🤖 Assistente Inteligente</h3>
          <p>Nossa IA está conectada aos dados da sua academia e pode ajudar com:</p>
          <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
            <li>💰 Informações financeiras</li>
            <li>👥 Dados de alunos e matrículas</li>
            <li>🏐 Gestão de turmas</li>
            <li>📊 Relatórios e estatísticas</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.chat-input',
      content: (
        <div>
          <h3>💬 Faça suas perguntas</h3>
          <p>Digite aqui suas perguntas em linguagem natural.</p>
          <p>Exemplos:</p>
          <ul style={{ textAlign: 'left', paddingLeft: '20px', fontSize: '14px' }}>
            <li>"Quantos alunos ativos temos?"</li>
            <li>"Qual o faturamento deste mês?"</li>
            <li>"Quais alunos estão inadimplentes?"</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3>{isPremiumUser ? '👑 Você é Usuário PRO!' : '🎯 Plano Gratuito'}</h3>
          {isPremiumUser ? (
            <div>
              <p>✅ Você tem <strong>acesso ilimitado</strong> à IA!</p>
              <p>Aproveite todas as funcionalidades sem restrições.</p>
            </div>
          ) : (
            <div>
              <p>Você tem <strong>5 conversas gratuitas</strong> por mês.</p>
              <p>Para ter acesso ilimitado e outras funcionalidades exclusivas:</p>
              <p><strong>💎 Entre em contato para contratar o plano PRO!</strong></p>
            </div>
          )}
          <p style={{ marginTop: '15px', fontSize: '14px', opacity: 0.8 }}>
            Este tour não será mostrado novamente.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  }, [onFinish]);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5',
          textColor: isDark ? '#f0f0f0' : '#1F2937',
          backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          arrowColor: isDark ? '#1a1a1a' : '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          fontSize: '15px',
          padding: '20px',
          ...(isDark && { border: '1px solid #333333' }),
        },
        tooltipContainer: {
          textAlign: 'center',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          fontSize: '14px',
          padding: '10px 20px',
          borderRadius: '6px',
        },
        buttonBack: {
          color: isDark ? '#a0a0a0' : '#6B7280',
          fontSize: '14px',
        },
        buttonSkip: {
          color: isDark ? '#6b6b6b' : '#9CA3AF',
          fontSize: '14px',
        },
      }}
      locale={{
        back: '← Voltar',
        close: 'Fechar',
        last: 'Concluir ✓',
        next: 'Próximo →',
        skip: 'Pular tour',
      }}
    />
  );
}
