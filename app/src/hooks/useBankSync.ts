import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { bankProvider } from '@/lib/providers';
import { applyRules } from '@/lib/rules';
import { useAuth } from './useAuth';
import type { Account, CategoryRule } from '@/types';

/**
 * Conectar banco: connect token → widget → grava bank_connections → importa accounts.
 * Sincronizar conta: busca transactions do provider e insere as novas
 * (dedupe por transactions.external_id, unique com household_id na migração).
 */
export function useConnectBank() {
  const { household, member } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!household) throw new Error('Sem household');
      const token = await bankProvider.createConnectToken();
      const result = await bankProvider.openWidget(token);
      if (!result) return { cancelled: true as const };

      const item = await bankProvider.getItem(result.itemId).catch(() => null);

      const { data: connection, error } = await supabase
        .from('bank_connections')
        .upsert({
          household_id: household.id,
          member_id: member?.id ?? null,
          provider: bankProvider.name,
          item_id: result.itemId,
          status: item?.status ?? 'UPDATED',
        }, { onConflict: 'provider,item_id' })
        .select()
        .single();
      if (error) throw error;

      const accounts = await bankProvider.listAccounts(result.itemId);
      if (accounts.length) {
        const { error: aErr } = await supabase.from('accounts').upsert(
          accounts.map((a) => ({
            household_id: household.id,
            connection_id: (connection as { id: string }).id,
            banco: a.banco,
            tipo: a.tipo,
            saldo: a.saldo,
            moeda: a.moeda,
            external_id: a.externalId,
          })),
          { onConflict: 'household_id,external_id' },
        );
        if (aErr) throw aErr;
      }

      return { cancelled: false as const, imported: accounts.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['bank_connections'] });
    },
  });
}

export function useSyncAccount() {
  const { household } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (account: Account) => {
      if (!household) throw new Error('Sem household');
      if (!account.external_id) throw new Error('Conta sem external_id — reconecte o banco');

      const from = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
      const remote = await bankProvider.listTransactions(account.external_id, { from });
      if (!remote.length) return { inserted: 0, saldo: account.saldo };

      // dedupe local: descarta o que já existe com o mesmo external_id
      const { data: existing, error: eErr } = await supabase
        .from('transactions')
        .select('external_id')
        .eq('household_id', household.id)
        .in('external_id', remote.map((t) => t.externalId));
      if (eErr) throw eErr;

      const known = new Set((existing ?? []).map((r) => (r as { external_id: string }).external_id));
      const novas = remote.filter((t) => !known.has(t.externalId));

      // categorização automática pelas regras do household
      const { data: rulesData } = await supabase
        .from('category_rules')
        .select('*')
        .eq('household_id', household.id);
      const rules = (rulesData ?? []) as unknown as CategoryRule[];

      if (novas.length) {
        const { error } = await supabase.from('transactions').insert(
          novas.map((t) => ({
            household_id: household.id,
            account_id: account.id,
            member_id: null,
            descricao: t.descricao,
            valor: t.valor,
            data: t.data,
            categoria_id: applyRules(t.descricao, rules),
            origem: 'open_finance',
            external_id: t.externalId,
          })),
        );
        if (error) throw error;
      }

      // saldo do provider é a fonte da verdade
      const fresh = await bankProvider
        .listAccounts((await supabase.from('bank_connections').select('item_id').eq('id', account.connection_id ?? '').maybeSingle()).data?.item_id ?? '')
        .catch(() => []);
      const match = fresh.find((a) => a.externalId === account.external_id);
      if (match) {
        await supabase.from('accounts').update({ saldo: match.saldo }).eq('id', account.id);
      }

      return { inserted: novas.length, saldo: match?.saldo ?? account.saldo };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
