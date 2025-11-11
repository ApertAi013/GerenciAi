import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faPaperPlane,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../services/whatsappService';
import type { WhatsAppConfig } from '../types/whatsappTypes';
import PremiumBadge from '../components/chat/PremiumBadge';
import '../styles/WhatsAppConfig.css';

export default function WhatsAppConfig() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await whatsappService.getConfig();
      if (response.status === 'success' && response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
      // Se não tem config, não é erro crítico
      if (error.response?.status !== 404) {
        toast.error('Erro ao verificar status do WhatsApp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) {
      toast.error('WhatsApp não está configurado. Entre em contato com o suporte.');
      return;
    }

    try {
      const newState = !config.is_active;
      const response = await whatsappService.toggleActive(newState);

      if (response.status === 'success') {
        setConfig({ ...config, is_active: newState });
        toast.success(newState ? 'WhatsApp ativado!' : 'WhatsApp desativado!');
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

      if (response.status === 'success') {
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

  const formatPhoneForDisplay = (phone: string) => {
    // Formata para exibição (sem mostrar o número completo por segurança)
    if (phone.length > 4) {
      return `****${phone.slice(-4)}`;
    }
    return phone;
  };

  if (!user || loading) {
    return (
      <div className="whatsapp-config-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  const isConfigured = !!config;
  const isActive = config?.is_active || false;
  const isVerified = config?.is_verified || false;

  return (
    <div className="whatsapp-config-container">
      <div className="config-header">
        <button className="btn-back" onClick={() => navigate('/whatsapp')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div>
          <h1>
            Status da Integração WhatsApp <PremiumBadge />
          </h1>
          <p>Verifique o status e teste o envio de mensagens</p>
        </div>
        {isConfigured && (
          <div className="config-status">
            <label className="toggle-switch">
              <input type="checkbox" checked={isActive} onChange={handleToggleActive} />
              <span className="toggle-slider"></span>
            </label>
            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
              <FontAwesomeIcon icon={isActive ? faCheckCircle : faTimesCircle} />
              {isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        )}
      </div>

      <div className="config-content">
        {/* Status da Integração */}
        {!isConfigured ? (
          <div className="verification-banner not-configured">
            <FontAwesomeIcon icon={faInfoCircle} />
            <div>
              <strong>WhatsApp Não Configurado</strong>
              <p>
                A integração WhatsApp ainda não foi configurada pelo administrador. Entre em contato
                com o suporte para ativar esta funcionalidade.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Banner de Status */}
            <div className={`verification-banner ${isVerified ? 'verified' : 'not-verified'}`}>
              <FontAwesomeIcon icon={isVerified ? faCheckCircle : faTimesCircle} />
              <div>
                <strong>{isVerified ? 'Conexão Verificada' : 'Conexão Não Verificada'}</strong>
                <p>
                  {isVerified
                    ? `Última verificação: ${new Date(config.last_verified_at || '').toLocaleString()}`
                    : 'Envie uma mensagem de teste para verificar a conexão'}
                </p>
              </div>
            </div>

            {/* Informações da Configuração */}
            <div className="config-section">
              <h2>Informações da Integração</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`info-value ${isActive ? 'active' : 'inactive'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Verificado:</span>
                  <span className={`info-value ${isVerified ? 'verified' : 'not-verified'}`}>
                    {isVerified ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone Number ID:</span>
                  <span className="info-value">
                    {formatPhoneForDisplay(config.phone_number_id)}
                  </span>
                </div>
                {config.created_at && (
                  <div className="info-item">
                    <span className="info-label">Configurado em:</span>
                    <span className="info-value">
                      {new Date(config.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Teste de Envio */}
            <div className="config-section test-section">
              <h2>Testar Envio de Mensagem</h2>
              <p>Envie uma mensagem de teste para verificar se a integração está funcionando</p>

              <div className="form-group">
                <label htmlFor="testPhone">Número de Telefone (com DDI)</label>
                <input
                  type="text"
                  id="testPhone"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="5511999999999"
                  disabled={!isActive}
                />
                <small>Formato: código do país + DDD + número (sem espaços ou símbolos)</small>
              </div>

              <button
                className="btn-test"
                onClick={handleSendTest}
                disabled={testing || !isActive}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {testing ? 'Enviando...' : 'Enviar Mensagem de Teste'}
              </button>

              {!isActive && (
                <p className="warning-text">Ative a integração para enviar mensagens de teste</p>
              )}
            </div>

            {/* Informações de Suporte */}
            <div className="config-section support-section">
              <h2>
                <FontAwesomeIcon icon={faInfoCircle} /> Precisa de Ajuda?
              </h2>
              <p>
                Se você está enfrentando problemas com a integração WhatsApp, entre em contato com
                o suporte:
              </p>
              <ul>
                <li>Email: teus.hcp@gmail.com</li>
                <li>Email: samuelfranca.m@gmail.com</li>
              </ul>
              <p className="support-note">
                A configuração técnica do WhatsApp Business API é gerenciada pelo administrador do
                sistema.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
