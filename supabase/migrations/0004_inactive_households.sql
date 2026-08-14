-- ============================================================================
-- 0004_inactive_households.sql
-- ============================================================================

create or replace function public.get_inactive_households(days_inactive int)
returns table(household_id uuid) as $$
begin
  return query
  select h.id
  from public.households h
  left join public.transactions t on t.household_id = h.id
  group by h.id
  having max(t.data) is null or max(t.data) < (current_date - days_inactive);
end;
$$ language plpgsql security definer;
