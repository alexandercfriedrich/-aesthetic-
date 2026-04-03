-- Migration: add_google_match_status_to_doctor_profiles

-- 1. ENUM erstellen
DO $$ BEGIN
  CREATE TYPE google_match_status AS ENUM (
    'pending',
    'matched_strict',
    'no_results',
    'ambiguous',
    'error'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Spalten hinzufügen
ALTER TABLE doctor_profiles
  ADD COLUMN IF NOT EXISTS google_match_status    google_match_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS google_match_candidate_count  integer,
  ADD COLUMN IF NOT EXISTS google_match_last_checked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS google_match_notes            text;

-- 3. Index für Admin-Filter
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_google_match_status
  ON doctor_profiles (google_match_status);
