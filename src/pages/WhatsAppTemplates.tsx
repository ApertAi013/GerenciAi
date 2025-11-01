import { useState, useEffect } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { WhatsAppTemplate, TemplateType } from '../types/whatsappTypes';
import { TEMPLATE_VARIABLES } from '../types/whatsappTypes';
import '../styles/WhatsAppTemplates.css';

export default function WhatsAppTemplates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'due_reminder' as TemplateType,
    message_template: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await whatsappService.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingId(template.id!);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      message_template: template.message_template,
      is_active: template.is_active,
    });
  };

  const handleNew = () => {
    setEditingId('new');
    setFormData({
      name: '',
      template_type: 'due_reminder',
      message_template: '',
      is_active: true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      template_type: 'due_reminder',
      message_template: '',
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.message_template.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    try {
      if (editingId === 'new') {
        const response = await whatsappService.createTemplate({
          name: formData.name,
          templateType: formData.template_type,
          messageTemplate: formData.message_template,
          isActive: formData.is_active,
        });
        if (response.success) {
          toast.success('Template criado com sucesso!');
          fetchTemplates();
          handleCancel();
        }
      } else if (typeof editingId === 'number') {
        const response = await whatsappService.updateTemplate(editingId, {
          name: formData.name,
          messageTemplate: formData.message_template,
          isActive: formData.is_active,
        });
        if (response.success) {
          toast.success('Template atualizado com sucesso!');
          fetchTemplates();
          handleCancel();
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar template');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o template "${name}"?`)) {
      return;
    }

    try {
      const response = await whatsappService.deleteTemplate(id);
      if (response.success) {
        toast.success('Template deletado com sucesso!');
        fetchTemplates();
      }
    } catch (error: any) {
      console.error('Erro ao deletar template:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar template');
    }
  };

  const getTemplateTypeLabel = (type: TemplateType) => {
    switch (type) {
      case 'due_reminder':
        return 'Lembrete de Vencimento';
      case 'overdue_reminder':
        return 'Lembrete de Atraso';
      case 'payment_confirmation':
        return 'Confirmação de Pagamento';
      default:
        return type;
    }
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      message_template: formData.message_template + variable,
    });
  };

  const availableVariables = TEMPLATE_VARIABLES.filter((v) =>
    v.availableFor.includes(formData.template_type)
  );

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

  return (
    <div className="whatsapp-templates-container">
      <div className="templates-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>Templates de Mensagens</h1>
          <p>Gerencie os templates de mensagens do WhatsApp</p>
        </div>
        <button className="btn-new" onClick={handleNew}>
          <FontAwesomeIcon icon={faPlus} /> Novo Template
        </button>
      </div>

      {/* Form de Edição/Criação */}
      {editingId && (
        <div className="template-form">
          <h2>{editingId === 'new' ? 'Novo Template' : 'Editar Template'}</h2>

          <div className="form-group">
            <label>Nome do Template</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Lembrete Personalizado"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Template</label>
            <select
              value={formData.template_type}
              onChange={(e) => setFormData({ ...formData, template_type: e.target.value as TemplateType })}
              disabled={editingId !== 'new'}
            >
              <option value="due_reminder">Lembrete de Vencimento</option>
              <option value="overdue_reminder">Lembrete de Atraso</option>
              <option value="payment_confirmation">Confirmação de Pagamento</option>
            </select>
            {editingId !== 'new' && <small>O tipo não pode ser alterado após criação</small>}
          </div>

          <div className="form-group">
            <label>Mensagem</label>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              placeholder="Digite a mensagem com as variáveis"
              rows={8}
            />
            <small>Use as variáveis abaixo para personalizar a mensagem</small>
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

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Template ativo
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCancel}>
              <FontAwesomeIcon icon={faTimes} /> Cancelar
            </button>
            <button className="btn-save" onClick={handleSave}>
              <FontAwesomeIcon icon={faSave} /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Templates */}
      <div className="templates-list">
        {templates.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum template cadastrado</p>
            <button className="btn-new" onClick={handleNew}>
              <FontAwesomeIcon icon={faPlus} /> Criar Primeiro Template
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className={`template-card ${template.is_active ? 'active' : 'inactive'}`}>
              <div className="template-header">
                <div>
                  <h3>{template.name}</h3>
                  <span className="template-type">{getTemplateTypeLabel(template.template_type)}</span>
                </div>
                <div className="template-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleEdit(template)}
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(template.id!, template.name)}
                    title="Deletar"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
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
  );
}
