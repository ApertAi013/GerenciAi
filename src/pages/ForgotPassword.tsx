import { useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import '../styles/Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSent(true);
      toast.success('Email enviado com sucesso!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao enviar email. Tente novamente.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/arenai-logo.svg" alt="ArenaAi" className="login-logo" />
          <h2>Esqueci minha senha</h2>
          <p>Digite seu email para receber o link de redefinição</p>
        </div>

        {sent ? (
          <div className="success-alert">
            <strong>Email enviado!</strong>
            <p>Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.</p>
            <p>O link expira em <strong>1 hora</strong>.</p>
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
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <Link to="/login">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
