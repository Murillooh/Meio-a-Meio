import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { EmergencyFund, Papel } from '@/types';

export interface Deposit {
  id: string;
  household_id: string;
  member_id: string | null;
  valor: number;
  tipo: 'deposito' | 'saque';
  data: string;
  nota: string | null;
  created_at: string;
  member?: { id: string; papel: Papel; nome: string | null } | null;
}

const keys = {
  fund: (hh: string) => ['emergency_fund', hh] as const,
  deposits: (hh: string) => ['emergency_deposits', hh] as const,
};

function useHouseholdId() {
  const { household } = useAuth();
  return household?.id ?? null;
}

/** Uma linha por household (unique household_id). Pode não existir ainda. */
export function useEmergencyFund() {
  const hh = useHouseholdId();
  return useQuery({
    queryKey: keys.fund(hh ?? 'none'),
    enabled: !!hh,
    queryFn: async (): Promise<EmergencyFund | null> => {
      const { data, error } = await supabase
        .from('emergency_fund')
        .select('*')
        .eq('household_id', hh!)
        .maybeSingle();
      if (error) throw error;
      return (data as EmergencyFund) ?? null;
    },
  });
}

export function useEmergencyDeposits() {
  const hh = useHouseholdId();
  return useQuery({
    queryKey: keys.deposits(hh ?? 'none'),
    enabled: !!hh,
    queryFn: async (): Promise<Deposit[]> => {
      const { data, error } = await supabase
        .from('emergency_deposits')
        .select('*, member:members(id,papel,nome)')
        .eq('household_id', hh!)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deposit[];
    },
  });
}

/** Cria ou atualiza a configuração da reserva (upsert por household_id). */
export function useSaveEmergencyFund() {
  const hh = useHouseholdId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { meta_valor: number; despesa_mensal_media: number }) => {
      const { data, error } = await supabase
        .from('emergency_fund')
        .upsert(
          { household_id: hh, ...input, updated_at: new Date().toISOString() },
          { onConflict: 'household_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as EmergencyFund;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emergency_fund'] }); },
  });
}

export function useCreateDeposit() {
  const hh = useHouseholdId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { valor: number; tipo: 'deposito' | 'saque'; data: string; nota: string | null; member_id: string | null }) => {
      const { data, error } = await supabase
        .from('emergency_deposits')
        .insert({ ...input, household_id: hh })
        .select()
        .single();
      if (error) throw error;
      return data as Deposit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency_deposits'] });
      qc.invalidateQueries({ queryKey: ['emergency_fund'] });
    },
  });
}

export function useDeleteDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emergency_deposits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emergency_deposits'] }); },
  });
}

/** Saldo = depósitos − saques. */
export function saldoFromDeposits(deposits: Deposit[]) {
  return deposits.reduce((s, d) => s + (d.tipo === 'saque' ? -Number(d.valor) : Number(d.valor)), 0);
}
