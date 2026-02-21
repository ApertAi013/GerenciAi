import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faReceipt,
  faPercent,
  faBullseye,
  faQrcode,
  faSync,
  faCheck,
  faTimes,
  faClock,
  faExclamationTriangle,
  faFileInvoice,
  faArrowRight,
  faCopy,
  faMobileAlt,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { appPaymentService } from '../services/appPaymentService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import type {
  AppPaymentConfig,
  FeeBreakdown,
  AppPaymentCharge,
  PixKeyType,
  ScopeType,
  AsaasChargeStatus,
} from '../types/appPaymentTypes';
import '../styles/AppPayments.css';

const PIX_KEY_TYPE_OPTIONS: { value: PixKeyType; label: string }[] = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'EVP', label: 'Chave Aleatória' },
];

const SCOPE_OPTIONS: { value: ScopeType; label: string; description: string }[] = [
  { value: 'all', label: 'Todos os alunos', description: 'Todos os alunos ativos terão acesso ao pagamento via app' },
  { value: 'classes', label: 'Turmas específicas', description: 'Apenas alunos das turmas selecionadas' },
  { value: 'students', label: 'Alunos específicos', description: 'Apenas os alunos selecionados' },
];

type TabKey = 'config' | 'fees' | 'scope' | 'charges';

const TABS: { key: TabKey; label: string; icon: typeof faCog }[] = [
  { key: 'config', label: 'Configuração PIX', icon: faCog },
  { key: 'fees', label: 'Taxas e Termos', icon: faPercent },
  { key: 'scope', label: 'Escopo', icon: faBullseye },
  { key: 'charges', label: 'Cobranças', icon: faReceipt },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function getStatusConfig(status: AsaasChargeStatus): { label: string; color: string; icon: typeof faCheck } {
  const map: Record<string, { label: string; color: string; icon: typeof faCheck }> = {
    PENDING: { label: 'Pendente', color: '#f59e0b', icon: faClock },
    RECEIVED: { label: 'Recebido', color: '#10b981', icon: faCheck },
    CONFIRMED: { label: 'Confirmado', color: '#10b981', icon: faCheck },
    OVERDUE: { label: 'Vencido', color: '#ef4444', icon: faExclamationTriangle },
    REFUNDED: { label: 'Estornado', color: '#6b7280', icon: faTimes },
    REFUND_REQUESTED: { label: 'Estorno Solicitado', color: '#f59e0b', icon: faClock },
    REFUND_IN_PROGRESS: { label: 'Estorno em Andamento', color: '#f59e0b', icon: faClock },
  };
  return map[status] || { label: status, color: '#6b7280', icon: faClock };
}

function getTransferStatusConfig(status: string | null): { label: string; color: string } {
  if (!status) return { label: '-', color: '#6b7280' };
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendente', color: '#f59e0b' },
    DONE: { label: 'Repassado', color: '#10b981' },
    CANCELLED: { label: 'Cancelado', color: '#6b7280' },
    FAILED: { label: 'Falhou', color: '#ef4444' },
  };
  return map[status] || { label: status, color: '#6b7280' };
}

export default function AppPayments() {
  const [activeTab, setActiveTab] = useState<TabKey>('config');
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<AppPaymentConfig | null>(null);
  const [fees, setFees] = useState<FeeBreakdown | null>(null);
  const [charges, setCharges] = useState<AppPaymentCharge[]>([]);

  // Config form
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF');
  const [pixKeyHolderName, setPixKeyHolderName] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Scope form
  const [scopeType, setScopeType] = useState<ScopeType>('all');
  const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [availableStudents, setAvailableStudents] = useState<Array<{ id: number; full_name: string }>>([]);
  const [savingScope, setSavingScope] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Charges filters
  const [chargeStatusFilter, setChargeStatusFilter] = useState('');
  const [chargeMonthFilter, setChargeMonthFilter] = useState('');
  const [generatingBulk, setGeneratingBulk] = useState(false);

  // Detail modal
  const [selectedCharge, setSelectedCharge] = useState<AppPaymentCharge | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const response = await appPaymentService.getConfig();
      const data = response.data;
      setConfig(data);

      if (data.configured) {
        setPixKey(data.pix_key || '');
        setPixKeyType(data.pix_key_type || 'CPF');
        setPixKeyHolderName(data.pix_key_holder_name || '');
        setScopeType(data.scope_type || 'all');
        setSelectedEntityIds(data.scope_entries?.map(e => e.entity_id) || []);
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
    }
  }, []);

  const loadFees = useCallback(async () => {
    try {
      const response = await appPaymentService.getFees();
      setFees(response.data);
    } catch (error: any) {
      console.error('Error loading fees:', error);
    }
  }, []);

  const loadCharges = useCallback(async () => {
    try {
      const params: { status?: string; reference_month?: string } = {};
      if (chargeStatusFilter) params.status = chargeStatusFilter;
      if (chargeMonthFilter) params.reference_month = chargeMonthFilter;
      const response = await appPaymentService.getCharges(params);
      setCharges(response.data);
    } catch (error: any) {
      console.error('Error loading charges:', error);
    }
  }, [chargeStatusFilter, chargeMonthFilter]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadConfig(), loadFees()]);
      setIsLoading(false);
    };
    init();
  }, [loadConfig, loadFees]);

  useEffect(() => {
    if (activeTab === 'charges') {
      loadCharges();
    }
  }, [activeTab, loadCharges]);

  useEffect(() => {
    if (activeTab === 'scope') {
      if (scopeType === 'classes' && availableClasses.length === 0) {
        classService.getClasses({ limit: 500 }).then(res => {
          const classes = res.data || [];
          setAvailableClasses(classes.map((c: any) => ({
            id: c.id,
            name: c.name || c.modality_name || `Turma ${c.id}`,
          })));
        }).catch(() => {});
      }
      if (scopeType === 'students' && availableStudents.length === 0) {
        studentService.getAllStudents().then(res => {
          setAvailableStudents(res.data || []);
        }).catch(() => {});
      }
    }
  }, [activeTab, scopeType, availableClasses.length, availableStudents.length]);

  const handleSavePixKey = async () => {
    if (!pixKey.trim()) {
      toast.error('Informe a chave PIX');
      return;
    }

    setSavingConfig(true);
    try {
      await appPaymentService.setupPixKey({
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType,
        pix_key_holder_name: pixKeyHolderName.trim() || undefined,
      });
      toast.success('Chave PIX configurada com sucesso!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar chave PIX');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      await appPaymentService.acceptTerms();
      toast.success('Termos aceitos!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao aceitar termos');
    }
  };

  const handleToggleEnabled = async () => {
    if (!config?.configured) {
      toast.error('Configure a chave PIX primeiro');
      return;
    }

    try {
      await appPaymentService.updateConfig({ is_enabled: !config.is_enabled });
      toast.success(config.is_enabled ? 'Pagamentos via app desabilitados' : 'Pagamentos via app habilitados!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configuração');
    }
  };

  const handleToggleCreditCard = async () => {
    try {
      await appPaymentService.updateConfig({ credit_card_enabled: !config?.credit_card_enabled });
      toast.success(config?.credit_card_enabled ? 'Cartao de credito desabilitado' : 'Cartao de credito habilitado!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configuração');
    }
  };

  const handleUpdateFeeMode = async (mode: 'absorb' | 'pass_to_student') => {
    try {
      await appPaymentService.updateConfig({ credit_card_fee_mode: mode });
      toast.success('Modo de taxa atualizado!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar modo de taxa');
    }
  };

  const handleSaveScope = async () => {
    if (scopeType !== 'all' && selectedEntityIds.length === 0) {
      toast.error(`Selecione pelo menos uma ${scopeType === 'classes' ? 'turma' : 'aluno'}`);
      return;
    }

    setSavingScope(true);
    try {
      await appPaymentService.updateScope({
        scope_type: scopeType,
        entity_ids: scopeType === 'all' ? [] : selectedEntityIds,
      });
      toast.success('Escopo atualizado!');
      await loadConfig();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar escopo');
    } finally {
      setSavingScope(false);
    }
  };

  const handleGenerateBulk = async () => {
    if (!chargeMonthFilter) {
      toast.error('Selecione o mês de referência');
      return;
    }

    setGeneratingBulk(true);
    try {
      const response = await appPaymentService.generateBulkCharges({ reference_month: chargeMonthFilter });
      const data = response.data;
      toast.success(`${data.generated} cobranças geradas, ${data.skipped} ignoradas`);
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} erros. Verifique CPF dos alunos.`);
      }
      await loadCharges();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao gerar cobranças');
    } finally {
      setGeneratingBulk(false);
    }
  };

  const handleRefreshCharge = async (chargeId: number) => {
    try {
      await appPaymentService.refreshChargeStatus(chargeId);
      toast.success('Status atualizado!');
      await loadCharges();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const handleCopyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código PIX copiado!');
  };

  const toggleEntitySelection = (id: number) => {
    setSelectedEntityIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const getCurrentMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="app-payments-page">
        <div className="page-header">
          <h1><FontAwesomeIcon icon={faMobileAlt} /> Pagamento via App</h1>
        </div>
        <div className="app-payments-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app-payments-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faMobileAlt} /> Pagamento via App</h1>
        <p className="page-subtitle">Configure pagamentos via PIX no aplicativo dos seus alunos</p>
      </div>

      {/* Status banner */}
      {config?.configured && (
        <div className={`app-payments-status-banner ${config.is_enabled ? 'enabled' : 'disabled'}`}>
          <div className="status-info">
            <FontAwesomeIcon icon={config.is_enabled ? faCheck : faTimes} />
            <span>
              {config.is_enabled
                ? 'Pagamentos via app habilitados'
                : 'Pagamentos via app desabilitados'}
            </span>
          </div>
          <button
            className={`btn-toggle ${config.is_enabled ? 'active' : ''}`}
            onClick={handleToggleEnabled}
          >
            {config.is_enabled ? 'Desabilitar' : 'Habilitar'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="app-payments-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="app-payments-content">
        {/* ============ CONFIG TAB ============ */}
        {activeTab === 'config' && (
          <div className="tab-panel">
            <h2>Configuração da Chave PIX</h2>
            <p className="tab-description">
              Configure a chave PIX onde você deseja receber os pagamentos dos alunos.
              O valor será recebido pela plataforma e repassado para esta conta após descontar as taxas.
            </p>

            <div className="config-form">
              <div className="form-group">
                <label>Tipo da Chave PIX</label>
                <select
                  value={pixKeyType}
                  onChange={e => setPixKeyType(e.target.value as PixKeyType)}
                >
                  {PIX_KEY_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Chave PIX</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === 'CPF' ? '000.000.000-00' :
                    pixKeyType === 'CNPJ' ? '00.000.000/0001-00' :
                    pixKeyType === 'EMAIL' ? 'email@exemplo.com' :
                    pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                    'Chave aleatória'
                  }
                />
              </div>

              <div className="form-group">
                <label>Nome do Titular (opcional)</label>
                <input
                  type="text"
                  value={pixKeyHolderName}
                  onChange={e => setPixKeyHolderName(e.target.value)}
                  placeholder="Nome completo do titular da conta"
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleSavePixKey}
                disabled={savingConfig}
              >
                {savingConfig ? 'Salvando...' : config?.configured ? 'Atualizar Chave PIX' : 'Cadastrar Chave PIX'}
              </button>
            </div>

            {config?.configured && config.pix_key && (
              <div className="config-summary">
                <h3>Chave PIX Atual</h3>
                <div className="summary-row">
                  <span>Tipo:</span>
                  <strong>{PIX_KEY_TYPE_OPTIONS.find(o => o.value === config.pix_key_type)?.label}</strong>
                </div>
                <div className="summary-row">
                  <span>Chave:</span>
                  <strong>{config.pix_key}</strong>
                </div>
                {config.pix_key_holder_name && (
                  <div className="summary-row">
                    <span>Titular:</span>
                    <strong>{config.pix_key_holder_name}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Credit Card Configuration */}
            {config?.configured && (
              <div className="credit-card-config">
                <h2>Cartao de Credito</h2>
                <p className="tab-description">
                  Habilite pagamento via cartao de credito no app dos alunos. Os alunos poderao pagar mensalidades e ativar cobranca recorrente automatica.
                </p>

                <div className="credit-card-toggle">
                  <div className="toggle-info">
                    <FontAwesomeIcon icon={faCreditCard} />
                    <div>
                      <span className="toggle-label">Pagamento via Cartao de Credito</span>
                      <span className="toggle-description">
                        {config.credit_card_enabled
                          ? 'Alunos podem pagar com cartao no app'
                          : 'Desabilitado - apenas PIX disponivel'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`btn-toggle ${config.credit_card_enabled ? 'active' : ''}`}
                    onClick={handleToggleCreditCard}
                  >
                    {config.credit_card_enabled ? 'Desabilitar' : 'Habilitar'}
                  </button>
                </div>

                {config.credit_card_enabled && (
                  <div className="fee-mode-selector">
                    <label>Modo de Taxa do Cartao</label>
                    <div className="fee-mode-options">
                      <label className={`fee-mode-option ${config.credit_card_fee_mode === 'absorb' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="fee_mode"
                          value="absorb"
                          checked={config.credit_card_fee_mode === 'absorb'}
                          onChange={() => handleUpdateFeeMode('absorb')}
                        />
                        <div>
                          <strong>Absorver taxas</strong>
                          <span>Voce arca com as taxas do cartao. O aluno paga o valor cheio da mensalidade.</span>
                        </div>
                      </label>
                      <label className={`fee-mode-option ${config.credit_card_fee_mode === 'pass_to_student' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="fee_mode"
                          value="pass_to_student"
                          checked={config.credit_card_fee_mode === 'pass_to_student'}
                          onChange={() => handleUpdateFeeMode('pass_to_student')}
                        />
                        <div>
                          <strong>Repassar ao aluno</strong>
                          <span>As taxas do cartao sao adicionadas ao valor da mensalidade do aluno.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ FEES TAB ============ */}
        {activeTab === 'fees' && (
          <div className="tab-panel">
            <h2>Taxas e Termos</h2>
            <p className="tab-description">
              Entenda as taxas aplicadas sobre os pagamentos realizados via app.
            </p>

            {fees && (
              <>
                <div className="fees-card">
                  <h3>Composição das Taxas</h3>
                  <div className="fee-row">
                    <span>Taxa Gateway (ASAAS)</span>
                    <strong>{fees.asaas_fee_percent.toFixed(2)}%</strong>
                  </div>
                  <div className="fee-row">
                    <span>Taxa Plataforma (GerenciAi)</span>
                    <strong>{fees.platform_fee_percent.toFixed(2)}%</strong>
                  </div>
                  <div className="fee-row total">
                    <span>Total de Taxas</span>
                    <strong>{fees.total_fee_percent.toFixed(2)}%</strong>
                  </div>
                </div>

                <div className="fees-example">
                  <h3>Exemplo: Mensalidade de R$ {fees.example.gross.toFixed(2)}</h3>
                  <div className="example-flow">
                    <div className="flow-item">
                      <span className="flow-label">Aluno paga</span>
                      <span className="flow-value gross">R$ {fees.example.gross.toFixed(2)}</span>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="flow-arrow" />
                    <div className="flow-item">
                      <span className="flow-label">Taxa ASAAS</span>
                      <span className="flow-value fee">- R$ {fees.example.asaas_fee.toFixed(2)}</span>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="flow-arrow" />
                    <div className="flow-item">
                      <span className="flow-label">Taxa GerenciAi</span>
                      <span className="flow-value fee">- R$ {fees.example.platform_fee.toFixed(2)}</span>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="flow-arrow" />
                    <div className="flow-item">
                      <span className="flow-label">Você recebe</span>
                      <span className="flow-value net">R$ {fees.example.net.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="terms-section">
                  <h3>Aceitar Termos</h3>
                  {config?.accepted_terms_at ? (
                    <div className="terms-accepted">
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Termos aceitos em {new Date(config.accepted_terms_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ) : (
                    <div className="terms-pending">
                      <p>
                        Ao habilitar pagamentos via app, você concorda que as taxas acima serão descontadas
                        automaticamente de cada pagamento recebido. O valor líquido será transferido para sua
                        chave PIX cadastrada.
                      </p>
                      <button className="btn-primary" onClick={handleAcceptTerms}>
                        Aceitar Termos e Taxas
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ SCOPE TAB ============ */}
        {activeTab === 'scope' && (
          <div className="tab-panel">
            <h2>Escopo dos Pagamentos</h2>
            <p className="tab-description">
              Defina quais alunos terão acesso ao pagamento via app.
            </p>

            <div className="scope-options">
              {SCOPE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`scope-option ${scopeType === opt.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="scope_type"
                    value={opt.value}
                    checked={scopeType === opt.value}
                    onChange={() => {
                      setScopeType(opt.value);
                      setSelectedEntityIds([]);
                    }}
                  />
                  <div>
                    <strong>{opt.label}</strong>
                    <span>{opt.description}</span>
                  </div>
                </label>
              ))}
            </div>

            {scopeType === 'classes' && (
              <div className="entity-selector">
                <h3>Selecione as Turmas</h3>
                <div className="entity-list">
                  {availableClasses.map(cls => (
                    <label key={cls.id} className={`entity-item ${selectedEntityIds.includes(cls.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedEntityIds.includes(cls.id)}
                        onChange={() => toggleEntitySelection(cls.id)}
                      />
                      <span>{cls.name}</span>
                    </label>
                  ))}
                  {availableClasses.length === 0 && (
                    <p className="empty-msg">Carregando turmas...</p>
                  )}
                </div>
              </div>
            )}

            {scopeType === 'students' && (
              <div className="entity-selector">
                <h3>Selecione os Alunos</h3>
                <input
                  type="text"
                  className="entity-search"
                  placeholder="Buscar aluno por nome..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                {selectedEntityIds.length > 0 && (
                  <p className="selected-count">{selectedEntityIds.length} aluno(s) selecionado(s)</p>
                )}
                <div className="entity-list">
                  {availableStudents
                    .filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map(student => (
                    <label key={student.id} className={`entity-item ${selectedEntityIds.includes(student.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedEntityIds.includes(student.id)}
                        onChange={() => toggleEntitySelection(student.id)}
                      />
                      <span>{student.full_name}</span>
                    </label>
                  ))}
                  {availableStudents.length === 0 && (
                    <p className="empty-msg">Carregando alunos...</p>
                  )}
                  {availableStudents.length > 0 && availableStudents.filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                    <p className="empty-msg">Nenhum aluno encontrado</p>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSaveScope}
              disabled={savingScope}
            >
              {savingScope ? 'Salvando...' : 'Salvar Escopo'}
            </button>
          </div>
        )}

        {/* ============ CHARGES TAB ============ */}
        {activeTab === 'charges' && (
          <div className="tab-panel">
            <h2>Cobranças via App</h2>

            <div className="charges-toolbar">
              <div className="charges-filters">
                <select
                  value={chargeStatusFilter}
                  onChange={e => setChargeStatusFilter(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="PENDING">Pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="OVERDUE">Vencido</option>
                  <option value="REFUNDED">Estornado</option>
                </select>

                <input
                  type="month"
                  value={chargeMonthFilter}
                  onChange={e => setChargeMonthFilter(e.target.value)}
                  placeholder="Mês referência"
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleGenerateBulk}
                disabled={generatingBulk || !chargeMonthFilter}
                title={!chargeMonthFilter ? 'Selecione o mês de referência' : ''}
              >
                <FontAwesomeIcon icon={faFileInvoice} />
                {generatingBulk ? 'Gerando...' : 'Gerar Cobranças do Mês'}
              </button>
            </div>

            {charges.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faQrcode} />
                <p>Nenhuma cobrança encontrada</p>
                <span>Selecione um mês e clique em "Gerar Cobranças do Mês" para começar</span>
              </div>
            ) : (
              <div className="charges-table-wrapper">
                <table className="charges-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Mês Ref.</th>
                      <th>Valor</th>
                      <th>Status Pagamento</th>
                      <th>Status Repasse</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map(charge => {
                      const statusCfg = getStatusConfig(charge.asaas_status);
                      const transferCfg = getTransferStatusConfig(charge.transfer_status);
                      return (
                        <tr key={charge.id}>
                          <td className="td-student">{charge.student_name}</td>
                          <td>{charge.reference_month}</td>
                          <td>{formatCurrency(charge.gross_amount_cents)}</td>
                          <td>
                            <span className="status-badge" style={{ background: statusCfg.color }}>
                              <FontAwesomeIcon icon={statusCfg.icon} />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td>
                            <span className="status-badge" style={{ background: transferCfg.color }}>
                              {transferCfg.label}
                            </span>
                          </td>
                          <td className="td-actions">
                            <button
                              className="btn-icon"
                              onClick={() => setSelectedCharge(charge)}
                              title="Ver detalhes"
                            >
                              <FontAwesomeIcon icon={faQrcode} />
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleRefreshCharge(charge.id)}
                              title="Atualizar status"
                            >
                              <FontAwesomeIcon icon={faSync} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charge Detail Modal */}
      {selectedCharge && (
        <div className="modal-overlay" onClick={() => setSelectedCharge(null)}>
          <div className="modal-content charge-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Cobrança</h2>
              <button className="btn-close" onClick={() => setSelectedCharge(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="charge-detail-body">
              <div className="detail-row">
                <span>Aluno:</span>
                <strong>{selectedCharge.student_name}</strong>
              </div>
              <div className="detail-row">
                <span>Mês Referência:</span>
                <strong>{selectedCharge.reference_month}</strong>
              </div>
              <div className="detail-row">
                <span>Valor Bruto:</span>
                <strong>{formatCurrency(selectedCharge.gross_amount_cents)}</strong>
              </div>
              <div className="detail-row">
                <span>Taxa ASAAS:</span>
                <strong className="fee-text">{formatCurrency(selectedCharge.asaas_fee_cents)}</strong>
              </div>
              <div className="detail-row">
                <span>Taxa Plataforma:</span>
                <strong className="fee-text">{formatCurrency(selectedCharge.platform_fee_cents)}</strong>
              </div>
              <div className="detail-row">
                <span>Valor Líquido:</span>
                <strong className="net-text">{formatCurrency(selectedCharge.net_amount_cents)}</strong>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span
                  className="status-badge"
                  style={{ background: getStatusConfig(selectedCharge.asaas_status).color }}
                >
                  {getStatusConfig(selectedCharge.asaas_status).label}
                </span>
              </div>
              <div className="detail-row">
                <span>Repasse:</span>
                <span
                  className="status-badge"
                  style={{ background: getTransferStatusConfig(selectedCharge.transfer_status).color }}
                >
                  {getTransferStatusConfig(selectedCharge.transfer_status).label}
                </span>
              </div>

              {selectedCharge.pix_qr_code && (
                <div className="pix-section">
                  <h3>PIX</h3>
                  {selectedCharge.pix_qr_code_image && (
                    <img
                      src={`data:image/png;base64,${selectedCharge.pix_qr_code_image}`}
                      alt="QR Code PIX"
                      className="pix-qr-image"
                    />
                  )}
                  <div className="pix-code-row">
                    <code className="pix-code">{selectedCharge.pix_qr_code.substring(0, 50)}...</code>
                    <button
                      className="btn-icon"
                      onClick={() => handleCopyPixCode(selectedCharge.pix_qr_code)}
                      title="Copiar código"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
