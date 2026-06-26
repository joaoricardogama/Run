-- ============================================================
-- Run Tejo — Schema V7
-- Integração Strava + confirmação de treinos
-- Aplicar no Supabase SQL Editor
-- ============================================================

-- 1. Campos Strava na tabela athletes
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS strava_athlete_id    bigint,
  ADD COLUMN IF NOT EXISTS strava_access_token  text,
  ADD COLUMN IF NOT EXISTS strava_refresh_token text,
  ADD COLUMN IF NOT EXISTS strava_token_expires_at bigint;

-- 2. Confirmação Strava em training_completions
ALTER TABLE training_completions
  ADD COLUMN IF NOT EXISTS confirmed_by_strava boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS strava_activity_id  bigint;

-- 3. Permitir que atletas atualizem os seus próprios campos Strava
DROP POLICY IF EXISTS "Athletes update own profile" ON athletes;
CREATE POLICY "Athletes update own profile" ON athletes
  FOR UPDATE USING (auth.email() = email);
