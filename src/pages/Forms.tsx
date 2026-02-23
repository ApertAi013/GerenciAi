import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faEye, faToggleOn, faToggleOff,
  faFileExport, faSearch, faTimes, faChevronLeft, faChevronRight,
  faClipboardList, faListOl, faCheckDouble, faAlignLeft, faListCheck,
  faUsers, faLayerGroup, faTag, faUserGroup, faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import { formService } from '../services/formService';
import { studentService } from '../services/studentService';
import { financialService } from '../services/financialService';
import type { Form, FormResponse, CreateFormRequest } from '../services/formService';
import toast from 'react-hot-toast';
import '../styles/Forms.css';

const RESPONSE_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Escolha Única',
  multiple_choice: 'Múltipla Escolha',
  text_only: 'Texto Livre',
  choice_with_text: 'Escolha + Texto',
};

const RESPONSE_TYPE_ICONS: Record<string, any> = {
  single_choice: faListOl,
  multiple_choice: faCheckDouble,
  text_only: faAlignLeft,
  choice_with_text: faListCheck,
};

const TARGET_LABELS: Record<string, string> = {
  all: 'Todos os Alunos',
  modality: 'Por Modalidade',
  level: 'Por Nível',
  specific: 'Alunos Específicos',
};

export default function Forms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  // Form modal fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formResponseType, setFormResponseType] = useState<CreateFormRequest['response_type']>('single_choice');
  const [formOptions, setFormOptions] = useState<string[]>(['', '']);
  const [formTargetType, setFormTargetType] = useState('all');
  const [formTargetModalityId, setFormTargetModalityId] = useState<number | null>(null);
  const [formTargetLevel, setFormTargetLevel] = useState('');
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<number[]>([]);
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formAllowMultiple, setFormAllowMultiple] = useState(false);
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [useUrlMode, setUseUrlMode] = useState(false);

  // Targeting data
  const [modalities, setModalities] = useState<Array<{ id: number; name: string }>>([]);
  const [levels, setLevels] = useState<Array<{ id: number; name: string }>>([]);
  const [allStudents, setAllStudents] = useState<Array<{ id: number; full_name: string; email: string }>>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Responses modal
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  useEffect(() => { loadForms(); }, [page]);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const res = await formService.getForms(page, 20);
      if (res.status === 'success') {
        setForms(res.data.forms);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch { toast.error('Erro ao carregar formulários'); }
    finally { setIsLoading(false); }
  };

  const loadTargetingData = async () => {
    try {
      const [modRes, studRes] = await Promise.all([
        financialService.getFilters(),
        studentService.getStudents({ limit: 200 }),
      ]);
      if (modRes.data) {
        setModalities(modRes.data.modalities || []);
        setLevels(modRes.data.levels || []);
      }
      if (studRes.status === 'success') {
        setAllStudents(studRes.data.map((s: any) => ({ id: s.id, full_name: s.full_name, email: s.email })));
      }
    } catch { /* non-critical */ }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingForm(null);
    setFormTitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormResponseType('single_choice');
    setFormOptions(['', '']);
    setFormTargetType('all');
    setFormTargetModalityId(null);
    setFormTargetLevel('');
    setFormTargetStudentIds([]);
    setFormIsRequired(false);
    setFormAllowMultiple(false);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormStartsAt(now.toISOString().slice(0, 16));
    setFormExpiresAt('');
    setShowFormModal(true);
    loadTargetingData();
  };

  // Open edit modal
  const openEditModal = async (form: Form) => {
    try {
      const res = await formService.getFormById(form.id);
      const f = res.data;
      setEditingForm(f);
      setFormTitle(f.title);
      setFormDescription(f.description || '');
      setFormImageUrl(f.image_url || '');
      setFormResponseType(f.response_type);
      setFormOptions(f.options?.map(o => o.label) || ['', '']);
      setFormTargetType(f.target_type);
      setFormTargetModalityId(f.target_modality_id);
      setFormTargetLevel(f.target_level || '');
      setFormTargetStudentIds(f.target_students?.map(s => s.id) || []);
      setFormIsRequired(f.is_required);
      setFormAllowMultiple(f.allow_multiple_submissions);
      setFormStartsAt(f.starts_at ? new Date(f.starts_at).toISOString().slice(0, 16) : '');
      setFormExpiresAt(f.expires_at ? new Date(f.expires_at).toISOString().slice(0, 16) : '');
      setShowFormModal(true);
      loadTargetingData();
    } catch { toast.error('Erro ao carregar formulário'); }
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) { toast.error('Título é obrigatório'); return; }
    if (!formStartsAt) { toast.error('Data de início é obrigatória'); return; }
    const needsOptions = ['single_choice', 'multiple_choice', 'choice_with_text'].includes(formResponseType);
    const validOptions = formOptions.filter(o => o.trim());
    if (needsOptions && validOptions.length < 2) { toast.error('Adicione pelo menos 2 opções'); return; }

    setIsSaving(true);
    try {
      const data: CreateFormRequest = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        image_url: formImageUrl.trim() || undefined,
        response_type: formResponseType,
        target_type: formTargetType,
        target_modality_id: formTargetType === 'modality' ? formTargetModalityId : null,
        target_level: formTargetType === 'level' ? formTargetLevel : null,
        target_student_ids: formTargetType === 'specific' ? formTargetStudentIds : undefined,
        is_required: formIsRequired,
        allow_multiple_submissions: formAllowMultiple,
        starts_at: formStartsAt,
        expires_at: formExpiresAt || null,
        options: needsOptions ? validOptions : [],
      };

      if (editingForm) {
        await formService.updateForm(editingForm.id, data);
        toast.success('Formulário atualizado');
      } else {
        await formService.createForm(data);
        toast.success('Formulário criado');
      }
      setShowFormModal(false);
      loadForms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally { setIsSaving(false); }
  };

  const handleToggleActive = async (form: Form) => {
    try {
      await formService.updateForm(form.id, { is_active: !form.is_active });
      toast.success(form.is_active ? 'Formulário desativado' : 'Formulário ativado');
      loadForms();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const handleDelete = async (form: Form) => {
    if (!confirm(`Excluir "${form.title}"? Todas as respostas serão perdidas.`)) return;
    try {
      await formService.deleteForm(form.id);
      toast.success('Formulário excluído');
      loadForms();
    } catch { toast.error('Erro ao excluir'); }
  };

  // Responses
  const openResponses = async (form: Form) => {
    setSelectedForm(form);
    setResponsesLoading(true);
    setShowResponsesModal(true);
    try {
      const [detailRes, respRes] = await Promise.all([
        formService.getFormById(form.id),
        formService.getFormResponses(form.id, 1, 200),
      ]);
      setSelectedForm(detailRes.data);
      setResponses(respRes.data.responses);
    } catch { toast.error('Erro ao carregar respostas'); }
    finally { setResponsesLoading(false); }
  };

  const handleExportCSV = async (form: Form) => {
    try {
      const blob = await formService.exportFormResponses(form.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formulario_${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_respostas.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exportação concluída');
    } catch { toast.error('Erro ao exportar'); }
  };

  // Preview
  const openPreview = async (form: Form) => {
    try {
      const res = await formService.getFormById(form.id);
      setSelectedForm(res.data);
      setShowPreviewModal(true);
    } catch { toast.error('Erro ao carregar preview'); }
  };

  const filteredStudents = allStudents.filter(s =>
    !studentSearch || s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const isExpired = (form: Form) => form.expires_at && new Date(form.expires_at) < new Date();

  return (
    <div className="forms-container">
      <div className="forms-page-header">
        <div>
          <h1><FontAwesomeIcon icon={faClipboardList} /> Formulários</h1>
          <p className="forms-subtitle">Crie pesquisas e formulários para seus alunos</p>
        </div>
        <button className="btn-create-form" onClick={openCreateModal}>
          <FontAwesomeIcon icon={faPlus} /> Novo Formulário
        </button>
      </div>

      {isLoading ? (
        <div className="forms-loading">Carregando...</div>
      ) : forms.length === 0 ? (
        <div className="forms-empty">
          <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 48, color: '#d1d5db' }} />
          <p>Nenhum formulário criado ainda</p>
          <button className="btn-create-form" onClick={openCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Criar Primeiro Formulário
          </button>
        </div>
      ) : (
        <>
          <div className="forms-grid">
            {forms.map(form => (
              <div key={form.id} className={`form-card ${!form.is_active ? 'inactive' : ''} ${isExpired(form) ? 'expired' : ''}`}>
                <div className="form-card-header">
                  <h3>{form.title}</h3>
                  <div className="form-badges">
                    <span className={`badge badge-type badge-${form.response_type}`}>
                      <FontAwesomeIcon icon={RESPONSE_TYPE_ICONS[form.response_type]} />
                      {RESPONSE_TYPE_LABELS[form.response_type]}
                    </span>
                    {form.is_required && <span className="badge badge-required">Obrigatório</span>}
                    {!form.is_active && <span className="badge badge-inactive">Inativo</span>}
                    {isExpired(form) && <span className="badge badge-expired">Expirado</span>}
                  </div>
                </div>

                {form.description && <p className="form-card-desc">{form.description}</p>}

                <div className="form-card-meta">
                  <span>Destinatários: {TARGET_LABELS[form.target_type]}{form.modality_name ? ` (${form.modality_name})` : ''}</span>
                  <span>Respostas: <strong>{form.response_count || 0}</strong></span>
                  {form.options && form.options.length > 0 && (
                    <span>Opções: {form.options.map(o => o.label).join(', ')}</span>
                  )}
                </div>

                <div className="form-card-dates">
                  <span>Início: {new Date(form.starts_at).toLocaleDateString('pt-BR')}</span>
                  {form.expires_at && <span>Expira: {new Date(form.expires_at).toLocaleDateString('pt-BR')}</span>}
                </div>

                <div className="form-card-actions">
                  <button title="Ver Respostas" onClick={() => openResponses(form)}><FontAwesomeIcon icon={faEye} /></button>
                  <button title="Preview" onClick={() => openPreview(form)}><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                  <button title="Editar" onClick={() => openEditModal(form)}><FontAwesomeIcon icon={faEdit} /></button>
                  <button title={form.is_active ? 'Desativar' : 'Ativar'} onClick={() => handleToggleActive(form)}>
                    <FontAwesomeIcon icon={form.is_active ? faToggleOn : faToggleOff} />
                  </button>
                  <button title="Excluir" className="btn-danger" onClick={() => handleDelete(form)}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="forms-pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /></button>
              <span>Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><FontAwesomeIcon icon={faChevronRight} /></button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="forms-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingForm ? 'Editar Formulário' : 'Novo Formulário'}</h2>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Título *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={200} placeholder="Ex: Compra da Camisa Nova" />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Descreva o formulário..." />
              </div>

              <div className="form-group">
                <label>Imagem (opcional)</label>
                {formImageUrl ? (
                  <div className="image-dropzone-preview">
                    <img src={formImageUrl} alt="Preview" />
                    <button type="button" className="image-remove-btn" onClick={() => setFormImageUrl('')}><FontAwesomeIcon icon={faTimes} /></button>
                  </div>
                ) : isUploadingImage ? (
                  <div className="image-dropzone uploading">
                    <div className="image-uploading-spinner" />
                    <span>Enviando imagem...</span>
                  </div>
                ) : useUrlMode ? (
                  <div>
                    <input type="url" value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} placeholder="https://..." />
                    <button type="button" className="btn-toggle-upload" onClick={() => setUseUrlMode(false)}>Ou arraste uma imagem</button>
                  </div>
                ) : (
                  <div
                    className={`image-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async e => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 2MB.'); return; }
                      if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem.'); return; }
                      setIsUploadingImage(true);
                      try {
                        const url = await formService.uploadImage(file);
                        setFormImageUrl(url);
                      } catch { toast.error('Erro ao enviar imagem'); }
                      finally { setIsUploadingImage(false); }
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (ev) => {
                        const file = (ev.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 2MB.'); return; }
                        setIsUploadingImage(true);
                        try {
                          const url = await formService.uploadImage(file);
                          setFormImageUrl(url);
                        } catch { toast.error('Erro ao enviar imagem'); }
                        finally { setIsUploadingImage(false); }
                      };
                      input.click();
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '1.5rem', color: '#9ca3af' }} />
                    <span>Arraste uma imagem ou clique para selecionar</span>
                    <small>JPEG, PNG, WebP ou GIF (máx. 2MB)</small>
                  </div>
                )}
                {!formImageUrl && !isUploadingImage && !useUrlMode && (
                  <button type="button" className="btn-toggle-upload" onClick={() => setUseUrlMode(true)}>Ou cole uma URL</button>
                )}
              </div>

              <div className="form-group">
                <label>Tipo de Resposta</label>
                <select value={formResponseType} onChange={e => setFormResponseType(e.target.value as any)}>
                  <option value="single_choice">Escolha Única (votação)</option>
                  <option value="multiple_choice">Múltipla Escolha (permite vários votos)</option>
                  <option value="text_only">Texto Livre</option>
                  <option value="choice_with_text">Escolha + Texto</option>
                </select>
              </div>

              {['single_choice', 'multiple_choice', 'choice_with_text'].includes(formResponseType) && (
                <div className="form-group">
                  <label>Opções</label>
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="option-row">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => { const newOpts = [...formOptions]; newOpts[idx] = e.target.value; setFormOptions(newOpts); }}
                        placeholder={`Opção ${idx + 1}`}
                      />
                      {formOptions.length > 2 && (
                        <button className="btn-remove-option" onClick={() => setFormOptions(formOptions.filter((_, i) => i !== idx))}><FontAwesomeIcon icon={faTimes} /></button>
                      )}
                    </div>
                  ))}
                  <button className="btn-add-option" onClick={() => setFormOptions([...formOptions, ''])}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Opção
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>Destinatários</label>
                <select value={formTargetType} onChange={e => setFormTargetType(e.target.value)}>
                  <option value="all">Todos os Alunos</option>
                  <option value="modality">Por Modalidade</option>
                  <option value="level">Por Nível</option>
                  <option value="specific">Alunos Específicos</option>
                </select>
              </div>

              {formTargetType === 'modality' && (
                <div className="form-group">
                  <label>Modalidade</label>
                  <select value={formTargetModalityId || ''} onChange={e => setFormTargetModalityId(Number(e.target.value) || null)}>
                    <option value="">Selecione...</option>
                    {modalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              {formTargetType === 'level' && (
                <div className="form-group">
                  <label>Nível</label>
                  <select value={formTargetLevel} onChange={e => setFormTargetLevel(e.target.value)}>
                    <option value="">Selecione...</option>
                    {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {formTargetType === 'specific' && (
                <div className="form-group">
                  <label>Alunos ({formTargetStudentIds.length} selecionados)</label>
                  <div className="student-search-box">
                    <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Buscar aluno..." />
                  </div>
                  <div className="student-select-list">
                    {filteredStudents.slice(0, 50).map(s => (
                      <label key={s.id} className="student-select-item">
                        <input
                          type="checkbox"
                          checked={formTargetStudentIds.includes(s.id)}
                          onChange={() => {
                            setFormTargetStudentIds(prev =>
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                          }}
                        />
                        <span>{s.full_name}</span>
                        <small>{s.email}</small>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Início *</label>
                  <input type="datetime-local" value={formStartsAt} onChange={e => setFormStartsAt(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Data de Expiração</label>
                  <input type="datetime-local" value={formExpiresAt} onChange={e => setFormExpiresAt(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formIsRequired} onChange={e => setFormIsRequired(e.target.checked)} />
                  Obrigatório
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={formAllowMultiple} onChange={e => setFormAllowMultiple(e.target.checked)} />
                  Permitir múltiplas respostas
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFormModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveForm} disabled={isSaving}>
                {isSaving ? 'Salvando...' : editingForm ? 'Salvar' : 'Criar Formulário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responses Modal */}
      {showResponsesModal && selectedForm && (
        <div className="modal-overlay" onClick={() => setShowResponsesModal(false)}>
          <div className="forms-modal forms-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Respostas: {selectedForm.title}</h2>
              <button className="modal-close" onClick={() => setShowResponsesModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {responsesLoading ? (
                <div className="forms-loading">Carregando respostas...</div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="responses-summary">
                    <div className="summary-total">
                      <strong>{responses.length}</strong> respostas
                    </div>
                    {selectedForm.options && selectedForm.options.length > 0 && selectedForm.option_counts && (
                      <div className="summary-options">
                        {selectedForm.options.map(opt => {
                          const count = selectedForm.option_counts?.[opt.id] || 0;
                          const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                          return (
                            <div key={opt.id} className="option-stat">
                              <div className="option-stat-label">{opt.label}</div>
                              <div className="option-stat-bar">
                                <div className="option-stat-fill" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="option-stat-count">{count} ({pct}%)</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Export */}
                  <div className="responses-actions">
                    <button className="btn-export" onClick={() => handleExportCSV(selectedForm)}>
                      <FontAwesomeIcon icon={faFileExport} /> Exportar CSV
                    </button>
                  </div>

                  {/* Table */}
                  {responses.length === 0 ? (
                    <p className="no-responses">Nenhuma resposta ainda</p>
                  ) : (
                    <div className="responses-table-wrapper">
                      <table className="responses-table">
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Email</th>
                            {selectedForm.response_type !== 'text_only' && <th>Opções</th>}
                            {['text_only', 'choice_with_text'].includes(selectedForm.response_type) && <th>Texto</th>}
                            <th>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {responses.map(r => (
                            <tr key={r.id}>
                              <td>{r.student_name}</td>
                              <td>{r.student_email}</td>
                              {selectedForm.response_type !== 'text_only' && (
                                <td>{r.selected_option_labels?.join(', ') || '-'}</td>
                              )}
                              {['text_only', 'choice_with_text'].includes(selectedForm.response_type) && (
                                <td>{r.text_response || '-'}</td>
                              )}
                              <td>{new Date(r.submitted_at).toLocaleString('pt-BR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedForm && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Preview do Formulário</h2>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>&times;</button>
            </div>
            <div className="preview-phone">
              <div className="preview-phone-content">
                {selectedForm.image_url && (
                  <img src={selectedForm.image_url} alt="" className="preview-image" />
                )}
                <h3 className="preview-title">{selectedForm.title}</h3>
                {selectedForm.description && <p className="preview-desc">{selectedForm.description}</p>}
                {selectedForm.is_required && <span className="preview-required-badge">Obrigatório</span>}

                <div className="preview-options">
                  {selectedForm.response_type === 'text_only' ? (
                    <div className="preview-textarea">Resposta do aluno...</div>
                  ) : (
                    selectedForm.options?.map(opt => (
                      <div key={opt.id} className="preview-option">
                        <span className={`preview-radio ${selectedForm.response_type === 'multiple_choice' || selectedForm.response_type === 'choice_with_text' ? 'checkbox' : ''}`}></span>
                        {opt.label}
                      </div>
                    ))
                  )}
                  {selectedForm.response_type === 'choice_with_text' && (
                    <div className="preview-textarea">Comentário adicional...</div>
                  )}
                </div>

                <div className="preview-submit-btn">Enviar Resposta</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
