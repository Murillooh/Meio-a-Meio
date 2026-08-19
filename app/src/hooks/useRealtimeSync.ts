import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/** Tabelas do grupo que qualquer membro pode mudar — nome da tabela bate com a
 *  primeira parte da queryKey usada nos hooks (ex: useTransactions -> ['transactions', hh]). */
const SYNCED_TABLES = [
  'transactions',
  'accounts',
  'members',
  'categories',
  'category_rules',
  'emergency_fund',
  'emergency_deposits',
] as const;

/**
 * Escuta o Supabase Realtime pro grupo ativo: quando você OU um convidado
 * mexe em qualquer uma das tabelas acima, invalida o cache pra essa tela
 * atualizar sozinha, sem precisar puxar pra atualizar.
 */
export function useRealtimeSync() {
  const { household } = useAuth();
  const qc = useQueryClient();
  const hh = household?.id;

  useEffect(() => {
    if (!hh) return;

    const channel = supabase.channel(`household-sync:${hh}`);
    for (const table of SYNCED_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `household_id=eq.${hh}` },
        () => {
          qc.invalidateQueries({ queryKey: [table, hh] });
        },
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hh, qc]);
}
