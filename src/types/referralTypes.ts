export interface ReferralCode {
  code: string;
  link: string;
  clicks: number;
  signups: number;
  conversions: number;
  referrals: Referral[];
}

export interface Referral {
  id: number;
  referee_email: string;
  referee_name?: string;
  status: 'pending' | 'signed_up' | 'converted' | 'rewarded';
  signed_up_at: string | null;
  converted_at: string | null;
  reward_applied_at: string | null;
  created_at: string;
}

export interface ReferralStats {
  clicks: number;
  signups: number;
  conversions: number;
  months_earned: number;
  pending_rewards: number;
}
