import { Navigate } from 'react-router';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

interface FeatureProtectedRouteProps {
  featureCode: string;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege rotas baseado em feature flags
 * Redireciona usuários sem acesso para a página inicial ou rota especificada
 */
export default function FeatureProtectedRoute({
  featureCode,
  children,
  redirectTo = '/',
}: FeatureProtectedRouteProps) {
  const { hasAccess, isLoading } = useFeatureAccess(featureCode);

  // Enquanto carrega, não mostra nada (pode adicionar um loading se necessário)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não tem acesso, redireciona
  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se tem acesso, renderiza os filhos
  return <>{children}</>;
}
