import { api } from './api';
import type {
  CourtRental,
  CreateRentalData,
  UpdateRentalData,
  RegisterPaymentData,
  RentalAvailability,
  Court,
  RentalFilters,
} from '../types/rentalTypes';
import type { ApiResponse } from '../types/apiTypes';

export const rentalService = {
  /**
   * Listar locações com filtros opcionais
   */
  getRentals: async (filters?: RentalFilters): Promise<ApiResponse<CourtRental[]>> => {
    const response = await api.get('/court-rentals', { params: filters });
    return response.data;
  },

  /**
   * Obter detalhes de uma locação específica
   */
  getRentalById: async (id: number): Promise<ApiResponse<CourtRental>> => {
    const response = await api.get(`/court-rentals/${id}`);
    return response.data;
  },

  /**
   * Criar nova locação (vinculada ou avulsa)
   */
  createRental: async (data: CreateRentalData): Promise<ApiResponse<CourtRental>> => {
    const response = await api.post('/court-rentals', data);
    return response.data;
  },

  /**
   * Atualizar locação existente
   */
  updateRental: async (id: number, data: UpdateRentalData): Promise<ApiResponse<CourtRental>> => {
    const response = await api.put(`/court-rentals/${id}`, data);
    return response.data;
  },

  /**
   * Cancelar locação (não deleta, apenas muda status)
   */
  cancelRental: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/court-rentals/${id}`);
    return response.data;
  },

  /**
   * Registrar pagamento de uma locação
   */
  registerPayment: async (id: number, data: RegisterPaymentData): Promise<ApiResponse<CourtRental>> => {
    const response = await api.post(`/court-rentals/${id}/payment`, data);
    return response.data;
  },

  /**
   * Verificar disponibilidade de horário para locação
   */
  checkAvailability: async (
    courtName: string,
    rentalDate: string,
    startTime: string,
    endTime: string
  ): Promise<ApiResponse<RentalAvailability>> => {
    const response = await api.get('/court-rentals/availability', {
      params: {
        court_name: courtName,
        rental_date: rentalDate,
        start_time: startTime,
        end_time: endTime,
      },
    });
    return response.data;
  },

  /**
   * Listar todas as quadras cadastradas com estatísticas
   */
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    const response = await api.get('/court-rentals/courts');
    return response.data;
  },

  /**
   * Obter locações de hoje
   */
  getTodayRentals: async (): Promise<ApiResponse<CourtRental[]>> => {
    const today = new Date().toISOString().split('T')[0];
    return rentalService.getRentals({
      start_date: today,
      end_date: today,
    });
  },

  /**
   * Obter locações com pagamento pendente
   */
  getPendingPayments: async (): Promise<ApiResponse<CourtRental[]>> => {
    return rentalService.getRentals({
      payment_status: 'pendente',
    });
  },
};
