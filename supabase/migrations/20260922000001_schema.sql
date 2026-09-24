-- =============================================================================
-- DKC - 1/3 : tables, types, constraints, indexes
-- =============================================================================
-- Reading order: 0001 schema -> 0002 security (auth trigger + RLS) ->
-- 0003 appointment functions. Each file is safe to read on its own.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('patient', 'admin');

create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

-- One practitioner (Rihab): cabinet and home visits share ONE calendar.
create type public.location_type as enum ('cabinet', 'home');

create type public.service_category as enum ('kinesitherapie', 'massage', 'hijama', 'diabetes_care');

-- 'session' = price of one session, 'package' = price of a programme/pack.
create type public.price_type as enum ('session', 'package');

-- ---------------------------------------------------------------------------
-- updated_at helper (used by every table below)
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles : one row per Supabase Auth user (created by a trigger, see 0002)
-- No medical data is stored here on purpose.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null check (char_length(full_name) between 2 and 100),
  email         text not null,
  phone         text check (phone is null or phone ~ '^\+?[0-9 ]{8,20}$'),
  date_of_birth date check (date_of_birth is null or date_of_birth >= date '1900-01-01'),
  role          public.user_role not null default 'patient',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services : the cabinet catalogue, managed by the admin
-- price NULL = "Tarif sur demande" (the app never invents a price).
-- Services are deactivated, not deleted, once used (see appointments FK).
-- ---------------------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique check (char_length(name) between 2 and 120),
  description       text not null default '' check (char_length(description) <= 2000),
  category          public.service_category not null,
  price             numeric(10, 2) check (price is null or price >= 0),
  price_type        public.price_type not null default 'session',
  sessions_included smallint check (sessions_included is null or sessions_included between 2 and 100),
  duration_minutes  smallint not null
                    check (duration_minutes between 15 and 480 and duration_minutes % 15 = 0),
  at_cabinet        boolean not null default true,
  at_home           boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint services_location_check check (at_cabinet or at_home),
  constraint services_sessions_check check (price_type = 'package' or sessions_included is null)
);

create index services_active_category_idx on public.services (is_active, category);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_rules : the normal weekly schedule
-- weekday uses ISO numbering: 1 = lundi ... 7 = dimanche.
-- Several rows per weekday are allowed (e.g. 09:00-12:00 and 14:00-18:00).
-- ---------------------------------------------------------------------------
create table public.availability_rules (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_time_check check (start_time < end_time and end_time < time '24:00')
);

create index availability_rules_weekday_idx on public.availability_rules (weekday);

create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_exceptions : a specific date that differs from the weekly rules
--   is_closed = true  -> the cabinet is closed that day (holiday, leave...)
--   is_closed = false -> these hours REPLACE the weekly hours for that date
-- If a date has a "closed" row, the date is closed whatever else exists.
-- ---------------------------------------------------------------------------
create table public.availability_exceptions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  is_closed  boolean not null default false,
  start_time time,
  end_time   time,
  reason     text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_exceptions_time_check check (
    (is_closed and start_time is null and end_time is null)
    or (not is_closed and start_time is not null and end_time is not null
        and start_time < end_time and end_time < time '24:00')
  )
);

create index availability_exceptions_date_idx on public.availability_exceptions (date);

create trigger availability_exceptions_set_updated_at
  before update on public.availability_exceptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- appointments
-- end_time is always computed by book_appointment() from the service duration.
-- ON DELETE RESTRICT: a patient or a service that has appointments cannot be
-- deleted, so the history can never point at nothing.
-- ---------------------------------------------------------------------------
create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.profiles (id) on delete restrict,
  service_id       uuid not null references public.services (id) on delete restrict,
  appointment_date date not null,
  start_time       time not null,
  end_time         time not null,
  location_type    public.location_type not null,
  home_address     text,
  status           public.appointment_status not null default 'pending',
  patient_notes    text check (patient_notes is null or char_length(patient_notes) <= 500),
  cancelled_by     public.user_role,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- The time interval of the appointment, used by the anti-overlap rule below.
  slot tsrange generated always as (
    tsrange(appointment_date + start_time, appointment_date + end_time, '[)')
  ) stored,

  constraint appointments_time_check check (start_time < end_time),
  constraint appointments_home_address_check check (
    (location_type = 'cabinet' and home_address is null)
    or (location_type = 'home' and char_length(home_address) between 5 and 300)
  ),
  constraint appointments_cancel_check check (
    (status = 'cancelled') = (cancelled_at is not null and cancelled_by is not null)
  ),

  -- DOUBLE-BOOKING GUARANTEE, enforced by PostgreSQL itself:
  -- two active (pending/confirmed) appointments can never overlap in time,
  -- whatever their location - Rihab cannot be in two places at once.
  -- This also closes race conditions: if two patients book the same slot at
  -- the same moment, the second INSERT fails.
  constraint appointments_no_overlap exclude using gist (slot with &&)
    where (status in ('pending', 'confirmed'))
);

create index appointments_patient_date_idx on public.appointments (patient_id, appointment_date desc);
create index appointments_date_status_idx on public.appointments (appointment_date, status);
create index appointments_service_idx on public.appointments (service_id);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();
