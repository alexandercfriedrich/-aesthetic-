-- App users (mirrors auth.users)
CREATE TABLE app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email citext NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Specialties
CREATE TABLE specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Procedure categories
CREATE TABLE procedure_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Procedures
CREATE TABLE procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES procedure_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  procedure_type procedure_type NOT NULL DEFAULT 'non_surgical',
  typical_price_min int,
  typical_price_max int,
  recovery_days int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Doctor profiles
CREATE TABLE doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status profile_status NOT NULL DEFAULT 'draft',
  verification_level verification_level NOT NULL DEFAULT 'unverified',
  is_premium boolean NOT NULL DEFAULT false,
  title text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text,
  specialty_id uuid REFERENCES specialties(id) ON DELETE SET NULL,
  bio_short text,
  bio_long text,
  website_url text,
  phone text,
  email citext,
  languages text[] NOT NULL DEFAULT '{}',
  profile_image_url text,
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('german',
      coalesce(normalize_text(first_name), '') || ' ' ||
      coalesce(normalize_text(last_name), '') || ' ' ||
      coalesce(normalize_text(bio_short), '') || ' ' ||
      coalesce(normalize_text(bio_long), '')
    )
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TRIGGER set_doctor_profiles_updated_at
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Clinic profiles
CREATE TABLE clinic_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status profile_status NOT NULL DEFAULT 'draft',
  name text NOT NULL,
  description text,
  website_url text,
  phone text,
  email citext,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_clinic_profiles_updated_at
  BEFORE UPDATE ON clinic_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Doctor-Clinic links
CREATE TABLE doctor_clinic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinic_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, clinic_id)
);

-- Locations
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinic_profiles(id) ON DELETE CASCADE,
  name text,
  address_street text,
  address_city text NOT NULL,
  address_zip text,
  address_state text,
  address_country text NOT NULL DEFAULT 'AT',
  lat double precision,
  lng double precision,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT location_has_owner CHECK (doctor_id IS NOT NULL OR clinic_id IS NOT NULL)
);

CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Doctor procedures
CREATE TABLE doctor_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  procedure_id uuid NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  price_min int,
  price_max int,
  price_note text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, procedure_id)
);

CREATE TRIGGER set_doctor_procedures_updated_at
  BEFORE UPDATE ON doctor_procedures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profile claims
CREATE TABLE profile_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status claim_status NOT NULL DEFAULT 'pending',
  verification_method claim_verification_method NOT NULL,
  claimant_email citext NOT NULL,
  claimant_phone text,
  claimant_role text,
  notes text,
  admin_notes text,
  document_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER set_profile_claims_updated_at
  BEFORE UPDATE ON profile_claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Lead requests
CREATE TABLE lead_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  status lead_status NOT NULL DEFAULT 'new',
  name text NOT NULL,
  email citext NOT NULL,
  phone text,
  procedure_id uuid REFERENCES procedures(id) ON DELETE SET NULL,
  message text,
  preferred_contact text,
  consent_data_processing boolean NOT NULL DEFAULT false,
  consent_forwarding boolean NOT NULL DEFAULT false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gclid text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_lead_requests_updated_at
  BEFORE UPDATE ON lead_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email citext,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  treatment text,
  verification_status review_verification_status NOT NULL DEFAULT 'unverified',
  moderation_status review_moderation_status NOT NULL DEFAULT 'pending',
  doctor_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Media assets
CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinic_profiles(id) ON DELETE CASCADE,
  kind media_kind NOT NULL,
  visibility media_visibility NOT NULL DEFAULT 'private',
  storage_path text NOT NULL,
  url text,
  alt_text text,
  is_approved boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Source records (import data)
CREATE TABLE source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  external_id text,
  raw_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric(4,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_source_records_updated_at
  BEFORE UPDATE ON source_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Audit logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Import batches
CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL,
  status import_batch_status NOT NULL DEFAULT 'pending',
  total_records int NOT NULL DEFAULT 0,
  processed_records int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TRIGGER set_import_batches_updated_at
  BEFORE UPDATE ON import_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Import candidates
CREATE TABLE import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  status import_candidate_status NOT NULL DEFAULT 'pending',
  raw_data jsonb NOT NULL DEFAULT '{}',
  normalized_data jsonb,
  matched_doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  confidence_score numeric(4,2) NOT NULL DEFAULT 0,
  merge_decision merge_decision,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_import_candidates_updated_at
  BEFORE UPDATE ON import_candidates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Merge events
CREATE TABLE merge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_doctor_id uuid NOT NULL REFERENCES doctor_profiles(id),
  target_doctor_id uuid NOT NULL REFERENCES doctor_profiles(id),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  merge_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Job runs
CREATE TABLE job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  result jsonb,
  error text
);
