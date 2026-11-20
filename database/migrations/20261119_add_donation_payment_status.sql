alter table public.donations
  add column if not exists payment_status text not null default 'received';

update public.donations
set payment_status = 'received'
where payment_status is null;

alter table public.donations
  alter column payment_status set default 'received',
  alter column payment_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.donations'::regclass
      and conname = 'donations_payment_status_check'
  ) then
    alter table public.donations
      add constraint donations_payment_status_check
      check (payment_status in ('received', 'pending'));
  end if;
end;
$$;

create or replace function public.public_festival_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'donations', coalesce((select sum(amount) from public.donations where payment_status = 'received'), 0),
    'sponsorships', coalesce((select sum(contribution_amount) from public.sponsors), 0),
    'auction', coalesce((select sum(winning_amount) from public.auction_items), 0),
    'expenses', coalesce((select sum(amount) from public.expenses), 0),
    'donor_count', (select count(*) from public.donations where payment_status = 'received'),
    'volunteer_count', (select count(*) from public.volunteers),
    'event_count', (select count(*) from public.events where is_published)
  );
$$;

create or replace function public.public_donation_wall()
returns table (plot_flat text, donor_name text, amount numeric, received_at timestamptz, notes text)
language sql
stable
security definer
set search_path = ''
as $$
  select plot_flat, coalesce(nullif(donor_name, ''), 'A devotee'), amount, received_at, notes
  from public.donations
  where show_on_wall = true
    and payment_status = 'received'
  order by received_at desc
  limit 12;
$$;

notify pgrst, 'reload schema';
