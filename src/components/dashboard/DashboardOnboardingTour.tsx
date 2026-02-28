import { useCallback } from 'react';
import Joyride, { type CallBackProps, type Step, STATUS } from 'react-joyride';
import { useThemeStore } from '../../store/themeStore';

interface DashboardOnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3>Bem-vindo ao ArenaAi! 🎉</h3>
        <p>Este é o seu painel principal. Aqui você tem uma visão geral de tudo que acontece na sua arena.</p>
        <p>Vamos te mostrar algumas funcionalidades!</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
  },
  {
    target: '.theme-toggle-btn',
    content: (
      <div>
        <h3>Alternar Tema</h3>
        <p>Você pode alternar entre o <strong>modo claro</strong> e o <strong>modo escuro</strong> a qualquer momento clicando aqui.</p>
        <p>Escolha o que for mais confortável para você!</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar-arenas"]',
    content: (
      <div>
        <h3>Suas Arenas</h3>
        <p>Acesse <strong>Arenas</strong> para gerenciar suas quadras, configurar horários de funcionamento e acompanhar métricas.</p>
      </div>
    ),
    placement: 'right',
  },
];

export default function DashboardOnboardingTour({ run, onFinish }: DashboardOnboardingTourProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

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
          primaryColor: '#F97316',
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
          textAlign: 'center' as const,
        },
        buttonNext: {
          backgroundColor: '#F97316',
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
