export type RentalStatus = 'agendada' | 'confirmada' | 'cancelada' | 'concluida';
export type PaymentStatus = 'pendente' | 'paga' | 'cancelada';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'transferencia' | 'outro';

export interface CourtRental {
  id: number;
  user_id: number;
  student_id?: number;
  student_name?: string;
  student_phone?: string;
  renter_name: string;
  renter_phone: string;
  renter_email?: string;
  renter_cpf?: string;
  court_name: string;
  rental_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_cents: number;
  status: RentalStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRentalData {
  student_id?: number;
  renter_name: string;
  renter_phone: string;
  renter_email?: string;
  renter_cpf?: string;
  court_name: string;
  rental_date: string;
  start_time: string;
  end_time: string;
  price_cents?: number;
  notes?: string;
}

export interface UpdateRentalData {
  renter_name?: string;
  renter_phone?: string;
  renter_email?: string;
  court_name?: string;
  rental_date?: string;
  start_time?: string;
  end_time?: string;
  price_cents?: number;
  status?: RentalStatus;
  notes?: string;
}

export interface RegisterPaymentData {
  payment_method: PaymentMethod;
  paid_at?: string;
}

export interface RentalAvailability {
  available: boolean;
  conflicts: {
    id: number;
    renter_name: string;
    start_time: string;
    end_time: string;
  }[];
  court_name: string;
  rental_date: string;
  start_time: string;
  end_time: string;
}

export interface Court {
  court_name: string;
  total_rentals: number;
  total_revenue_cents: number;
}

export interface RentalFilters {
  start_date?: string;
  end_date?: string;
  court_name?: string;
  status?: RentalStatus;
  payment_status?: PaymentStatus;
}
