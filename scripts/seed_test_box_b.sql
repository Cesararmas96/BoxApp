-- ============================================================
-- SEED: Test Box B — Multi-Tenant Isolation Testing
-- Date: 2026-03-03
-- Purpose: Create a second independent tenant to verify that
--          RLS policies completely isolate Box A data from Box B.
--
-- IMPORTANT: Auth users (auth.users) must be created FIRST via
--            Supabase Dashboard → Authentication → Users → Add user.
--            Then run this script using the Supabase SQL Editor
--            with the service_role key (bypasses RLS).
--
-- Users to create BEFORE running this script:
--   admin@boxb.test   password: Admin1234!
--   coach@boxb.test   password: Coach1234!
--   athlete@boxb.test password: Athlete1234!
-- ============================================================

-- ============================================================
-- STEP 1: Create Box B
-- Slug "crossfit-beta" → accesible en dev en /?box=crossfit-beta
-- ============================================================
INSERT INTO public.boxes (id, name, slug, country, subscription_status)
VALUES (
    'bbbbbbbb-0000-4000-a000-000000000001',
    'CrossFit Beta',
    'crossfit-beta',
    'Venezuela',
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    subscription_status = EXCLUDED.subscription_status;

-- ============================================================
-- STEP 2: Plans for Box B
-- ============================================================
INSERT INTO public.plans (id, name, price, box_id) VALUES
    ('bbbbbbbb-1111-4000-a000-000000000001', 'Starter',  60, 'bbbbbbbb-0000-4000-a000-000000000001'),
    ('bbbbbbbb-1111-4000-a000-000000000002', 'Pro',     100, 'bbbbbbbb-0000-4000-a000-000000000001'),
    ('bbbbbbbb-1111-4000-a000-000000000003', 'Elite',   150, 'bbbbbbbb-0000-4000-a000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Profiles for Box B
--
-- REPLACE the UUIDs below with the real auth.users IDs generated
-- by Supabase after creating the users in the dashboard.
-- You can find them in: Auth → Users → copy "User UID"
-- ============================================================

-- Admin de Box B
-- REPLACE 'REPLACE-WITH-AUTH-UID-ADMIN' with the real UID
INSERT INTO public.profiles (id, first_name, last_name, email, role_id, box_id, status)
VALUES (
    'REPLACE-WITH-AUTH-UID-ADMIN',
    'Carlos',
    'Beta',
    'admin@boxb.test',
    'admin',
    'bbbbbbbb-0000-4000-a000-000000000001',
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    role_id = 'admin',
    box_id  = 'bbbbbbbb-0000-4000-a000-000000000001';

-- Coach de Box B
-- REPLACE 'REPLACE-WITH-AUTH-UID-COACH' with the real UID
INSERT INTO public.profiles (id, first_name, last_name, email, role_id, box_id, status)
VALUES (
    'REPLACE-WITH-AUTH-UID-COACH',
    'Laura',
    'Beta',
    'coach@boxb.test',
    'coach',
    'bbbbbbbb-0000-4000-a000-000000000001',
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    role_id = 'coach',
    box_id  = 'bbbbbbbb-0000-4000-a000-000000000001';

-- Athlete de Box B
-- REPLACE 'REPLACE-WITH-AUTH-UID-ATHLETE' with the real UID
INSERT INTO public.profiles (id, first_name, last_name, email, role_id, box_id, status)
VALUES (
    'REPLACE-WITH-AUTH-UID-ATHLETE',
    'Pedro',
    'Beta',
    'athlete@boxb.test',
    'athlete',
    'bbbbbbbb-0000-4000-a000-000000000001',
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    role_id = 'athlete',
    box_id  = 'bbbbbbbb-0000-4000-a000-000000000001';

-- ============================================================
-- STEP 4: Membership for the athlete of Box B
-- Depends on athlete UID being correct in Step 3
-- ============================================================
INSERT INTO public.memberships (id, athlete_id, plan_id, status, start_date, box_id)
VALUES (
    'bbbbbbbb-2222-4000-a000-000000000001',
    'REPLACE-WITH-AUTH-UID-ATHLETE',
    'bbbbbbbb-1111-4000-a000-000000000002',
    'active',
    CURRENT_DATE,
    'bbbbbbbb-0000-4000-a000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: An expense for Box B (to test financial isolation)
-- ============================================================
INSERT INTO public.expenses (id, description, amount, category, date, box_id)
VALUES (
    'bbbbbbbb-3333-4000-a000-000000000001',
    'Renta mensual Box B',
    800,
    'Rent',
    CURRENT_DATE,
    'bbbbbbbb-0000-4000-a000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: Verify the setup
-- ============================================================
SELECT 'BOX B CREATED' AS result, id, name, slug, subscription_status
FROM public.boxes
WHERE id = 'bbbbbbbb-0000-4000-a000-000000000001';

SELECT 'PROFILES IN BOX B' AS result, first_name, last_name, email, role_id, status
FROM public.profiles
WHERE box_id = 'bbbbbbbb-0000-4000-a000-000000000001';

SELECT 'PLANS IN BOX B' AS result, name, price
FROM public.plans
WHERE box_id = 'bbbbbbbb-0000-4000-a000-000000000001';
