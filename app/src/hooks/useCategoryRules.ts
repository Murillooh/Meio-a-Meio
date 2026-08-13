import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { CategoryRule } from '@/types';

export function useCategoryRules() {
  const { household } = useAuth();
  const hh = household?.id ?? null;
  return useQuery({
    queryKey: ['category_rules', hh ?? 'none'],
    enabled: !!hh,
    queryFn: async (): Promise<CategoryRule[]> => {
      const { data, error } = await supabase
        .from('category_rules')
        .select('*, categoria:categories(id,nome,tipo,cor)')
        .eq('household_id', hh!)
        .order('padrao');
      if (error) throw error;
      return (data ?? []) as unknown as CategoryRule[];
    },
  });
}

export function useSaveRule() {
  const { household } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; padrao: string; categoria_id: string; ativa?: boolean }) => {
      const payload = {
        household_id: household?.id,
        padrao: input.padrao.trim().toUpperCase(),
        categoria_id: input.categoria_id,
        ativa: input.ativa ?? true,
      };
      const q = input.id
        ? supabase.from('category_rules').update(payload).eq('id', input.id).select().single()
        : supabase.from('category_rules').upsert(payload, { onConflict: 'household_id,padrao' }).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data as CategoryRule;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['category_rules'] }); },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['category_rules'] }); },
  });
}

/** Reaplica as regras nas transações do household que estão sem categoria. */
export function useReapplyRules() {
  const { household } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: CategoryRule[]) => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, descricao')
        .eq('household_id', household!.id)
        .is('categoria_id', null);
      if (error) throw error;

      const { applyRules } = await import('@/lib/rules');
      const updates = (data ?? [])
        .map((t) => ({ id: (t as any).id as string, categoria_id: applyRules((t as any).descricao, rules) }))
        .filter((u) => u.categoria_id);

      for (const u of updates) {
        const { error: uErr } = await supabase.from('transactions').update({ categoria_id: u.categoria_id }).eq('id', u.id);
        if (uErr) throw uErr;
      }
      return updates.length;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });
}
