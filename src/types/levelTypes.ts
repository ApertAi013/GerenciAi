export interface Level {
  id: number;
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
  is_default: boolean;
  created_at: string;
}

export interface CreateLevelRequest {
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
}

export interface UpdateLevelRequest {
  name?: string;
  description?: string;
  color?: string;
  order_index?: number;
}

export interface LevelsResponse {
  status: 'success' | 'error';
  message: string;
  data: Level[];
}

export interface Modality {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  classes_count?: number;
  user_id?: number;
  created_at: string;
}

export interface CreateModalityRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateModalityRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface ModalitiesResponse {
  success: boolean;
  message: string;
  data: Modality[];
}
