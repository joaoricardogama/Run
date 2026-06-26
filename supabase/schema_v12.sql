-- schema_v12.sql — planos semanais individuais por atleta

CREATE TABLE IF NOT EXISTS athlete_weekly_plans (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id  uuid    REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  week_start  date    NOT NULL,
  content     jsonb   NOT NULL DEFAULT '{}',
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(athlete_id, week_start)
);

ALTER TABLE athlete_weekly_plans ENABLE ROW LEVEL SECURITY;

-- Coach pode fazer tudo
CREATE POLICY "coaches_all_athlete_weekly_plans"
  ON athlete_weekly_plans FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Atleta pode ler apenas o seu plano
CREATE POLICY "athletes_read_own_weekly_plan"
  ON athlete_weekly_plans FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());
