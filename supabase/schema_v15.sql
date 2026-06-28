-- schema_v15.sql — Clubes + Community feed

-- ── Tabela de clubes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  short_name  text,
  location    text,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
-- Qualquer autenticado lê clubes
CREATE POLICY "clubs_read_all"   ON clubs FOR SELECT TO authenticated USING (true);
-- Só coaches criam/editam clubes
CREATE POLICY "clubs_write_coach" ON clubs FOR ALL TO authenticated USING (is_coach()) WITH CHECK (is_coach());

-- ── Liga atletas a clube ──────────────────────────────────────
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id);

-- ── RLS: atleta lê completions de colegas do mesmo clube ─────
-- (A política existente já permite ao atleta ler as suas próprias completions)
CREATE POLICY "athletes_read_club_completions" ON training_completions
  FOR SELECT TO authenticated
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      JOIN athletes me
        ON me.club_id IS NOT NULL
        AND me.club_id = a.club_id
        AND me.email = (auth.jwt() ->> 'email')
    )
  );

-- ── RLS: atleta lê perfil básico de colegas do mesmo clube ───
CREATE POLICY "athletes_read_clubmates" ON athletes
  FOR SELECT TO authenticated
  USING (
    -- sempre pode ler o próprio
    email = (auth.jwt() ->> 'email')
    OR
    -- ou colegas de clube
    (
      club_id IS NOT NULL AND
      club_id IN (
        SELECT club_id FROM athletes
        WHERE email = (auth.jwt() ->> 'email') AND club_id IS NOT NULL
      )
    )
  );
