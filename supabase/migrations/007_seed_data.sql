-- Specialties
INSERT INTO specialties (name, slug, description) VALUES
  ('Plastische, Rekonstruktive und Ästhetische Chirurgie', 'plastische-chirurgie', 'Fachärzte für das gesamte Spektrum ästhetischer und rekonstruktiver Operationen'),
  ('Haut- und Geschlechtskrankheiten', 'dermatologie', 'Dermatologen mit Schwerpunkt ästhetische Dermatologie'),
  ('Hals-, Nasen- und Ohrenheilkunde', 'hno', 'HNO-Ärzte mit Spezialisierung auf Nasenkorrektur und Gesichtschirurgie'),
  ('Mund-, Kiefer- und Gesichtschirurgie', 'mkg', 'Spezialisten für Kiefer- und Gesichtsrekonstruktion'),
  ('Zahnmedizin', 'zahnmedizin', 'Zahnärzte und Kieferorthopäden mit ästhetischem Schwerpunkt')
ON CONFLICT (slug) DO NOTHING;

-- Procedure categories
INSERT INTO procedure_categories (name, slug, icon, sort_order) VALUES
  ('Gesicht', 'gesicht', 'face', 1),
  ('Brust', 'brust', 'heart', 2),
  ('Körper', 'koerper', 'body', 3),
  ('Haut', 'haut', 'sparkles', 4),
  ('Haare', 'haare', 'scissors', 5),
  ('Zähne', 'zaehne', 'smile', 6)
ON CONFLICT (slug) DO NOTHING;

-- Procedures
INSERT INTO procedures (name, slug, description, procedure_type, category_id, typical_price_min, typical_price_max, recovery_days)
SELECT
  p.name, p.slug, p.description, p.procedure_type::procedure_type,
  pc.id, p.price_min, p.price_max, p.recovery_days
FROM (VALUES
  ('Nasen-OP (Rhinoplastik)', 'nasen-op', 'Operative Korrektur der Nasenform und -funktion', 'surgical', 'gesicht', 3000, 8000, 14),
  ('Botox (Botulinumtoxin)', 'botox', 'Entspannung von Mimikfalten durch Botulinumtoxin', 'non_surgical', 'haut', 300, 800, 0),
  ('Brustvergrößerung', 'brustvergroesserung', 'Augmentation der Brust mit Implantaten oder Eigenfett', 'surgical', 'brust', 4000, 9000, 10),
  ('Fettabsaugung (Liposuktion)', 'fettabsaugung', 'Entfernung unerwünschter Fettdepots', 'surgical', 'koerper', 2000, 6000, 7),
  ('Zahnimplantate', 'zahnimplantate', 'Dauerhafte Zahnersatzlösung mit Titanimplantaten', 'surgical', 'zaehne', 800, 3000, 3),
  ('Hyaluron-Filler', 'hyaluron', 'Volumenaufbau und Faltenbehandlung mit Hyaluronsäure', 'non_surgical', 'haut', 250, 700, 0),
  ('Lidstraffung (Blepharoplastik)', 'lidstraffung', 'Korrektur von hängenden Augenlidern', 'surgical', 'gesicht', 2000, 5000, 7),
  ('Haartransplantation (FUE)', 'haartransplantation', 'Eigenhaartransplantation bei Haarausfall', 'surgical', 'haare', 3000, 8000, 7),
  ('PRP-Behandlung', 'prp', 'Platelet Rich Plasma für Hautverjüngung und Haarverdichtung', 'non_surgical', 'haut', 300, 600, 0),
  ('Laserbehandlung', 'laserbehandlung', 'Verschiedene Laserverfahren zur Hautverbesserung', 'non_surgical', 'haut', 200, 1500, 3),
  ('Microneedling', 'microneedling', 'Minimale Verletzungen zur Stimulation der Kollagenproduktion', 'non_surgical', 'haut', 150, 400, 1)
) AS p(name, slug, description, procedure_type, cat_slug, price_min, price_max, recovery_days)
JOIN procedure_categories pc ON pc.slug = p.cat_slug
ON CONFLICT (slug) DO NOTHING;
