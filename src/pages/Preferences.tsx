import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../styles/Preferences.css';

export default function Preferences() {
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Template padrão
  const defaultTemplate = `Olá [Nome], tudo bem?

Passando para lembrar do vencimento da sua mensalidade.

*Pix 48.609.350/0001-86*

Caso não for fazer aulas esse mês, favor nos informar!

Obrigado!`;

  useEffect(() => {
    // Carregar template salvo ou usar o padrão
    const savedTemplate = localStorage.getItem('whatsapp_payment_template');
    if (savedTemplate) {
      setWhatsappTemplate(savedTemplate);
    } else {
      setWhatsappTemplate(defaultTemplate);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('whatsapp_payment_template', whatsappTemplate);
      toast.success('Preferências salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar a mensagem padrão?')) {
      setWhatsappTemplate(defaultTemplate);
      localStorage.setItem('whatsapp_payment_template', defaultTemplate);
      toast.success('Mensagem restaurada para o padrão');
    }
  };

  // Preview da mensagem com variáveis substituídas
  const getPreview = () => {
    return whatsappTemplate
      .replace(/\[Nome\]/g, 'João')
      .replace(/\[NomeCompleto\]/g, 'João da Silva')
      .replace(/\[Valor\]/g, 'R$ 150,00')
      .replace(/\[Vencimento\]/g, '10/01/2025')
      .replace(/\[Referencia\]/g, '2025-01');
  };

  return (
    <div className="preferences-page">
      <div className="page-header">
        <h1>⚙️ Preferências</h1>
      </div>

      <div className="preferences-content">
        <section className="preference-section">
          <div className="section-header">
            <h2>📱 Mensagem de Cobrança via WhatsApp</h2>
            <p className="section-description">
              Configure a mensagem que será enviada ao clicar no botão de WhatsApp na tela de Financeiro.
            </p>
          </div>

          <div className="variables-help">
            <h4>Variáveis disponíveis:</h4>
            <div className="variables-list">
              <span className="variable-tag" onClick={() => setWhatsappTemplate(prev => prev + '[Nome]')}>
                [Nome] <small>- Primeiro nome do aluno</small>
              </span>
              <span className="variable-tag" onClick={() => setWhatsappTemplate(prev => prev + '[NomeCompleto]')}>
                [NomeCompleto] <small>- Nome completo</small>
              </span>
              <span className="variable-tag" onClick={() => setWhatsappTemplate(prev => prev + '[Valor]')}>
                [Valor] <small>- Valor da fatura</small>
              </span>
              <span className="variable-tag" onClick={() => setWhatsappTemplate(prev => prev + '[Vencimento]')}>
                [Vencimento] <small>- Data de vencimento</small>
              </span>
              <span className="variable-tag" onClick={() => setWhatsappTemplate(prev => prev + '[Referencia]')}>
                [Referencia] <small>- Mês de referência</small>
              </span>
            </div>
          </div>

          <div className="editor-container">
            <div className="editor-column">
              <label htmlFor="whatsapp-template">Mensagem:</label>
              <textarea
                id="whatsapp-template"
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                rows={12}
                placeholder="Digite sua mensagem personalizada..."
              />
            </div>

            <div className="preview-column">
              <label>Prévia:</label>
              <div className="message-preview">
                <div className="whatsapp-bubble">
                  {getPreview().split('\n').map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="section-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
            >
              Restaurar Padrão
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Preferências'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
