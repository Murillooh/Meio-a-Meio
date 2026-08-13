-- ============================================================================
-- 0002_category_rules.sql — regras de categorização automática
-- Se transactions.descricao contém 'padrao' (case-insensitive), aplica categoria_id.
-- ============================================================================

create table if not exists public.category_rules (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid        not null references public.households (id) on delete cascade,
  padrao       text        not null check (length(btrim(padrao)) > 0),
  categoria_id uuid        not null references public.categories (id) on delete cascade,
  ativa        boolean     not null default true,
  created_at   timestamptz not null default now(),
  unique (household_id, padrao)
);

create index if not exists idx_category_rules_household on public.category_rules (household_id);

alter table public.category_rules enable row level security;

drop policy if exists category_rules_select on public.category_rules;
create policy category_rules_select on public.category_rules
  for select to authenticated
  using (household_id in (select public.current_household_ids()));

drop policy if exists category_rules_insert on public.category_rules;
create policy category_rules_insert on public.category_rules
  for insert to authenticated
  with check (household_id in (select public.current_household_ids()));

drop policy if exists category_rules_update on public.category_rules;
create policy category_rules_update on public.category_rules
  for update to authenticated
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

drop policy if exists category_rules_delete on public.category_rules;
create policy category_rules_delete on public.category_rules
  for delete to authenticated
  using (household_id in (select public.current_household_ids()));

grant select, insert, update, delete on public.category_rules to authenticated;

-- Regras padrão junto com as categorias padrão do household.
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_escola uuid;
  cat_emerg  uuid;
  cat_casa   uuid;
begin
  insert into public.categories (household_id, nome, tipo, cor, icone)
  values (new.id, 'Escola', 'escola', '#d4a017', 'graduation-cap')
  returning id into cat_escola;

  insert into public.categories (household_id, nome, tipo, cor, icone)
  values (new.id, 'Emergência', 'emergencia', '#f0a3b1', 'shield')
  returning id into cat_emerg;

  insert into public.categories (household_id, nome, tipo, cor, icone)
  values (new.id, 'Casa', 'geral', '#8ab0a0', 'home')
  returning id into cat_casa;

  insert into public.category_rules (household_id, padrao, categoria_id)
  values
    (new.id, 'MENSALIDADE', cat_escola),
    (new.id, 'ESCOLA',      cat_escola),
    (new.id, 'RESERVA',     cat_emerg),
    (new.id, 'SUPERMERCADO', cat_casa),
    (new.id, 'ENERGIA',     cat_casa)
  on conflict (household_id, padrao) do nothing;

  insert into public.emergency_fund (household_id)
  values (new.id)
  on conflict (household_id) do nothing;

  return new;
end $$;
