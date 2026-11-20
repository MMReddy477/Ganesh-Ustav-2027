create extension if not exists pgcrypto;
create sequence if not exists public.donation_receipt_sequence;

alter table public.donations
  add column if not exists transaction_reference text,
  add column if not exists receipt_no text,
  add column if not exists receipt_token text,
  add column if not exists receipt_url text,
  add column if not exists whatsapp_sent boolean not null default false,
  add column if not exists sms_sent boolean not null default false,
  add column if not exists sent_at timestamptz,
  add column if not exists whatsapp_status text not null default 'not_configured',
  add column if not exists sms_status text not null default 'not_configured',
  add column if not exists whatsapp_message_sid text,
  add column if not exists sms_message_sid text,
  add column if not exists whatsapp_error_code text,
  add column if not exists sms_error_code text;

create or replace function public.generate_donation_receipt_no()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'SGU/DON/2027/'
    || case
      when next_number < 100000 then lpad(next_number::text, 5, '0')
      else next_number::text
    end
  from (select nextval('public.donation_receipt_sequence'::regclass) as next_number) sequence_value;
$$;

do $$
declare
  highest_number bigint;
begin
  select coalesce(max(substring(receipt_no from '([0-9]+)$')::bigint), 0)
  into highest_number
  from public.donations
  where receipt_no ~ '^SGU/DON/2027/[0-9]+$';

  with numbered as (
    select id, row_number() over (order by created_at, id) as row_number
    from public.donations
    where receipt_no is null
      or receipt_no !~ '^SGU/DON/2027/[0-9]+$'
  )
  update public.donations as donation
  set receipt_no = 'SGU/DON/2027/'
    || case
      when highest_number + numbered.row_number < 100000
        then lpad((highest_number + numbered.row_number)::text, 5, '0')
      else (highest_number + numbered.row_number)::text
    end
  from numbered
  where donation.id = numbered.id;

  select coalesce(max(substring(receipt_no from '([0-9]+)$')::bigint), 0)
  into highest_number
  from public.donations
  where receipt_no ~ '^SGU/DON/2027/[0-9]+$';

  if highest_number = 0 then
    perform setval('public.donation_receipt_sequence'::regclass, 1, false);
  else
    perform setval('public.donation_receipt_sequence'::regclass, highest_number, true);
  end if;
end
$$;

update public.donations
set receipt_token = encode(gen_random_bytes(32), 'hex')
where receipt_token is null;

alter table public.donations
  alter column receipt_no set default public.generate_donation_receipt_no(),
  alter column receipt_no set not null,
  alter column receipt_token set default encode(gen_random_bytes(32), 'hex'),
  alter column receipt_token set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'donations_receipt_no_key'
      and conrelid = 'public.donations'::regclass
  ) then
    alter table public.donations
      add constraint donations_receipt_no_key unique (receipt_no);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'donations_receipt_token_key'
      and conrelid = 'public.donations'::regclass
  ) then
    alter table public.donations
      add constraint donations_receipt_token_key unique (receipt_token);
  end if;
end
$$;

update public.donations
set receipt_url = '/receipt/' || receipt_no || '?token=' || receipt_token;

create index if not exists donations_whatsapp_message_sid_idx
  on public.donations (whatsapp_message_sid)
  where whatsapp_message_sid is not null;

create index if not exists donations_sms_message_sid_idx
  on public.donations (sms_message_sid)
  where sms_message_sid is not null;

drop function if exists public.public_donation_receipt(text);

create or replace function public.public_donation_receipt(p_receipt_no text, p_receipt_token text)
returns table (
  receipt_no text,
  donor_name text,
  amount numeric,
  currency text,
  received_at timestamptz,
  plot_flat text,
  payment_method text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.receipt_no,
    coalesce(nullif(d.donor_name, ''), 'Community donor'),
    d.amount,
    d.currency::text,
    d.received_at,
    d.plot_flat,
    d.payment_method
  from public.donations d
  where d.receipt_no = p_receipt_no
    and d.receipt_token = p_receipt_token
    and d.payment_status = 'received'
  limit 1;
$$;

revoke all on function public.generate_donation_receipt_no() from public;
grant execute on function public.generate_donation_receipt_no() to authenticated, service_role;
revoke all on function public.public_donation_receipt(text, text) from public;
grant execute on function public.public_donation_receipt(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
