alter table public.auction_items
  add column if not exists festival_year integer,
  add column if not exists plot_flat text;

update public.auction_items
set festival_year = 2027
where festival_year is null;

alter table public.auction_items
  alter column festival_year set default 2027,
  alter column festival_year set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'auction_items_festival_year_check'
      and conrelid = 'public.auction_items'::regclass
  ) then
    alter table public.auction_items
      add constraint auction_items_festival_year_check
      check (festival_year between 2000 and 2100);
  end if;
end $$;

alter table public.auction_items drop constraint if exists auction_items_auction_type_check;
alter table public.auction_items
  add constraint auction_items_auction_type_check
  check (auction_type in ('laddu', 'kalasam', 'coconut', 'other'));

insert into public.auction_items (
  id, title, auction_type, festival_year, plot_flat, winning_amount, winner_name, winner_consent, is_published
) values
  ('00000000-0000-4000-8000-000000000301', 'Laddu', 'laddu', 2026, 'Villa 5', 85000, 'Narasimha Rao', true, true),
  ('00000000-0000-4000-8000-000000000302', 'Kalasam', 'kalasam', 2026, '219', 32000, 'Sunitha Devi', true, true)
on conflict (id) do update set
  title = excluded.title,
  auction_type = excluded.auction_type,
  festival_year = excluded.festival_year,
  plot_flat = excluded.plot_flat,
  winning_amount = excluded.winning_amount,
  winner_name = excluded.winner_name,
  winner_consent = excluded.winner_consent,
  is_published = excluded.is_published;

drop function if exists public.public_auction_items();

create function public.public_auction_items()
returns table (id uuid, title text, auction_type text, festival_year integer, plot_flat text, description text, scheduled_at timestamptz, winning_amount numeric, winner_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select id, title, auction_type, festival_year, plot_flat, description, scheduled_at, winning_amount,
         case when winner_consent then winner_name else null end
  from public.auction_items
  where is_published = true
  order by scheduled_at nulls last, created_at desc
  limit 100;
$$;
