import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import '../styles/Login.css';

interface SavedAccount {
  email: string;
  name: string;
}

function getSavedAccounts(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem('savedAccounts') || '[]');
  } catch {
    return [];
  }
}

function saveAccount(email: string, name: string) {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  accounts.unshift({ email, name });
  localStorage.setItem('savedAccounts', JSON.stringify(accounts.slice(0, 5)));
}

function removeAccount(email: string) {
  const accounts = getSavedAccounts().filter((a) => a.email !== email);
  localStorage.setItem('savedAccounts', JSON.stringify(accounts));
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  const selectAccount = (account: SavedAccount) => {
    setEmail(account.email);
    setPassword('');
    setError('');
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

      // Suporta ambos os formatos: { success: true } e { status: 'success' }
      const isSuccess = response.status === 'success' || (response as any).success === true;

      if (isSuccess) {
        // Salvar preferência ANTES de setAuth (authStore usa isso para escolher o storage)
        if (keepLoggedIn) {
          localStorage.setItem('keepLoggedIn', 'true');
        } else {
          localStorage.removeItem('keepLoggedIn');
        }

        // Salvar conta para acesso rápido
        const user = response.data.user;
        saveAccount(email, user.name || user.email);
        setSavedAccounts(getSavedAccounts());

        setAuth(user, response.data.token);

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
          <img src="/arenai-logo.svg" alt="ArenaAi" className="login-logo" />
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
                  className={`saved-account-item${email === account.email ? ' active' : ''}`}
                  onClick={() => selectAccount(account)}
                >
                  <div className="saved-account-avatar">
                    {getInitials(account.name)}
                  </div>
                  <div className="saved-account-info">
                    <span className="saved-account-name">{account.name}</span>
                    <span className="saved-account-email">{account.email}</span>
                  </div>
                  <button
                    className="saved-account-remove"
                    onClick={(e) => handleRemoveAccount(e, account.email)}
                    title="Remover conta salva"
                  >
                    &times;
                  </button>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
              <span>Mantenha-me logado (ir direto ao portal)</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
