-- ============================================================
-- Migration: Clean Movements Schema
-- Date: 2026-02-14
-- Description:
--   1. Ensures image_url and demo_url columns exist
--   2. Adds a unique constraint on (name, box_id) to prevent
--      duplicate movements per box
--   3. Cleans up garbage entries (non-movement data)
-- ============================================================

-- 1. Add image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movements'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.movements ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- 2. Add demo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movements'
      AND column_name = 'demo_url'
  ) THEN
    ALTER TABLE public.movements ADD COLUMN demo_url TEXT;
  END IF;
END $$;

-- 3. Add unique constraint on (name, box_id) to prevent duplicates
-- First drop if exists to make migration idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movements_name_box_id_unique'
  ) THEN
    ALTER TABLE public.movements
      ADD CONSTRAINT movements_name_box_id_unique
      UNIQUE (name, box_id);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- There are duplicates; clean them up first (keep the oldest)
    DELETE FROM public.movements a
    USING public.movements b
    WHERE a.id > b.id
      AND a.name = b.name
      AND a.box_id = b.box_id;
    -- Now add the constraint
    ALTER TABLE public.movements
      ADD CONSTRAINT movements_name_box_id_unique
      UNIQUE (name, box_id);
END $$;

-- 4. Delete garbage entries that are NOT actual movements
-- These are training instructions, notes, numbers, etc.
DELETE FROM public.movements WHERE name IN (
  'Wod', 'Wod 1', 'Wod 2:', 'Workout', 'Complex', 'General',
  'Fuerza', 'Endurance', 'Endurance Fot Time', 'Combinado',
  'Seria Asi', 'Seria De Esta Forma', 'Hago 21',
  'Fallo = Bajar Peso', 'E2mom 10', 'Ot2m', '70/80/',
  '-4-3-2', '× 3', 'Entre El 85/90 %',
  'Con Pausa Abajo  Manteniendo Firme Abdomen Espalda Y Codos Arriba',
  'Debe Ser Tan Bajo Como Un Front Squat Comun Profundo Pero Sin Permitir Que Sufra La Rodilla La Flexión Máxima'
);

-- 5. Fix miscategorized movements
UPDATE public.movements SET category = 'Gymnastics' WHERE name IN (
  'Pull Ups', 'Strict Pull Ups', 'C2b Pull Ups', 'Chest To Bar',
  'Toes-to-bar', 'Rope Climbs', 'Wall Climbs', 'Air Squats',
  'Pistol Squats', 'Alternating Pustol Squats'
) AND category != 'Gymnastics';

UPDATE public.movements SET category = 'Accessory' WHERE name IN (
  'Wall Balls', 'Glute Bridge', 'Glute Bridge Hold'
) AND category NOT IN ('Accessory');

UPDATE public.movements SET category = 'Monostructural' WHERE name IN (
  'Double Unders', 'Doble Unders', 'Doblé Unders', 'Single Unders'
) AND category != 'Monostructural';
