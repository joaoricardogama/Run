-- schema_v12b.sql — fix RLS athlete_weekly_plans
-- O athlete.id NÃO é o mesmo que auth.uid() — o atleta é buscado por email
-- Por isso usamos email do JWT para encontrar o athlete_id correto

DROP POLICY IF EXISTS "athletes_read_own_weekly_plan" ON athlete_weekly_plans;

CREATE POLICY "athletes_read_own_weekly_plan"
  ON athlete_weekly_plans FOR SELECT TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM athletes
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
