-- Run Tejo — Schema completo (versão simplificada, email hardcoded)
-- Colar no SQL Editor do Supabase e clicar Run

-- TABELAS
create table if not exists athletes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  "group"    text check ("group" in ('G1','G2','G3','G4','G5','G6')),
  pr_5km     integer,
  pr_10km    integer,
  strava_url text,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists races (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  date             date not null,
  distance_km      numeric(6,3),
  location         text,
  description      text,
  registration_url text,
  created_at       timestamptz not null default now()
);

create table if not exists athlete_races (
  id         uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  race_id    uuid not null references races(id) on delete cascade,
  confirmed  boolean not null default true,
  created_at timestamptz not null default now(),
  unique(athlete_id, race_id)
);

create table if not exists results (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid not null references athletes(id) on delete cascade,
  race_id         uuid references races(id) on delete set null,
  date            date not null,
  distance_km     numeric(6,3) not null,
  time_seconds    integer not null,
  notes           text,
  certificate_url text,
  strava_url      text,
  created_at      timestamptz not null default now()
);

create table if not exists general_plans (
  id         uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  content    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists individual_plans (
  id         uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  race_id    uuid references races(id) on delete set null,
  objective  text not null check (objective in ('5km','10km')),
  weeks      integer not null default 3,
  content    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- FUNÇÕES HELPER
create or replace function is_coach()
returns boolean language sql security definer as $$
  select auth.email() = 'coach@runtejo.pt'
$$;

create or replace function my_athlete_id()
returns uuid language sql security definer as $$
  select id from athletes where email = auth.email() limit 1
$$;

-- ROW LEVEL SECURITY
alter table athletes         enable row level security;
alter table races            enable row level security;
alter table athlete_races    enable row level security;
alter table results          enable row level security;
alter table general_plans    enable row level security;
alter table individual_plans enable row level security;

-- races: leitura pública, escrita só coach
create policy "races_public_read"  on races for select using (true);
create policy "races_coach_insert" on races for insert with check (is_coach());
create policy "races_coach_update" on races for update using (is_coach());
create policy "races_coach_delete" on races for delete using (is_coach());

-- general_plans: leitura pública, escrita só coach
create policy "gp_public_read"  on general_plans for select using (true);
create policy "gp_coach_insert" on general_plans for insert with check (is_coach());
create policy "gp_coach_update" on general_plans for update using (is_coach());

-- athletes: coach vê tudo, atleta vê/edita o seu próprio
create policy "athletes_coach_all"   on athletes for all using (is_coach());
create policy "athletes_self_read"   on athletes for select using (id = my_athlete_id());
create policy "athletes_self_update" on athletes for update using (id = my_athlete_id());

-- athlete_races: coach vê tudo, atleta gere as suas
create policy "ar_coach_all"   on athlete_races for all using (is_coach());
create policy "ar_self_select" on athlete_races for select using (athlete_id = my_athlete_id());
create policy "ar_self_insert" on athlete_races for insert with check (athlete_id = my_athlete_id());
create policy "ar_self_delete" on athlete_races for delete using (athlete_id = my_athlete_id());

-- results: coach vê tudo, atleta gere os seus
create policy "res_coach_all"   on results for all using (is_coach());
create policy "res_self_select" on results for select using (athlete_id = my_athlete_id());
create policy "res_self_insert" on results for insert with check (athlete_id = my_athlete_id());
create policy "res_self_update" on results for update using (athlete_id = my_athlete_id());

-- individual_plans: coach gere tudo, atleta lê o seu
create policy "ip_coach_all"   on individual_plans for all using (is_coach());
create policy "ip_self_select" on individual_plans for select using (athlete_id = my_athlete_id());
