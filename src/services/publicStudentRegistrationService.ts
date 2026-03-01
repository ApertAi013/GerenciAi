import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://gerenciai-backend-798546007335.us-east1.run.app';

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
