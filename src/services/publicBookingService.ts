import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://gerenciai-backend-798546007335.us-east1.run.app';

// Separate axios instance WITHOUT auth token interceptor
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface PublicCourt {
  id: number;
  name: string;
  description?: string;
  default_price_cents?: number;
  cancellation_deadline_hours?: number;
  cancellation_fee_cents?: number;
  min_advance_booking_hours?: number;
  max_advance_booking_days?: number;
  operating_hours?: OperatingHourPublic[];
}

export interface OperatingHourPublic {
  day_of_week: number;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  price_cents?: number;
  is_active: boolean;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  price_cents: number;
  is_available: boolean;
}

export interface PublicRental {
  id: number;
  renter_name: string;
  renter_phone?: string;
  court_name: string;
  rental_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  payment_status: string;
  booking_source?: string;
  cancellation_fee_cents?: number;
  rental_token?: string;
  cancellation_deadline_hours?: number;
  court_cancellation_fee?: number;
  created_at: string;
}

export const publicBookingService = {
  getBookingInfo: async (token: string) => {
    const response = await publicApi.get(`/api/public/booking/${token}/info`);
    return response.data;
  },

  getAvailableCourts: async (token: string) => {
    const response = await publicApi.get(`/api/public/booking/${token}/courts`);
    return response.data;
  },

  getAvailableSlots: async (token: string, courtId: number, date: string) => {
    const response = await publicApi.get(`/api/public/booking/${token}/availability`, {
      params: { court_id: courtId, date },
    });
    return response.data;
  },

  createReservation: async (token: string, data: {
    name: string;
    phone: string;
    cpf?: string;
    court_id: number;
    rental_date: string;
    start_time: string;
    end_time: string;
  }) => {
    const response = await publicApi.post(`/api/public/booking/${token}/reserve`, data);
    return response.data;
  },

  getRentalByToken: async (rentalToken: string) => {
    const response = await publicApi.get(`/api/public/booking/rental/${rentalToken}`);
    return response.data;
  },

  getRenterRentals: async (accessToken: string) => {
    const response = await publicApi.get(`/api/public/booking/renter/${accessToken}/rentals`);
    return response.data;
  },

  cancelRental: async (rentalToken: string) => {
    const response = await publicApi.put(`/api/public/booking/rental/${rentalToken}/cancel`);
    return response.data;
  },

  rescheduleRental: async (rentalToken: string, data: {
    new_date: string;
    new_start_time: string;
    new_end_time: string;
  }) => {
    const response = await publicApi.put(`/api/public/booking/rental/${rentalToken}/reschedule`, data);
    return response.data;
  },
};
