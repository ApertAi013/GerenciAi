import { api } from './api';
import type {
  Court,
  CreateCourtData,
  UpdateCourtData,
  CourtApiResponse,
  OperatingHour,
} from '../types/courtTypes';

export const courtService = {
  getCourts: async (): Promise<CourtApiResponse<Court[]>> => {
    const response = await api.get('/api/courts');
    return response.data;
  },

  getCourtById: async (id: number): Promise<CourtApiResponse<Court>> => {
    const response = await api.get(`/api/courts/${id}`);
    return response.data;
  },

  createCourt: async (data: CreateCourtData): Promise<CourtApiResponse<Court>> => {
    const response = await api.post('/api/courts', data);
    return response.data;
  },

  updateCourt: async (id: number, data: UpdateCourtData): Promise<CourtApiResponse<Court>> => {
    const response = await api.put(`/api/courts/${id}`, data);
    return response.data;
  },

  deleteCourt: async (id: number): Promise<CourtApiResponse<null>> => {
    const response = await api.delete(`/api/courts/${id}`);
    return response.data;
  },

  // Operating hours
  getOperatingHours: async (courtId: number): Promise<CourtApiResponse<OperatingHour[]>> => {
    const response = await api.get(`/api/courts/${courtId}/operating-hours`);
    return response.data;
  },

  setOperatingHours: async (courtId: number, hours: OperatingHour[]): Promise<CourtApiResponse<OperatingHour[]>> => {
    const response = await api.put(`/api/courts/${courtId}/operating-hours`, { hours });
    return response.data;
  },

  // Booking token
  getBookingToken: async (): Promise<CourtApiResponse<{ booking_token: string | null }>> => {
    const response = await api.get('/api/courts/booking-token/get');
    return response.data;
  },

  generateBookingToken: async (): Promise<CourtApiResponse<{ booking_token: string }>> => {
    const response = await api.post('/api/courts/booking-token/generate');
    return response.data;
  },
};
