export type Papel = 'pai' | 'mae';
export type CategoriaTipo = 'escola' | 'emergencia' | 'geral' | 'livre';
export type Origem = 'open_finance' | 'manual';

export interface Household { id: string; nome: string; invite_code: string; created_at: string }

export interface Member {
  id: string; household_id: string; user_id: string;
  papel: Papel; nome: string | null; created_at: string;
}

export interface Category {
  id: string; household_id: string; nome: string;
  tipo: CategoriaTipo; cor: string | null; icone: string | null;
}

export interface Account {
  id: string; household_id: string; connection_id: string | null;
  banco: string | null; tipo: string | null; saldo: number; moeda: string; external_id: string | null;
}

export interface Transaction {
  id: string; household_id: string; account_id: string | null; member_id: string | null;
  descricao: string; valor: number; data: string;
  categoria_id: string | null; origem: Origem; external_id: string | null; created_at: string;
}

export interface TransactionRow extends Transaction {
  categoria: Pick<Category, 'id' | 'nome' | 'tipo' | 'cor' | 'icone'> | null;
  member: Pick<Member, 'id' | 'papel' | 'nome'> | null;
  account: Pick<Account, 'id' | 'banco'> | null;
}

export interface EmergencyFund {
  id: string; household_id: string; meta_valor: number; despesa_mensal_media: number;
}

export interface CategoryRule {
  id: string;
  household_id: string;
  padrao: string;
  categoria_id: string;
  ativa?: boolean;
  created_at?: string;
  categoria?: Pick<Category, 'id' | 'nome' | 'tipo' | 'cor'> | null;
}
