-- =============================================================================
-- DKC - 3/3 : appointment engine (slots, booking, cancellation, status)
-- =============================================================================
-- All appointment WRITES go through these functions. They run as SECURITY
-- DEFINER (with a fixed search_path) and check every rule themselves:
-- who is calling (auth.uid()), what they are allowed to do, and whether the
-- time is really free. Errors are raised as stable codes ('DKC_...') that the
-- Next.js app translates into French messages.
--
-- Booking rules (easy to change here, in one place):
--   * slot grid             : every 30 minutes from the start of a window
--   * minimum notice        : 2 hours before the appointment
--   * booking horizon       : up to 60 days ahead
--   * active appointments   : max 10 upcoming pending/confirmed per patient
--   * all times are Morocco time (Africa/Casablanca)
-- =============================================================================

-- Current date/time in Morocco, as a plain timestamp (no time zone).
create function public.now_local()
returns timestamp
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Casablanca');
$$;

-- ---------------------------------------------------------------------------
-- get_available_slots : the ONE definition of "what is bookable".
-- Used to display slots AND to validate every booking, so they can't differ.
-- Returns only times - never any information about other patients.
-- ---------------------------------------------------------------------------
create function public.get_available_slots(p_service_id uuid, p_date date)
returns table (start_time time, end_time time)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_duration  interval;
  v_now       timestamp := public.now_local();
  v_step      constant interval := interval '30 minutes';
  v_notice    constant interval := interval '2 hours';
  v_horizon   constant integer  := 60;
begin
  select make_interval(mins => s.duration_minutes) into v_duration
  from public.services s
  where s.id = p_service_id and s.is_active;

  if v_duration is null
     or p_date is null
     or p_date < v_now::date
     or p_date > v_now::date + v_horizon then
    return;
  end if;

  return query
  with windows as (
    -- 1) Exceptions for this date (if any) replace the weekly schedule...
    select e.start_time as w_start, e.end_time as w_end
    from public.availability_exceptions e
    where e.date = p_date and not e.is_closed
      and not exists (
        select 1 from public.availability_exceptions c
        where c.date = p_date and c.is_closed)
    union all
    -- 2) ...otherwise the weekly rules of that weekday apply.
    select r.start_time, r.end_time
    from public.availability_rules r
    where r.weekday = extract(isodow from p_date)::integer
      and not exists (
        select 1 from public.availability_exceptions e where e.date = p_date)
  ),
  candidates as (
    select distinct g.slot_start
    from windows w
    cross join lateral generate_series(
      p_date + w.w_start,
      p_date + w.w_end - v_duration,   -- the whole service must fit
      v_step) as g(slot_start)
  )
  select c.slot_start::time, (c.slot_start + v_duration)::time
  from candidates c
  where c.slot_start >= v_now + v_notice
    and not exists (
      select 1 from public.appointments a
      where a.status in ('pending', 'confirmed')
        and a.slot && tsrange(c.slot_start, c.slot_start + v_duration, '[)'))
  order by 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- book_appointment : a patient books a slot for THEMSELF.
-- patient_id comes from auth.uid(), never from the caller.
-- Returns the new appointment id. The new appointment is always 'pending'.
-- ---------------------------------------------------------------------------
create function public.book_appointment(
  p_service_id   uuid,
  p_date         date,
  p_start_time   time,
  p_location     public.location_type,
  p_home_address text default null,
  p_notes        text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_service public.services%rowtype;
  v_address text := nullif(trim(coalesce(p_home_address, '')), '');
  v_notes   text := left(nullif(trim(coalesce(p_notes, '')), ''), 500);
  v_id      uuid;
begin
  if v_uid is null then
    raise exception 'DKC_NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_uid and role = 'patient' and is_active) then
    raise exception 'DKC_FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_service from public.services where id = p_service_id and is_active;
  if not found then
    raise exception 'DKC_SERVICE_UNAVAILABLE';
  end if;

  if (p_location = 'cabinet' and not v_service.at_cabinet)
     or (p_location = 'home' and not v_service.at_home) then
    raise exception 'DKC_LOCATION_NOT_OFFERED';
  end if;

  if p_location = 'home' then
    if v_address is null or char_length(v_address) not between 5 and 300 then
      raise exception 'DKC_HOME_ADDRESS_REQUIRED';
    end if;
  else
    v_address := null;
  end if;

  if (select count(*) from public.appointments a
      where a.patient_id = v_uid
        and a.status in ('pending', 'confirmed')
        and a.appointment_date + a.start_time > public.now_local()) >= 10 then
    raise exception 'DKC_TOO_MANY_APPOINTMENTS';
  end if;

  if not exists (
    select 1 from public.get_available_slots(p_service_id, p_date) s
    where s.start_time = p_start_time) then
    raise exception 'DKC_SLOT_UNAVAILABLE';
  end if;

  begin
    insert into public.appointments (
      patient_id, service_id, appointment_date, start_time, end_time,
      location_type, home_address, patient_notes)
    values (
      v_uid, p_service_id, p_date, p_start_time,
      p_start_time + make_interval(mins => v_service.duration_minutes),
      p_location, v_address, v_notes)
    returning id into v_id;
  exception when exclusion_violation then
    -- Someone else took (part of) this time a split second earlier.
    raise exception 'DKC_SLOT_TAKEN';
  end;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_appointment : the patient who owns it (before it starts) or an admin.
-- Another patient's id behaves exactly like a non-existent id (no leak).
-- ---------------------------------------------------------------------------
create function public.cancel_appointment(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_appt     public.appointments%rowtype;
begin
  if v_uid is null then
    raise exception 'DKC_NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_appt from public.appointments where id = p_id for update;
  if not found or (not v_is_admin and v_appt.patient_id <> v_uid) then
    raise exception 'DKC_NOT_FOUND';
  end if;

  if v_appt.status not in ('pending', 'confirmed') then
    raise exception 'DKC_INVALID_STATUS';
  end if;

  if not v_is_admin and v_appt.appointment_date + v_appt.start_time <= public.now_local() then
    raise exception 'DKC_TOO_LATE';
  end if;

  update public.appointments
  set status = 'cancelled',
      cancelled_by = case when v_is_admin then 'admin'::public.user_role
                          else 'patient'::public.user_role end,
      cancelled_at = now()
  where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_appointment_status : admin only. Allowed transitions:
--   pending   -> confirmed
--   confirmed -> completed   (only once the appointment has started)
--   pending / confirmed -> cancelled   (same as cancel_appointment)
-- ---------------------------------------------------------------------------
create function public.set_appointment_status(p_id uuid, p_status public.appointment_status)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_appt public.appointments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'DKC_FORBIDDEN' using errcode = '42501';
  end if;

  if p_status = 'cancelled' then
    perform public.cancel_appointment(p_id);
    return;
  end if;

  select * into v_appt from public.appointments where id = p_id for update;
  if not found then
    raise exception 'DKC_NOT_FOUND';
  end if;

  if not ((v_appt.status = 'pending' and p_status = 'confirmed')
          or (v_appt.status = 'confirmed' and p_status = 'completed')) then
    raise exception 'DKC_INVALID_STATUS';
  end if;

  if p_status = 'completed'
     and v_appt.appointment_date + v_appt.start_time > public.now_local() then
    raise exception 'DKC_NOT_STARTED';
  end if;

  update public.appointments set status = p_status where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------
revoke execute on function public.now_local()                                   from public;
revoke execute on function public.get_available_slots(uuid, date)               from public;
revoke execute on function public.book_appointment(uuid, date, time, public.location_type, text, text) from public, anon;
revoke execute on function public.cancel_appointment(uuid)                      from public, anon;
revoke execute on function public.set_appointment_status(uuid, public.appointment_status) from public, anon;

grant execute on function public.now_local()                     to anon, authenticated;
grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;
grant execute on function public.book_appointment(uuid, date, time, public.location_type, text, text) to authenticated;
grant execute on function public.cancel_appointment(uuid)        to authenticated;
grant execute on function public.set_appointment_status(uuid, public.appointment_status) to authenticated;
