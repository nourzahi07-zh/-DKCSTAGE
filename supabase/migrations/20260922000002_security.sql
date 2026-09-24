-- =============================================================================
-- DKC - 2/3 : profile creation, role protection, Row Level Security
-- =============================================================================
-- Principle: the publishable key is public, so anyone can call the Supabase
-- API directly. Every rule below is therefore enforced HERE, in the database,
-- not only in the Next.js code.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Automatic profile creation on sign-up
-- The role is ALWAYS 'patient' (column default). Sign-up metadata is only used
-- for the name and phone, never for the role. Admins are promoted manually
-- from the SQL editor (see README "Creating the first admin").
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
  v_phone text := trim(coalesce(new.raw_user_meta_data ->> 'phone', ''));
begin
  if char_length(v_name) < 2 then
    v_name := 'Patient';
  end if;
  if v_phone !~ '^\+?[0-9 ]{8,20}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, email, full_name, phone)
  values (new.id, coalesce(new.email, ''), v_name, v_phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their e-mail in Auth.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- 2. Role helper used by the policies
-- SECURITY DEFINER so it can read profiles without triggering RLS recursion.
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_active
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Protected profile columns
-- Through the API (roles anon/authenticated):
--   * nobody can change id, email, role or created_at - not even an admin;
--   * only an admin can change is_active, and never on their own account.
-- Direct SQL by the project owner (SQL editor, migrations) is not affected:
-- that is the approved way to promote the first admin.
-- ---------------------------------------------------------------------------
create function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id <> old.id
     or new.role <> old.role
     or new.email <> old.email
     or new.created_at <> old.created_at then
    raise exception 'DKC_FORBIDDEN_FIELD' using errcode = '42501';
  end if;

  if new.is_active <> old.is_active then
    if not public.is_admin() or new.id = (select auth.uid()) then
      raise exception 'DKC_FORBIDDEN_FIELD' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- 4. Table privileges (first layer) + Row Level Security (second layer)
-- ---------------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.services                enable row level security;
alter table public.availability_rules      enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments            enable row level security;

-- Anonymous visitors only ever read active services (and call the slot
-- function, see 0003). Everything else is closed to them.
revoke all on public.profiles, public.availability_rules,
              public.availability_exceptions, public.appointments from anon;
revoke insert, update, delete on public.services from anon;

-- Profiles are created by the trigger only and never deleted through the API.
revoke insert, delete on public.profiles from authenticated;

-- Appointments are written ONLY through the functions in 0003
-- (book / cancel / change status), which check every business rule.
revoke insert, update, delete on public.appointments from authenticated;

-- profiles ------------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own or admin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- services ------------------------------------------------------------------
create policy "services: read active, admin reads all"
  on public.services for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "services: admin insert"
  on public.services for insert to authenticated
  with check ((select public.is_admin()));

create policy "services: admin update"
  on public.services for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Deleting a service that has appointments is blocked by the foreign key.
create policy "services: admin delete"
  on public.services for delete to authenticated
  using ((select public.is_admin()));

-- availability (admin only; the public sees free slots through
-- get_available_slots(), never the raw schedule or exception reasons) -------
create policy "availability_rules: admin all"
  on public.availability_rules for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "availability_exceptions: admin all"
  on public.availability_exceptions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- appointments (read only; writes go through functions) --------------------
create policy "appointments: read own or admin"
  on public.appointments for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 5. Internal functions are not callable through the API
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.protect_profile_columns()  from public, anon, authenticated;
revoke execute on function public.set_updated_at()           from public, anon, authenticated;
-- is_admin() is used inside policies evaluated for visitors too (services);
-- for them it simply returns false.
revoke execute on function public.is_admin()                 from public;
grant  execute on function public.is_admin()                 to anon, authenticated;
