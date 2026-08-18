-- ============================================================================
-- 0007_creator_manage_group.sql
-- Antes, qualquer membro podia remover qualquer outro membro ou apagar o
-- grupo inteiro (RLS liberava pra "household_id in current_household_ids()").
-- Agora só quem criou o grupo pode remover pessoas ou excluir o grupo.
-- Continua liberado remover a si mesmo (sair do grupo).
-- ============================================================================

drop policy if exists members_delete on public.members;
create policy members_delete on public.members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or household_id in (select id from public.households where created_by = auth.uid())
  );

drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete to authenticated
  using (created_by = auth.uid());
