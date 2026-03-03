-- ============================================================
-- admin_reset_password: allows admin/root to reset a user's
-- password to the default (12345678) via a Supabase RPC call.
-- No Edge Function deployment required.
-- ============================================================

-- Ensure pgcrypto is available (needed for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role TEXT;
    caller_email TEXT;
    hashed TEXT;
    default_pw TEXT := '12345678';
BEGIN
    -- 1. Verify caller is admin or root
    caller_email := auth.email();
    SELECT role_id INTO caller_role FROM public.profiles WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'admin'
       AND caller_email IS DISTINCT FROM 'root@test.com' THEN
        RETURN json_build_object('error', 'Unauthorized: only admin or root can reset passwords');
    END IF;

    -- 2. Verify target user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- 3. Hash the default password with bcrypt (same algo GoTrue uses)
    -- NOTE: cost factor 10 matches GoTrue's default; using gen_salt('bf') without
    -- an explicit cost defaults to 6 which causes "Invalid login credentials" errors.
    hashed := extensions.crypt(default_pw, extensions.gen_salt('bf', 10));

    -- 4. Update the password in auth.users
    UPDATE auth.users
    SET encrypted_password = hashed,
        updated_at = now()
    WHERE id = target_user_id;

    -- 5. Flag profile to force password change on next login
    UPDATE public.profiles
    SET force_password_change = true
    WHERE id = target_user_id;

    RETURN json_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users (RLS-style check is inside the function)
GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID) TO authenticated;

-- Force PostgREST to reload its schema cache so the function is available via RPC
NOTIFY pgrst, 'reload schema';
