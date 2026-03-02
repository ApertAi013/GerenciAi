import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faInfoCircle,
  faClock,
  faCheck,
  faBan,
  faShieldAlt,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { WhatsAppTemplate, TemplateType, TemplateRequest, UsageData } from '../types/whatsappTypes';
import { TEMPLATE_VARIABLES } from '../types/whatsappTypes';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsAppTemplates.css';

export default function WhatsAppTemplates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [requests, setRequests] = useState<TemplateRequest[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const openRequestForm = () => {
    setShowRequestForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Edit form (only for custom templates — name + isActive)
  const [editForm, setEditForm] = useState({ name: '', is_active: true });

  // Request form
  const [requestForm, setRequestForm] = useState({
    name: '',
    templateType: 'due_reminder' as TemplateType,
    messageTemplate: '',
    param_student_name: false,
    param_court_name: false,
    param_days_until_due: false,
    param_due_date: false,
    param_pix_key: false,
    param_amount: false,
  });

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [templatesRes, requestsRes, usageRes] = await Promise.all([
        whatsappService.getTemplates(),
        whatsappService.getTemplateRequests(),
        whatsappService.getUsage(),
      ]);

      if (templatesRes.success) setTemplates(templatesRes.data);
      if (requestsRes.success) setRequests(requestsRes.data);
      if (usageRes.success) setUsage(usageRes.data);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    if (template.sys_template_type === 'std') return;
    setEditingId(template.id!);
    setEditForm({ name: template.name, is_active: template.is_active });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', is_active: true });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    try {
      const response = await whatsappService.updateTemplate(editingId!, {
        name: editForm.name,
        isActive: editForm.is_active,
      });
      if (response.success) {
        toast.success('Template atualizado!');
        fetchAll();
        handleCancelEdit();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar template');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o template "${name}"?`)) return;
    try {
      const response = await whatsappService.deleteTemplate(id);
      if (response.success) {
        toast.success('Template deletado!');
        fetchAll();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar template');
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!requestForm.messageTemplate.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    try {
      const response = await whatsappService.createTemplateRequest({
        name: requestForm.name,
        templateType: requestForm.templateType,
        messageTemplate: requestForm.messageTemplate,
        param_student_name: requestForm.param_student_name,
        param_court_name: requestForm.param_court_name,
        param_days_until_due: requestForm.param_days_until_due,
        param_due_date: requestForm.param_due_date,
        param_pix_key: requestForm.param_pix_key,
        param_amount: requestForm.param_amount,
      });
      if (response.success) {
        toast.success('Solicitação enviada! Aguarde aprovação.');
        setShowRequestForm(false);
        setRequestForm({
          name: '',
          templateType: 'due_reminder',
          messageTemplate: '',
          param_student_name: false,
          param_court_name: false,
          param_days_until_due: false,
          param_due_date: false,
          param_pix_key: false,
          param_amount: false,
        });
        fetchAll();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar solicitação');
    }
  };

  const getTemplateTypeLabel = (type: TemplateType) => {
    switch (type) {
      case 'due_reminder': return 'Lembrete de Vencimento';
      case 'overdue_reminder': return 'Lembrete de Atraso';
      case 'payment_confirmation': return 'Confirmação de Pagamento';
      default: return type;
    }
  };

  const getRequestStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Em análise', icon: faClock, className: 'pending' };
      case 'approved': return { label: 'Aprovado', icon: faCheck, className: 'approved' };
      case 'rejected': return { label: 'Rejeitado', icon: faBan, className: 'rejected' };
      default: return { label: status, icon: faClock, className: '' };
    }
  };

  const insertVariable = (variable: string) => {
    setRequestForm({
      ...requestForm,
      messageTemplate: requestForm.messageTemplate + variable,
    });
  };

  const availableVariables = TEMPLATE_VARIABLES.filter((v) =>
    v.availableFor.includes(requestForm.templateType)
  );

  const usagePercent = usage ? Math.min((usage.std_sent / usage.std_limit) * 100, 100) : 0;

  if (!user) {
    return (
      <div className="whatsapp-templates-container">
        <div className="loading">Faça login para acessar os templates</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="whatsapp-templates-container">
        <div className="loading">Carregando templates...</div>
      </div>
    );
  }

  const stdTemplates = templates.filter(t => t.sys_template_type === 'std' || !t.sys_template_type);
  const customTemplates = templates.filter(t => t.sys_template_type === 'custom');

  return (
    <div className="whatsapp-templates-container">
      <div className="templates-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>
            Templates de Mensagens <PremiumBadge />
          </h1>
          <p>Gerencie os templates de mensagens do WhatsApp</p>
        </div>
        <button className="btn-new" onClick={openRequestForm}>
          <FontAwesomeIcon icon={faPlus} /> Solicitar Template Custom
        </button>
      </div>

      {/* Usage Banner */}
      {usage && (
        <div className="usage-banner">
          <div className="usage-info">
            <div className="usage-std">
              <FontAwesomeIcon icon={faPaperPlane} />
              <span><strong>{usage.std_sent}</strong> / {usage.std_limit.toLocaleString('pt-BR')} mensagens padrão usadas este mês</span>
            </div>
            {usage.custom_sent > 0 && (
              <div className="usage-custom">
                <span>{usage.custom_sent} mensagens custom ({(usage.custom_cost_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
              </div>
            )}
          </div>
          <div className="usage-bar">
            <div
              className={`usage-bar-fill ${usagePercent >= 90 ? 'danger' : usagePercent >= 70 ? 'warning' : ''}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="usage-pricing-info">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>Templates padrão: gratuitos (até 1.200 msgs/mês) | Templates custom: R$0,50 por mensagem</span>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="template-form" ref={formRef}>
          <h2>Solicitar Template Custom</h2>
          <p className="form-subtitle">
            Templates custom custam <strong>R$0,50 por mensagem</strong> enviada. Após enviar a solicitação, ela será analisada pelo administrador.
          </p>

          <div className="form-group">
            <label>Nome do Template</label>
            <input
              type="text"
              value={requestForm.name}
              onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
              placeholder="Ex: Lembrete Personalizado"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Template</label>
            <select
              value={requestForm.templateType}
              onChange={(e) => setRequestForm({ ...requestForm, templateType: e.target.value as TemplateType })}
            >
              <option value="due_reminder">Lembrete de Vencimento</option>
              <option value="overdue_reminder">Lembrete de Atraso</option>
              <option value="payment_confirmation">Confirmação de Pagamento</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mensagem</label>
            <textarea
              value={requestForm.messageTemplate}
              onChange={(e) => setRequestForm({ ...requestForm, messageTemplate: e.target.value })}
              placeholder="Digite a mensagem com as variáveis"
              rows={8}
            />
            <small>Use as variáveis abaixo para personalizar a mensagem</small>
          </div>

          <div className="form-group">
            <label>Variáveis utilizadas no template</label>
            <div className="param-checkboxes">
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_student_name}
                  onChange={(e) => setRequestForm({ ...requestForm, param_student_name: e.target.checked })} />
                <span>Nome do Aluno</span>
              </label>
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_court_name}
                  onChange={(e) => setRequestForm({ ...requestForm, param_court_name: e.target.checked })} />
                <span>Nome da Arena</span>
              </label>
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_days_until_due}
                  onChange={(e) => setRequestForm({ ...requestForm, param_days_until_due: e.target.checked })} />
                <span>Dias até Vencimento</span>
              </label>
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_due_date}
                  onChange={(e) => setRequestForm({ ...requestForm, param_due_date: e.target.checked })} />
                <span>Data de Vencimento</span>
              </label>
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_pix_key}
                  onChange={(e) => setRequestForm({ ...requestForm, param_pix_key: e.target.checked })} />
                <span>Chave PIX</span>
              </label>
              <label className="param-checkbox-item">
                <input type="checkbox" checked={requestForm.param_amount}
                  onChange={(e) => setRequestForm({ ...requestForm, param_amount: e.target.checked })} />
                <span>Valor</span>
              </label>
            </div>
          </div>

          <div className="variables-section">
            <h3>
              <FontAwesomeIcon icon={faInfoCircle} /> Variáveis Disponíveis
            </h3>
            <div className="variables-grid">
              {availableVariables.map((variable) => (
                <div
                  key={variable.name}
                  className="variable-chip"
                  onClick={() => insertVariable(variable.name)}
                >
                  <code>{variable.name}</code>
                  <small>{variable.description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setShowRequestForm(false)}>
              <FontAwesomeIcon icon={faTimes} /> Cancelar
            </button>
            <button className="btn-save" onClick={handleSubmitRequest}>
              <FontAwesomeIcon icon={faPaperPlane} /> Enviar Solicitação
            </button>
          </div>
        </div>
      )}

      {/* STD Templates */}
      <div className="templates-section">
        <h2 className="section-title">
          <FontAwesomeIcon icon={faShieldAlt} /> Templates Padrão
          <span className="section-badge std">Gratuitos</span>
        </h2>
        <p className="section-desc">Templates pré-aprovados inclusos no plano. Texto não editável.</p>

        <div className="templates-list">
          {stdTemplates.length === 0 ? (
            <div className="empty-state"><p>Nenhum template padrão disponível</p></div>
          ) : (
            stdTemplates.map((template) => (
              <div key={template.id} className={`template-card ${template.is_active ? 'active' : 'inactive'}`}>
                <div className="template-header">
                  <div>
                    <h3>{template.name}</h3>
                    <span className="template-type">{getTemplateTypeLabel(template.template_type)}</span>
                  </div>
                  <span className="type-badge std">Padrão</span>
                </div>
                <div className="template-message">
                  <pre>{template.message_template}</pre>
                </div>
                <div className="template-footer">
                  <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Custom Templates */}
      <div className="templates-section">
        <h2 className="section-title">
          Templates Custom
          <span className="section-badge custom">R$0,50/msg</span>
        </h2>
        <p className="section-desc">Templates personalizados. Cada mensagem enviada custa R$0,50.</p>

        <div className="templates-list">
          {customTemplates.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum template custom</p>
              <button className="btn-new-sm" onClick={openRequestForm}>
                <FontAwesomeIcon icon={faPlus} /> Solicitar Template
              </button>
            </div>
          ) : (
            customTemplates.map((template) => (
              <div key={template.id} className={`template-card ${template.is_active ? 'active' : 'inactive'}`}>
                <div className="template-header">
                  <div>
                    {editingId === template.id ? (
                      <input
                        className="inline-edit"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <h3>{template.name}</h3>
                    )}
                    <span className="template-type">{getTemplateTypeLabel(template.template_type)}</span>
                  </div>
                  <div className="template-actions">
                    <span className="type-badge custom">Custom</span>
                    {editingId === template.id ? (
                      <>
                        <button className="btn-icon save" onClick={handleSaveEdit} title="Salvar">
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button className="btn-icon cancel" onClick={handleCancelEdit} title="Cancelar">
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-icon edit" onClick={() => handleEdit(template)} title="Editar">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(template.id!, template.name)} title="Deletar">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="template-message">
                  <pre>{template.message_template}</pre>
                </div>
                <div className="template-footer">
                  <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  {editingId === template.id && (
                    <label className="checkbox-label-inline">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      />
                      Ativo
                    </label>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Requests */}
      {requests.length > 0 && (
        <div className="templates-section">
          <h2 className="section-title">Minhas Solicitações</h2>
          <div className="requests-list">
            {requests.map((req) => {
              const statusInfo = getRequestStatusLabel(req.status);
              return (
                <div key={req.id} className="request-card">
                  <div className="request-header">
                    <div>
                      <h3>{req.name}</h3>
                      <span className="template-type">{getTemplateTypeLabel(req.template_type)}</span>
                    </div>
                    <span className={`request-status ${statusInfo.className}`}>
                      <FontAwesomeIcon icon={statusInfo.icon} /> {statusInfo.label}
                    </span>
                  </div>
                  <div className="template-message">
                    <pre>{req.message_template}</pre>
                  </div>
                  {req.admin_notes && (
                    <div className="admin-notes">
                      <strong>Nota do admin:</strong> {req.admin_notes}
                    </div>
                  )}
                  <div className="request-footer">
                    <span className="request-date">
                      Enviado em {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
