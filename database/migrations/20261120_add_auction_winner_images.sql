alter table public.auction_items
  add column if not exists winner_image_url text;

alter table public.auction_items
  drop constraint if exists auction_items_auction_type_check;

alter table public.auction_items
  add constraint auction_items_auction_type_check
  check (auction_type in ('laddu_first', 'laddu_second', 'laddu_third', 'kalasam_winner', 'laddu', 'kalasam', 'coconut', 'other'));

drop function if exists public.public_auction_items();

create function public.public_auction_items()
returns table (
  id uuid,
  title text,
  auction_type text,
  festival_year integer,
  plot_flat text,
  description text,
  scheduled_at timestamptz,
  winning_amount numeric,
  winner_name text,
  winner_image_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select id, title, auction_type, festival_year, plot_flat, description, scheduled_at, winning_amount,
         case when winner_consent then winner_name else null end,
         case when winner_consent then winner_image_url else null end
  from public.auction_items
  where is_published = true
  order by scheduled_at nulls last, created_at desc
  limit 100;
$$;

grant execute on function public.public_auction_items() to anon, authenticated;
