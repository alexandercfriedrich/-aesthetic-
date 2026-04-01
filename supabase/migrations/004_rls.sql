alter table public.app_users enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.clinic_profiles enable row level security;
alter table public.locations enable row level security;
alter table public.doctor_procedures enable row level security;
alter table public.profile_claims enable row level security;
alter table public.lead_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.media_assets enable row level security;

-- app_users
create policy "app_users_select_own" on public.app_users for select to authenticated using (id = auth.uid());
create policy "app_users_update_own" on public.app_users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "app_users_insert_own" on public.app_users for insert to authenticated with check (id = auth.uid());

-- doctor_profiles
create policy "doctor_profiles_public_read_published" on public.doctor_profiles for select to anon, authenticated using (profile_status = 'published');
create policy "doctor_profiles_owner_read" on public.doctor_profiles for select to authenticated using (owner_user_id = auth.uid());
create policy "doctor_profiles_owner_update" on public.doctor_profiles for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- clinic_profiles
create policy "clinic_profiles_public_read_published" on public.clinic_profiles for select to anon, authenticated using (profile_status = 'published');
create policy "clinic_profiles_owner_update" on public.clinic_profiles for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- locations
create policy "locations_public_read" on public.locations for select to anon, authenticated using (
  exists (select 1 from public.doctor_profiles d where d.id = locations.doctor_id and d.profile_status = 'published')
  or exists (select 1 from public.clinic_profiles c where c.id = locations.clinic_id and c.profile_status = 'published')
);
create policy "locations_doctor_owner_manage" on public.locations for all to authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = locations.doctor_id and d.owner_user_id = auth.uid()) or exists (select 1 from public.clinic_profiles c where c.id = locations.clinic_id and c.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.doctor_profiles d where d.id = locations.doctor_id and d.owner_user_id = auth.uid()) or exists (select 1 from public.clinic_profiles c where c.id = locations.clinic_id and c.owner_user_id = auth.uid()));

-- doctor_procedures
create policy "doctor_procedures_public_read" on public.doctor_procedures for select to anon, authenticated using (exists (select 1 from public.doctor_profiles d where d.id = doctor_procedures.doctor_id and d.profile_status = 'published'));
create policy "doctor_procedures_owner_manage" on public.doctor_procedures for all to authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = doctor_procedures.doctor_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.doctor_profiles d where d.id = doctor_procedures.doctor_id and d.owner_user_id = auth.uid()));

-- profile_claims
create policy "profile_claims_insert_authenticated" on public.profile_claims for insert to authenticated with check (claimant_user_id = auth.uid());
create policy "profile_claims_read_own" on public.profile_claims for select to authenticated using (claimant_user_id = auth.uid());
create policy "profile_claims_update_own_pending" on public.profile_claims for update to authenticated
  using (claimant_user_id = auth.uid() and status in ('initiated', 'email_sent', 'otp_verified', 'document_pending'))
  with check (claimant_user_id = auth.uid());

-- lead_requests
create policy "lead_requests_public_insert" on public.lead_requests for insert to anon, authenticated with check (consent_privacy = true and consent_data_forwarding = true);
create policy "lead_requests_doctor_read_own" on public.lead_requests for select to authenticated using (exists (select 1 from public.doctor_profiles d where d.id = lead_requests.doctor_id and d.owner_user_id = auth.uid()));
create policy "lead_requests_doctor_update_own" on public.lead_requests for update to authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = lead_requests.doctor_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.doctor_profiles d where d.id = lead_requests.doctor_id and d.owner_user_id = auth.uid()));

-- reviews
create policy "reviews_public_read_published" on public.reviews for select to anon, authenticated using (moderation_status = 'published');
create policy "reviews_public_insert" on public.reviews for insert to anon, authenticated with check (rating_overall between 1 and 5);
create policy "reviews_doctor_read_own" on public.reviews for select to authenticated using (exists (select 1 from public.doctor_profiles d where d.id = reviews.doctor_id and d.owner_user_id = auth.uid()));

-- media_assets
create policy "media_assets_public_read_public" on public.media_assets for select to anon, authenticated using (visibility = 'public' and approved_at is not null);
create policy "media_assets_owner_manage" on public.media_assets for all to authenticated
  using (uploaded_by = auth.uid() or exists (select 1 from public.doctor_profiles d where d.id = media_assets.doctor_id and d.owner_user_id = auth.uid()) or exists (select 1 from public.clinic_profiles c where c.id = media_assets.clinic_id and c.owner_user_id = auth.uid()))
  with check (uploaded_by = auth.uid() or exists (select 1 from public.doctor_profiles d where d.id = media_assets.doctor_id and d.owner_user_id = auth.uid()) or exists (select 1 from public.clinic_profiles c where c.id = media_assets.clinic_id and c.owner_user_id = auth.uid()));
