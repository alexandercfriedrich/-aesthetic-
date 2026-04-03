-- Migration 011: UNIQUE INDEX auf locations (doctor_id) WHERE is_primary
-- Wird benoetigt damit import-aesthop.ts per ON CONFLICT (doctor_id)
-- WHERE is_primary die primäre Location idempotent upserten kann.

CREATE UNIQUE INDEX IF NOT EXISTS locations_doctor_primary_uidx
  ON public.locations (doctor_id)
  WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS locations_clinic_primary_uidx
  ON public.locations (clinic_id)
  WHERE is_primary = true;
