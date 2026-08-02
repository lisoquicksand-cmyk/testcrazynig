CREATE TABLE public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  details text,
  page_path text,
  ip_address text,
  user_agent text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.security_audit_log TO anon, authenticated;
GRANT SELECT, DELETE ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert audit events"
  ON public.security_audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins can read audit events"
  ON public.security_audit_log FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admins can delete audit events"
  ON public.security_audit_log FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log (created_at DESC);