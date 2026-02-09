-- Security Audit System Implementation
-- This migration sets up the triggers and internal functions to capture database changes automatically.

-- 1. Ensure the audit_logs table exists with correct columns
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- References profiles(id)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add foreign key if not exists (safely)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_changed_by_fkey'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT audit_logs_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. Create the function that will be called by triggers
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    v_record_id TEXT;
BEGIN
    -- Try to get the user ID from the Supabase session
    -- Note: auth.uid() works when changes come via PostgREST/Supabase API
    current_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        v_record_id := (row_to_json(OLD)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), current_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := (row_to_json(NEW)->>'id')::TEXT;
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, row_to_json(NEW), current_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Triggers for all critical tables
-- (Dropping first to avoid conflicts if they partially exist)

-- Profiles
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Boxes
DROP TRIGGER IF EXISTS audit_boxes_changes ON public.boxes;
CREATE TRIGGER audit_boxes_changes
AFTER INSERT OR UPDATE OR DELETE ON public.boxes
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Plans
DROP TRIGGER IF EXISTS audit_plans_changes ON public.plans;
CREATE TRIGGER audit_plans_changes
AFTER INSERT OR UPDATE OR DELETE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Memberships
DROP TRIGGER IF EXISTS audit_memberships_changes ON public.memberships;
CREATE TRIGGER audit_memberships_changes
AFTER INSERT OR UPDATE OR DELETE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- WODs
DROP TRIGGER IF EXISTS audit_wods_changes ON public.wods;
CREATE TRIGGER audit_wods_changes
AFTER INSERT OR UPDATE OR DELETE ON public.wods
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Competitions
DROP TRIGGER IF EXISTS audit_competitions_changes ON public.competitions;
CREATE TRIGGER audit_competitions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.competitions
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Leads
DROP TRIGGER IF EXISTS audit_leads_changes ON public.leads;
CREATE TRIGGER audit_leads_changes
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- Expenses
DROP TRIGGER IF EXISTS audit_expenses_changes ON public.expenses;
CREATE TRIGGER audit_expenses_changes
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_log();

-- 5. Enable RLS for audit_logs
-- Only admins should be able to read audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role_id = 'admin'
    )
);
