-- ============================================================================
-- 0003_push_subscriptions.sql
-- ============================================================================

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  endpoint     text not null,
  auth         text not null,
  p256dh       text not null,
  created_at   timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- RLS
alter table public.push_subscriptions enable row level security;

-- O usuário só pode ver/editar suas próprias inscrições
create policy "Users can manage their own subscriptions"
  on public.push_subscriptions
  for all using (user_id = auth.uid());

-- Triggers for Webhooks (using Supabase net extension)
-- Supabase Edge Functions URL must be updated dynamically or we can use the default webhook method.
-- For local development, creating Database Webhooks via pg_net is preferred.
create extension if not exists "pg_net";

-- The trigger logic will be handled directly in the Edge Function by subscribing to the DB changes via pg_net or by configuring Supabase Database Webhooks through the dashboard.
