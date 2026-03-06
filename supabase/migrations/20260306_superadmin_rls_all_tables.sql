-- ============================================================
-- Migration: Superadmin RLS SELECT bypass — all box data tables
-- Date: 2026-03-06
-- Extends tenant_isolation_select on all data tables to include
-- is_super_admin() bypass so root@test.com can inspect any box.
-- Only SELECT policies are modified — INSERT/UPDATE/DELETE unchanged.
-- is_super_admin() already exists (20260219_superadmin_rls.sql).
-- ============================================================

-- WODS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wods') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.wods;
  CREATE POLICY "tenant_isolation_select" ON public.wods
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: wods';
END IF;
END $$;

-- LEADS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.leads;
  CREATE POLICY "tenant_isolation_select" ON public.leads
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: leads';
END IF;
END $$;

-- EXPENSES (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.expenses;
  CREATE POLICY "tenant_isolation_select" ON public.expenses
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: expenses';
END IF;
END $$;

-- INVOICES (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.invoices;
  CREATE POLICY "tenant_isolation_select" ON public.invoices
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: invoices';
END IF;
END $$;

-- PLANS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plans') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.plans;
  CREATE POLICY "tenant_isolation_select" ON public.plans
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: plans';
END IF;
END $$;

-- MOVEMENTS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='movements') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.movements;
  CREATE POLICY "tenant_isolation_select" ON public.movements
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: movements';
END IF;
END $$;

-- PERSONAL_RECORDS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_records') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.personal_records;
  CREATE POLICY "tenant_isolation_select" ON public.personal_records
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: personal_records';
END IF;
END $$;

-- BOOKINGS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.bookings;
  CREATE POLICY "tenant_isolation_select" ON public.bookings
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: bookings';
END IF;
END $$;

-- RESULTS (via wod join — no direct box_id)
-- Original policy: athlete_id = auth.uid() OR EXISTS (wods join where box_id matches)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='results') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.results;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='results' AND column_name='athlete_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.results
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR athlete_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.wods w WHERE w.id = results.wod_id AND w.box_id = public.current_user_box_id())
      );
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.results
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (SELECT 1 FROM public.wods w WHERE w.id = results.wod_id AND w.box_id = public.current_user_box_id())
      );
  END IF;
  RAISE NOTICE 'Superadmin bypass applied to: results';
END IF;
END $$;

-- SESSIONS (box_id direct if column exists, else role-based)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sessions') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.sessions;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sessions' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.sessions
      FOR SELECT TO authenticated
      USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.sessions
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach','receptionist','athlete'))
      );
  END IF;
  RAISE NOTICE 'Superadmin bypass applied to: sessions';
END IF;
END $$;

-- COMPETITIONS (box_id direct)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitions') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competitions;
  CREATE POLICY "tenant_isolation_select" ON public.competitions
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  RAISE NOTICE 'Superadmin bypass applied to: competitions';
END IF;
END $$;

-- COMPETITION_EVENTS (box_id direct or via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_events') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_events;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_events' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_events
      FOR SELECT TO authenticated
      USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.competition_events
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_events.competition_id AND c.box_id = public.current_user_box_id())
      );
  END IF;
  RAISE NOTICE 'Superadmin bypass applied to: competition_events';
END IF;
END $$;

-- COMPETITION_PARTICIPANTS (box_id direct or via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_participants') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_participants;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_participants' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_participants
      FOR SELECT TO authenticated
      USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.competition_participants
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.box_id = public.current_user_box_id())
      );
  END IF;
  RAISE NOTICE 'Superadmin bypass applied to: competition_participants';
END IF;
END $$;

-- COMPETITION_SCORES (box_id direct or via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_scores') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_scores;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_scores' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_scores
      FOR SELECT TO authenticated
      USING (public.is_super_admin() OR box_id = public.current_user_box_id());
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.competition_scores
      FOR SELECT TO authenticated
      USING (
        public.is_super_admin()
        OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_scores.competition_id AND c.box_id = public.current_user_box_id())
      );
  END IF;
  RAISE NOTICE 'Superadmin bypass applied to: competition_scores';
END IF;
END $$;

-- COMPETITION_JUDGES (via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_judges') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_judges;
  CREATE POLICY "tenant_isolation_select" ON public.competition_judges
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_judges.competition_id AND c.box_id = public.current_user_box_id())
    );
  RAISE NOTICE 'Superadmin bypass applied to: competition_judges';
END IF;
END $$;

-- COMPETITION_DIVISIONS (via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_divisions') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_divisions;
  CREATE POLICY "tenant_isolation_select" ON public.competition_divisions
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_divisions.competition_id AND c.box_id = public.current_user_box_id())
    );
  RAISE NOTICE 'Superadmin bypass applied to: competition_divisions';
END IF;
END $$;

-- COMPETITION_TEAMS (via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_teams') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_teams;
  CREATE POLICY "tenant_isolation_select" ON public.competition_teams
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_teams.competition_id AND c.box_id = public.current_user_box_id())
    );
  RAISE NOTICE 'Superadmin bypass applied to: competition_teams';
END IF;
END $$;

-- COMPETITION_HEATS (via competitions join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_heats') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_heats;
  CREATE POLICY "tenant_isolation_select" ON public.competition_heats
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_heats.competition_id AND c.box_id = public.current_user_box_id())
    );
  RAISE NOTICE 'Superadmin bypass applied to: competition_heats';
END IF;
END $$;

-- LANE_ASSIGNMENTS (via heats -> competitions double join)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lane_assignments') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.lane_assignments;
  CREATE POLICY "tenant_isolation_select" ON public.lane_assignments
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.competition_heats ch
        JOIN public.competitions c ON c.id = ch.competition_id
        WHERE ch.id = lane_assignments.heat_id AND c.box_id = public.current_user_box_id()
      )
    );
  RAISE NOTICE 'Superadmin bypass applied to: lane_assignments';
END IF;
END $$;

-- AUTOMATION_LOGS (box_id direct, admin-only)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='automation_logs') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.automation_logs;
  CREATE POLICY "tenant_isolation_select" ON public.automation_logs
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'))
    );
  RAISE NOTICE 'Superadmin bypass applied to: automation_logs';
END IF;
END $$;

-- AUDIT_LOGS (box_id direct, admin-only)
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.audit_logs;
  CREATE POLICY "tenant_isolation_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
      public.is_super_admin()
      OR (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'))
    );
  RAISE NOTICE 'Superadmin bypass applied to: audit_logs';
END IF;
END $$;

-- DONE
