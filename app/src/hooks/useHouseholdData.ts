import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { monthRange } from '@/lib/format';
import type { Account, Category, Member, Transaction, TransactionRow } from '@/types';

export interface TxFilters {
  month: string;              // 'YYYY-MM'
  accountId?: string | null;
  categoryId?: string | null;
  memberId?: string | null;
}

const keys = {
  accounts: (hh: string) => ['accounts', hh] as const,
  categories: (hh: string) => ['categories', hh] as const,
  members: (hh: string) => ['members', hh] as const,
  transactions: (hh: string, f: TxFilters) => ['transactions', hh, f] as const,
};

function useHouseholdId() {
  const { household } = useAuth();
  return household?.id ?? null;
}

export function useAccounts() {
  const hh = useHouseholdId();
  return useQuery({
    queryKey: keys.accounts(hh ?? 'none'),
    enabled: !!hh,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase.from('accounts').select('*').eq('household_id', hh!).order('banco');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCategories() {
  const hh = useHouseholdId();
  return useQuery({
    queryKey: keys.categories(hh ?? 'none'),
    enabled: !!hh,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*').eq('household_id', hh!).order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMembers() {
  const hh = useHouseholdId();
  return useQuery({
    queryKey: keys.members(hh ?? 'none'),
    enabled: !!hh,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.from('members').select('*').eq('household_id', hh!).order('papel');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransactions(filters: TxFilters) {
  const hh = useHouseholdId();
  const { from, to } = monthRange(filters.month);
  return useQuery({
    queryKey: keys.transactions(hh ?? 'none', filters),
    enabled: !!hh,
    queryFn: async (): Promise<TransactionRow[]> => {
      let q = supabase
        .from('transactions')
        .select('*, categoria:categories(id,nome,tipo,cor,icone), member:members(id,papel,nome), account:accounts(id,banco)')
        .eq('household_id', hh!)
        .gte('data', from)
        .lte('data', to)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.accountId) q = q.eq('account_id', filters.accountId);
      if (filters.categoryId === 'none') q = q.is('categoria_id', null);
      else if (filters.categoryId) q = q.eq('categoria_id', filters.categoryId);
      if (filters.memberId) q = q.eq('member_id', filters.memberId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as TransactionRow[];
    },
  });
}

export type NewTransaction = {
  descricao: string; valor: number; data: string;
  categoria_id: string | null; member_id: string | null; account_id: string | null;
};

export function useCreateTransaction() {
  const hh = useHouseholdId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTransaction): Promise<Transaction> => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, household_id: hh, origem: 'manual' })
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewTransaction> & { id: string }) => {
      const { error } = await supabase.from('transactions').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });
}

export function useCreateCategory() {
  const hh = useHouseholdId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; tipo: Category['tipo']; cor: string; icone: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...input, household_id: hh })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); },
  });
}
