-- ============================================================
-- Run Tejo — Schema V2 migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text UNIQUE NOT NULL,
  bio        text,
  grade      text,
  specialization text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Coach edits own record" ON coaches FOR UPDATE USING (auth.email() = email);

-- Insert coaches
INSERT INTO coaches (name, email, bio, grade, specialization)
VALUES
  ('João Gama', 'coach@runtejo.pt',
   'Treinador principal do Run Tejo.',
   'Treinador Atletismo Grau 1',
   'Especialização em Provas de Estrada')
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      grade = EXCLUDED.grade,
      specialization = EXCLUDED.specialization;

-- 2. New columns on athletes
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS date_of_birth    date,
  ADD COLUMN IF NOT EXISTS sex              text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS nationality      text DEFAULT 'Portuguesa',
  ADD COLUMN IF NOT EXISTS location         text,
  ADD COLUMN IF NOT EXISTS postal_code      text,
  ADD COLUMN IF NOT EXISTS nif              text,
  ADD COLUMN IF NOT EXISTS modalities       text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specializations  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coach_id         uuid REFERENCES coaches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gdpr_consent     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_consent_date timestamptz;

-- 3. RLS: athletes can self-register
CREATE POLICY "Athletes can insert own row" ON athletes
  FOR INSERT WITH CHECK (auth.email() = email);

-- 4. Sample race for testing
INSERT INTO races (name, date, distance_km, location, description, registration_url)
VALUES
  ('10km Run Tejo — Prova Teste', '2026-07-20', 10, 'Parque das Nações, Lisboa',
   'Prova de teste do calendário Run Tejo. Percurso plano ao longo do Tejo.',
   'https://runtejo.pt/inscricoes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Group assignment thresholds (logic is in src/utils/groupAssignment.js)
-- MASCULINOS 10km: G1<33:00 G2<38:00 G3<45:00 G4<52:30 G5<60:00 G6≥60:00
-- FEMININOS  10km: G1<37:30 G2<42:30 G3<50:00 G4<57:30 G5<65:00 G6≥65:00
-- ============================================================
