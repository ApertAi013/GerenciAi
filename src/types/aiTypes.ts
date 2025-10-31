export type SuggestionType =
  | 'payment_reminder'
  | 'available_slots'
  | 'low_occupancy'
  | 'inactive_students'
  | 'schedule_conflict';

export type SuggestionPriority = 'alta' | 'media' | 'baixa';
export type SuggestionStatus = 'pendente' | 'lida' | 'executada';
export type Frequency = 'daily' | 'every_2_days' | 'weekly' | 'disabled';

export interface AISuggestion {
  id: number;
  user_id: number;
  type: SuggestionType;
  title: string;
  description: string;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  metadata?: any;
  created_at: string;
  read_at?: string;
  executed_at?: string;
}

export interface AISettings {
  id: number;
  user_id: number;
  is_active: boolean;
  payment_reminders_enabled: boolean;
  payment_reminders_frequency: Frequency;
  available_slots_enabled: boolean;
  available_slots_frequency: Frequency;
  low_occupancy_enabled: boolean;
  low_occupancy_frequency: Frequency;
  inactive_students_enabled: boolean;
  inactive_students_frequency: Frequency;
  schedule_conflicts_enabled: boolean;
  schedule_conflicts_frequency: Frequency;
  preferred_notification_time?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAISettingsData {
  is_active?: boolean;
  payment_reminders_enabled?: boolean;
  payment_reminders_frequency?: Frequency;
  available_slots_enabled?: boolean;
  available_slots_frequency?: Frequency;
  low_occupancy_enabled?: boolean;
  low_occupancy_frequency?: Frequency;
  inactive_students_enabled?: boolean;
  inactive_students_frequency?: Frequency;
  schedule_conflicts_enabled?: boolean;
  schedule_conflicts_frequency?: Frequency;
  preferred_notification_time?: string;
}

export interface AIStats {
  total_suggestions: number;
  pending_count: number;
  read_count: number;
  executed_count: number;
  by_type: Record<SuggestionType, number>;
  by_priority: Record<SuggestionPriority, number>;
}

// Action response types
export interface WhatsAppLink {
  student_id: number;
  student_name: string;
  phone: string;
  whatsapp_link: string;
  amount?: number;
  due_date?: string;
  days_inactive?: number;
}

export interface ClassInfo {
  id: number;
  name: string;
  weekday?: string;
  time?: string;
  available_slots?: number;
  occupancy_rate?: number;
  enrolled?: number;
  max?: number;
}

export interface ScheduleConflict {
  class1: {
    id: number;
    name: string;
  };
  class2: {
    id: number;
    name: string;
  };
  weekday: string;
}

export type ActionData =
  | { type: 'whatsapp_links'; links: WhatsAppLink[] }
  | { type: 'class_list'; classes: ClassInfo[] }
  | { type: 'low_occupancy_list'; classes: ClassInfo[] }
  | { type: 'conflicts_list'; conflicts: ScheduleConflict[] };
