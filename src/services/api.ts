import axios from 'axios';

const API_BASE_URL = 'https://gerenciai-backend-798546007335.us-east1.run.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só redireciona para login se não estiver na rota de login
    // e se for um erro de autenticação com token presente
    if (
      error.response?.status === 401 &&
      localStorage.getItem('token') &&
      !window.location.pathname.includes('/login')
    ) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
