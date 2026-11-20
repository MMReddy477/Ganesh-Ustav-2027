create table if not exists public.gallery_audios (
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

create index if not exists gallery_audios_order_idx
  on public.gallery_audios (is_published, created_at desc);

alter table public.gallery_audios enable row level security;

drop policy if exists "Public can read published gallery audios" on public.gallery_audios;
create policy "Public can read published gallery audios"
  on public.gallery_audios for select to anon, authenticated using (is_published);

drop policy if exists "Admins can manage gallery audios" on public.gallery_audios;
create policy "Admins can manage gallery audios"
  on public.gallery_audios for all to authenticated
  using ((select public.is_committee_admin()))
  with check ((select public.is_committee_admin()));

grant select on public.gallery_audios to anon, authenticated;
grant select, insert, update, delete on public.gallery_audios to authenticated;
