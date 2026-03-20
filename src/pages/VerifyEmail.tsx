import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.DEV ? '' : 'https://gerenciai-backend-798546007335.us-east1.run.app';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [helpSent, setHelpSent] = useState(false);

  useEffect(() => {
    if (token) verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/verify-email/${token}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Link invalido ou expirado.');
      }
    } catch {
      setStatus('error');
      setMessage('Erro ao verificar email. Tente novamente.');
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/api/public/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message);
    } catch {
      setResendMessage('Erro ao reenviar. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  const handleHelp = async () => {
    try {
      await fetch(`${API_URL}/api/public/signup-help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail, message: 'Nao recebeu email de verificacao' }),
      });
      setHelpSent(true);
    } catch {
      // silent
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: 20 }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <h2 style={{ color: '#667eea', marginBottom: 8 }}>ArenaAi</h2>

        {status === 'loading' && (
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Verificando email...</p>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>&#10003;</div>
            <h3 style={{ color: '#16a34a' }}>{message}</h3>
            <button
              onClick={() => navigate('/login')}
              style={{ marginTop: 24, padding: '12px 32px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
            >
              Fazer Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16, color: '#f59e0b' }}>&#9888;</div>
            <h3 style={{ color: '#dc2626' }}>{message}</h3>

            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 12 }}>Nao recebeu o email? Informe seu email para reenviar:</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {resending ? '...' : 'Reenviar'}
                </button>
              </div>
              {resendMessage && <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#16a34a' }}>{resendMessage}</p>}

              {!helpSent ? (
                <button
                  onClick={handleHelp}
                  style={{ marginTop: 16, background: 'none', border: 'none', color: '#667eea', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Preciso de ajuda - entrem em contato comigo
                </button>
              ) : (
                <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#16a34a' }}>Pedido enviado! Entraremos em contato em breve.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
