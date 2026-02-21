import { useNavigate } from 'react-router-dom';
import '../styles/PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-header">
        <div className="privacy-header-content">
          <span className="privacy-logo" onClick={() => navigate('/')}>GerenciAi</span>
        </div>
      </div>

      <div className="privacy-container">
        <h1>Politica de Privacidade</h1>
        <p className="privacy-updated">Ultima atualizacao: 20 de fevereiro de 2026</p>

        <section>
          <h2>1. Introducao</h2>
          <p>
            A GerenciAi ("nos", "nosso" ou "plataforma") e um sistema de gestao para academias e escolas esportivas.
            Esta Politica de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informacoes
            pessoais quando voce utiliza nossos servicos, incluindo o aplicativo mobile e a plataforma web.
          </p>
        </section>

        <section>
          <h2>2. Dados que Coletamos</h2>
          <h3>2.1. Dados fornecidos por voce</h3>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone, CPF/CNPJ</li>
            <li><strong>Dados de alunos:</strong> nome, e-mail, telefone, CPF, data de nascimento, endereco</li>
            <li><strong>Dados financeiros:</strong> informacoes de faturamento, chave PIX para recebimento de pagamentos</li>
          </ul>
          <h3>2.2. Dados coletados automaticamente</h3>
          <ul>
            <li><strong>Dados de uso:</strong> paginas visitadas, funcionalidades utilizadas, horarios de acesso</li>
            <li><strong>Dados do dispositivo:</strong> tipo de dispositivo, sistema operacional, versao do app</li>
            <li><strong>Dados de autenticacao:</strong> tokens de sessao, informacoes de login</li>
          </ul>
        </section>

        <section>
          <h2>3. Como Usamos seus Dados</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Fornecer e manter nossos servicos de gestao de academias</li>
            <li>Processar pagamentos via PIX atraves do gateway ASAAS</li>
            <li>Gerenciar matriculas, turmas e agendamentos</li>
            <li>Enviar notificacoes relevantes sobre faturas, aulas e avisos</li>
            <li>Gerar relatorios financeiros e operacionais</li>
            <li>Melhorar a experiencia do usuario e nossos servicos</li>
            <li>Cumprir obrigacoes legais e regulatorias</li>
          </ul>
        </section>

        <section>
          <h2>4. Compartilhamento de Dados</h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul>
            <li><strong>ASAAS (gateway de pagamentos):</strong> para processar cobranças e transferencias PIX. O ASAAS recebe nome, e-mail, CPF e valores de cobranca</li>
            <li><strong>Google Cloud Platform:</strong> nossos servidores estao hospedados na infraestrutura do Google Cloud</li>
            <li><strong>A academia/escola esportiva:</strong> os gestores da academia tem acesso aos dados de seus respectivos alunos</li>
          </ul>
          <p>Nao vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.</p>
        </section>

        <section>
          <h2>5. Seguranca dos Dados</h2>
          <p>Adotamos medidas de seguranca para proteger seus dados:</p>
          <ul>
            <li>Comunicacao criptografada via HTTPS/TLS</li>
            <li>Senhas armazenadas com hash seguro (bcrypt)</li>
            <li>Autenticacao via tokens JWT com expiracao</li>
            <li>Isolamento de dados por academia (multi-tenant)</li>
            <li>Validacao anti-fraude em transacoes financeiras</li>
            <li>Webhook de validacao de saques com verificacao de origem</li>
          </ul>
        </section>

        <section>
          <h2>6. Retencao de Dados</h2>
          <p>
            Seus dados sao mantidos enquanto sua conta estiver ativa ou conforme necessario para fornecer os servicos.
            Dados financeiros sao mantidos pelo prazo legal exigido pela legislacao brasileira.
            Voce pode solicitar a exclusao dos seus dados a qualquer momento, exceto quando houver obrigacao legal de retencao.
          </p>
        </section>

        <section>
          <h2>7. Seus Direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce tem direito a:</p>
          <ul>
            <li>Confirmar a existencia de tratamento de seus dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimizacao, bloqueio ou eliminacao de dados</li>
            <li>Solicitar a portabilidade dos dados</li>
            <li>Revogar seu consentimento a qualquer momento</li>
          </ul>
        </section>

        <section>
          <h2>8. Pagamentos via App</h2>
          <p>
            Quando voce utiliza o pagamento via PIX no aplicativo mobile, seus dados (nome, CPF, e-mail) sao
            compartilhados com o ASAAS, nosso gateway de pagamentos, para geracao da cobranca. O ASAAS possui
            sua propria politica de privacidade disponivel em <a href="https://www.asaas.com/politica-de-privacidade" target="_blank" rel="noopener noreferrer">asaas.com/politica-de-privacidade</a>.
          </p>
          <p>
            As taxas aplicadas (taxa ASAAS + taxa da plataforma) sao transparentes e informadas ao gestor
            antes da ativacao do servico.
          </p>
        </section>

        <section>
          <h2>9. Cookies e Armazenamento Local</h2>
          <p>
            Utilizamos armazenamento local (localStorage) no navegador e no aplicativo mobile para manter
            sua sessao ativa e preferencias do usuario. Nao utilizamos cookies de rastreamento ou publicidade.
          </p>
        </section>

        <section>
          <h2>10. Alteracoes nesta Politica</h2>
          <p>
            Podemos atualizar esta Politica de Privacidade periodicamente. Alteracoes significativas serao
            comunicadas atraves do aplicativo ou por e-mail. Recomendamos revisar esta pagina regularmente.
          </p>
        </section>

        <section>
          <h2>11. Contato</h2>
          <p>
            Para exercer seus direitos, tirar duvidas ou fazer solicitacoes sobre seus dados pessoais,
            entre em contato conosco:
          </p>
          <ul>
            <li><strong>E-mail:</strong> contato@gerenciai.app</li>
            <li><strong>Responsavel:</strong> GerenciAi - Sistema de Gestao para Academias</li>
          </ul>
        </section>
      </div>

      <div className="privacy-footer">
        <p>&copy; 2026 GerenciAi. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
