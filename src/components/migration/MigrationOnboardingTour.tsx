import Joyride, { type Step, type CallBackProps } from 'react-joyride';

interface MigrationOnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Bem-vindo à Migração de Dados!</h2>
        <p>
          Aqui você pode importar dados do seu sistema anterior para o GerenciAi.
          Vamos te mostrar como funciona!
        </p>
      </div>
    ),
    placement: 'center',
  },
  {
    target: '.upload-zone',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">1. Upload de Arquivos</h3>
        <p>
          Arraste e solte seus arquivos CSV nesta área ou clique para selecionar.
          Você pode importar dados de agenda, contratos e vendas.
        </p>
      </div>
    ),
  },
  {
    target: '.supported-types',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">2. Tipos Suportados</h3>
        <p>
          Aqui você vê os tipos de arquivos que podem ser importados e quais colunas são necessárias.
        </p>
      </div>
    ),
  },
  {
    target: '.import-history',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">3. Histórico de Importações</h3>
        <p>
          Acompanhe o status das suas importações. Você pode ver quantos registros foram importados
          com sucesso e se houve algum erro.
        </p>
      </div>
    ),
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Pronto para começar!</h2>
        <p>
          Agora você já sabe como importar seus dados. Comece fazendo o upload do seu primeiro
          arquivo CSV!
        </p>
      </div>
    ),
    placement: 'center',
  },
];

export default function MigrationOnboardingTour({ run, onFinish }: MigrationOnboardingTourProps) {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}
