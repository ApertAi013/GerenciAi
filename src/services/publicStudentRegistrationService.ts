import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const publicApi = axios.create({
  baseURL: API_URL,
});

export const publicStudentRegistrationService = {
  async getRegistrationInfo(token: string) {
    const response = await publicApi.get(`/api/public/student-registration/${token}/info`);
    return response.data;
  },

  async registerStudent(token: string, data: {
    full_name: string;
    email: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    sex?: string;
  }) {
    const response = await publicApi.post(`/api/public/student-registration/${token}/register`, data);
    return response.data;
  },
};
