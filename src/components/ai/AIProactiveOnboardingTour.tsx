import { useCallback } from 'react';
import Joyride, { type CallBackProps, type Step, STATUS } from 'react-joyride';

interface AIProactiveOnboardingTourProps {
  run: boolean;
  onFinish: () => void;
  isPremiumUser: boolean;
}

export default function AIProactiveOnboardingTour({ run, onFinish, isPremiumUser }: AIProactiveOnboardingTourProps) {
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3>🤖 Bem-vindo à IA Proativa!</h3>
          <p>Nossa IA analisa automaticamente os dados da sua academia e gera sugestões inteligentes para melhorar sua gestão.</p>
          <p style={{ marginTop: '15px' }}>Vamos fazer um tour rápido pelas funcionalidades!</p>
        </div>
      ),
      disableBeacon: true,
      placement: 'center',
    },
    {
      target: '.ai-card',
      content: (
        <div>
          <h3>📋 Sugestões Inteligentes</h3>
          <p>Aqui você encontra sugestões geradas pela IA, como:</p>
          <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
            <li>💰 Lembretes de pagamento</li>
            <li>📅 Vagas disponíveis em turmas</li>
            <li>📉 Alertas de baixa ocupação</li>
            <li>😴 Alunos inativos</li>
            <li>⚠️ Conflitos de horário</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3>⚙️ Configurações Personalizadas</h3>
          <p>Na área de configurações, você pode:</p>
          <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
            <li>Ativar/desativar cada tipo de sugestão</li>
            <li>Definir a frequência das análises</li>
            <li>Escolher o horário preferido para notificações</li>
            <li>Gerar sugestões sob demanda</li>
          </ul>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3>{isPremiumUser ? '👑 Você é Usuário PRO!' : '🎯 Feature Premium'}</h3>
          {isPremiumUser ? (
            <div>
              <p>✅ Você tem <strong>acesso total</strong> à IA Proativa!</p>
              <p>Aproveite sugestões ilimitadas e automáticas para otimizar sua gestão.</p>
            </div>
          ) : (
            <div>
              <p>A IA Proativa é uma <strong>funcionalidade premium</strong>.</p>
              <p>Para ter acesso completo a sugestões inteligentes automáticas:</p>
              <p><strong>💎 Entre em contato para contratar!</strong></p>
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
          textColor: '#1F2937',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          arrowColor: '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          fontSize: '15px',
          padding: '20px',
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
          color: '#6B7280',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#9CA3AF',
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
