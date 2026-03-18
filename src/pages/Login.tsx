import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authService } from '../services/authService';
import '../styles/Login.css';

interface SavedAccount {
  email: string;
  name: string;
  token?: string;
  user?: any;
}

function getSavedAccounts(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem('savedAccounts') || '[]');
  } catch {
    return [];
  }
}

function saveAccount(email: string, name: string, token: string, user: any) {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  accounts.unshift({ email, name, token, user });
  localStorage.setItem('savedAccounts', JSON.stringify(accounts.slice(0, 5)));
}

function updateAccountToken(email: string) {
  const accounts = getSavedAccounts().map((a) =>
    a.email === email ? { email: a.email, name: a.name } : a
  );
  localStorage.setItem('savedAccounts', JSON.stringify(accounts));
}

function removeAccount(email: string) {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  localStorage.setItem('savedAccounts', JSON.stringify(accounts));
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const passwordRef = useRef<HTMLInputElement>(null);
  const logoSrc = theme === 'dark' ? '/arenai-logo-white.svg' : '/arenai-logo.svg';

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [autoLoginEmail, setAutoLoginEmail] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<any[] | null>(null);
  const [roleToken, setRoleToken] = useState<string | null>(null);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  const selectAccount = async (account: SavedAccount) => {
    setError('');

    // Se tem token salvo, tenta login instantâneo
    if (account.token && account.user) {
      setAutoLoginEmail(account.email);
      try {
        // Temporariamente seta o token para o axios interceptor usar
        localStorage.setItem('token', account.token);

        // Verifica se o token ainda é válido
        const meRes = await authService.getMe();

        if (meRes.status === 'success' && meRes.data) {
          // Token válido — login instantâneo
          localStorage.setItem('keepLoggedIn', 'true');
          setAuth(meRes.data, account.token);

          // Atualiza conta salva com dados frescos
          saveAccount(account.email, meRes.data.full_name || meRes.data.name || account.name, account.token, meRes.data);
          setSavedAccounts(getSavedAccounts());

          toast.success(`Bem-vindo, ${(meRes.data.full_name || account.name).split(' ')[0]}!`);
          navigate('/dashboard');
          return;
        }
      } catch {
        // Token expirado/inválido — limpa e pede senha
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateAccountToken(account.email);
        setSavedAccounts(getSavedAccounts());
        toast.error('Sessão expirada. Digite sua senha.');
      } finally {
        setAutoLoginEmail(null);
      }
    }

    // Fallback: preenche email e foca na senha
    setEmail(account.email);
    setPassword('');
    setTimeout(() => passwordRef.current?.focus(), 50);
  };

  const handleRemoveAccount = (e: React.MouseEvent, accountEmail: string) => {
    e.stopPropagation();
    removeAccount(accountEmail);
    setSavedAccounts(getSavedAccounts());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      const isSuccess = response.status === 'success' || (response as any).success === true;

      if (isSuccess) {
        // Check if multi-role selection needed
        if (response.data.requires_role_selection) {
          setAvailableRoles(response.data.available_roles);
          setRoleToken(response.data.token);
          return;
        }

        if (keepLoggedIn) {
          localStorage.setItem('keepLoggedIn', 'true');
        } else {
          localStorage.removeItem('keepLoggedIn');
        }

        const user = response.data.user;
        const token = response.data.token;

        saveAccount(email, user.full_name || user.name || user.email, token, user);
        setSavedAccounts(getSavedAccounts());

        setAuth(user, token);

        toast.success('Login realizado com sucesso!');

        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setError('Email ou senha inválidos');
        toast.error('Email ou senha inválidos');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (selectedRole: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authService.login({ email, password, selected_role: selectedRole });
      if (response.status === 'success' && response.data.user) {
        const user = response.data.user;
        const token = response.data.token;

        if (keepLoggedIn) localStorage.setItem('keepLoggedIn', 'true');
        saveAccount(email, user.full_name || user.email, token, user);
        setSavedAccounts(getSavedAccounts());
        setAuth(user, token);

        toast.success('Login realizado com sucesso!');
        setAvailableRoles(null);
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao selecionar perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logoSrc} alt="ArenaAi" className="login-logo" />
          <h2>Bem-vindo de volta</h2>
          <p>Faça login para acessar o sistema</p>
        </div>

        {savedAccounts.length > 0 && (
          <div className="saved-accounts">
            <span className="saved-accounts-label">Contas salvas</span>
            <div className="saved-accounts-list">
              {savedAccounts.map((account) => (
                <div
                  key={account.email}
                  className={`saved-account-item${email === account.email ? ' active' : ''}${autoLoginEmail === account.email ? ' logging-in' : ''}${account.token ? ' has-token' : ''}`}
                  onClick={() => !autoLoginEmail && selectAccount(account)}
                >
                  <div className="saved-account-avatar">
                    {autoLoginEmail === account.email ? (
                      <span className="saved-account-spinner" />
                    ) : (
                      getInitials(account.name)
                    )}
                  </div>
                  <div className="saved-account-info">
                    <span className="saved-account-name">{account.name}</span>
                    <span className="saved-account-email">
                      {autoLoginEmail === account.email
                        ? 'Entrando...'
                        : account.token
                          ? 'Clique para entrar'
                          : account.email}
                    </span>
                  </div>
                  {!autoLoginEmail && (
                    <button
                      className="saved-account-remove"
                      onClick={(e) => handleRemoveAccount(e, account.email)}
                      title="Remover conta salva"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        {availableRoles ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
              Como deseja entrar?
            </h3>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', margin: 0 }}>
              Sua conta possui mais de um perfil. Selecione:
            </p>
            {availableRoles.map((r: any, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectRole(r.role)}
                disabled={isLoading}
                style={{
                  padding: '1rem 1.25rem', borderRadius: 12,
                  border: `2px solid ${r.role === 'gestor' ? '#667eea' : '#f59e0b'}`,
                  background: 'transparent',
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = r.role === 'gestor' ? '#667eea15' : '#f59e0b15'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  background: r.role === 'gestor' ? '#667eea20' : '#f59e0b20',
                }}>
                  {r.role === 'gestor' ? '🏟' : '🎓'}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    {r.role === 'gestor' ? 'Gerenciar sua arena' : 'Acessar como instrutor'}
                  </div>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setAvailableRoles(null); setRoleToken(null); }}
              style={{
                background: 'none', border: 'none', color: '#888',
                cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem',
              }}
            >
              Voltar
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isLoading || !!autoLoginEmail}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              ref={passwordRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading || !!autoLoginEmail}
            />
          </div>

          <div className="forgot-password-link">
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </div>

          <div className="form-group-checkbox">
            <label htmlFor="keepLoggedIn" className="checkbox-label">
              <input
                id="keepLoggedIn"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                disabled={isLoading || !!autoLoginEmail}
              />
              <span>Mantenha-me logado (ir direto ao portal)</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading || !!autoLoginEmail}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
