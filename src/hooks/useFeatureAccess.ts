import { useState, useEffect } from 'react';
import { premiumFeaturesService } from '../services/premiumFeaturesService';
import type { FeatureAccess } from '../types/premiumFeaturesTypes';

interface UseFeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para verificar se o usuário tem acesso a uma feature específica
 * @param featureCode - Código da feature a ser verificada
 * @returns Objeto com hasAccess, isLoading e error
 */
export function useFeatureAccess(featureCode: string): UseFeatureAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await premiumFeaturesService.getMyAccess(featureCode);

        if (mounted) {
          // Verifica se a feature está ativa E se o usuário tem acesso
          const featureIsActive = response.data.feature.is_active;
          const userHasAccess = response.data.access.hasAccess;

          setHasAccess(featureIsActive && userHasAccess);
        }
      } catch (err: any) {
        if (mounted) {
          console.error(`Erro ao verificar acesso à feature ${featureCode}:`, err);
          setError(err.message || 'Erro ao verificar acesso');
          setHasAccess(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [featureCode]);

  return { hasAccess, isLoading, error };
}
