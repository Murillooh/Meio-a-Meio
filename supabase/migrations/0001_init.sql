-- ============================================================================
-- 0001_init.sql — schema inicial do app de finanças familiar
-- Postgres / Supabase. Pode ser colado direto no SQL Editor.
-- Ordem: extensões → tabelas → helper → índices → RLS → seed de categorias.
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

-- Casa (household): unidade de isolamento de TODOS os dados do app.
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  nome        text        not null,
  invite_code text        not null unique,
  created_by  uuid        references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now()
);

-- Membros da casa. Um usuário pode pertencer a mais de uma casa,
-- mas só uma vez em cada uma (unique household_id + user_id).
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid        not null references public.households (id) on delete cascade,
  user_id      uuid        not null references auth.users (id)        on delete cascade,
  papel        text        not null check (papel in ('pai', 'mae')),
  nome         text,
  created_at   timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Categorias de gasto. 'livre' = dinheiro sem alocação obrigatória.
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  nome         text not null,
  tipo         text not null check (tipo in ('escola', 'emergencia', 'geral', 'livre')),
  cor          text,
  icone        text,
  created_at   timestamptz not null default now()
);

-- Conexões de Open Finance (Pluggy por padrão). item_id é o id do agregador.
create table if not exists public.bank_connections (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid        not null references public.households (id) on delete cascade,
  member_id    uuid        references public.members (id) on delete set null,
  provider     text        not null default 'pluggy',
  item_id      text,
  status       text        not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (provider, item_id)
);

-- Contas bancárias trazidas por uma conexão (ou criadas à mão).
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid    not null references public.households (id)        on delete cascade,
  connection_id uuid    references public.bank_connections (id)           on delete set null,
  banco         text,
  tipo          text,
  saldo         numeric(14, 2) not null default 0,
  moeda         text    not null default 'BRL',
  external_id   text,
  created_at    timestamptz not null default now(),
  unique (household_id, external_id)
);

-- Lançamentos. valor positivo = entrada, negativo = saída.
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid    not null references public.households (id) on delete cascade,
  account_id   uuid    references public.accounts (id)   on delete set null,
  member_id    uuid    references public.members (id)    on delete set null,
  descricao    text    not null,
  valor        numeric(14, 2) not null,
  data         date    not null default current_date,
  categoria_id uuid    references public.categories (id) on delete set null,
  origem       text    not null default 'manual' check (origem in ('open_finance', 'manual')),
  external_id  text,
  created_at   timestamptz not null default now(),
  -- evita duplicar o mesmo lançamento vindo do agregador
  unique (household_id, external_id)
);

-- Reserva de emergência: uma linha por casa.
create table if not exists public.emergency_fund (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid unique not null references public.households (id) on delete cascade,
  meta_valor            numeric(14, 2) not null default 0,
  despesa_mensal_media  numeric(14, 2) not null default 0,
  updated_at            timestamptz not null default now()
);

-- Movimentações da reserva.
create table if not exists public.emergency_deposits (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid        not null references public.households (id) on delete cascade,
  member_id    uuid        references public.members (id) on delete set null,
  valor        numeric(14, 2) not null check (valor > 0),
  tipo         text        not null check (tipo in ('deposito', 'saque')),
  data         date        not null default current_date,
  nota         text,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- 2. HELPER — casas do usuário logado
-- SECURITY DEFINER de propósito: a função lê members sem passar por RLS,
-- evitando recursão infinita quando as próprias políticas de members a usam.
-- ============================================================================

create or replace function public.current_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.members
  where user_id = auth.uid();
$$;

revoke all on function public.current_household_ids() from public;
grant execute on function public.current_household_ids() to authenticated;

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================

create index if not exists idx_members_household        on public.members (household_id);
create index if not exists idx_members_user             on public.members (user_id);
create index if not exists idx_categories_household     on public.categories (household_id);
create index if not exists idx_bank_conn_household      on public.bank_connections (household_id);
create index if not exists idx_accounts_household       on public.accounts (household_id);
create index if not exists idx_accounts_connection      on public.accounts (connection_id);
create index if not exists idx_transactions_household   on public.transactions (household_id);
create index if not exists idx_transactions_data        on public.transactions (data desc);
create index if not exists idx_transactions_hh_data     on public.transactions (household_id, data desc);
create index if not exists idx_transactions_categoria   on public.transactions (categoria_id);
create index if not exists idx_transactions_account     on public.transactions (account_id);
create index if not exists idx_emg_fund_household       on public.emergency_fund (household_id);
create index if not exists idx_emg_deposits_household   on public.emergency_deposits (household_id);
create index if not exists idx_emg_deposits_data        on public.emergency_deposits (data desc);

-- ============================================================================
-- 4. RLS
-- Regra geral: household_id in (select current_household_ids()).
-- households usa id in (...); members permite ao usuário ver a própria linha
-- (necessário para o primeiro carregamento) e criar seu próprio vínculo.
-- ============================================================================

alter table public.households         enable row level security;
alter table public.members            enable row level security;
alter table public.categories         enable row level security;
alter table public.bank_connections   enable row level security;
alter table public.accounts           enable row level security;
alter table public.transactions       enable row level security;
alter table public.emergency_fund     enable row level security;
alter table public.emergency_deposits enable row level security;

-- ---------- households ----------
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (id in (select public.current_household_ids()) or created_by = auth.uid());

-- qualquer usuário autenticado pode criar uma casa (ele vira membro em seguida)
drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert to authenticated
  with check (true);

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update to authenticated
  using (id in (select public.current_household_ids()))
  with check (id in (select public.current_household_ids()));

drop policy if exists households_delete on public.households;
create policy households_delete on public.households
  for delete to authenticated
  using (id in (select public.current_household_ids()));

-- ---------- members ----------
-- vê a si mesmo OU qualquer membro de uma casa em que já está
drop policy if exists members_select on public.members;
create policy members_select on public.members
  for select to authenticated
  using (user_id = auth.uid() or household_id in (select public.current_household_ids()));

-- só cria vínculo para si mesmo (entrar via convite / ao criar a casa)
drop policy if exists members_insert on public.members;
create policy members_insert on public.members
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists members_update on public.members;
create policy members_update on public.members
  for update to authenticated
  using (household_id in (select public.current_household_ids()))
  with check (household_id in (select public.current_household_ids()));

drop policy if exists members_delete on public.members;
create policy members_delete on public.members
  for delete to authenticated
  using (household_id in (select public.current_household_ids()));

-- ---------- tabelas "household_id" (mesmo padrão para as 6) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'bank_connections', 'accounts',
    'transactions', 'emergency_fund', 'emergency_deposits'
  ]
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format($f$
      create policy %1$s_select on public.%1$s
        for select to authenticated
        using (household_id in (select public.current_household_ids()))
    $f$, t);

    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format($f$
      create policy %1$s_insert on public.%1$s
        for insert to authenticated
        with check (household_id in (select public.current_household_ids()))
    $f$, t);

    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format($f$
      create policy %1$s_update on public.%1$s
        for update to authenticated
        using (household_id in (select public.current_household_ids()))
        with check (household_id in (select public.current_household_ids()))
    $f$, t);

    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format($f$
      create policy %1$s_delete on public.%1$s
        for delete to authenticated
        using (household_id in (select public.current_household_ids()))
    $f$, t);
  end loop;
end $$;

-- ============================================================================
-- 5. SEED — categorias padrão ao criar uma casa
-- Trigger roda como definer, então não é bloqueada pela RLS de categories
-- (no momento do insert o criador ainda não é membro).
-- ============================================================================

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, nome, tipo, cor, icone)
  values
    (new.id, 'Escola',     'escola',     '#d4a017', 'graduation-cap'),
    (new.id, 'Emergência', 'emergencia', '#f0a3b1', 'shield'),
    (new.id, 'Casa',       'geral',      '#8ab0a0', 'home');

  insert into public.emergency_fund (household_id)
  values (new.id)
  on conflict (household_id) do nothing;

  return new;
end $$;

drop trigger if exists trg_seed_default_categories on public.households;
create trigger trg_seed_default_categories
  after insert on public.households
  for each row execute function public.seed_default_categories();

-- ============================================================================
-- 6. GRANTS (RLS continua sendo o filtro real)
-- ============================================================================

grant select, insert, update, delete on all tables in schema public to authenticated;
