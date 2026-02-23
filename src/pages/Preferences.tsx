import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
  getTemplates,
  saveTemplates,
  DEFAULT_MESSAGE,
  type WhatsAppTemplate,
} from '../utils/whatsappTemplates';
import '../styles/Preferences.css';

export default function Preferences() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [defaultPassword, setDefaultPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const loaded = getTemplates();
    setTemplates(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);

    const savedPassword = localStorage.getItem('default_student_password');
    if (savedPassword) setDefaultPassword(savedPassword);
  }, []);

  const selectedTemplate = templates.find(t => t.id === selectedId);

  const updateSelected = (field: 'name' | 'message', value: string) => {
    setTemplates(prev =>
      prev.map(t => t.id === selectedId ? { ...t, [field]: value } : t)
    );
  };

  const handleAddTemplate = () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Digite um nome para o template');
      return;
    }
    if (templates.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Já existe um template com esse nome');
      return;
    }
    const newTemplate: WhatsAppTemplate = {
      id: Date.now().toString(36),
      name,
      message: DEFAULT_MESSAGE,
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    setSelectedId(newTemplate.id);
    setIsAddingNew(false);
    setNewName('');
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      toast.error('Você precisa ter pelo menos um template');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || '');
    }
  };

  const handleSave = () => {
    if (defaultPassword && defaultPassword.length < 6) {
      toast.error('A senha padrão deve ter no mínimo 6 caracteres');
      return;
    }

    // Validate template names
    for (const t of templates) {
      if (!t.name.trim()) {
        toast.error('Todos os templates devem ter um nome');
        return;
      }
    }

    setIsSaving(true);
    try {
      saveTemplates(templates);

      if (defaultPassword) {
        localStorage.setItem('default_student_password', defaultPassword);
      } else {
        localStorage.removeItem('default_student_password');
      }

      toast.success('Preferências salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMessage = () => {
    if (confirm('Restaurar a mensagem deste template para o padrão?')) {
      updateSelected('message', DEFAULT_MESSAGE);
      toast.success('Mensagem restaurada para o padrão');
    }
  };

  const handleClearPassword = () => {
    setDefaultPassword('');
    localStorage.removeItem('default_student_password');
    toast.success('Senha padrão removida');
  };

  const insertVariable = (variable: string) => {
    if (!selectedTemplate) return;
    updateSelected('message', selectedTemplate.message + variable);
  };

  const getPreview = () => {
    if (!selectedTemplate) return '';
    return selectedTemplate.message
      .replace(/\[Nome\]/g, 'João')
      .replace(/\[NomeCompleto\]/g, 'João da Silva')
      .replace(/\[Valor\]/g, 'R$ 150,00')
      .replace(/\[Vencimento\]/g, '10/01/2025')
      .replace(/\[Referencia\]/g, '2025-01');
  };

  return (
    <div className="preferences-page">
      <div className="page-header">
        <h1>Preferências</h1>
      </div>

      <div className="preferences-content">
        <section className="preference-section">
          <div className="section-header">
            <h2>Templates de WhatsApp</h2>
            <p className="section-description">
              Crie e gerencie templates de mensagem para enviar via WhatsApp. Ao clicar no botão de WhatsApp, você poderá escolher qual template usar.
            </p>
          </div>

          {/* Template tabs */}
          <div className="template-tabs">
            {templates.map(t => (
              <div
                key={t.id}
                className={`template-tab ${t.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <span className="template-tab-name">{t.name}</span>
                {templates.length > 1 && (
                  <button
                    type="button"
                    className="template-tab-delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                    title="Excluir template"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            ))}

            {isAddingNew ? (
              <div className="template-tab-add-form">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do template..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTemplate();
                    if (e.key === 'Escape') { setIsAddingNew(false); setNewName(''); }
                  }}
                />
                <button type="button" className="template-tab-add-confirm" onClick={handleAddTemplate}>
                  Criar
                </button>
                <button type="button" className="template-tab-add-cancel" onClick={() => { setIsAddingNew(false); setNewName(''); }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="template-tab template-tab--add"
                onClick={() => setIsAddingNew(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                Novo
              </button>
            )}
          </div>

          {selectedTemplate && (
            <>
              {/* Template name input */}
              <div className="template-name-row">
                <label htmlFor="template-name">Nome:</label>
                <input
                  id="template-name"
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) => updateSelected('name', e.target.value)}
                  className="template-name-input"
                />
              </div>

              <div className="variables-help">
                <h4>Variáveis disponíveis:</h4>
                <div className="variables-list">
                  <span className="variable-tag" onClick={() => insertVariable('[Nome]')}>
                    [Nome] <small>- Primeiro nome do aluno</small>
                  </span>
                  <span className="variable-tag" onClick={() => insertVariable('[NomeCompleto]')}>
                    [NomeCompleto] <small>- Nome completo</small>
                  </span>
                  <span className="variable-tag" onClick={() => insertVariable('[Valor]')}>
                    [Valor] <small>- Valor da fatura</small>
                  </span>
                  <span className="variable-tag" onClick={() => insertVariable('[Vencimento]')}>
                    [Vencimento] <small>- Data de vencimento</small>
                  </span>
                  <span className="variable-tag" onClick={() => insertVariable('[Referencia]')}>
                    [Referencia] <small>- Mês de referência</small>
                  </span>
                </div>
              </div>

              <div className="editor-container">
                <div className="editor-column">
                  <label htmlFor="whatsapp-template">Mensagem:</label>
                  <textarea
                    id="whatsapp-template"
                    value={selectedTemplate.message}
                    onChange={(e) => updateSelected('message', e.target.value)}
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
                <button type="button" className="btn-secondary" onClick={handleResetMessage}>
                  Restaurar Mensagem Padrão
                </button>
              </div>
            </>
          )}
        </section>

        <section className="preference-section">
          <div className="section-header">
            <h2>Senha Padrão para Alunos</h2>
            <p className="section-description">
              Defina uma senha padrão que será aplicada automaticamente ao cadastrar novos alunos.
              Os alunos poderão usar esta senha para acessar o aplicativo.
            </p>
          </div>

          <div className="default-password-container">
            <div className="password-input-wrapper">
              <label htmlFor="default-password">Senha padrão:</label>
              <div className="password-field">
                <input
                  id="default-password"
                  type={showPassword ? 'text' : 'password'}
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="Ex: 123456"
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
              {defaultPassword && defaultPassword.length > 0 && defaultPassword.length < 6 && (
                <span className="password-hint error">Mínimo de 6 caracteres</span>
              )}
              {defaultPassword && defaultPassword.length >= 6 && (
                <span className="password-hint success">Senha válida</span>
              )}
              {!defaultPassword && (
                <span className="password-hint">Sem senha padrão definida. Alunos serão criados sem senha.</span>
              )}
            </div>

            <div className="section-actions">
              {defaultPassword && (
                <button type="button" className="btn-secondary" onClick={handleClearPassword}>
                  Limpar Senha
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="preferences-global-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving || (defaultPassword.length > 0 && defaultPassword.length < 6)}
          >
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
}
