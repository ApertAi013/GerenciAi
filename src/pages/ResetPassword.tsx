import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import '../styles/Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!token) {
      setError('Token inválido. Solicite um novo link de redefinição.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      toast.success('Senha alterada com sucesso!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/arenai-logo.svg" alt="ArenaAi" className="login-logo" />
            <h2>Link inválido</h2>
            <p>Este link de redefinição é inválido ou já foi utilizado.</p>
          </div>
          <div className="back-to-login">
            <Link to="/esqueci-senha">Solicitar novo link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/arenai-logo.svg" alt="ArenaAi" className="login-logo" />
          <h2>Redefinir senha</h2>
          <p>Digite sua nova senha</p>
        </div>

        {success ? (
          <>
            <div className="success-alert">
              <strong>Senha alterada com sucesso!</strong>
              <p>Você já pode fazer login com sua nova senha.</p>
            </div>
            <div className="back-to-login">
              <Link to="/login" className="login-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Ir para o login
              </Link>
            </div>
          </>
        ) : (
          <>
            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">Nova senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar nova senha</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
