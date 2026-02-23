import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import '../../styles/Loading.css';

export default function ProtectedRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth, setLoading, isLoading, user } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = authService.getToken();

      if (!token) {
        navigate('/login');
        return;
      }

      // Se já tem usuário carregado, verificar billing_status
      if (user) {
        if (user.billing_status === 'blocked') {
          navigate('/billing-blocked');
        }
        return;
      }

      // Buscar dados do usuário
      try {
        setLoading(true);
        const response = await authService.getMe();

        // Suporta ambos os formatos: { success: true, user } e { status: 'success', data }
        const isSuccess = response.status === 'success' || (response as any).success === true;
        const userData = response.data || (response as any).user;

        if (isSuccess && userData) {
          setAuth(userData, token);

          // Redirect blocked users to billing page
          if (userData.billing_status === 'blocked') {
            navigate('/billing-blocked');
            return;
          }
        } else {
          throw new Error('Falha na autenticação');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        authService.removeToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [navigate, setAuth, setLoading, user]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
