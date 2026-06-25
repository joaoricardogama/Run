-- ============================================================
-- Run Tejo — Schema V4
-- Aplicar no Supabase SQL Editor (pode re-executar com segurança)
-- ============================================================

-- 1. Corrigir is_coach() para usar auth.email() directamente
--    Necessário porque current_setting('app.coach_email') pode não estar
--    configurado no Supabase, fazendo is_coach() retornar sempre false.
CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.email() = (
    SELECT email FROM coaches ORDER BY created_at LIMIT 1
  )
$$;

-- 2. Adicionar coluna avatar_url à tabela athletes (se não existir)
--    Necessário para o upload de foto de perfil em MyProfile.jsx
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS avatar_url text;
