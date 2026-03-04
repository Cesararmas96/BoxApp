-- ============================================================
-- Migration: Admin Panel — trial_ends_at + refined RLS
-- Date: 2026-03-03
-- Feature: FEAT-003 Panel Administrativo (TASK-011)
-- ============================================================

-- ============================================================
-- STEP 1: Add trial_ends_at column to boxes
-- ============================================================
ALTER TABLE public.boxes
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- STEP 1b: Backfill existing boxes: trial_ends_at = created_at + 30 days
UPDATE public.boxes
SET trial_ends_at = created_at + INTERVAL '30 days'
WHERE trial_ends_at IS NULL
  AND created_at IS NOT NULL;

-- Edge case: boxes with NULL created_at get trial_ends_at = now + 30 days
UPDATE public.boxes
SET trial_ends_at = now() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL;

RAISE NOTICE 'Added trial_ends_at to boxes and backfilled existing rows';

-- ============================================================
-- STEP 2: Refine boxes UPDATE policy
--
-- Current policy (from 20260219_superadmin_rls.sql):
--   "tenant_isolation_update" allows admin to UPDATE any field.
--
-- New constraint: when a box admin (non-superadmin) updates
-- subscription_status, they may ONLY set it to 'suspended'.
-- All other fields remain freely updatable by admin.
-- Superadmin retains unrestricted UPDATE access.
-- ============================================================
DO $$ BEGIN
IF EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'boxes'
) THEN
  -- Drop and recreate the UPDATE policy with the suspension restriction
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.boxes;

  CREATE POLICY "tenant_isolation_update" ON public.boxes
    FOR UPDATE TO authenticated
    USING (
      public.is_super_admin()
      OR (
        id = public.current_user_box_id()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role_id = 'admin'
        )
      )
    )
    WITH CHECK (
      -- Superadmin: unrestricted
      public.is_super_admin()
      OR (
        -- Box admin: can update their own box BUT
        -- subscription_status may only be set to 'suspended'
        id = public.current_user_box_id()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role_id = 'admin'
        )
        AND (
          -- Either subscription_status is not being changed (same as current)
          subscription_status = (
            SELECT b.subscription_status FROM public.boxes b WHERE b.id = public.current_user_box_id()
          )
          -- Or it is being changed, but only to 'suspended'
          OR subscription_status = 'suspended'
        )
      )
    );

  RAISE NOTICE 'Refined boxes UPDATE policy: admin can only set subscription_status to suspended';
END IF;
END $$;

-- ============================================================
-- DONE ✅
-- Summary:
--   1. boxes.trial_ends_at TIMESTAMPTZ added, backfilled with created_at + 30 days
--   2. boxes UPDATE policy refined: admin can suspend own box but not reactivate
-- Verification queries:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='boxes' AND column_name='trial_ends_at';
--   SELECT COUNT(*) FROM boxes WHERE trial_ends_at IS NULL;  -- must be 0
--   SELECT policyname FROM pg_policies
--     WHERE tablename='boxes' AND cmd='UPDATE';
-- ============================================================
