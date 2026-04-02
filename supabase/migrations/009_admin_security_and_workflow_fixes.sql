-- 009_admin_security_and_workflow_fixes.sql
-- Follow-up security and workflow fixes for admin/backoffice flows.

-- -----------------------------------------------------------------------
-- Helper: admin/editor role check usable inside RLS
-- -----------------------------------------------------------------------
create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users u
    where u.id = auth.uid()
      and u.role in ('admin', 'editor')
  );
$$;

-- -----------------------------------------------------------------------
-- RLS additions for admin/editor and missing owner-read policy
-- -----------------------------------------------------------------------

-- clinic_profiles: missing owner read for non-published profiles
create policy "clinic_profiles_owner_read"
  on public.clinic_profiles
  for select
  to authenticated
  using (owner_user_id = auth.uid());

-- doctor_profiles: allow admin/editor backoffice access
create policy "doctor_profiles_admin_read"
  on public.doctor_profiles
  for select
  to authenticated
  using (public.is_admin_or_editor());

create policy "doctor_profiles_admin_update"
  on public.doctor_profiles
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

-- admin moderation/actions support on related tables
create policy "profile_claims_admin_read"
  on public.profile_claims
  for select
  to authenticated
  using (public.is_admin_or_editor());

create policy "profile_claims_admin_update"
  on public.profile_claims
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "reviews_admin_read"
  on public.reviews
  for select
  to authenticated
  using (public.is_admin_or_editor());

create policy "reviews_admin_update"
  on public.reviews
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "lead_requests_admin_read"
  on public.lead_requests
  for select
  to authenticated
  using (public.is_admin_or_editor());

create policy "lead_requests_admin_update"
  on public.lead_requests
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

-- -----------------------------------------------------------------------
-- Import/Ops tables: enable RLS + restrict to admin/editor
-- -----------------------------------------------------------------------
alter table public.import_batches enable row level security;
alter table public.import_candidates enable row level security;
alter table public.merge_events enable row level security;
alter table public.job_runs enable row level security;

create policy "import_batches_admin_all"
  on public.import_batches
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "import_candidates_admin_all"
  on public.import_candidates
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "merge_events_admin_all"
  on public.merge_events
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "job_runs_admin_all"
  on public.job_runs
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

-- -----------------------------------------------------------------------
-- Atomic claim approval RPC
-- -----------------------------------------------------------------------
create or replace function public.approve_doctor_claim(p_claim_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_claim public.profile_claims%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not public.is_admin_or_editor() then
    raise exception 'Kein Zugriff';
  end if;

  select *
  into v_claim
  from public.profile_claims
  where id = p_claim_id
  for update;

  if not found then
    raise exception 'Claim nicht gefunden';
  end if;

  if v_claim.doctor_id is null or v_claim.claimant_user_id is null then
    raise exception 'Claim hat keine Arzt-ID oder Claimant-ID';
  end if;

  update public.doctor_profiles
  set
    owner_user_id = v_claim.claimant_user_id,
    is_claimed = true,
    is_verified = true,
    verification_level = 'basic',
    last_verified_at = now()
  where id = v_claim.doctor_id;

  update public.profile_claims
  set
    status = 'approved',
    reviewed_at = now(),
    approved_user_id = auth.uid()
  where id = p_claim_id;
end;
$$;

-- -----------------------------------------------------------------------
-- City-search index support for normalized comparisons
-- -----------------------------------------------------------------------
create index if not exists idx_locations_city_norm_trgm
  on public.locations using gin (public.normalize_text(city) gin_trgm_ops);

create index if not exists idx_locations_city_norm_btree
  on public.locations (public.normalize_text(city));

