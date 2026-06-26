-- ============================================================
-- Run Tejo — Schema V6
-- Gamification: training_completions
-- Aplicar no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS training_completions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id    uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date          date NOT NULL DEFAULT current_date,
  session_label text NOT NULL DEFAULT 'Treino',
  points        integer NOT NULL DEFAULT 10,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(athlete_id, date, session_label)
);

ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;

-- Coach vê e gere tudo
DROP POLICY IF EXISTS "Coach manages completions" ON training_completions;
CREATE POLICY "Coach manages completions" ON training_completions
  FOR ALL USING (is_coach());

-- Atletas gerem os próprios registos
DROP POLICY IF EXISTS "Athletes manage own completions" ON training_completions;
CREATE POLICY "Athletes manage own completions" ON training_completions
  FOR ALL USING (
    athlete_id = (SELECT id FROM athletes WHERE email = auth.email() LIMIT 1)
  );
