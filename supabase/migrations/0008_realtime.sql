-- ============================================================================
-- 0008_realtime.sql
-- Liga o Supabase Realtime nas tabelas do household, pra quando um convidado
-- adiciona/edita algo, todo mundo no mesmo grupo ver a mudança na hora, sem
-- precisar puxar pra atualizar. RLS já filtra quem pode ver cada linha —
-- Realtime respeita as mesmas policies de select, então não vaza dado de
-- outro grupo.
-- ============================================================================

do $$ begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.accounts;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.members;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.category_rules;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.emergency_fund;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.emergency_deposits;
exception when duplicate_object then null;
end $$;
