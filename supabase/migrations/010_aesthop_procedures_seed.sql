-- ============================================================
-- Migration 010: Alle 45 ÄsthOp-Procedures (ÄsthOp-VO 2013)
-- ============================================================
-- Fügt aesthop_code Spalte hinzu und seeded alle 45 Eingriffe
-- aus der Österreichischen Ästhetischen Operationen-Verordnung.
-- Safe für re-runs (ON CONFLICT DO NOTHING / DO UPDATE).
-- ============================================================

-- 1. aesthop_code Spalte zu procedures hinzufügen
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS aesthop_code text UNIQUE;

-- 2. Fehlende Kategorien ergänzen
INSERT INTO public.procedure_categories (slug, name_de, sort_order) VALUES
  ('minimal-invasiv',  'Minimal-invasiv',   7),
  ('intimchirurgie',   'Intimchirurgie',    8),
  ('sonstiges',        'Sonstiges',         9)
ON CONFLICT (slug) DO NOTHING;

-- 3. Alle 45 ÄsthOp-Procedures
-- Bestehende Slugs (aus 007_seed.sql) werden per ON CONFLICT aktualisiert
-- (aesthop_code wird nachgetragen). Neue werden inserted.

-- GESICHT
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'kinnkorrektur', 'Kinnkorrektur (Genioplastik)', ARRAY['genioplastik','kinnkorrektur'], c.id, 'operation', 'face', '01'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'nasen-op', 'Nasenkorrektur (Rhinoplastik)', ARRAY['nasenkorrektur','rhinoplastik'], c.id, 'operation', 'face', '02'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'ohranlegung', 'Ohranlegung (Otoplastik)', ARRAY['otoplastik','ohranlegung','ohren-op'], c.id, 'operation', 'face', '03'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'lidstraffung', 'Lider- und Brauenkorrektur (Blepharoplastik)', ARRAY['blepharoplastik','augenlidkorrektur','lidstraffung'], c.id, 'operation', 'face', '04'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'facelift', 'Gesichtsstraffung (Facelift, Browlift, Halslift)', ARRAY['facelift','browlift','halslift','gesichtsstraffung'], c.id, 'operation', 'face', '05'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO NOTHING;

-- KÖRPER
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'fettabsaugung', 'Fettabsaugung (Liposuktion)', ARRAY['liposuktion','fettabsaugung'], c.id, 'operation', 'body', '06'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'bauchdeckenstraffung', 'Bauchdeckenstraffung (Abdominoplastik)', ARRAY['abdominoplastik','tummy tuck','bauchstraffung'], c.id, 'operation', 'body', '07'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO NOTHING;

-- BRUST
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'brustvergroesserung', 'Brustvergrößerung', ARRAY['brust-op','implantate','brustvergrößerung'], c.id, 'operation', 'breast', '08'
FROM public.procedure_categories c WHERE c.slug = 'brust'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'bruststraffung', 'Bruststraffung und -verkleinerung', ARRAY['mastopexie','brustverkleinerung','bruststraffung'], c.id, 'operation', 'breast', '09'
FROM public.procedure_categories c WHERE c.slug = 'brust'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'brustrekonstruktion', 'Brustaufbau und -rekonstruktion', ARRAY['brustrekonstruktion','brustaufbau'], c.id, 'operation', 'breast', '10'
FROM public.procedure_categories c WHERE c.slug = 'brust'
ON CONFLICT (slug) DO NOTHING;

-- KÖRPER (Extremitäten)
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'oberschenkelstraffung', 'Oberschenkelstraffung', ARRAY['oberschenkelstraffung','thigh lift'], c.id, 'operation', 'body', '11'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'oberarmstraffung', 'Oberarmstraffung', ARRAY['oberarmstraffung','arm lift','brachioplastik'], c.id, 'operation', 'body', '12'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'gesaessstraffung', 'Gesäßstraffung (Gluteoplastik)', ARRAY['gluteoplastik','po-straffung','gesäßstraffung'], c.id, 'operation', 'body', '13'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'implantate-koerper', 'Implantate (außer Brustimplantate)', ARRAY['körperimplantate','implantate'], c.id, 'operation', 'body', '14'
FROM public.procedure_categories c WHERE c.slug = 'koerper'
ON CONFLICT (slug) DO NOTHING;

-- MINIMAL-INVASIV
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'botox', 'Injektionsbehandlungen mit Botulinumtoxin', ARRAY['botox','botulinumtoxin','faltenbehandlung'], c.id, 'behandlung', 'skin', '15'
FROM public.procedure_categories c WHERE c.slug = 'minimal-invasiv'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code, category_id = EXCLUDED.category_id;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'hyaluron', 'Injektionsbehandlungen mit Füllmaterialien (Filler)', ARRAY['hyaluronsaeure','filler','hyaluron'], c.id, 'behandlung', 'skin', '16'
FROM public.procedure_categories c WHERE c.slug = 'minimal-invasiv'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code, category_id = EXCLUDED.category_id;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'prp', 'Eigenblutbehandlungen (PRP)', ARRAY['platelet rich plasma','eigenblut','prp'], c.id, 'behandlung', 'skin', '17'
FROM public.procedure_categories c WHERE c.slug = 'minimal-invasiv'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code, category_id = EXCLUDED.category_id;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'fadenlift', 'Fadenlift (Fadenbehandlung)', ARRAY['fadenlift','fadenbehandlung','thread lift'], c.id, 'behandlung', 'face', '18'
FROM public.procedure_categories c WHERE c.slug = 'minimal-invasiv'
ON CONFLICT (slug) DO NOTHING;

-- HAUT
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'peeling', 'Chemisches Peeling (mitteltief, tief)', ARRAY['chemical peel','peeling','säurepeeling'], c.id, 'behandlung', 'skin', '19'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'laserbehandlung', 'Laserbehandlungen der Haut', ARRAY['laser','laserresurfacing','hautlaser'], c.id, 'behandlung', 'skin', '20'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'ipl', 'Lichtbehandlungen der Haut (IPL)', ARRAY['ipl','intense pulsed light','lichttherapie'], c.id, 'behandlung', 'skin', '21'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'radiofrequenz', 'Radiofrequenzbehandlungen', ARRAY['radiofrequenz','rf-behandlung','thermage'], c.id, 'behandlung', 'skin', '22'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'hifu', 'Ultraschallbehandlungen (HIFU)', ARRAY['hifu','ultherapy','ultraschall'], c.id, 'behandlung', 'skin', '23'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'kryolipolyse', 'Kryolipolyse', ARRAY['kryolipolyse','coolsculpting','fettgefrierung'], c.id, 'behandlung', 'body', '24'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'mesotherapie', 'Mesotherapie', ARRAY['mesotherapie','mikroinjektionen'], c.id, 'behandlung', 'skin', '25'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'microneedling', 'Mikronadeln (Microneedling)', ARRAY['dermaroller','kollagentherapie','microneedling'], c.id, 'behandlung', 'skin', '26'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'permanent-makeup', 'Permanent Make-up', ARRAY['permanent makeup','tattoo gesicht','microblading'], c.id, 'behandlung', 'face', '27'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

-- HAARE
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'haartransplantation', 'Haartransplantation', ARRAY['fue','haarverpflanzung','haartransplantation'], c.id, 'operation', 'hair', '28'
FROM public.procedure_categories c WHERE c.slug = 'haare'
ON CONFLICT (slug) DO UPDATE SET aesthop_code = EXCLUDED.aesthop_code;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'laser-haarentfernung', 'Laserbehandlungen der Haare', ARRAY['haarentfernung','laser hair removal','epilierung'], c.id, 'behandlung', 'hair', '29'
FROM public.procedure_categories c WHERE c.slug = 'haare'
ON CONFLICT (slug) DO NOTHING;

-- INTIMCHIRURGIE
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'intimchirurgie', 'Intimchirurgie (Labioplastik u.a.)', ARRAY['labioplastik','intim-op','schamlippen'], c.id, 'operation', 'body', '30'
FROM public.procedure_categories c WHERE c.slug = 'intimchirurgie'
ON CONFLICT (slug) DO NOTHING;

-- SONSTIGES / WEITERE EINGRIFFE
INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'lidhebung-nicht-chirurgisch', 'Lidhebung ohne Operation (nicht-chirurgisch)', ARRAY['nicht-chirurgisch','plasma pen','lidhebung'], c.id, 'behandlung', 'face', '31'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'lipofilling', 'Fettgewebstransplantation (Lipofilling)', ARRAY['lipofilling','eigenfett','fat transfer'], c.id, 'operation', 'body', '32'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'narbenkorrektur', 'Narbenkorrektur', ARRAY['narbenkorrektur','narbenrevision'], c.id, 'operation', 'skin', '33'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'afterkorrektur', 'Afterkorrektur', ARRAY['afterkorrektur','analkorrektur'], c.id, 'operation', 'body', '34'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'penisverlaengerung', 'Penisverlängerung/-vergrößerung', ARRAY['penisvergrößerung','penisverlängerung'], c.id, 'operation', 'body', '35'
FROM public.procedure_categories c WHERE c.slug = 'intimchirurgie'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'hymenrekonstruktion', 'Hymenrekonstruktion', ARRAY['hymenrekonstruktion','hymen'], c.id, 'operation', 'body', '36'
FROM public.procedure_categories c WHERE c.slug = 'intimchirurgie'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'sterilisation', 'Sterilisation', ARRAY['sterilisation','tubenligatur'], c.id, 'operation', 'body', '37'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'vasektomie', 'Vasektomie', ARRAY['vasektomie','sterilisation mann'], c.id, 'operation', 'body', '38'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'ohrlaeppchen', 'Ohrläppchenkorrekturen', ARRAY['ohrläppchen','ohrkorrektur'], c.id, 'operation', 'face', '39'
FROM public.procedure_categories c WHERE c.slug = 'gesicht'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'gingivoplastik', 'Zahnfleischkorrekturen (Gingivoplastik)', ARRAY['gingivoplastik','zahnfleisch'], c.id, 'operation', 'face', '40'
FROM public.procedure_categories c WHERE c.slug = 'zaehne'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'tattoo-entfernung', 'Entfernung von Tattowierungen', ARRAY['tattooentfernung','tattoo laser','tattooremoval'], c.id, 'behandlung', 'skin', '41'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'venenbehandlung', 'Entfernung von Besenreisern / Venenbehandlung', ARRAY['besenreiser','venenbehandlung','sklerotherapie'], c.id, 'behandlung', 'body', '42'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'hyperhidrose', 'Behandlung von Hyperhidrose', ARRAY['hyperhidrose','schwitzen','botox schwitzen'], c.id, 'behandlung', 'skin', '43'
FROM public.procedure_categories c WHERE c.slug = 'haut'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'alopezie', 'Behandlung von Alopezie', ARRAY['alopezie','haarausfall','haarverlust'], c.id, 'behandlung', 'hair', '44'
FROM public.procedure_categories c WHERE c.slug = 'haare'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area, aesthop_code)
SELECT 'sonstige-aesthop', 'Sonstige ästhetische Operationen und Behandlungen', ARRAY['sonstiges','weitere eingriffe'], c.id, 'behandlung', 'skin', '45'
FROM public.procedure_categories c WHERE c.slug = 'sonstiges'
ON CONFLICT (slug) DO NOTHING;
