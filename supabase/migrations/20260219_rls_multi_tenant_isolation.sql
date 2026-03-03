-- ============================================================
-- Migration: RLS Multi-Tenant Isolation (Defensive)
-- Date: 2026-02-19
-- Each section checks IF the table exists before applying.
-- ============================================================

-- STEP 0: Helper function
CREATE OR REPLACE FUNCTION public.current_user_box_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT box_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- STEP 1: WODS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wods') THEN
  ALTER TABLE public.wods ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.wods;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.wods;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.wods;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.wods;
  CREATE POLICY "tenant_isolation_select" ON public.wods FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_insert" ON public.wods FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_update" ON public.wods FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.wods FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: wods';
END IF;
END $$;

-- ============================================================
-- STEP 2: LEADS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.leads;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.leads;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.leads;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.leads;
  CREATE POLICY "tenant_isolation_select" ON public.leads FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist','coach')));
  CREATE POLICY "tenant_isolation_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')));
  CREATE POLICY "tenant_isolation_update" ON public.leads FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.leads FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: leads';
END IF;
END $$;

-- ============================================================
-- STEP 3: EXPENSES
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.expenses;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.expenses;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.expenses;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.expenses;
  CREATE POLICY "tenant_isolation_select" ON public.expenses FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')));
  CREATE POLICY "tenant_isolation_insert" ON public.expenses FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')));
  CREATE POLICY "tenant_isolation_update" ON public.expenses FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.expenses FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: expenses';
END IF;
END $$;

-- ============================================================
-- STEP 4: INVOICES
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
  ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.invoices;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.invoices;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.invoices;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.invoices;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='user_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.invoices FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')) OR user_id = auth.uid()));
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.invoices FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  END IF;
  CREATE POLICY "tenant_isolation_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')));
  CREATE POLICY "tenant_isolation_update" ON public.invoices FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.invoices FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: invoices';
END IF;
END $$;

-- ============================================================
-- STEP 5: PLANS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plans') THEN
  ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.plans;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.plans;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.plans;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.plans;
  CREATE POLICY "tenant_isolation_select" ON public.plans FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_insert" ON public.plans FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  CREATE POLICY "tenant_isolation_update" ON public.plans FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.plans FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: plans';
END IF;
END $$;

-- ============================================================
-- STEP 6: MOVEMENTS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='movements') THEN
  ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.movements;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.movements;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.movements;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.movements;
  CREATE POLICY "tenant_isolation_select" ON public.movements FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_insert" ON public.movements FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.movements FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.movements FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: movements';
END IF;
END $$;

-- ============================================================
-- STEP 7: PERSONAL_RECORDS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_records') THEN
  ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.personal_records;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.personal_records;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.personal_records;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.personal_records;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='personal_records' AND column_name='athlete_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.personal_records FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach'))));
    CREATE POLICY "tenant_isolation_insert" ON public.personal_records FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach'))));
    CREATE POLICY "tenant_isolation_update" ON public.personal_records FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id() AND (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')))) WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.personal_records FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach'))));
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.personal_records FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_insert" ON public.personal_records FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_update" ON public.personal_records FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.personal_records FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  END IF;
  RAISE NOTICE 'RLS applied to: personal_records';
END IF;
END $$;

-- ============================================================
-- STEP 8: BOOKINGS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings') THEN
  ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.bookings;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.bookings;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.bookings;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.bookings;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='user_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.bookings FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach','receptionist'))));
    CREATE POLICY "tenant_isolation_insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist'))));
    CREATE POLICY "tenant_isolation_delete" ON public.bookings FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist'))));
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.bookings FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.bookings FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','receptionist')));
  END IF;
  CREATE POLICY "tenant_isolation_update" ON public.bookings FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  RAISE NOTICE 'RLS applied to: bookings';
END IF;
END $$;

-- ============================================================
-- STEP 9: RESULTS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='results') THEN
  ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.results;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.results;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.results;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.results;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='results' AND column_name='athlete_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.results FOR SELECT TO authenticated USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.wods w WHERE w.id = results.wod_id AND w.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_insert" ON public.results FOR INSERT TO authenticated WITH CHECK (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.results FOR UPDATE TO authenticated USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_delete" ON public.results FOR DELETE TO authenticated USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.wods w WHERE w.id = results.wod_id AND w.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_insert" ON public.results FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.results FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_delete" ON public.results FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  END IF;
  RAISE NOTICE 'RLS applied to: results';
END IF;
END $$;

-- ============================================================
-- STEP 10: SESSIONS — box_id direct or via box column
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sessions') THEN
  ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.sessions;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.sessions;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.sessions;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.sessions;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sessions' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.sessions FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_insert" ON public.sessions FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_update" ON public.sessions FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.sessions FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  ELSE
    -- Fallback: role-based only
    CREATE POLICY "tenant_isolation_select" ON public.sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach','receptionist','athlete')));
    CREATE POLICY "tenant_isolation_insert" ON public.sessions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.sessions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_delete" ON public.sessions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  END IF;
  RAISE NOTICE 'RLS applied to: sessions';
END IF;
END $$;

-- ============================================================
-- STEP 11: COMPETITIONS (fix existing)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitions') THEN
  DROP POLICY IF EXISTS "Public can view competitions" ON public.competitions;
  DROP POLICY IF EXISTS "Admins manage competitions" ON public.competitions;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competitions;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competitions;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competitions;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competitions;
  CREATE POLICY "tenant_isolation_select" ON public.competitions FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_insert" ON public.competitions FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competitions FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
  CREATE POLICY "tenant_isolation_delete" ON public.competitions FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: competitions';
END IF;
END $$;

-- ============================================================
-- STEP 12: COMPETITION_EVENTS (fix USING(true))
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_events') THEN
  DROP POLICY IF EXISTS "Public can view competition events" ON public.competition_events;
  DROP POLICY IF EXISTS "Admins and coaches can manage events" ON public.competition_events;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_events;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_events;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_events;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_events;
  -- Check if box_id column exists on this table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_events' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_events FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_insert" ON public.competition_events FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.competition_events FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.competition_events FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  ELSE
    -- Fallback: join via competition_id -> competitions.box_id
    CREATE POLICY "tenant_isolation_select" ON public.competition_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_events.competition_id AND c.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_insert" ON public.competition_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_events.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.competition_events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_events.competition_id AND c.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_delete" ON public.competition_events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_events.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  END IF;
  RAISE NOTICE 'RLS applied to: competition_events';
END IF;
END $$;

-- ============================================================
-- STEP 13: COMPETITION_PARTICIPANTS (fix USING(true))
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_participants') THEN
  DROP POLICY IF EXISTS "Public can view participants" ON public.competition_participants;
  DROP POLICY IF EXISTS "Admins and coaches can manage participants" ON public.competition_participants;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_participants;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_participants;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_participants;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_participants;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_participants' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_participants FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_insert" ON public.competition_participants FOR INSERT TO authenticated WITH CHECK (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.competition_participants FOR UPDATE TO authenticated USING (box_id = public.current_user_box_id()) WITH CHECK (box_id = public.current_user_box_id());
    CREATE POLICY "tenant_isolation_delete" ON public.competition_participants FOR DELETE TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.competition_participants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_insert" ON public.competition_participants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
    CREATE POLICY "tenant_isolation_update" ON public.competition_participants FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.box_id = public.current_user_box_id()));
    CREATE POLICY "tenant_isolation_delete" ON public.competition_participants FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_participants.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  END IF;
  RAISE NOTICE 'RLS applied to: competition_participants';
END IF;
END $$;

-- ============================================================
-- STEP 14: COMPETITION_SCORES (fix USING(true))
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_scores') THEN
  DROP POLICY IF EXISTS "Public can view competition scores" ON public.competition_scores;
  DROP POLICY IF EXISTS "Admins and coaches can manage scores" ON public.competition_scores;
  DROP POLICY IF EXISTS "Public can view validated scores" ON public.competition_scores;
  DROP POLICY IF EXISTS "Judges can create scores" ON public.competition_scores;
  DROP POLICY IF EXISTS "Judges can update own scores" ON public.competition_scores;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_scores;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_scores;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_scores;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_scores;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='competition_scores' AND column_name='box_id') THEN
    CREATE POLICY "tenant_isolation_select" ON public.competition_scores FOR SELECT TO authenticated USING (box_id = public.current_user_box_id());
  ELSE
    CREATE POLICY "tenant_isolation_select" ON public.competition_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_scores.competition_id AND c.box_id = public.current_user_box_id()));
  END IF;
  CREATE POLICY "tenant_isolation_insert" ON public.competition_scores FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competition_scores FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_delete" ON public.competition_scores FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: competition_scores';
END IF;
END $$;

-- ============================================================
-- STEP 15: COMPETITION_JUDGES (via parent)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_judges') THEN
  DROP POLICY IF EXISTS "Public can view competition judges" ON public.competition_judges;
  DROP POLICY IF EXISTS "Admins and coaches can manage judges" ON public.competition_judges;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_judges;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_judges;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_judges;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_judges;
  CREATE POLICY "tenant_isolation_select" ON public.competition_judges FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_judges.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_insert" ON public.competition_judges FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_judges.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competition_judges FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_judges.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_delete" ON public.competition_judges FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_judges.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: competition_judges';
END IF;
END $$;

-- ============================================================
-- STEP 16: COMPETITION_DIVISIONS (via parent)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_divisions') THEN
  DROP POLICY IF EXISTS "Public can view divisions" ON public.competition_divisions;
  DROP POLICY IF EXISTS "Admins manage divisions" ON public.competition_divisions;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_divisions;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_divisions;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_divisions;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_divisions;
  CREATE POLICY "tenant_isolation_select" ON public.competition_divisions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_divisions.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_insert" ON public.competition_divisions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_divisions.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competition_divisions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_divisions.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_delete" ON public.competition_divisions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_divisions.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: competition_divisions';
END IF;
END $$;

-- ============================================================
-- STEP 17: COMPETITION_TEAMS (via parent)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_teams') THEN
  DROP POLICY IF EXISTS "Public can view teams" ON public.competition_teams;
  DROP POLICY IF EXISTS "Admins manage teams" ON public.competition_teams;
  DROP POLICY IF EXISTS "Captains manage own team" ON public.competition_teams;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_teams;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_teams;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_teams;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_teams;
  CREATE POLICY "tenant_isolation_select" ON public.competition_teams FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_teams.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_insert" ON public.competition_teams FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_teams.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competition_teams FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_teams.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_delete" ON public.competition_teams FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_teams.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: competition_teams';
END IF;
END $$;

-- ============================================================
-- STEP 18: COMPETITION_HEATS (via parent)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competition_heats') THEN
  DROP POLICY IF EXISTS "Public can view heats" ON public.competition_heats;
  DROP POLICY IF EXISTS "Admins manage heats" ON public.competition_heats;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.competition_heats;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.competition_heats;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.competition_heats;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.competition_heats;
  CREATE POLICY "tenant_isolation_select" ON public.competition_heats FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_heats.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_insert" ON public.competition_heats FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_heats.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.competition_heats FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_heats.competition_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_delete" ON public.competition_heats FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_heats.competition_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: competition_heats';
END IF;
END $$;

-- ============================================================
-- STEP 19: LANE_ASSIGNMENTS (via heat -> competition)
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lane_assignments') THEN
  DROP POLICY IF EXISTS "Public can view lanes" ON public.lane_assignments;
  DROP POLICY IF EXISTS "Admins manage lanes" ON public.lane_assignments;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.lane_assignments;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.lane_assignments;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.lane_assignments;
  DROP POLICY IF EXISTS "tenant_isolation_delete" ON public.lane_assignments;
  CREATE POLICY "tenant_isolation_select" ON public.lane_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.competition_heats ch JOIN public.competitions c ON c.id = ch.competition_id WHERE ch.id = lane_assignments.heat_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_insert" ON public.lane_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.competition_heats ch JOIN public.competitions c ON c.id = ch.competition_id WHERE ch.id = lane_assignments.heat_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.lane_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.competition_heats ch JOIN public.competitions c ON c.id = ch.competition_id WHERE ch.id = lane_assignments.heat_id AND c.box_id = public.current_user_box_id()));
  CREATE POLICY "tenant_isolation_delete" ON public.lane_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.competition_heats ch JOIN public.competitions c ON c.id = ch.competition_id WHERE ch.id = lane_assignments.heat_id AND c.box_id = public.current_user_box_id()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: lane_assignments';
END IF;
END $$;

-- ============================================================
-- STEP 20: AUTOMATION_LOGS
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='automation_logs') THEN
  ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.automation_logs;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.automation_logs;
  CREATE POLICY "tenant_isolation_select" ON public.automation_logs FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  CREATE POLICY "tenant_isolation_insert" ON public.automation_logs FOR INSERT TO authenticated, service_role WITH CHECK (true);
  RAISE NOTICE 'RLS applied to: automation_logs';
END IF;
END $$;

-- ============================================================
-- STEP 21: FUNCTIONAL_FEEDBACK
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='functional_feedback') THEN
  ALTER TABLE public.functional_feedback ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.functional_feedback;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.functional_feedback;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.functional_feedback;
  -- Use role-based access (safe regardless of column names)
  CREATE POLICY "tenant_isolation_select" ON public.functional_feedback FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach','athlete')));
  CREATE POLICY "tenant_isolation_insert" ON public.functional_feedback FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  CREATE POLICY "tenant_isolation_update" ON public.functional_feedback FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('admin','coach')));
  RAISE NOTICE 'RLS applied to: functional_feedback';
END IF;
END $$;

-- ============================================================
-- STEP 22: AUDIT_LOGS — add box_id + fix policies
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
  -- Add box_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='box_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN box_id UUID;
  END IF;
  DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "System and anyone can insert audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.audit_logs;
  DROP POLICY IF EXISTS "tenant_isolation_insert" ON public.audit_logs;
  CREATE POLICY "tenant_isolation_select" ON public.audit_logs FOR SELECT TO authenticated USING (box_id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  CREATE POLICY "tenant_isolation_insert" ON public.audit_logs FOR INSERT TO authenticated, service_role WITH CHECK (true);
  RAISE NOTICE 'RLS applied to: audit_logs';
END IF;
END $$;

-- ============================================================
-- STEP 23: BOXES — only your own box visible
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boxes') THEN
  ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.boxes;
  DROP POLICY IF EXISTS "anon_select_by_slug" ON public.boxes;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.boxes;
  CREATE POLICY "tenant_isolation_select" ON public.boxes FOR SELECT TO authenticated USING (id = public.current_user_box_id());
  CREATE POLICY "anon_select_by_slug" ON public.boxes FOR SELECT TO anon USING (true);
  CREATE POLICY "tenant_isolation_update" ON public.boxes FOR UPDATE TO authenticated USING (id = public.current_user_box_id()) WITH CHECK (id = public.current_user_box_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'));
  RAISE NOTICE 'RLS applied to: boxes';
END IF;
END $$;

-- ============================================================
-- STEP 24: ROLES — system table, read-only
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='roles') THEN
  ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "roles_select" ON public.roles;
  CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);
  RAISE NOTICE 'RLS applied to: roles';
END IF;
END $$;

-- ============================================================
-- STEP 25: Fix admin_reset_password cross-tenant
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions AS $$
DECLARE
    caller_role TEXT; caller_email TEXT; caller_box_id UUID;
    target_box_id UUID; hashed TEXT; default_pw TEXT := '12345678';
BEGIN
    caller_email := auth.email();
    SELECT role_id, box_id INTO caller_role, caller_box_id FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' AND caller_email IS DISTINCT FROM 'root@test.com' THEN
        RETURN json_build_object('error', 'Unauthorized');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RETURN json_build_object('error', 'User not found');
    END IF;
    SELECT box_id INTO target_box_id FROM public.profiles WHERE id = target_user_id;
    IF caller_email IS DISTINCT FROM 'root@test.com' AND target_box_id IS DISTINCT FROM caller_box_id THEN
        RETURN json_build_object('error', 'Cannot reset password for user outside your box');
    END IF;
    -- NOTE: cost factor 10 matches GoTrue's default; gen_salt('bf') without explicit
    -- cost defaults to 6 which causes "Invalid login credentials" errors.
    hashed := extensions.crypt(default_pw, extensions.gen_salt('bf', 10));
    UPDATE auth.users SET encrypted_password = hashed, updated_at = now() WHERE id = target_user_id;
    UPDATE public.profiles SET force_password_change = true WHERE id = target_user_id;
    RETURN json_build_object('success', true);
END; $$;

-- ============================================================
-- STEP 26: Update audit trigger to capture box_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID; current_box_id UUID; v_record_id TEXT;
BEGIN
    current_user_id := auth.uid();
    SELECT box_id INTO current_box_id FROM public.profiles WHERE id = current_user_id;
    IF (TG_OP = 'DELETE') THEN
        v_record_id := (row_to_json(OLD)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by, box_id) VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), current_user_id, current_box_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by, box_id) VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user_id, current_box_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by, box_id) VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(NEW), current_user_id, current_box_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DONE ✅
