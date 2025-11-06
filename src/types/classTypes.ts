export interface ClassStudent {
  student_id: number;
  student_name: string;
  enrollment_id: number;
  plan_name?: string;
}

export interface Class {
  id: number;
  modality_id: number;
  modality_name?: string;
  name?: string;
  weekday: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  start_time: string;
  end_time?: string;
  location?: string;
  capacity: number;
  level?: 'iniciante' | 'intermediario' | 'avancado' | 'todos';
  allowed_levels?: string[]; // Array of level names that can attend this class
  current_students?: number; // Number of enrolled students
  enrolled_count?: number; // Number of enrolled students (from backend)
  students?: ClassStudent[]; // List of enrolled students with details
  status: 'ativa' | 'suspensa' | 'cancelada';
  created_at?: string;
}

export interface Modality {
  id: number;
  name: string;
  description?: string;
}

export interface ClassesResponse {
  success: boolean;
  message?: string;
  data: Class[];
}

export interface ModalitiesResponse {
  success: boolean;
  message?: string;
  data: Modality[];
}

export interface CreateClassRequest {
  modality_id: number;
  name?: string;
  weekday: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  start_time: string;
  end_time?: string;
  location?: string;
  capacity?: number;
  level?: 'iniciante' | 'intermediario' | 'avancado' | 'todos';
  allowed_levels?: string[];
}
