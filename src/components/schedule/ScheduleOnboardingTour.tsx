import { useCallback } from 'react';
import Joyride, { type CallBackProps, type Step, STATUS } from 'react-joyride';

interface ScheduleOnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3>Dicas da Agenda</h3>
        <p>Vamos te mostrar algumas funcionalidades da agenda que vão facilitar sua gestão!</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
  },
  {
    target: '.class-name',
    content: (
      <div>
        <h3>Editar Turma</h3>
        <p><strong>Clique no nome da turma</strong> para abrir o modal de edição.</p>
        <p>Você pode alterar horário, capacidade, níveis, cor e mais.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.class-card-header',
    content: (
      <div>
        <h3>Mover Turma</h3>
        <p><strong>Arraste pelo cabeçalho</strong> (área do horário) para mover a turma para outro dia ou horário.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.student-chip',
    content: (
      <div>
        <h3>Transferir Aluno</h3>
        <p><strong>Arraste um aluno</strong> de uma turma para outra para transferi-lo.</p>
        <p>Clique no nome do aluno para ver os detalhes dele.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.schedule-search',
    content: (
      <div>
        <h3>Buscar Turma</h3>
        <p>Use a busca para encontrar turmas rapidamente pelo nome ou modalidade.</p>
      </div>
    ),
    placement: 'bottom',
  },
];

export default function ScheduleOnboardingTour({ run, onFinish }: ScheduleOnboardingTourProps) {
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
          textAlign: 'center' as const,
        },
        buttonNext: {
          backgroundColor: '#F97316',
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
