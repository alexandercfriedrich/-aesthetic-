create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_de text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.procedure_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_de text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_de text not null,
  synonyms text[] not null default '{}',
  category_id uuid references public.procedure_categories(id) on delete set null,
  procedure_type public.procedure_type not null,
  body_area text,
  intro_md text,
  risks_md text,
  recovery_md text,
  faq_md text,
  is_active boolean not null default true,
  search_text text generated always as (
    public.normalize_text(name_de || ' ' || array_to_string(synonyms, ' '))
  ) stored,
  fts tsvector generated always as (
    to_tsvector('simple', public.normalize_text(name_de || ' ' || array_to_string(synonyms, ' ')))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinic_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.app_users(id) on delete set null,
  slug text not null unique,
  name text not null,
  clinic_type text not null default 'ordination',
  about text,
  website_url text,
  phone text,
  email text,
  is_claimed boolean not null default false,
  is_verified boolean not null default false,
  verification_level public.verification_level not null default 'none',
  is_premium boolean not null default false,
  profile_status public.profile_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.app_users(id) on delete set null,
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  title_prefix text,
  title_suffix text,
  public_display_name text not null,
  gender text,
  primary_specialty_id uuid references public.specialties(id) on delete set null,
  short_bio text,
  long_bio text,
  years_experience int,
  languages text[] not null default '{}',
  website_url text,
  email_public text,
  phone_public text,
  is_claimed boolean not null default false,
  is_verified boolean not null default false,
  verification_level public.verification_level not null default 'none',
  is_premium boolean not null default false,
  profile_status public.profile_status not null default 'draft',
  source_confidence numeric(5,4) not null default 0,
  source_type text,
  source_url text,
  last_verified_at timestamptz,
  search_text text generated always as (
    public.normalize_text(
      coalesce(public_display_name,'') || ' ' ||
      coalesce(short_bio,'') || ' ' ||
      coalesce(long_bio,'')
    )
  ) stored,
  fts tsvector generated always as (
    setweight(to_tsvector('simple', public.normalize_text(coalesce(public_display_name,''))), 'A') ||
    setweight(to_tsvector('simple', public.normalize_text(coalesce(short_bio,''))), 'B') ||
    setweight(to_tsvector('simple', public.normalize_text(coalesce(long_bio,''))), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_clinic_links (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinic_profiles(id) on delete cascade,
  role_label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (doctor_id, clinic_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid references public.clinic_profiles(id) on delete cascade,
  country_code text not null default 'AT',
  state text,
  city text not null,
  district text,
  postal_code text,
  street text,
  house_number text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((doctor_id is not null) or (clinic_id is not null))
);

create table public.doctor_procedures (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  clinic_id uuid references public.clinic_profiles(id) on delete set null,
  years_offered int,
  description_short text,
  is_primary_focus boolean not null default false,
  price_from numeric(10,2),
  price_to numeric(10,2),
  currency text not null default 'EUR',
  price_note text,
  consultation_fee numeric(10,2),
  is_price_verified boolean not null default false,
  last_price_check_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, procedure_id, clinic_id)
);

create table public.profile_claims (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid references public.clinic_profiles(id) on delete cascade,
  claimant_user_id uuid references public.app_users(id) on delete cascade,
  claimant_email text not null,
  claimant_phone text,
  requested_role text not null default 'doctor',
  status public.claim_status not null default 'initiated',
  proof_type text,
  proof_value text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((doctor_id is not null) or (clinic_id is not null))
);

create table public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctor_profiles(id) on delete set null,
  clinic_id uuid references public.clinic_profiles(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  source_page_url text,
  source_page_type text,
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  preferred_contact text,
  preferred_time text,
  message text not null,
  consent_privacy boolean not null default false,
  consent_data_forwarding boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gclid text,
  is_qualified boolean,
  spam_score numeric(5,2),
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid references public.clinic_profiles(id) on delete set null,
  user_id uuid references public.app_users(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  rating_overall int not null check (rating_overall between 1 and 5),
  rating_consultation int check (rating_consultation between 1 and 5),
  rating_result int check (rating_result between 1 and 5),
  rating_staff int check (rating_staff between 1 and 5),
  title text,
  body text,
  visit_month int check (visit_month between 1 and 12),
  visit_year int check (visit_year between 2000 and 2100),
  verification_status public.review_verification_status not null default 'unverified',
  moderation_status public.review_moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctor_profiles(id) on delete cascade,
  clinic_id uuid references public.clinic_profiles(id) on delete cascade,
  uploaded_by uuid references public.app_users(id) on delete set null,
  bucket_id text not null,
  object_path text not null,
  mime_type text,
  width int,
  height int,
  alt_text text,
  visibility public.media_visibility not null default 'private',
  media_kind public.media_kind not null default 'other',
  sort_order int not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create trigger trg_procedures_updated_at
before update on public.procedures
for each row execute function public.set_updated_at();

create trigger trg_clinic_profiles_updated_at
before update on public.clinic_profiles
for each row execute function public.set_updated_at();

create trigger trg_doctor_profiles_updated_at
before update on public.doctor_profiles
for each row execute function public.set_updated_at();

create trigger trg_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create trigger trg_doctor_procedures_updated_at
before update on public.doctor_procedures
for each row execute function public.set_updated_at();

create trigger trg_profile_claims_updated_at
before update on public.profile_claims
for each row execute function public.set_updated_at();

create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();
