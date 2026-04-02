-- 008_imports_and_ops.sql
-- Import staging, dedupe, job tracking, publish queue and claim extension

-- -----------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------

create type public.import_batch_status as enum (
  'created',
  'running',
  'needs_review',
  'completed',
  'failed'
);

create type public.import_candidate_status as enum (
  'new',
  'matched',
  'needs_review',
  'approved',
  'rejected',
  'merged'
);

create type public.merge_decision as enum (
  'create_new',
  'merge_into_existing',
  'ignore'
);

create type public.claim_verification_method as enum (
  'email_domain',
  'document_upload',
  'phone_callback',
  'manual'
);

-- -----------------------------------------------------------------------
-- Import batches
-- -----------------------------------------------------------------------

create table public.import_batches (
  id                uuid primary key default gen_random_uuid(),
  source_type       text not null,
  source_label      text not null,
  started_by        uuid references public.app_users(id) on delete set null,
  status            public.import_batch_status not null default 'created',
  raw_file_path     text,
  total_rows        int not null default 0,
  processed_rows    int not null default 0,
  approved_rows     int not null default 0,
  rejected_rows     int not null default 0,
  error_count       int not null default 0,
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_import_batches_updated_at
before update on public.import_batches
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------
-- Import candidates (staging rows per batch)
-- -----------------------------------------------------------------------

create table public.import_candidates (
  id                        uuid primary key default gen_random_uuid(),
  batch_id                  uuid not null references public.import_batches(id) on delete cascade,
  entity_kind               text not null check (entity_kind in ('doctor','clinic')),
  status                    public.import_candidate_status not null default 'new',
  source_external_id        text,
  source_url                text,
  raw_json                  jsonb not null,
  normalized_name           text,
  normalized_website_domain text,
  normalized_phone          text,
  city                      text,
  postal_code               text,
  specialty_text            text,
  confidence_score          numeric(5,4) not null default 0,
  matched_doctor_id         uuid references public.doctor_profiles(id) on delete set null,
  matched_clinic_id         uuid references public.clinic_profiles(id) on delete set null,
  merge_decision            public.merge_decision,
  reviewer_id               uuid references public.app_users(id) on delete set null,
  reviewer_notes            text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_import_candidates_batch    on public.import_candidates(batch_id, status);
create index idx_import_candidates_matched  on public.import_candidates(matched_doctor_id) where matched_doctor_id is not null;

create trigger trg_import_candidates_updated_at
before update on public.import_candidates
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------
-- Merge events (audit trail of merge decisions)
-- -----------------------------------------------------------------------

create table public.merge_events (
  id                uuid primary key default gen_random_uuid(),
  candidate_id      uuid not null references public.import_candidates(id) on delete cascade,
  target_doctor_id  uuid references public.doctor_profiles(id) on delete set null,
  target_clinic_id  uuid references public.clinic_profiles(id) on delete set null,
  decided_by        uuid references public.app_users(id) on delete set null,
  decision          public.merge_decision not null,
  before_json       jsonb,
  after_json        jsonb,
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------
-- Job runs (cron + manual + webhook)
-- -----------------------------------------------------------------------

create table public.job_runs (
  id            uuid primary key default gen_random_uuid(),
  job_name      text not null,
  trigger_type  text not null check (trigger_type in ('manual','cron','webhook')),
  status        text not null check (status in ('running','success','failed')),
  started_by    uuid references public.app_users(id) on delete set null,
  input_json    jsonb,
  output_json   jsonb,
  error_text    text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index idx_job_runs_name_status on public.job_runs(job_name, status, started_at desc);

-- -----------------------------------------------------------------------
-- Extend profile_claims with claim verification fields
-- -----------------------------------------------------------------------

alter table public.profile_claims
  add column if not exists verification_method  public.claim_verification_method,
  add column if not exists assigned_to          uuid references public.app_users(id) on delete set null,
  add column if not exists reviewed_at          timestamptz,
  add column if not exists approved_user_id     uuid references public.app_users(id) on delete set null;

-- -----------------------------------------------------------------------
-- Publish queue view
-- -----------------------------------------------------------------------

create or replace view public.publish_queue as
select
  d.id,
  d.slug,
  d.public_display_name,
  d.profile_status,
  d.is_claimed,
  d.is_verified,
  d.is_premium,
  d.source_confidence,
  exists (
    select 1 from public.locations l where l.doctor_id = d.id
  ) as has_location,
  exists (
    select 1 from public.doctor_procedures dp
    where dp.doctor_id = d.id and dp.is_active = true
  ) as has_procedure,
  (d.primary_specialty_id is not null) as has_specialty
from public.doctor_profiles d
where d.profile_status in ('draft','hidden');

-- -----------------------------------------------------------------------
-- Review moderation queue view
-- -----------------------------------------------------------------------

create or replace view public.review_moderation_queue as
select
  r.id,
  r.doctor_id,
  d.public_display_name,
  d.slug as doctor_slug,
  r.rating_overall,
  r.title,
  r.body,
  r.verification_status,
  r.moderation_status,
  r.created_at
from public.reviews r
join public.doctor_profiles d on d.id = r.doctor_id
where r.moderation_status in ('pending','flagged')
order by r.created_at asc;
