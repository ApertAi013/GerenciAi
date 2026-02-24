import { api } from './api';
import type { ReferralCode, ReferralStats, Referral } from '../types/referralTypes';

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://gerenciai-backend-798546007335.us-east1.run.app';

export const referralService = {
  async getMyReferralCode(): Promise<ReferralCode> {
    const response = await api.get('/api/referral/my-code');
    return response.data.data;
  },

  async getMyReferrals(): Promise<Referral[]> {
    const response = await api.get('/api/referral/my-referrals');
    return response.data.data;
  },

  async getMyStats(): Promise<ReferralStats> {
    const response = await api.get('/api/referral/my-stats');
    return response.data.data;
  },

  async trackClick(code: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/public/referral/${code}/click`);
    } catch {
      // Non-blocking
    }
  },

  async getReferralInfo(code: string): Promise<{ name: string; logo_url: string | null }> {
    const response = await fetch(`${API_BASE_URL}/api/public/referral/${code}/info`);
    const data = await response.json();
    if (data.status === 'success') return data.data;
    throw new Error(data.message);
  },
};
