import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faPaperPlane,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { WhatsAppConfig } from '../types/whatsappTypes';
import '../styles/WhatsAppConfig.css';

export default function WhatsAppConfig() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form fields
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showWebhookToken, setShowWebhookToken] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await whatsappService.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
        setPhoneNumberId(response.data.phone_number_id || '');
        setBusinessAccountId(response.data.business_account_id || '');
        // Não mostra o token completo por segurança
        setAccessToken('');
        setWebhookVerifyToken('');
      }
    } catch (error: any) {
      // Se não tem config ainda, é normal
      if (error.response?.status !== 404) {
        console.error('Erro ao buscar configuração:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validação
    if (!phoneNumberId.trim()) {
      toast.error('Phone Number ID é obrigatório');
      return;
    }

    if (!accessToken.trim() && !config) {
      toast.error('Access Token é obrigatório na primeira configuração');
      return;
    }

    try {
      setSaving(true);

      const data: any = {
        phoneNumberId: phoneNumberId.trim(),
      };

      if (businessAccountId.trim()) {
        data.businessAccountId = businessAccountId.trim();
      }

      if (accessToken.trim()) {
        data.accessToken = accessToken.trim();
      }

      if (webhookVerifyToken.trim()) {
        data.webhookVerifyToken = webhookVerifyToken.trim();
      }

      const response = await whatsappService.saveConfig(data);

      if (response.success) {
        setConfig(response.data);
        toast.success('Configuração salva com sucesso!');
        // Limpa os campos de senha
        setAccessToken('');
        setWebhookVerifyToken('');
      }
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) {
      toast.error('Configure a API antes de ativar');
      return;
    }

    try {
      const newState = !config.is_active;
      const response = await whatsappService.toggleActive(newState);

      if (response.success) {
        setConfig({ ...config, is_active: newState });
        toast.success(newState ? 'Integração ativada!' : 'Integração desativada!');
      }
    } catch (error: any) {
      console.error('Erro ao alternar estado:', error);
      toast.error(error.response?.data?.message || 'Erro ao alternar estado');
    }
  };

  const handleSendTest = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Digite um número de telefone para teste');
      return;
    }

    // Validação básica do número
    const cleaned = testPhoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      toast.error('Número inválido. Use o formato: 5511999999999');
      return;
    }

    try {
      setTesting(true);
      const response = await whatsappService.sendTest(cleaned);

      if (response.success) {
        toast.success('Mensagem de teste enviada com sucesso!');
        setTestPhoneNumber('');
      }
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <div className="whatsapp-config-container">
        <div className="loading">Faça login para acessar as configurações</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="whatsapp-config-container">
        <div className="loading">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="whatsapp-config-container">
      <div className="config-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>Configuração WhatsApp Business API</h1>
          <p>Configure as credenciais da sua conta WhatsApp Business</p>
        </div>
        {config && (
          <div className="config-status">
            <label className="toggle-switch">
              <input type="checkbox" checked={config.is_active} onChange={handleToggleActive} />
              <span className="toggle-slider"></span>
            </label>
            <span className={`status-badge ${config.is_active ? 'active' : 'inactive'}`}>
              <FontAwesomeIcon icon={config.is_active ? faCheckCircle : faTimesCircle} />
              {config.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        )}
      </div>

      <div className="config-content">
        {/* Status da Verificação */}
        {config && (
          <div className={`verification-banner ${config.is_verified ? 'verified' : 'not-verified'}`}>
            <FontAwesomeIcon icon={config.is_verified ? faCheckCircle : faTimesCircle} />
            <div>
              <strong>
                {config.is_verified ? 'Conexão Verificada' : 'Conexão Não Verificada'}
              </strong>
              <p>
                {config.is_verified
                  ? `Última verificação: ${new Date(config.last_verified_at || '').toLocaleString()}`
                  : 'Envie uma mensagem de teste para verificar a conexão'}
              </p>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="config-section instructions">
          <h2>Como Obter as Credenciais</h2>
          <ol>
            <li>
              Acesse{' '}
              <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">
                Meta for Developers
              </a>
            </li>
            <li>Crie um app ou use um existente</li>
            <li>Adicione o produto "WhatsApp"</li>
            <li>Configure um número de telefone</li>
            <li>Copie o Phone Number ID e o Access Token</li>
          </ol>
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="help-link"
          >
            Ver Tutorial Completo →
          </a>
        </div>

        {/* Formulário de Configuração */}
        <div className="config-section">
          <h2>Credenciais da API</h2>

          <div className="form-group">
            <label htmlFor="phoneNumberId">
              Phone Number ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="phoneNumberId"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
            />
            <small>ID do número de telefone do WhatsApp Business</small>
          </div>

          <div className="form-group">
            <label htmlFor="businessAccountId">Business Account ID</label>
            <input
              type="text"
              id="businessAccountId"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="987654321098765 (opcional)"
            />
            <small>ID da conta business (opcional)</small>
          </div>

          <div className="form-group">
            <label htmlFor="accessToken">
              Access Token {!config && <span className="required">*</span>}
            </label>
            <div className="input-with-icon">
              <input
                type={showAccessToken ? 'text' : 'password'}
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={config ? 'Deixe vazio para manter o atual' : 'EAAxxxxxxxxxx...'}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAccessToken(!showAccessToken)}
              >
                <FontAwesomeIcon icon={showAccessToken ? faEyeSlash : faEye} />
              </button>
            </div>
            <small>Token permanente de acesso à API</small>
          </div>

          <div className="form-group">
            <label htmlFor="webhookVerifyToken">Webhook Verify Token</label>
            <div className="input-with-icon">
              <input
                type={showWebhookToken ? 'text' : 'password'}
                id="webhookVerifyToken"
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                placeholder="meu_token_secreto_123 (opcional)"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowWebhookToken(!showWebhookToken)}
              >
                <FontAwesomeIcon icon={showWebhookToken ? faEyeSlash : faEye} />
              </button>
            </div>
            <small>Token para verificação do webhook (opcional)</small>
          </div>

          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>

        {/* Teste de Conexão */}
        {config && (
          <div className="config-section test-section">
            <h2>Testar Conexão</h2>
            <p>Envie uma mensagem de teste para verificar se a integração está funcionando</p>

            <div className="form-group">
              <label htmlFor="testPhone">Número de Telefone (com DDI)</label>
              <input
                type="text"
                id="testPhone"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="5511999999999"
              />
              <small>Formato: código do país + DDD + número (sem espaços ou símbolos)</small>
            </div>

            <button
              className="btn-test"
              onClick={handleSendTest}
              disabled={testing || !config.is_active}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              {testing ? 'Enviando...' : 'Enviar Mensagem de Teste'}
            </button>

            {!config.is_active && (
              <p className="warning-text">Ative a integração para enviar mensagens de teste</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
