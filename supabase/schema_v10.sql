-- schema_v10: workout metrics from screenshots (Garmin / Apple)

-- Add metric columns to training_completions
alter table training_completions
  add column if not exists source          text    default 'manual',  -- 'manual' | 'strava' | 'screenshot'
  add column if not exists screenshot_url  text,
  add column if not exists distance_km     numeric,
  add column if not exists duration_sec    integer,
  add column if not exists pace_avg        text,
  add column if not exists hr_avg          integer,
  add column if not exists hr_max          integer,
  add column if not exists cadence_avg     integer,
  add column if not exists power_avg       integer,
  add column if not exists elevation_m     integer,
  add column if not exists laps            jsonb,   -- [{dist, time, pace, hr, cadence}]
  add column if not exists hr_zones        jsonb,   -- {z1:{pct,sec}, z2:..., z5:...}
  add column if not exists power_zones     jsonb,   -- {z1:..., z6:...}
  add column if not exists ai_summary      text;

-- Supabase Storage bucket (run in dashboard if bucket doesn't exist)
-- insert into storage.buckets (id, name, public) values ('workout-screenshots', 'workout-screenshots', true)
-- on conflict do nothing;

-- RLS for new columns inherits from training_completions policies
-- No extra policies needed (athlete can insert/update their own rows)
