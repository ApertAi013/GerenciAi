import { useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('=== INICIANDO LOGIN ===');
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'vazio');

    try {
      console.log('Chamando authService.login...');
      const response = await authService.login({ email, password });
      console.log('Resposta recebida:', response);

      // Suporta ambos os formatos: { success: true } e { status: 'success' }
      const isSuccess = response.status === 'success' || (response as any).success === true;

      if (isSuccess) {
        console.log('Login bem-sucedido, salvando auth...');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token);

        setAuth(response.data.user, response.data.token);

        // Salvar preferência de "mantenha-me logado"
        if (keepLoggedIn) {
          localStorage.setItem('keepLoggedIn', 'true');
        } else {
          localStorage.removeItem('keepLoggedIn');
        }

        toast.success('Login realizado com sucesso!');

        console.log('Navegando para /dashboard...');
        // Pequeno delay para mostrar o toast antes de navegar
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        console.log('Login falhou - formato de resposta inválido');
        setError('Email ou senha inválidos');
        toast.error('Email ou senha inválidos');
      }
    } catch (err: any) {
      console.error('=== ERRO NO LOGIN ===');
      console.error('Erro completo:', err);
      console.error('Response:', err.response);
      console.error('Data:', err.response?.data);
      console.error('Status:', err.response?.status);
      const errorMessage = err.response?.data?.message || 'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('=== FIM LOGIN ===');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/arenai-logo.svg" alt="ArenaAi" className="login-logo" />
          <h2>Bem-vindo de volta</h2>
          <p>Faça login para acessar o sistema</p>
        </div>

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
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
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
