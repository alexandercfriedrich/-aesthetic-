insert into public.specialties (slug, name_de, sort_order) values
('plastische-rekonstruktive-aesthetische-chirurgie', 'Plastische, Rekonstruktive und Ästhetische Chirurgie', 1),
('haut-und-geschlechtskrankheiten', 'Haut- und Geschlechtskrankheiten', 2),
('hno', 'Hals-, Nasen- und Ohrenheilkunde', 3),
('mund-kiefer-gesichtschirurgie', 'Mund-, Kiefer- und Gesichtschirurgie', 4),
('zahnmedizin', 'Zahnmedizin', 5)
on conflict (slug) do nothing;

insert into public.procedure_categories (slug, name_de, sort_order) values
('gesicht', 'Gesicht', 1),
('brust', 'Brust', 2),
('koerper', 'Körper', 3),
('haut', 'Haut', 4),
('haare', 'Haare', 5),
('zaehne', 'Zähne', 6)
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'nasen-op', 'Nasen-OP', array['nasenkorrektur','rhinoplastik'], c.id, 'operation', 'face'
from public.procedure_categories c where c.slug = 'gesicht'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'botox', 'Botox', array['botulinumtoxin','faltenbehandlung'], c.id, 'behandlung', 'skin'
from public.procedure_categories c where c.slug = 'haut'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'brustvergroesserung', 'Brustvergrößerung', array['brust-op','implantate'], c.id, 'operation', 'breast'
from public.procedure_categories c where c.slug = 'brust'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'fettabsaugung', 'Fettabsaugung', array['liposuktion'], c.id, 'operation', 'body'
from public.procedure_categories c where c.slug = 'koerper'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'zahnimplantate', 'Zahnimplantate', array['implantat','implantate'], c.id, 'operation', 'teeth'
from public.procedure_categories c where c.slug = 'zaehne'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'hyaluron', 'Hyaluron-Filler', array['hyaluronsaeure','filler'], c.id, 'behandlung', 'skin'
from public.procedure_categories c where c.slug = 'haut'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'lidstraffung', 'Lidstraffung', array['blepharoplastik','augenlidkorrektur'], c.id, 'operation', 'face'
from public.procedure_categories c where c.slug = 'gesicht'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'haartransplantation', 'Haartransplantation', array['fue','haarverpflanzung'], c.id, 'operation', 'hair'
from public.procedure_categories c where c.slug = 'haare'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'prp', 'PRP-Behandlung', array['platelet rich plasma','eigenblut'], c.id, 'behandlung', 'skin'
from public.procedure_categories c where c.slug = 'haut'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'laserbehandlung', 'Laserbehandlung', array['laser','laserresurfacing'], c.id, 'behandlung', 'skin'
from public.procedure_categories c where c.slug = 'haut'
on conflict (slug) do nothing;

insert into public.procedures (slug, name_de, synonyms, category_id, procedure_type, body_area)
select 'microneedling', 'Microneedling', array['dermaroller','kollagentherapie'], c.id, 'behandlung', 'skin'
from public.procedure_categories c where c.slug = 'haut'
on conflict (slug) do nothing;
