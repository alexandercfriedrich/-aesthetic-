-- Migration 012: location_type + location_label für Arbeitsstätten-Unterscheidung
--
-- Hintergrund: Ein Arzt kann laut Ärztekammer mehrere Arbeitsstätten haben:
--   - Private Ordination (Priorität als Primäradresse)
--   - Krankenhaus / Klinik
--   - Kassenambulanz / SVS-Gesundheitszentrum
--   - Sonstige
--
-- location_label speichert den Originalnamen aus der Ärztekammer (z.B. "Klinik LANDSTRASSE").

-- 1. location_type Spalte hinzufügen
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS location_type text NOT NULL DEFAULT 'other'
    CONSTRAINT locations_type_check
    CHECK (location_type IN ('ordination', 'krankenhaus', 'kassenambulanz', 'other'));

-- 2. location_label Spalte hinzufügen (Originalbezeichnung z.B. "Ord. AGNESE", "Klinik LANDSTRASSE")
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS location_label text;

-- 3. Den unique-Index auf (doctor_id, is_primary=true) entfernen, falls vorhanden.
--    Vorher war nur 1 primary erlaubt → jetzt weiterhin nur 1, aber enforced via
--    Script-Logik, nicht DB-Constraint (flexibler bei Reimports).
DROP INDEX IF EXISTS public.locations_doctor_primary_unique;

-- 4. Neuen Index für schnelle Abfragen nach location_type
CREATE INDEX IF NOT EXISTS locations_doctor_type_idx
  ON public.locations (doctor_id, location_type)
  WHERE doctor_id IS NOT NULL;

-- 5. Index für primäre Locations (häufigste Abfrage: Arztprofil-Seite)
CREATE INDEX IF NOT EXISTS locations_doctor_primary_idx
  ON public.locations (doctor_id, is_primary)
  WHERE doctor_id IS NOT NULL AND is_primary = true;

COMMENT ON COLUMN public.locations.location_type IS
  'Typ der Arbeitsstätte: ordination (private Praxis), krankenhaus, kassenambulanz, other';

COMMENT ON COLUMN public.locations.location_label IS
  'Originalbezeichnung der Arbeitsstätte aus der Ärztekammer, z.B. "Klinik LANDSTRASSE", "Ord. AGNESE"';
