-- ============================================================
-- Migration: Super-Admin RLS for boxes table
-- Date: 2026-02-19
-- Allows root@test.com (super-admin) to see/manage ALL boxes.
-- Regular users still see only their own box.
-- ============================================================

-- Helper: Check if current user is a super-admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (auth.email() = 'root@test.com')
    OR COALESCE((auth.jwt()->'user_metadata'->>'is_root')::boolean, false)
$$;

-- ============================================================
-- BOXES: Replace policies to include super-admin bypass
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boxes') THEN
  DROP POLICY IF EXISTS "tenant_isolation_select" ON public.boxes;
  DROP POLICY IF EXISTS "anon_select_by_slug" ON public.boxes;
  DROP POLICY IF EXISTS "tenant_isolation_update" ON public.boxes;
  DROP POLICY IF EXISTS "superadmin_insert" ON public.boxes;
  DROP POLICY IF EXISTS "superadmin_delete" ON public.boxes;

  -- SELECT: super-admin sees all, regular users only their box
  CREATE POLICY "tenant_isolation_select" ON public.boxes
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR id = public.current_user_box_id());

  -- Anon can read boxes (needed for slug-based login page)
  CREATE POLICY "anon_select_by_slug" ON public.boxes
    FOR SELECT TO anon
    USING (true);

  -- INSERT: only super-admin can create new boxes
  CREATE POLICY "superadmin_insert" ON public.boxes
    FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());

  -- UPDATE: super-admin can update any box; box-admin can update their own
  CREATE POLICY "tenant_isolation_update" ON public.boxes
    FOR UPDATE TO authenticated
    USING (
      public.is_super_admin()
      OR (id = public.current_user_box_id() AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'
      ))
    )
    WITH CHECK (
      public.is_super_admin()
      OR (id = public.current_user_box_id() AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'admin'
      ))
    );

  -- DELETE: only super-admin
  CREATE POLICY "superadmin_delete" ON public.boxes
    FOR DELETE TO authenticated
    USING (public.is_super_admin());

  RAISE NOTICE 'Super-admin RLS applied to: boxes';
END IF;
END $$;

-- ============================================================
-- PROFILES: super-admin can see member counts across all boxes
-- ============================================================
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
  -- Add a policy that allows super-admin to SELECT all profiles
  -- (needed for counting members per box in the admin panel)
  DROP POLICY IF EXISTS "superadmin_read_all" ON public.profiles;
  CREATE POLICY "superadmin_read_all" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.is_super_admin());

  RAISE NOTICE 'Super-admin RLS applied to: profiles';
END IF;
END $$;

-- DONE ✅
