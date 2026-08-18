-- ============================================================================
-- 0005_freeform_papel.sql
-- Papel deixa de ser fixo em 'pai'/'mae': vira apelido de texto livre
-- (ex: "Namorada", "Amigo", "Mãe"), pra caber qualquer tipo de grupo,
-- não só família com pai e mãe. Multi-household por usuário já era
-- suportado pelo schema (0001_init.sql) — nada muda aí.
-- ============================================================================

-- remove a trava 'pai'/'mae', qualquer que seja o nome real do constraint
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'members'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%papel%'
  loop
    execute format('alter table public.members drop constraint %I', c.conname);
  end loop;
end $$;

-- papel passa a ser opcional: quem entra por convite ainda não escolheu apelido
alter table public.members alter column papel drop not null;
