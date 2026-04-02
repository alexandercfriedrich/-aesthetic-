create extension if not exists pgcrypto;
create extension if not exists unaccent;
create extension if not exists pg_trgm;
create extension if not exists citext;

-- normalize_text: lowercases, strips accents, collapses whitespace.
-- We cast 'unaccent'::regdictionary so Postgres resolves it at definition
-- time and considers the call IMMUTABLE (safe for indexes & triggers).
create or replace function public.normalize_text(input text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select trim(
    regexp_replace(
      lower(unaccent('unaccent'::regdictionary, coalesce(input, ''))),
      '\s+', ' ', 'g'
    )
  );
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(unaccent('unaccent'::regdictionary, coalesce(input, ''))),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.user_role as enum ('admin', 'editor', 'doctor', 'staff', 'user');
create type public.profile_status as enum ('draft', 'published', 'hidden', 'suspended');
create type public.verification_level as enum ('none', 'basic', 'document', 'editorial');
create type public.claim_status as enum ('initiated', 'email_sent', 'otp_verified', 'document_pending', 'manual_review', 'approved', 'rejected');
create type public.lead_status as enum ('new', 'sent', 'viewed', 'contacted', 'won', 'lost', 'spam');
create type public.review_verification_status as enum ('unverified', 'email', 'document', 'editorial');
create type public.review_moderation_status as enum ('pending', 'published', 'rejected', 'flagged');
create type public.media_visibility as enum ('public', 'private', 'premium', 'internal');
create type public.media_kind as enum ('portrait', 'clinic', 'certificate', 'logo', 'gallery', 'other');
create type public.procedure_type as enum ('operation', 'behandlung');

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();
