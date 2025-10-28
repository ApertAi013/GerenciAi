export interface Student {
  id: number;
  full_name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
}

export interface CreateStudentRequest {
  full_name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
}

export interface UpdateStudentRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
}

export interface StudentsResponse {
  success: boolean;
  message: string;
  data: Student[];
}
