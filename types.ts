
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
}

export interface PhotoRecord {
  id: string;
  path: string; // base64 ou url
  is_primary: boolean;
  individuo_id?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Attachment {
  id: string;
  individuo_id: string;
  nome_arquivo: string;
  tipo_mime: string;
  path: string;
  legenda?: string;
  created_by: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  individuo_id: string;
  relacionado_id: string;
  tipo: 'COMPARSA' | 'PARENTE' | 'VIZINHO';
  created_by: string;
  created_at: string;
  relacionado_nome?: string; // Para exibição na UI
  relacionado_alcunha?: string;
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
  fotos_individuos?: PhotoRecord[];
  individuos_anexos?: Attachment[];
  relacionamentos?: Relationship[];
  created_at?: string;
  updated_at?: string;
}

export interface Approach {
  id: string;
  data: string;
  horario: string;
  local: string;
  vtr: string;
  equipe: string[];
  individuosId: string[];
  objetosApreendidos?: string;
  relatorio: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
