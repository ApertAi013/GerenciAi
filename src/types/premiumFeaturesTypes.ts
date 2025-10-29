// Tipos para Premium Features

export interface FeatureLimit {
  id: number;
  feature_code: string;
  feature_name: string;
  free_monthly_limit: number;
  description: string;
  is_active: boolean;
}

export interface UsageInfo {
  monthlyLimit?: number;
  usedThisMonth?: number;
  remainingUses?: number;
  resetDate?: string;
  unlimited?: boolean;
}

export interface FeatureAccess {
  hasAccess: boolean;
  isUnlimited: boolean;
  usageInfo: UsageInfo;
}

export interface MyAccessResponse {
  feature: FeatureLimit;
  access: FeatureAccess;
}

export interface UsageTracking {
  user_id: number;
  conversation_id?: number;
  action_type: 'message' | 'conversation_start';
  tokens_used: number;
  month_year: string;
  created_at: string;
}

export interface MyUsageResponse {
  feature: FeatureLimit;
  usage: {
    currentMonth: string;
    totalUsages: number;
    limit: number;
    isUnlimited: boolean;
  };
  recent_usages: UsageTracking[];
}

export interface PremiumFeaturesResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  usageInfo?: UsageInfo;
}
