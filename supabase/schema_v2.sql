-- ============================================================
-- Run Tejo — Schema V2 migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  bio  text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Coach edits own record" ON coaches FOR UPDATE USING (auth.email() = email);

-- Insert the default coach (adjust name/email as needed)
INSERT INTO coaches (name, email, bio)
VALUES ('Treinador Run Tejo', 'coach@runtejo.pt', 'Treinador principal do Run Tejo.')
ON CONFLICT (email) DO NOTHING;

-- 2. New columns on athletes
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS sex           text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS nationality   text DEFAULT 'Portuguesa',
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS modalities    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coach_id      uuid REFERENCES coaches(id) ON DELETE SET NULL;

-- 3. RLS: athletes can register themselves
-- Allow INSERT for authenticated users (self-registration)
CREATE POLICY IF NOT EXISTS "Athletes can insert own row" ON athletes
  FOR INSERT WITH CHECK (auth.email() = email);

-- ============================================================
-- Group assignment thresholds (for reference — logic is in JS)
-- MASCULINOS 10km: G1<33:00 G2<38:00 G3<45:00 G4<52:30 G5<60:00 G6≥60:00
-- FEMININOS  10km: G1<37:30 G2<42:30 G3<50:00 G4<57:30 G5<65:00 G6≥65:00
-- ============================================================
