
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  matricula: string;
  nome: string;
  senha: string;
  role: UserRole;
  primeiro_acesso: boolean;
}

export interface PhotoRecord {
  id: string;
  path: string;
  is_primary: boolean;
  individuo_id?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Individual {
  id: string;
  nome: string;
  alcunha?: string;
  documento?: string;
  data_nascimento?: string;
  mae?: string;
  endereco?: string;
  faccao?: string;
  created_at?: string;
  updated_at?: string;
  fotos_individuos?: PhotoRecord[];
}

// Added missing Relationship interface used in EditIndividualModal.tsx
export interface Relationship {
  id: string;
  individuo_id: string;
  relacionado_id: string;
  tipo: 'COMPARSA' | 'PARENTE' | 'VIZINHO';
  created_at: string;
  created_by?: string;
  relacionado_nome?: string;
  relacionado_alcunha?: string;
}

// Added missing Attachment interface used in EditIndividualModal.tsx
export interface Attachment {
  id: string;
  individuo_id: string;
  nome_arquivo: string;
  tipo_mime: string;
  path: string;
  legenda?: string;
  created_by?: string;
  created_at: string;
}

export interface DBApproach {
  id: string;
  data: string;
  horario: string;
  local: string;
  vtr: string;
  relatorio: string;
  objetos_apreendidos?: string;
  resultado?: string;
  individuo_nome?: string;
  individuo_id?: string;
  created_at?: string;
  foto_path?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
