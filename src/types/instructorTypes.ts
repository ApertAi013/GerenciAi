export interface InstructorPermissions {
  view_all_classes?: boolean;
  view_assigned_classes?: boolean;
  assign_classes?: boolean;
  manage_payments?: boolean;
  create_students?: boolean;
  edit_students?: boolean;
  change_student_class?: boolean;
  view_reports?: boolean;
  manage_enrollments?: boolean;
  view_financial?: boolean;
  create_classes?: boolean;
  edit_classes?: boolean;
  delete_classes?: boolean;
}

export interface InstructorClass {
  id: number;
  name: string;
  weekday: string;
  start_time: string;
  end_time: string;
  location: string;
  modality_name: string;
  capacity?: number;
  level?: string;
  status?: string;
  modality_id?: number;
  enrolled_count?: number;
}

export interface Instructor {
  id: number;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  permissions: InstructorPermissions;
  classes_count?: number;
  classes?: InstructorClass[];
}

export interface CreateInstructorRequest {
  full_name: string;
  email: string;
  permissions?: InstructorPermissions;
  send_email?: boolean;
}

export interface UpdateInstructorPermissionsRequest {
  permissions: InstructorPermissions;
}

export interface AssignClassRequest {
  class_id: number;
}

export interface AvailablePermissions {
  [key: string]: string;
}
