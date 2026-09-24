-- =============================================================================
-- DKC - service catalogue (real DKC catalogue, taken from the previous
-- application's seed data and confirmed by the cabinet owner).
-- Prices are in MAD. Everything here can be edited later in /admin/services.
--
-- Safe to run several times: existing services (matched by name) are left
-- untouched, so admin edits are never overwritten.
-- No patients, no appointments, no availability hours are seeded:
-- Rihab enters her real hours in /admin/availability.
-- =============================================================================

insert into public.services
  (name, category, description, price, price_type, sessions_included, duration_minutes, at_cabinet, at_home)
values
  -- Hijama
  ('Hijama Humide', 'hijama', 'Séance de hijama humide (cupping thérapie humide).', 150, 'session', null, 45, true, false),
  ('Hijama Sèche',  'hijama', 'Séance de hijama sèche (cupping thérapie sèche).',   150, 'session', null, 45, true, false),

  -- Massages (single session)
  ('Massage Relaxant',      'massage', 'Massage relaxant pour le bien-être et la détente.', 200, 'session', null, 60, true, true),
  ('Massage Thérapeutique', 'massage', 'Massage thérapeutique ciblé.',                      250, 'session', null, 60, true, true),
  ('Massage Sportif',       'massage', 'Massage sportif pour la récupération musculaire.',  300, 'session', null, 60, true, true),
  ('Massage Thaï',          'massage', 'Massage thaï traditionnel.',                        150, 'session', null, 60, true, false),
  ('Massage Lymphatique',   'massage', 'Drainage lymphatique manuel.',                      200, 'session', null, 60, true, true),

  -- Massage packs of 10 sessions (each session is booked one by one)
  ('Pack 10 séances - Massage Relaxant',      'massage', 'Forfait de 10 séances de massage relaxant.',      1700, 'package', 10, 60, true, true),
  ('Pack 10 séances - Massage Thérapeutique', 'massage', 'Forfait de 10 séances de massage thérapeutique.', 2200, 'package', 10, 60, true, true),
  ('Pack 10 séances - Massage Sportif',       'massage', 'Forfait de 10 séances de massage sportif.',       2700, 'package', 10, 60, true, true),
  ('Pack 10 séances - Massage Thaï',          'massage', 'Forfait de 10 séances de massage thaï.',          1300, 'package', 10, 60, true, false),
  ('Pack 10 séances - Massage Lymphatique',   'massage', 'Forfait de 10 séances de drainage lymphatique.',  1700, 'package', 10, 60, true, true),

  -- Diabetes care
  ('Consultation Diabète',                     'diabetes_care', 'Consultation initiale liée au parcours de soins diabète.',        150,  'session', null, 30, true, false),
  ('Prévention des complications diabétiques', 'diabetes_care', 'Programme de prévention des complications liées au diabète.',    2500, 'package', null, 45, true, false),
  ('Rééducation pour les diabétiques',         'diabetes_care', 'Programme de rééducation adapté aux patients diabétiques.',       2500, 'package', null, 45, true, false),
  ('Prévention des plaies et soins des pieds', 'diabetes_care', 'Programme de prévention des plaies et soins podologiques.',        1300, 'package', null, 45, true, false),
  ('Mobilité et souplesse',                    'diabetes_care', 'Programme dédié à la mobilité et à la souplesse.',                 2400, 'package', null, 45, true, false),
  ('Gestion de la douleur',                    'diabetes_care', 'Programme de gestion de la douleur pour patients diabétiques.',   1700, 'package', null, 45, true, false)
on conflict (name) do nothing;
