-- schema_v8.sql — Recordes pessoais + resultados oficiais de atletas

-- Recordes pessoais (PBs) do atleta
create table if not exists athlete_personal_bests (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid references athletes(id) on delete cascade not null,
  event          text not null,           -- '100m','400m','5k','10k','Meia Maratona','Maratona', etc.
  time_seconds   numeric,                 -- tempo em segundos (corrida / pista)
  mark           text,                    -- marca original (ex: "45:30", "8.50m")
  source         text default 'manual',   -- 'manual' | 'strava' | 'official'
  recorded_at    date,
  race_name      text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (athlete_id, event, source)      -- um PB por evento/fonte
);

-- Resultados oficiais de provas
create table if not exists athlete_race_results (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid references athletes(id) on delete cascade not null,
  race_name      text not null,
  event          text not null,           -- '10k Estrada', 'Meia Maratona', '5000m Pista', etc.
  result         text not null,           -- ex: "45:23" ou "8.50m"
  time_seconds   numeric,
  position       integer,
  category       text,                    -- ex: 'Sénior M', 'Sub-20 F'
  location       text,
  race_date      date not null,
  official       boolean default true,
  strava_activity_id bigint,
  created_at     timestamptz default now()
);

-- RLS
alter table athlete_personal_bests enable row level security;
alter table athlete_race_results enable row level security;

-- Atleta vê e edita os seus próprios dados
create policy "athlete_read_own_pbs" on athlete_personal_bests
  for select using (
    athlete_id = (select id from athletes where email = auth.email())
  );

create policy "athlete_write_own_pbs" on athlete_personal_bests
  for all using (
    athlete_id = (select id from athletes where email = auth.email())
  );

create policy "athlete_read_own_results" on athlete_race_results
  for select using (
    athlete_id = (select id from athletes where email = auth.email())
  );

create policy "athlete_write_own_results" on athlete_race_results
  for all using (
    athlete_id = (select id from athletes where email = auth.email())
  );

-- Coach vê dados de todos os seus atletas
create policy "coach_read_pbs" on athlete_personal_bests
  for select using (
    exists (
      select 1 from athletes a
      where a.id = athlete_personal_bests.athlete_id
        and a.coach_id = (select id from athletes where email = auth.email() and is_coach = true)
    )
  );

create policy "coach_read_results" on athlete_race_results
  for select using (
    exists (
      select 1 from athletes a
      where a.id = athlete_race_results.athlete_id
        and a.coach_id = (select id from athletes where email = auth.email() and is_coach = true)
    )
  );

-- Adicionar colunas de onboarding à tabela athletes (se não existirem)
alter table athletes add column if not exists experience_level text;  -- 'runner' | 'beginner'
alter table athletes add column if not exists goal text;              -- 'improve' | 'compete' | 'health'
