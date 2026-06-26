-- schema_v9.sql — Coluna escalão FPA na tabela athletes

alter table athletes add column if not exists escalao text;

-- Comentário sobre os escalões suportados:
-- 'Benjamim A M', 'Benjamim A F'   (Sub-10)
-- 'Benjamim B M', 'Benjamim B F'   (Sub-12)
-- 'Infantil M', 'Infantil F'        (Sub-14)
-- 'Iniciado M', 'Iniciado F'        (Sub-16)
-- 'Sub-18 M', 'Sub-18 F'
-- 'Sub-20 M', 'Sub-20 F'
-- 'Sub-23 M', 'Sub-23 F'
-- 'Sénior M', 'Sénior F'
-- 'V35 M', 'V35 F'  ...  'V70 M', 'V70 F'
