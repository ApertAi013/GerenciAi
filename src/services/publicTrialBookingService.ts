import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://gerenciai-backend-798546007335.us-east1.run.app';

// Separate axios instance WITHOUT auth token interceptor
const publicTrialApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface TrialModality {
  id: number;
  name: string;
  description?: string;
  classes_count: number;
}

export interface TrialClass {
  id: number;
  name: string;
  weekday: string;
  start_time: string;
  end_time: string;
  location?: string;
  capacity: number;
  level?: string;
  color?: string;
  modality_name: string;
  allow_overbooking: boolean;
  max_trial_per_day: number;
  enrolled_count: number;
  available_spots: number;
  is_full: boolean;
}

export interface TrialAvailability {
  class_id: number;
  class_name: string;
  modality_name: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  trial_count: number;
  max_trial_per_day: number;
  allow_overbooking: boolean;
  is_available: boolean;
  reason?: string;
}

export interface TrialBookingResult {
  booking_id: number;
  booking_token: string;
  access_token: string;
  class_name: string;
  modality_name: string;
  start_time: string;
  end_time: string;
  attendance_date: string;
  status: string;
}

export interface TrialBookingDetails {
  id: number;
  attendance_date: string;
  status: string;
  booking_source: string;
  booking_token: string;
  notes?: string;
  created_at: string;
  student_name: string;
  student_phone: string;
  student_email?: string;
  class_name: string;
  weekday: string;
  start_time: string;
  end_time: string;
  location?: string;
  color?: string;
  modality_name: string;
}

export const publicTrialBookingService = {
  async getBookingInfo(token: string) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/${token}/info`);
    return response.data;
  },

  async getAvailableModalities(token: string) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/${token}/modalities`);
    return response.data;
  },

  async getAvailableClasses(token: string, modalityId: number) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/${token}/classes`, {
      params: { modality_id: modalityId },
    });
    return response.data;
  },

  async getClassAvailability(token: string, classId: number, date: string) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/${token}/availability`, {
      params: { class_id: classId, date },
    });
    return response.data;
  },

  async createTrialBooking(token: string, data: {
    full_name: string;
    phone: string;
    email?: string;
    class_id: number;
    attendance_date: string;
    notes?: string;
  }) {
    const response = await publicTrialApi.post(`/api/public/trial-booking/${token}/reserve`, data);
    return response.data;
  },

  async getTrialBookingByToken(bookingToken: string) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/trial/${bookingToken}`);
    return response.data;
  },

  async getTrialStudentBookings(accessToken: string) {
    const response = await publicTrialApi.get(`/api/public/trial-booking/trial-student/${accessToken}/bookings`);
    return response.data;
  },

  async cancelTrialBooking(bookingToken: string) {
    const response = await publicTrialApi.put(`/api/public/trial-booking/trial/${bookingToken}/cancel`);
    return response.data;
  },
};
