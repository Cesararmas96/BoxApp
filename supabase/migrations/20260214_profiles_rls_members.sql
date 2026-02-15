-- RLS Policies for profiles table
-- Allows staff (admin, coach, receptionist) to read all profiles in their box
-- Required for /members page to show the member list

-- Enable RLS if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might restrict access (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- 1. Users can always read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Staff (admin, coach, receptionist) can view all profiles in the same box
CREATE POLICY "Staff can view box members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
    AND p.box_id = profiles.box_id
    AND p.role_id IN ('admin', 'coach', 'receptionist')
  )
);

-- 3. Staff can update profiles in their box (for edit member)
CREATE POLICY "Staff can update box members"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
    AND p.box_id = profiles.box_id
    AND p.role_id IN ('admin', 'coach', 'receptionist')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
    AND p.box_id = profiles.box_id
    AND p.role_id IN ('admin', 'coach', 'receptionist')
  )
);

-- RLS for memberships (needed for profiles->memberships join in /members)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view box memberships" ON public.memberships;
CREATE POLICY "Staff can view box memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
    AND p.box_id = memberships.box_id
    AND p.role_id IN ('admin', 'coach', 'receptionist')
  )
);

-- Athletes can view their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
CREATE POLICY "Users can view own memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
