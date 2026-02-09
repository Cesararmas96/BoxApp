-- Fix Audit System Relationship and Types
-- 1. Ensure record_id is TEXT
ALTER TABLE public.audit_logs ALTER COLUMN record_id TYPE TEXT USING record_id::TEXT;

-- 2. Explicitly recreate the foreign key with a clear name
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_changed_by_fkey;
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.profiles(id);

-- 3. Grant permissions just in case
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO service_role;

-- 4. Ensure RLS is correct
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

DROP POLICY IF EXISTS "System and anyone can insert audit logs" ON public.audit_logs;
CREATE POLICY "System and anyone can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);
