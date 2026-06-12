
CREATE TABLE public.admin_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  success BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_login_attempts TO anon;
GRANT SELECT, INSERT ON public.admin_login_attempts TO authenticated;
GRANT ALL ON public.admin_login_attempts TO service_role;

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert login attempts"
  ON public.admin_login_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read login attempts"
  ON public.admin_login_attempts FOR SELECT
  USING (true);

CREATE INDEX idx_admin_login_attempts_created_at ON public.admin_login_attempts(created_at DESC);
CREATE INDEX idx_admin_login_attempts_identifier ON public.admin_login_attempts(identifier);
