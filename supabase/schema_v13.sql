-- schema_v13.sql — Perfil expandido do atleta + medalhas

-- ── Novos campos no perfil do atleta ────────────────────────────
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS is_federated    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS federation_id   text,
  ADD COLUMN IF NOT EXISTS height_cm       integer,
  ADD COLUMN IF NOT EXISTS weight_kg       numeric(5,1),
  ADD COLUMN IF NOT EXISTS club            text,
  ADD COLUMN IF NOT EXISTS trainer_grade   text,          -- '1', '2', '3', 'Grau III', etc.
  ADD COLUMN IF NOT EXISTS equipment_watch text,
  ADD COLUMN IF NOT EXISTS equipment_shoes text,
  -- PRs pista (segundos decimais, ex: 100m = 11.42)
  ADD COLUMN IF NOT EXISTS pr_100m         numeric(6,2),
  ADD COLUMN IF NOT EXISTS pr_200m         numeric(6,2),
  ADD COLUMN IF NOT EXISTS pr_400m         numeric(6,2),
  ADD COLUMN IF NOT EXISTS pr_800m         numeric(7,2),
  ADD COLUMN IF NOT EXISTS pr_1500m        numeric(7,2),
  ADD COLUMN IF NOT EXISTS pr_3000m        numeric(7,2);
  -- pr_5km e pr_10km já existem em segundos inteiros

-- ── Tabela de medalhas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS athlete_medals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id       uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  competition_name text NOT NULL,
  competition_type text NOT NULL DEFAULT 'unofficial', -- 'FPA', 'official', 'unofficial'
  competition_date date,
  distance         text NOT NULL,   -- '100m','200m','400m','800m','1500m','3000m','5km','10km','Meia Maratona','Maratona','Corta-Mato'
  position         integer,         -- 1=ouro,2=prata,3=bronze,4+=sem medalha
  medal            text,            -- 'ouro','prata','bronze', null
  time_seconds     numeric(8,2),    -- tempo em segundos
  category         text,            -- escalão (Sénior M, Juvenil F, etc.)
  notes            text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE athlete_medals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_all_medals" ON athlete_medals
  FOR ALL TO authenticated USING (is_coach()) WITH CHECK (is_coach());

CREATE POLICY "athletes_read_own_medals" ON athlete_medals
  FOR SELECT TO authenticated
  USING (
    athlete_id IN (SELECT id FROM athletes WHERE email = (auth.jwt() ->> 'email'))
  );
