alter table public.expenses
  add column if not exists spent_at_time time;

drop function if exists public.public_expense_ledger();

create function public.public_expense_ledger()
returns table (
  id uuid,
  category text,
  description text,
  paid_to text,
  spent_at date,
  spent_at_time time,
  amount numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select id, category, description, paid_to, spent_at, spent_at_time, amount
  from public.expenses
  order by spent_at desc, spent_at_time desc nulls last
  limit 100;
$$;

grant execute on function public.public_expense_ledger() to anon, authenticated;
