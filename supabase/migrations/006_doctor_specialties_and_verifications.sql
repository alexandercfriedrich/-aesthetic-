-- n-n: doctor_profiles <-> specialties
create table public.doctor_specialties (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (doctor_id, specialty_id)
);

create index idx_doctor_specialties_doctor on public.doctor_specialties(doctor_id);
create index idx_doctor_specialties_specialty on public.doctor_specialties(specialty_id);

-- doctor verifications (1-n)
create table public.doctor_verifications (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  verified_by uuid references public.app_users(id) on delete set null,
  verification_level public.verification_level not null,
  method text not null,
  notes text,
  document_paths text[] not null default '{}',
  verified_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_doctor_verifications_doctor on public.doctor_verifications(doctor_id);

alter table public.doctor_specialties enable row level security;
alter table public.doctor_verifications enable row level security;

create policy "doctor_specialties_public_read" on public.doctor_specialties for select to anon, authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = doctor_specialties.doctor_id and d.profile_status = 'published'));

create policy "doctor_specialties_owner_manage" on public.doctor_specialties for all to authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = doctor_specialties.doctor_id and d.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.doctor_profiles d where d.id = doctor_specialties.doctor_id and d.owner_user_id = auth.uid()));

create policy "doctor_verifications_owner_read" on public.doctor_verifications for select to authenticated
  using (exists (select 1 from public.doctor_profiles d where d.id = doctor_verifications.doctor_id and d.owner_user_id = auth.uid()));
