import { api } from './api';
import type {
  PremiumFeaturesResponse,
  MyAccessResponse,
  MyUsageResponse,
  FeatureLimit,
} from '../types/premiumFeaturesTypes';

export const premiumFeaturesService = {
  // Verificar acesso do usuário atual a uma feature
  async getMyAccess(featureCode: string): Promise<PremiumFeaturesResponse<MyAccessResponse>> {
    const response = await api.get<PremiumFeaturesResponse<MyAccessResponse>>(
      `/api/premium-features/my-access/${featureCode}`
    );
    return response.data;
  },

  // Obter estatísticas de uso do usuário para uma feature
  async getMyUsage(featureCode: string): Promise<PremiumFeaturesResponse<MyUsageResponse>> {
    const response = await api.get<PremiumFeaturesResponse<MyUsageResponse>>(
      `/api/premium-features/my-usage/${featureCode}`
    );
    return response.data;
  },

  // Admin: Listar todas as features
  async listFeatures(): Promise<PremiumFeaturesResponse<FeatureLimit[]>> {
    const response = await api.get<PremiumFeaturesResponse<FeatureLimit[]>>(
      '/api/premium-features/admin/list'
    );
    return response.data;
  },

  // Admin: Conceder acesso a um usuário
  async grantAccess(
    userId: number,
    featureCode: string,
    isUnlimited: boolean = false
  ): Promise<PremiumFeaturesResponse<any>> {
    const response = await api.post<PremiumFeaturesResponse<any>>(
      '/api/premium-features/admin/grant',
      {
        userId,
        featureCode,
        isUnlimited,
      }
    );
    return response.data;
  },

  // Admin: Revogar acesso de um usuário
  async revokeAccess(
    userId: number,
    featureCode: string
  ): Promise<PremiumFeaturesResponse<any>> {
    const response = await api.post<PremiumFeaturesResponse<any>>(
      '/api/premium-features/admin/revoke',
      {
        userId,
        featureCode,
      }
    );
    return response.data;
  },

  // Admin: Verificar acesso de um usuário específico
  async checkUserAccess(
    userId: number,
    featureCode: string
  ): Promise<PremiumFeaturesResponse<MyAccessResponse>> {
    const response = await api.get<PremiumFeaturesResponse<MyAccessResponse>>(
      `/api/premium-features/admin/check/${userId}/${featureCode}`
    );
    return response.data;
  },
};
