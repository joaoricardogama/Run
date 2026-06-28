-- schema_v16.sql — Adicionar polyline da rota Strava

ALTER TABLE training_completions
  ADD COLUMN IF NOT EXISTS map_polyline text;
