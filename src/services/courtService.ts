import { api } from './api';
import type {
  Court,
  CreateCourtData,
  UpdateCourtData,
  CourtApiResponse,
} from '../types/courtTypes';

export const courtService = {
  /**
   * Listar todas as quadras
   */
  getCourts: async (): Promise<CourtApiResponse<Court[]>> => {
    const response = await api.get('/api/courts');
    return response.data;
  },

  /**
   * Obter detalhes de uma quadra específica
   */
  getCourtById: async (id: number): Promise<CourtApiResponse<Court>> => {
    const response = await api.get(`/api/courts/${id}`);
    return response.data;
  },

  /**
   * Criar nova quadra
   */
  createCourt: async (data: CreateCourtData): Promise<CourtApiResponse<Court>> => {
    const response = await api.post('/api/courts', data);
    return response.data;
  },

  /**
   * Atualizar quadra existente
   */
  updateCourt: async (id: number, data: UpdateCourtData): Promise<CourtApiResponse<Court>> => {
    const response = await api.put(`/api/courts/${id}`, data);
    return response.data;
  },

  /**
   * Deletar quadra
   */
  deleteCourt: async (id: number): Promise<CourtApiResponse<null>> => {
    const response = await api.delete(`/api/courts/${id}`);
    return response.data;
  },
};
