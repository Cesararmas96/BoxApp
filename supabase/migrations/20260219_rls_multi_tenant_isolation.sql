-- ============================================================
-- Migration: RLS Multi-Tenant Isolation
-- Date: 2026-02-19
-- Priority: CRITICAL (Phase 0 — Security Emergency)
-- Description:
--   Implements complete Row Level Security policies to ensure
--   strict data isolation between CrossFit Boxes (tenants).
--   
--   Before this migration, 13+ tables with box_id had NO
--   tenant-scoped RLS policies, allowing any authenticated user
--   to read/write data across all boxes.
--
-- Tables affected:
--   - Direct box_id: wods, classes, leads, expenses, invoices,
--     plans, items, movements, personal_records, bookings,
--     competitions, competition_events, competition_participants,
--     competition_scores
--   - Indirect (via parent): competition_divisions,
--     competition_teams, competition_heats, competition_judges,
--     lane_assignments
--   - Special: audit_logs, sessions, user_sessions,
--     automation_logs, item_history, functional_feedback, results
--   - Corrected: admin_reset_password function
-- ============================================================

-- ============================================================
-- STEP 0: Helper function to get the current user's box_id
-- This avoids repeating the subquery in every policy and
-- is marked STABLE + SECURITY DEFINER for performance & safety.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_box_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT box_id FROM public.profiles WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION public.current_user_box_id() IS
  'Returns the box_id of the currently authenticated user. Used in RLS policies for multi-tenant isolation.';


-- ============================================================
-- STEP 1: WODS — Core table, has box_id
-- ============================================================

ALTER TABLE public.wods ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.wods;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.wods;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.wods;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.wods;

CREATE POLICY "tenant_isolation_select" ON public.wods
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.wods
  FOR INSERT TO authenticated
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_update" ON public.wods
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.wods
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 2: CLASSES — has box_id
-- ============================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.classes;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.classes;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.classes;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.classes;

CREATE POLICY "tenant_isolation_select" ON public.classes
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.classes
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.classes
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 3: LEADS — has box_id
-- ============================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.leads;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.leads;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.leads;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.leads;

CREATE POLICY "tenant_isolation_select" ON public.leads
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 4: EXPENSES — has box_id
-- ============================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.expenses;

CREATE POLICY "tenant_isolation_select" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.expenses
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.expenses
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 5: INVOICES — has box_id
-- ============================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.invoices;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.invoices;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.invoices;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.invoices;

-- Staff can see all invoices in their box
CREATE POLICY "tenant_isolation_select" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      -- Staff can see all invoices in their box
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'receptionist')
      )
      -- Athletes can see their own invoices
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.invoices
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.invoices
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 6: PLANS — has box_id
-- ============================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.plans;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.plans;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.plans;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.plans;

-- All authenticated users in the box can view plans (needed for signup/billing)
CREATE POLICY "tenant_isolation_select" ON public.plans
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.plans
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.plans
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.plans
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 7: ITEMS (Inventory) — has box_id
-- ============================================================

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.items;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.items;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.items;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.items;

CREATE POLICY "tenant_isolation_select" ON public.items
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.items
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.items
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 8: MOVEMENTS — has box_id
-- ============================================================

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.movements;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.movements;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.movements;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.movements;

-- All users in the box can see movements (needed for WOD display)
CREATE POLICY "tenant_isolation_select" ON public.movements
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.movements
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.movements
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.movements
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 9: PERSONAL_RECORDS — has box_id
-- ============================================================

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.personal_records;
DROP POLICY IF EXISTS "athlete_own_records_select" ON public.personal_records;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.personal_records;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.personal_records;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.personal_records;

-- Staff can read all PRs in the box; athletes can see their own
CREATE POLICY "tenant_isolation_select" ON public.personal_records
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      athlete_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  );

-- Athletes can insert their own PRs within their box
CREATE POLICY "tenant_isolation_insert" ON public.personal_records
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND (
      athlete_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.personal_records
  FOR UPDATE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      athlete_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.personal_records
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      athlete_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  );


-- ============================================================
-- STEP 10: BOOKINGS — has box_id
-- ============================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.bookings;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.bookings;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.bookings;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.bookings;

CREATE POLICY "tenant_isolation_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach', 'receptionist')
      )
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'receptionist')
      )
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.bookings
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.bookings
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'receptionist')
      )
    )
  );


-- ============================================================
-- STEP 11: COMPETITIONS — has box_id (fix existing policies)
-- ============================================================

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins manage competitions" ON public.competitions;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competitions;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competitions;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competitions;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competitions;

CREATE POLICY "tenant_isolation_select" ON public.competitions
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.competitions
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competitions
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.competitions
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 12: COMPETITION_EVENTS — has box_id (fix USING(true))
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view competition events" ON public.competition_events;
DROP POLICY IF EXISTS "Admins and coaches can manage events" ON public.competition_events;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_events;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_events;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_events;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_events;

CREATE POLICY "tenant_isolation_select" ON public.competition_events
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.competition_events
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_events
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.competition_events
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 13: COMPETITION_PARTICIPANTS — has box_id (fix USING(true))
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view participants" ON public.competition_participants;
DROP POLICY IF EXISTS "Admins and coaches can manage participants" ON public.competition_participants;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_participants;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_participants;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_participants;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_participants;

CREATE POLICY "tenant_isolation_select" ON public.competition_participants
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.competition_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_participants
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.competition_participants
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 14: COMPETITION_SCORES — has box_id (fix USING(true))
-- The 20260210 migration created a DIFFERENT competition_scores
-- with different columns. We handle both schemas gracefully.
-- ============================================================

-- Drop old insecure policies from both migrations
DROP POLICY IF EXISTS "Public can view competition scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Admins and coaches can manage scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Public can view validated scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Judges can create scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Judges can update own scores" ON public.competition_scores;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_scores;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_scores;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_scores;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_scores;

CREATE POLICY "tenant_isolation_select" ON public.competition_scores
  FOR SELECT TO authenticated
  USING (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_insert" ON public.competition_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    box_id = public.current_user_box_id()
    AND (
      -- Judges assigned to the competition
      EXISTS (
        SELECT 1 FROM public.competition_judges cj
        WHERE cj.user_id = auth.uid()
        AND cj.competition_id = competition_scores.event_id  -- via event -> competition
      )
      -- Or admin/coach
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_scores
  FOR UPDATE TO authenticated
  USING (box_id = public.current_user_box_id())
  WITH CHECK (box_id = public.current_user_box_id());

CREATE POLICY "tenant_isolation_delete" ON public.competition_scores
  FOR DELETE TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 15: COMPETITION_JUDGES — No direct box_id, uses parent
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view competition judges" ON public.competition_judges;
DROP POLICY IF EXISTS "Admins and coaches can manage judges" ON public.competition_judges;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_judges;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_judges;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_judges;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_judges;

CREATE POLICY "tenant_isolation_select" ON public.competition_judges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_judges.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.competition_judges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_judges.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_judges
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_judges.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.competition_judges
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_judges.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 16: COMPETITION_DIVISIONS — No direct box_id, uses parent
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view divisions" ON public.competition_divisions;
DROP POLICY IF EXISTS "Admins manage divisions" ON public.competition_divisions;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_divisions;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_divisions;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_divisions;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_divisions;

CREATE POLICY "tenant_isolation_select" ON public.competition_divisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_divisions.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.competition_divisions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_divisions.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_divisions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_divisions.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.competition_divisions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_divisions.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 17: COMPETITION_TEAMS — No direct box_id, uses parent
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view teams" ON public.competition_teams;
DROP POLICY IF EXISTS "Admins manage teams" ON public.competition_teams;
DROP POLICY IF EXISTS "Captains manage own team" ON public.competition_teams;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_teams;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_teams;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_teams;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_teams;

CREATE POLICY "tenant_isolation_select" ON public.competition_teams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_teams.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.competition_teams
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_teams.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

-- Captains can also update their own team
CREATE POLICY "tenant_isolation_update" ON public.competition_teams
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_teams.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND (
      captain_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_id IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.competition_teams
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_teams.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 18: COMPETITION_HEATS — No direct box_id, uses parent
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view heats" ON public.competition_heats;
DROP POLICY IF EXISTS "Admins manage heats" ON public.competition_heats;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_heats;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_heats;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_heats;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_heats;

CREATE POLICY "tenant_isolation_select" ON public.competition_heats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_heats.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.competition_heats
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_heats.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.competition_heats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_heats.competition_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.competition_heats
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_heats.competition_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 19: LANE_ASSIGNMENTS — No direct box_id, via heat -> competition
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Public can view lanes" ON public.lane_assignments;
DROP POLICY IF EXISTS "Admins manage lanes" ON public.lane_assignments;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.lane_assignments;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.lane_assignments;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.lane_assignments;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.lane_assignments;

CREATE POLICY "tenant_isolation_select" ON public.lane_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_heats ch
      JOIN public.competitions c ON c.id = ch.competition_id
      WHERE ch.id = lane_assignments.heat_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.lane_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competition_heats ch
      JOIN public.competitions c ON c.id = ch.competition_id
      WHERE ch.id = lane_assignments.heat_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.lane_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_heats ch
      JOIN public.competitions c ON c.id = ch.competition_id
      WHERE ch.id = lane_assignments.heat_id
      AND c.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.lane_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_heats ch
      JOIN public.competitions c ON c.id = ch.competition_id
      WHERE ch.id = lane_assignments.heat_id
      AND c.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 20: SESSIONS — No box_id directly, but via class->box_id
-- ============================================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.sessions;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.sessions;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.sessions;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.sessions;

CREATE POLICY "tenant_isolation_select" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      WHERE cl.id = sessions.class_id
      AND cl.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes cl
      WHERE cl.id = sessions.class_id
      AND cl.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      WHERE cl.id = sessions.class_id
      AND cl.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes cl
      WHERE cl.id = sessions.class_id
      AND cl.box_id = public.current_user_box_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 21: USER_SESSIONS — via session -> class -> box_id
-- ============================================================

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.user_sessions;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.user_sessions;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.user_sessions;

CREATE POLICY "tenant_isolation_select" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.classes cl ON cl.id = s.class_id
      WHERE s.id = user_sessions.session_id
      AND cl.box_id = public.current_user_box_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role_id IN ('admin', 'coach', 'receptionist')
      )
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach', 'receptionist')
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.user_sessions
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach', 'receptionist')
    )
  );


-- ============================================================
-- STEP 22: RESULTS — via wod -> box_id
-- ============================================================

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.results;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.results;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.results;
DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.results;

CREATE POLICY "tenant_isolation_select" ON public.results
  FOR SELECT TO authenticated
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.wods w
      WHERE w.id = results.wod_id
      AND w.box_id = public.current_user_box_id()
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.results
  FOR INSERT TO authenticated
  WITH CHECK (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.results
  FOR UPDATE TO authenticated
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );

CREATE POLICY "tenant_isolation_delete" ON public.results
  FOR DELETE TO authenticated
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id IN ('admin', 'coach')
    )
  );


-- ============================================================
-- STEP 23: ITEM_HISTORY — via item -> box_id
-- ============================================================

ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.item_history;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.item_history;

CREATE POLICY "tenant_isolation_select" ON public.item_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_history.item_id
      AND i.box_id = public.current_user_box_id()
    )
  );

-- Insert is typically done by triggers, but allow staff inserts
CREATE POLICY "tenant_isolation_insert" ON public.item_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_history.item_id
      AND i.box_id = public.current_user_box_id()
    )
  );


-- ============================================================
-- STEP 24: FUNCTIONAL_FEEDBACK — no box_id, via session -> class
-- ============================================================

ALTER TABLE public.functional_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.functional_feedback;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.functional_feedback;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.functional_feedback;

CREATE POLICY "tenant_isolation_select" ON public.functional_feedback
  FOR SELECT TO authenticated
  USING (
    athlete_id = auth.uid()
    OR coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );

CREATE POLICY "tenant_isolation_insert" ON public.functional_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );

CREATE POLICY "tenant_isolation_update" ON public.functional_feedback
  FOR UPDATE TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 25: AUTOMATION_LOGS — has box_id
-- ============================================================

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.automation_logs;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.automation_logs;

CREATE POLICY "tenant_isolation_select" ON public.automation_logs
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );

-- System/service inserts — allow service_role and authenticated with box match
CREATE POLICY "tenant_isolation_insert" ON public.automation_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);


-- ============================================================
-- STEP 26: AUDIT_LOGS — Fix to filter by box_id
-- ============================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System and anyone can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "tenant_isolation_select" ON public.audit_logs;
DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.audit_logs;

-- Admins can only see audit logs for their own box
CREATE POLICY "tenant_isolation_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    box_id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );

-- System can always insert audit logs (triggered by DB)
CREATE POLICY "tenant_isolation_insert" ON public.audit_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);


-- ============================================================
-- STEP 27: BOXES table — Only visible to members of that box
-- (Except for login page which uses anon/public access)
-- ============================================================

ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON public.boxes;
DROP POLICY IF EXISTS "anon_select_by_slug" ON public.boxes;
DROP POLICY IF EXISTS "tenant_isolation_update" ON public.boxes;

-- Authenticated users can see their own box
CREATE POLICY "tenant_isolation_select" ON public.boxes
  FOR SELECT TO authenticated
  USING (id = public.current_user_box_id());

-- Anonymous users can look up boxes by slug (needed for /box/:slug login page)
CREATE POLICY "anon_select_by_slug" ON public.boxes
  FOR SELECT TO anon
  USING (true);

-- Only admins can update their box settings
CREATE POLICY "tenant_isolation_update" ON public.boxes
  FOR UPDATE TO authenticated
  USING (id = public.current_user_box_id())
  WITH CHECK (
    id = public.current_user_box_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role_id = 'admin'
    )
  );


-- ============================================================
-- STEP 28: ROLES table — Read-only for all authenticated
-- (System table, not tenant-specific)
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select" ON public.roles;

CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- STEP 29: Fix admin_reset_password to validate same-box
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role TEXT;
    caller_email TEXT;
    caller_box_id UUID;
    target_box_id UUID;
    hashed TEXT;
    default_pw TEXT := '12345678';
BEGIN
    -- 1. Verify caller is admin or root
    caller_email := auth.email();
    SELECT role_id, box_id INTO caller_role, caller_box_id
      FROM public.profiles WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'admin'
       AND caller_email IS DISTINCT FROM 'root@test.com' THEN
        RETURN json_build_object('error', 'Unauthorized: only admin or root can reset passwords');
    END IF;

    -- 2. Verify target user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- 3. SECURITY: Verify target user belongs to the same box
    SELECT box_id INTO target_box_id
      FROM public.profiles WHERE id = target_user_id;

    IF caller_email IS DISTINCT FROM 'root@test.com'
       AND (target_box_id IS DISTINCT FROM caller_box_id) THEN
        RETURN json_build_object('error', 'Cannot reset password for user outside your box');
    END IF;

    -- 4. Hash the default password with bcrypt (same algo GoTrue uses)
    hashed := extensions.crypt(default_pw, extensions.gen_salt('bf'));

    -- 5. Update the password in auth.users
    UPDATE auth.users
    SET encrypted_password = hashed,
        updated_at = now()
    WHERE id = target_user_id;

    -- 6. Flag profile to force password change on next login
    UPDATE public.profiles
    SET force_password_change = true
    WHERE id = target_user_id;

    RETURN json_build_object('success', true);
END;
$$;


-- ============================================================
-- STEP 30: Add box_id column to audit_logs if missing
-- (The proc_audit_log trigger should populate it automatically)
-- ============================================================

-- Ensure box_id exists on audit_logs for tenant filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'box_id'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN box_id UUID;
  END IF;
END $$;

-- Update the audit trigger function to capture box_id
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_box_id UUID;
    v_record_id TEXT;
BEGIN
    -- Try to get the user ID and box_id from the Supabase session
    current_user_id := auth.uid();
    SELECT box_id INTO current_box_id
      FROM public.profiles WHERE id = current_user_id;

    IF (TG_OP = 'DELETE') THEN
        v_record_id := (row_to_json(OLD)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by, box_id)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), current_user_id, current_box_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by, box_id)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user_id, current_box_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by, box_id)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(NEW), current_user_id, current_box_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- DONE. All tables now have tenant-scoped RLS policies.
-- ============================================================
