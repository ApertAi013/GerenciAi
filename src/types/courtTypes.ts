export type CourtStatus = 'ativa' | 'inativa' | 'manutencao';

export interface Court {
  id: number;
  name: string;
  description?: string;
  status: CourtStatus;
  default_price_cents?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCourtData {
  name: string;
  description?: string;
  status?: CourtStatus;
  default_price_cents?: number;
}

export interface UpdateCourtData {
  name?: string;
  description?: string;
  status?: CourtStatus;
  default_price_cents?: number;
}

export interface CourtApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
