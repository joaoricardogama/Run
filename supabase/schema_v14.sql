-- schema_v14.sql — Feed de atividades Strava + comentários do treinador

-- ── Novos campos em training_completions ─────────────────────
ALTER TABLE training_completions
  ADD COLUMN IF NOT EXISTS strava_name    text,
  ADD COLUMN IF NOT EXISTS strava_type    text,   -- 'Run','Walk','Ride',...
  ADD COLUMN IF NOT EXISTS duration_s     integer, -- tempo em movimento (segundos)
  ADD COLUMN IF NOT EXISTS elevation_m    integer; -- ganho de elevação (metros)
  -- distance_km, pace_avg, hr_avg, cadence_avg já existem

-- ── Comentários de treinadores em atividades ─────────────────
CREATE TABLE IF NOT EXISTS training_comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  completion_id uuid REFERENCES training_completions(id) ON DELETE CASCADE NOT NULL,
  athlete_id    uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  author_email  text NOT NULL,
  author_name   text NOT NULL,
  author_role   text NOT NULL DEFAULT 'coach', -- 'coach' | 'athlete'
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE training_comments ENABLE ROW LEVEL SECURITY;

-- Coach pode tudo
CREATE POLICY "coaches_all_comments" ON training_comments
  FOR ALL TO authenticated USING (is_coach()) WITH CHECK (is_coach());

-- Atleta lê os comentários das suas atividades
CREATE POLICY "athletes_read_own_comments" ON training_comments
  FOR SELECT TO authenticated
  USING (
    athlete_id IN (SELECT id FROM athletes WHERE email = (auth.jwt() ->> 'email'))
  );

-- Atleta pode inserir comentário (resposta ao treinador)
CREATE POLICY "athletes_insert_own_comments" ON training_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    athlete_id IN (SELECT id FROM athletes WHERE email = (auth.jwt() ->> 'email'))
  );
