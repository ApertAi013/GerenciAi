import { useState } from 'react';
import { useNavigate } from 'react-router';
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

      if (response.success) {
        console.log('Login bem-sucedido, salvando auth...');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token);

        setAuth(response.data.user, response.data.token);
        console.log('Navegando para /...');
        navigate('/');
      } else {
        console.log('Login falhou - success = false');
        setError('Email ou senha inválidos');
      }
    } catch (err: any) {
      console.error('=== ERRO NO LOGIN ===');
      console.error('Erro completo:', err);
      console.error('Response:', err.response);
      console.error('Data:', err.response?.data);
      console.error('Status:', err.response?.status);
      setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
      console.log('=== FIM LOGIN ===');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="logo">GerenciAi</h1>
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

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p><strong>Teste:</strong> admin@gerenciai.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
