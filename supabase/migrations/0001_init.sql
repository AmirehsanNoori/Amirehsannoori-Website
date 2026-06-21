-- =============================================================================
-- AEN website — initial schema (MVP + lightly future-proofed)
-- Apply once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent guards on tables, policies, triggers).
-- Amounts: prices/payments are stored in IRR *Rial* (the unit Iranian gateways
-- use), as integers. Convert to Toman only for display.
-- =============================================================================

-- ---------- helper: keep updated_at fresh -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles (extends auth.users) -----------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text,
  phone            text,
  preferred_locale text not null default 'fa' check (preferred_locale in ('fa','en')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- session_types (consultation tiers) ------------------------------
create table if not exists public.session_types (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name_fa           text not null,
  name_en           text not null,
  description_fa    text,
  description_en    text,
  duration_minutes  int  not null,
  price_irr         bigint not null default 0,   -- Rial; 0 for free tiers
  price_usd         numeric(10,2) not null default 0,
  is_free           boolean not null default false,
  is_active         boolean not null default true,
  cal_event_type_id text,                        -- Cal.com mapping (set later)
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

-- ---------- bookings --------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles (id) on delete set null,
  session_type_id uuid references public.session_types (id),
  status          text not null default 'pending'
                    check (status in ('pending','paid','confirmed','cancelled','completed')),
  scheduled_at    timestamptz,
  locale          text not null default 'fa',
  cal_booking_uid text,                          -- Cal.com booking reference
  guest_name      text,
  guest_email     text,
  amount          bigint,                        -- Rial, snapshot at booking time
  currency        text not null default 'IRR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

-- ---------- payments --------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  provider     text not null check (provider in ('idpay','zarinpal','stripe','manual')),
  provider_ref text,                             -- gateway authority / txn id
  amount       bigint not null,                  -- Rial (or smallest unit for Stripe)
  currency     text not null default 'IRR',
  status       text not null default 'pending'
                 check (status in ('pending','succeeded','failed','refunded')),
  receipt_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists payments_booking_id_idx on public.payments (booking_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- ---------- leads (contact form) --------------------------------------------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text,
  locale     text not null default 'fa',
  source     text not null default 'contact_form',
  created_at timestamptz not null default now()
);

-- ---------- newsletter_subscribers (future, provisioned now) ----------------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  locale     text not null default 'fa',
  confirmed  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- updated_at triggers ---------------------------------------------
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- auto-create a profile when a user signs up ----------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles               enable row level security;
alter table public.session_types          enable row level security;
alter table public.bookings               enable row level security;
alter table public.payments               enable row level security;
alter table public.leads                  enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- profiles: each user sees/edits only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

-- session_types: anyone can read active tiers (public pricing)
drop policy if exists "session_types_read_active" on public.session_types;
create policy "session_types_read_active" on public.session_types
  for select to anon, authenticated using (is_active = true);

-- bookings: users read only their own (writes go through the server/service-role)
drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select to authenticated using ((select auth.uid()) = user_id);

-- payments: users read only their own (writes go through the server/service-role)
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

-- leads: anyone may submit; nobody reads via the public API (service-role only)
drop policy if exists "leads_insert_any" on public.leads;
create policy "leads_insert_any" on public.leads
  for insert to anon, authenticated with check (true);

-- newsletter: anyone may subscribe; reads are service-role only
drop policy if exists "newsletter_insert_any" on public.newsletter_subscribers;
create policy "newsletter_insert_any" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

-- =============================================================================
-- Seed: the two launch consultation tiers (prices are placeholders — update!)
-- =============================================================================
insert into public.session_types
  (slug, name_fa, name_en, duration_minutes, price_irr, price_usd, is_free, sort_order)
values
  ('discovery', 'جلسهٔ آشنایی', 'Discovery Call', 30, 0, 0, true, 1),
  ('strategy',  'جلسهٔ استراتژی', 'Strategy Session', 60, 0, 0, false, 2)
on conflict (slug) do nothing;
