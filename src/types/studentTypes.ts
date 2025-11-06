export interface Student {
  id: number;
  full_name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
  level?: 'iniciante' | 'intermediario' | 'avançado' | string;
  level_id?: number;
  level_name?: string; // Nome do nível customizado (da tabela levels)
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
  gender?: string;
  address?: string;
  responsible_name?: string;
}

export interface CreateStudentRequest {
  full_name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
  level?: string;
}

export interface UpdateStudentRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
  level_id?: number;
  level?: string;
  cpf?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
  gender?: string;
  address?: string;
  responsible_name?: string;
}

export interface StudentsResponse {
  success: boolean;
  message: string;
  data: Student[];
}
