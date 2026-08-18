-- ============================================================================
-- 0006_join_by_invite_code.sql
-- Bug: households_select (0001) só deixa ver uma casa se você já é membro
-- dela ou foi quem criou. Quem recebe um código de convite não é nenhum dos
-- dois ainda, então a busca por invite_code sempre voltava vazia ("Código de
-- convite não encontrado" mesmo com o código certo).
-- Fix: função SECURITY DEFINER que busca só pelo código exato, sem abrir
-- a leitura de todas as casas via RLS.
-- ============================================================================

create or replace function public.household_by_invite_code(code text)
returns public.households
language sql
stable
security definer
set search_path = public
as $$
  select * from public.households where invite_code = upper(trim(code)) limit 1;
$$;

revoke all on function public.household_by_invite_code(text) from public;
grant execute on function public.household_by_invite_code(text) to authenticated;
