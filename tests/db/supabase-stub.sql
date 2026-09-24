-- =============================================================================
-- Minimal stand-in for what a real Supabase project provides BEFORE our
-- migrations run, so the migrations can be tested in PGlite without Docker.
-- Mirrors Supabase: the anon/authenticated/service_role roles, the default
-- (broad) privileges Supabase grants on the public schema, an auth.users
-- table, and auth.uid() reading the JWT "sub" claim.
-- NOT used in production - only by tests/db.
-- =============================================================================
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase's defaults: API roles get every privilege on the public schema,
-- and RLS/revokes are what actually restrict them. Reproducing this is what
-- makes the tests meaningful.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
