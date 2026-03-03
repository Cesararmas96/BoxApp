-- ============================================================
-- Migration: Add subscription_status to boxes table
-- Date: 2026-03-02
-- Adds lifecycle management for multi-tenant SaaS billing.
-- ============================================================

-- STEP 1: Create ENUM type (defensive)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
    CREATE TYPE public.subscription_status_type AS ENUM (
      'trial',
      'active',
      'suspended',
      'cancelled'
    );
    RAISE NOTICE 'Created type: subscription_status_type';
  ELSE
    RAISE NOTICE 'Type subscription_status_type already exists, skipping.';
  END IF;
END $$;

-- STEP 2: Add column to boxes table (defensive)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'boxes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'boxes'
        AND column_name = 'subscription_status'
    ) THEN
      ALTER TABLE public.boxes
        ADD COLUMN subscription_status public.subscription_status_type NOT NULL DEFAULT 'trial';
      RAISE NOTICE 'Column subscription_status added to boxes.';
    ELSE
      RAISE NOTICE 'Column subscription_status already exists, skipping.';
    END IF;
  END IF;
END $$;

-- STEP 3: Migrate existing boxes to 'active'
-- All boxes created before this migration are considered active (manually managed).
UPDATE public.boxes
SET subscription_status = 'active'
WHERE subscription_status = 'trial';

-- STEP 4: Helper function for RLS / app logic
-- Returns true if the current user's box is active or on trial (i.e., NOT suspended/cancelled).
CREATE OR REPLACE FUNCTION public.is_tenant_active()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (
      SELECT subscription_status IN ('active', 'trial')
      FROM public.boxes
      WHERE id = public.current_user_box_id()
    ),
    false
  )
$$;

-- DONE ✅
-- New boxes default to 'trial'; super-admin sets them to 'active' manually.
-- Existing boxes are now 'active'.
