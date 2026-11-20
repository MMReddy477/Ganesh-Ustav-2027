create extension if not exists pgcrypto;

create type public.committee_role as enum ('super_admin', 'admin', 'editor');
create type public.volunteer_status as enum ('pending', 'approved', 'declined');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role public.committee_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 20),
  email text,
  skills text,
  availability text,
  status public.volunteer_status not null default 'pending',
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  category text not null default 'Festival',
  alt_text text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  poster_url text,
  category text not null default 'Highlights',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_audios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  audio_url text not null,
  category text not null default 'Aarti',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text,
  donor_phone text,
  plot_flat text,
  amount numeric(12, 2) not null check (amount > 0),
  payment_status text not null default 'received' check (payment_status in ('received', 'pending')),
  currency char(3) not null default 'INR',
  payment_method text not null default 'UPI',
  transaction_reference text,
  receipt_url text,
  show_on_wall boolean not null default false,
  received_at timestamptz not null default now(),
  notes text,
  recorded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  paid_to text,
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'INR',
  spent_at date not null default current_date,
  spent_at_time time,
  receipt_url text,
  recorded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier text not null default 'Community',
  plot_flat text,
  contribution_amount numeric(12, 2) check (contribution_amount is null or contribution_amount >= 0),
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auction_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  auction_type text not null check (auction_type in ('laddu_first', 'laddu_second', 'laddu_third', 'kalasam_winner', 'laddu', 'kalasam', 'coconut', 'other')),
  festival_year integer not null default 2027 check (festival_year between 2000 and 2100),
  plot_flat text,
  description text,
  scheduled_at timestamptz,
  winning_amount numeric(12, 2) check (winning_amount is null or winning_amount > 0),
  winner_name text,
  winner_image_url text,
  winner_consent boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.users (id, email, display_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'display_name', ''),
  'super_admin'
from auth.users
where lower(email) = lower('muni477@gmail.com')
on conflict (id) do update
set email = excluded.email,
    role = 'super_admin',
    updated_at = now();
    select email, role
from public.users
where lower(email) = lower('muni477@gmail.com');

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN')),
  table_name text not null,
  record_id text,
  occurred_at timestamptz not null default now(),
  ip_address inet,
  old_data jsonb,
  new_data jsonb
);

create index volunteers_status_created_idx on public.volunteers (status, created_at desc);
create index events_published_start_idx on public.events (is_published, starts_at);
create index announcements_active_idx on public.announcements (is_published, starts_at desc, ends_at);
create index donations_received_idx on public.donations (received_at desc);
create index expenses_spent_idx on public.expenses (spent_at desc);
create index gallery_images_order_idx on public.gallery_images (is_published, sort_order, created_at desc);
create index gallery_videos_order_idx on public.gallery_videos (is_published, created_at desc);
create index gallery_audios_order_idx on public.gallery_audios (is_published, created_at desc);
create index sponsors_order_idx on public.sponsors (is_published, sort_order);
create index auction_items_schedule_idx on public.auction_items (is_published, scheduled_at);
create index audit_logs_auth_rate_limit_idx on public.audit_logs (action, ip_address, occurred_at desc);

create or replace function public.is_committee_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role in ('super_admin'::public.committee_role, 'admin'::public.committee_role)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'super_admin'::public.committee_role
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  actor uuid;
begin
  actor := auth.uid();
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
    insert into public.audit_logs (actor_id, action, table_name, record_id, old_data)
    values (actor, tg_op, tg_table_name, row_data ->> 'id', row_data);
    return old;
  elsif tg_op = 'UPDATE' then
    row_data := to_jsonb(new);
    insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
    values (actor, tg_op, tg_table_name, row_data ->> 'id', to_jsonb(old), row_data);
    return new;
  end if;

  row_data := to_jsonb(new);
  insert into public.audit_logs (actor_id, action, table_name, record_id, new_data)
  values (actor, tg_op, tg_table_name, row_data ->> 'id', row_data);
  return new;
end;
$$;

create or replace function public.log_admin_auth_event(p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  ip_text text;
  request_ip inet;
  recent_attempts bigint;
begin
  if p_action is null or p_action not in ('LOGIN', 'LOGOUT', 'FAILED_LOGIN') then
    raise exception 'Unsupported admin auth event';
  end if;

  ip_text := split_part(
    coalesce(
      nullif(request_headers ->> 'x-forwarded-for', ''),
      nullif(request_headers ->> 'x-real-ip', ''),
      nullif(request_headers ->> 'cf-connecting-ip', ''),
      ''
    ),
    ',',
    1
  );
  begin
    request_ip := nullif(btrim(ip_text), '')::inet;
  exception when invalid_text_representation then
    request_ip := null;
  end;

  if p_action = 'FAILED_LOGIN' then
    if actor is not null then
      raise exception 'Failed login events must be unauthenticated';
    end if;

    if request_ip is null then
      select count(*) into recent_attempts
      from public.audit_logs
      where action = 'FAILED_LOGIN'
        and ip_address is null
        and occurred_at > now() - interval '10 minutes';
      if recent_attempts >= 50 then return; end if;
    else
      select count(*) into recent_attempts
      from public.audit_logs
      where action = 'FAILED_LOGIN'
        and ip_address = request_ip
        and occurred_at > now() - interval '10 minutes';
      if recent_attempts >= 20 then return; end if;
    end if;
  elsif actor is null then
    raise exception 'Authentication is required for this event';
  end if;

  insert into public.audit_logs (actor_id, action, table_name, record_id, ip_address)
  values (actor, p_action, 'auth', actor::text, request_ip);
end;
$$;

create or replace function public.provision_committee_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'editor')
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
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

create or replace function public.public_expense_summary()
returns table (category text, amount numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select category, sum(amount)
  from public.expenses
  group by category
  order by sum(amount) desc;
$$;

drop function if exists public.public_expense_ledger();

create function public.public_expense_ledger()
returns table (id uuid, category text, description text, paid_to text, spent_at date, spent_at_time time, amount numeric)
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

drop function if exists public.public_auction_items();

create function public.public_auction_items()
returns table (id uuid, title text, auction_type text, festival_year integer, plot_flat text, description text, scheduled_at timestamptz, winning_amount numeric, winner_name text, winner_image_url text)
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
  limit 20;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.provision_committee_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'volunteers', 'events', 'gallery_images', 'gallery_videos', 'gallery_audios',
    'donations', 'expenses', 'sponsors', 'announcements', 'contacts', 'website_settings', 'auction_items'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;

  foreach table_name in array array[
    'users', 'volunteers', 'events', 'gallery_images', 'gallery_videos', 'gallery_audios',
    'donations', 'expenses', 'sponsors', 'announcements', 'contacts', 'website_settings', 'auction_items'
  ] loop
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.write_audit_log()', table_name);
  end loop;
end;
$$;

alter table public.users enable row level security;
alter table public.volunteers enable row level security;
alter table public.events enable row level security;
alter table public.gallery_images enable row level security;
alter table public.gallery_videos enable row level security;
alter table public.gallery_audios enable row level security;
alter table public.donations enable row level security;
alter table public.expenses enable row level security;
alter table public.sponsors enable row level security;
alter table public.announcements enable row level security;
alter table public.contacts enable row level security;
alter table public.website_settings enable row level security;
alter table public.auction_items enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can view their own profile or admins can view all"
  on public.users for select to authenticated
  using (id = (select auth.uid()) or (select public.is_committee_admin()));
create policy "Only super admins can manage user roles"
  on public.users for update to authenticated
  using ((select public.is_super_admin()))
  with check ((select public.is_super_admin()));

create policy "Public can submit volunteer applications"
  on public.volunteers for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "Admins can manage volunteer applications"
  on public.volunteers for all to authenticated
  using ((select public.is_committee_admin()))
  with check ((select public.is_committee_admin()));

create policy "Public can read published events"
  on public.events for select to anon, authenticated using (is_published);
create policy "Admins can manage events"
  on public.events for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can read published gallery images"
  on public.gallery_images for select to anon, authenticated using (is_published);
create policy "Admins can manage gallery images"
  on public.gallery_images for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can read published gallery videos"
  on public.gallery_videos for select to anon, authenticated using (is_published);
create policy "Admins can manage gallery videos"
  on public.gallery_videos for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can read published gallery audios"
  on public.gallery_audios for select to anon, authenticated using (is_published);
create policy "Admins can manage gallery audios"
  on public.gallery_audios for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Admins can manage donations"
  on public.donations for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));
create policy "Admins can manage expenses"
  on public.expenses for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));
create policy "Admins can manage auction items"
  on public.auction_items for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can read published sponsors"
  on public.sponsors for select to anon, authenticated using (is_published);
create policy "Admins can manage sponsors"
  on public.sponsors for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can read active announcements"
  on public.announcements for select to anon, authenticated
  using (is_published and starts_at <= now() and (ends_at is null or ends_at >= now()));
create policy "Admins can manage announcements"
  on public.announcements for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can submit contact messages"
  on public.contacts for insert to anon, authenticated
  with check (status = 'new');
create policy "Admins can manage contact messages"
  on public.contacts for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Public can view public website settings"
  on public.website_settings for select to anon, authenticated using (is_public);
create policy "Admins can manage website settings"
  on public.website_settings for all to authenticated using ((select public.is_committee_admin())) with check ((select public.is_committee_admin()));

create policy "Admins can view audit history"
  on public.audit_logs for select to authenticated using ((select public.is_committee_admin()));

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;
revoke all on function public.log_admin_auth_event(text) from public;
grant execute on function public.log_admin_auth_event(text) to anon, authenticated;
grant select, insert, update on public.users to authenticated;
grant select on public.events, public.gallery_images, public.gallery_videos, public.gallery_audios, public.sponsors, public.announcements to anon, authenticated;
grant select, insert on public.volunteers, public.contacts to anon, authenticated;
grant select, insert, update, delete on public.events, public.gallery_images, public.gallery_videos, public.gallery_audios, public.donations, public.expenses, public.sponsors, public.announcements, public.auction_items, public.website_settings to authenticated;
grant execute on function public.public_festival_summary() to anon, authenticated;
grant execute on function public.public_donation_wall() to anon, authenticated;
grant execute on function public.public_expense_summary() to anon, authenticated;
grant execute on function public.public_expense_ledger() to anon, authenticated;
grant execute on function public.public_auction_items() to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'festival-media',
  'festival-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view festival media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'festival-media');
create policy "Admins can upload festival media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'festival-media' and (select public.is_committee_admin()));
create policy "Admins can update festival media"
  on storage.objects for update to authenticated
  using (bucket_id = 'festival-media' and (select public.is_committee_admin()))
  with check (bucket_id = 'festival-media' and (select public.is_committee_admin()));
create policy "Admins can delete festival media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'festival-media' and (select public.is_committee_admin()));

notify pgrst, 'reload schema';
