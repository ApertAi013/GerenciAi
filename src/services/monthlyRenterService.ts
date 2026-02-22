import { api } from './api';

export interface MonthlyRenter {
  id: number;
  court_id: number;
  court_name?: string;
  renter_name: string;
  renter_phone: string;
  renter_email?: string;
  renter_cpf?: string;
  student_id?: number;
  student_name?: string;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  monthly_price_cents: number;
  status: 'ativo' | 'inativo' | 'cancelado';
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

export interface CreateMonthlyRenterData {
  court_id: number;
  renter_name: string;
  renter_phone: string;
  renter_email?: string;
  renter_cpf?: string;
  student_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  monthly_price_cents?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export const monthlyRenterService = {
  getAll: async () => {
    const response = await api.get('/api/monthly-renters');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/api/monthly-renters/${id}`);
    return response.data;
  },

  create: async (data: CreateMonthlyRenterData) => {
    const response = await api.post('/api/monthly-renters', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateMonthlyRenterData & { status: string }>) => {
    const response = await api.put(`/api/monthly-renters/${id}`, data);
    return response.data;
  },

  deactivate: async (id: number) => {
    const response = await api.delete(`/api/monthly-renters/${id}`);
    return response.data;
  },

  generateRentals: async (month: number, year: number) => {
    const response = await api.post('/api/monthly-renters/generate-rentals', { month, year });
    return response.data;
  },
};
