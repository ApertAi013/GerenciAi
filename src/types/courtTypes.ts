export type CourtStatus = 'ativa' | 'inativa' | 'manutencao';

export interface Court {
  id: number;
  name: string;
  description?: string;
  status: CourtStatus;
  default_price_cents?: number;
  cancellation_deadline_hours?: number;
  cancellation_fee_cents?: number;
  allow_public_booking?: boolean;
  min_advance_booking_hours?: number;
  max_advance_booking_days?: number;
  created_at: string;
  updated_at: string;
}

export interface OperatingHour {
  id?: number;
  court_id: number;
  day_of_week: number;
  day_name?: string;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  price_cents?: number | null;
  is_active: boolean;
}

export interface CreateCourtData {
  name: string;
  description?: string;
  status?: CourtStatus;
  default_price_cents?: number;
  cancellation_deadline_hours?: number;
  cancellation_fee_cents?: number;
  allow_public_booking?: boolean;
  min_advance_booking_hours?: number;
  max_advance_booking_days?: number;
}

export interface UpdateCourtData {
  name?: string;
  description?: string;
  status?: CourtStatus;
  default_price_cents?: number;
  cancellation_deadline_hours?: number;
  cancellation_fee_cents?: number;
  allow_public_booking?: boolean;
  min_advance_booking_hours?: number;
  max_advance_booking_days?: number;
}

export interface CourtApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
