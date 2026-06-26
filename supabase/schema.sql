-- Run Tejo Coaching App — Supabase Schema
-- Run this in the Supabase SQL editor

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists athletes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  "group"       text check ("group" in ('G1','G2','G3','G4','G5','G6')),
  pr_5km        integer,   -- seconds
  pr_10km       integer,   -- seconds
  strava_url    text,
  notes         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists races (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  date              date not null,
  distance_km       numeric(6,3),
  location          text,
  description       text,
  registration_url  text,
  created_at        timestamptz not null default now()
);

create table if not exists athlete_races (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  race_id     uuid not null references races(id) on delete cascade,
  confirmed   boolean not null default true,
  created_at  timestamptz not null default now(),
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
  id          uuid primary key default gen_random_uuid(),
  week_start  date not null unique,
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists individual_plans (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  race_id     uuid references races(id) on delete set null,
  objective   text not null check (objective in ('5km','10km')),
  weeks       integer not null default 3,
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- STORAGE
-- ============================================================

-- Create the certificates bucket (run via Supabase Dashboard → Storage
-- or via the management API; SQL editor cannot create buckets directly)
-- Bucket name: certificates
-- Public read: true

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table athletes        enable row level security;
alter table races           enable row level security;
alter table athlete_races   enable row level security;
alter table results         enable row level security;
alter table general_plans   enable row level security;
alter table individual_plans enable row level security;

-- Helper: is the current user the coach?
create or replace function is_coach()
returns boolean language sql security definer as $$
  select current_setting('app.coach_email', true) = (
    select email from auth.users where id = auth.uid()
  )
$$;

-- Helper: get the athlete id linked to the current user
create or replace function my_athlete_id()
returns uuid language sql security definer as $$
  select id from athletes where email = (
    select email from auth.users where id = auth.uid()
  ) limit 1
$$;

-- ---- races: public read, coach write ----
create policy "races_public_read"   on races for select using (true);
create policy "races_coach_insert"  on races for insert with check (is_coach());
create policy "races_coach_update"  on races for update using (is_coach());
create policy "races_coach_delete"  on races for delete using (is_coach());

-- ---- general_plans: public read, coach write ----
create policy "general_plans_public_read"  on general_plans for select using (true);
create policy "general_plans_coach_write"  on general_plans for insert with check (is_coach());
create policy "general_plans_coach_update" on general_plans for update using (is_coach());

-- ---- athletes: coach full access, athlete reads own row ----
create policy "athletes_coach_all"    on athletes for all using (is_coach());
create policy "athletes_self_read"    on athletes for select using (id = my_athlete_id());
create policy "athletes_self_update"  on athletes for update using (id = my_athlete_id());

-- ---- athlete_races: coach all, athlete own rows ----
create policy "athlete_races_coach_all"   on athlete_races for all using (is_coach());
create policy "athlete_races_self_select" on athlete_races for select using (athlete_id = my_athlete_id());
create policy "athlete_races_self_insert" on athlete_races for insert with check (athlete_id = my_athlete_id());
create policy "athlete_races_self_delete" on athlete_races for delete using (athlete_id = my_athlete_id());

-- ---- results: coach all, athlete own rows ----
create policy "results_coach_all"    on results for all using (is_coach());
create policy "results_self_select"  on results for select using (athlete_id = my_athlete_id());
create policy "results_self_insert"  on results for insert with check (athlete_id = my_athlete_id());
create policy "results_self_update"  on results for update using (athlete_id = my_athlete_id());

-- ---- individual_plans: coach all, athlete reads own ----
create policy "individual_plans_coach_all"   on individual_plans for all using (is_coach());
create policy "individual_plans_self_select" on individual_plans for select using (athlete_id = my_athlete_id());

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Set app.coach_email in your Supabase project settings (Database → Configuration → Settings)
--    OR replace the is_coach() function with a hardcoded email check:
--    select auth.email() = 'coach@runtejo.pt'
--
-- 2. After creating the storage bucket "certificates", add a policy:
--    - SELECT: true (public read)
--    - INSERT: auth.role() = 'authenticated'
--
-- 3. Create a Supabase Auth user for the coach with VITE_COACH_EMAIL
-- 4. Create Supabase Auth users for each athlete matching their email in the athletes table
