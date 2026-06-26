-- Migration: Add unique constraints and sequences for concurrent safety
-- Run this against your PostgreSQL database

-- =============================================
-- 1. Sequence for participant IDs (atomic, race-free)
-- =============================================
CREATE SEQUENCE IF NOT EXISTS participant_id_seq START 1;

-- Sync sequence with existing data so new IDs don't collide with existing ones
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(participant_id FROM '\d+$') AS INTEGER)
  ), 0) INTO max_num FROM participants;
  IF max_num > 0 THEN
    PERFORM setval('participant_id_seq', max_num);
  END IF;
END $$;

-- =============================================
-- 2. Sequence for guest IDs (atomic, race-free)
-- =============================================
CREATE SEQUENCE IF NOT EXISTS guest_id_seq START 1;

-- Sync sequence with existing data
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(guest_id FROM '\d+$') AS INTEGER)
  ), 0) INTO max_num FROM guests;
  IF max_num > 0 THEN
    PERFORM setval('guest_id_seq', max_num);
  END IF;
END $$;

-- =============================================
-- 3. Unique constraint on participants (full_name + industry_name)
--    Prevents same person from being registered twice even under concurrency
-- =============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_name_industry
  ON participants (LOWER(full_name), LOWER(industry_name));

-- =============================================
-- 4. Unique constraint on guests (full_name + industry_name)
--    Prevents same guest from being registered twice
-- =============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_unique_name_industry
  ON guests (LOWER(full_name), LOWER(COALESCE(industry_name, '')));
