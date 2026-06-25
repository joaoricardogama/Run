-- ============================================================
-- Run Tejo — Schema V3
-- Aplica no Supabase SQL Editor (é seguro re-executar)
-- ============================================================

-- 1. register_athlete (SECURITY DEFINER contorna o RLS)
CREATE OR REPLACE FUNCTION register_athlete(
  p_name text, p_email text, p_group text,
  p_pr_5km int, p_pr_10km int,
  p_date_of_birth date, p_sex text,
  p_nationality text, p_location text,
  p_postal_code text, p_nif text,
  p_modalities text[], p_specializations text[],
  p_coach_id uuid, p_gdpr_consent boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO athletes (
    name, email, "group", pr_5km, pr_10km,
    date_of_birth, sex, nationality, location,
    postal_code, nif, modalities, specializations,
    coach_id, gdpr_consent, gdpr_consent_date, active
  ) VALUES (
    p_name, p_email, p_group, p_pr_5km, p_pr_10km,
    p_date_of_birth, p_sex, p_nationality, p_location,
    p_postal_code, p_nif, p_modalities, p_specializations,
    p_coach_id, p_gdpr_consent,
    CASE WHEN p_gdpr_consent THEN now() ELSE NULL END,
    true
  )
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- 2. Atleta pode ler o próprio registo (fix para useAuth/MyPlan)
DROP POLICY IF EXISTS "Athletes read own row" ON athletes;
CREATE POLICY "Athletes read own row" ON athletes
  FOR SELECT USING (auth.email() = email);

-- 3. Atleta pode atualizar os próprios dados
DROP POLICY IF EXISTS "Athletes update own row" ON athletes;
CREATE POLICY "Athletes update own row" ON athletes
  FOR UPDATE USING (auth.email() = email);

-- 4. RLS para athlete_races
ALTER TABLE athlete_races ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages athlete_races" ON athlete_races;
CREATE POLICY "Coach manages athlete_races" ON athlete_races
  FOR ALL USING (is_coach());

DROP POLICY IF EXISTS "Athletes read own races" ON athlete_races;
CREATE POLICY "Athletes read own races" ON athlete_races
  FOR SELECT USING (
    athlete_id = (
      SELECT id FROM athletes WHERE email = auth.email() LIMIT 1
    )
  );

-- 5. RLS para individual_plans
ALTER TABLE individual_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages plans" ON individual_plans;
CREATE POLICY "Coach manages plans" ON individual_plans
  FOR ALL USING (is_coach());

DROP POLICY IF EXISTS "Athletes read own plan" ON individual_plans;
CREATE POLICY "Athletes read own plan" ON individual_plans
  FOR SELECT USING (
    athlete_id = (
      SELECT id FROM athletes WHERE email = auth.email() LIMIT 1
    )
  );
