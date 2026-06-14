
-- =========================================================
-- 1. ROLE SYSTEM
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can see their own roles" ON public.user_roles;
CREATE POLICY "users can see their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- has_role: SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- Admin-only role management policies
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================================================
-- 2. DDOS RATE LIMITING (DB-backed)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_time
  ON public.rate_limit_hits (bucket, created_at DESC);

GRANT ALL ON public.rate_limit_hits TO service_role;
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- No client policies: only service role / SECURITY DEFINER fns can use it.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _max_hits int,
  _window_seconds int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hits int;
BEGIN
  DELETE FROM public.rate_limit_hits
    WHERE created_at < now() - (interval '1 second' * (_window_seconds * 4));

  SELECT count(*) INTO hits
    FROM public.rate_limit_hits
    WHERE bucket = _bucket
      AND created_at > now() - (interval '1 second' * _window_seconds);

  IF hits >= _max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_hits (bucket) VALUES (_bucket);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;

-- =========================================================
-- 3. CONTENT TABLES — public read, admin write
-- =========================================================

-- VIDEOS
DROP POLICY IF EXISTS "Anyone can modify videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;
CREATE POLICY "public read videos" ON public.videos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write videos" ON public.videos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COURSES
DROP POLICY IF EXISTS "Anyone can modify courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "public read courses" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRICING PACKAGES
DROP POLICY IF EXISTS "Anyone can modify pricing" ON public.pricing_packages;
DROP POLICY IF EXISTS "Anyone can view pricing" ON public.pricing_packages;
CREATE POLICY "public read pricing" ON public.pricing_packages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write pricing" ON public.pricing_packages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TESTIMONIALS
DROP POLICY IF EXISTS "Anyone can modify testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
CREATE POLICY "public read testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- UPDATES
DROP POLICY IF EXISTS "Anyone can modify updates" ON public.updates;
DROP POLICY IF EXISTS "Anyone can view updates" ON public.updates;
CREATE POLICY "public read updates" ON public.updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write updates" ON public.updates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROMO CODES (read still public for client-side preview; writes admin-only)
DROP POLICY IF EXISTS "Anyone can modify promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Anyone can view promo codes" ON public.promo_codes;
CREATE POLICY "public read promo codes" ON public.promo_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write promo codes" ON public.promo_codes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SITE SETTINGS (read still public for background/etc; writes admin-only)
DROP POLICY IF EXISTS "Anyone can modify settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "public read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write site settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- 4. ORDERS / COURSE ORDERS — admin only; inserts via edge function (service role)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can modify orders" ON public.orders;
CREATE POLICY "admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view course orders" ON public.course_orders;
DROP POLICY IF EXISTS "Anyone can insert course orders" ON public.course_orders;
DROP POLICY IF EXISTS "Anyone can update course orders" ON public.course_orders;
DROP POLICY IF EXISTS "Anyone can delete course orders" ON public.course_orders;
DROP POLICY IF EXISTS "Anyone can modify course orders" ON public.course_orders;
CREATE POLICY "admins manage course orders" ON public.course_orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- 5. ORDER MESSAGES — admin only direct; customer via edge function (service role)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view messages" ON public.order_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.order_messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.order_messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.order_messages;
DROP POLICY IF EXISTS "Anyone can modify messages" ON public.order_messages;
CREATE POLICY "admins manage messages" ON public.order_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- 6. ADMIN LOGIN ATTEMPTS — public can insert (for logging), admin can read
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view login attempts" ON public.admin_login_attempts;
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.admin_login_attempts;
DROP POLICY IF EXISTS "Public read attempts" ON public.admin_login_attempts;
GRANT SELECT, INSERT ON public.admin_login_attempts TO anon, authenticated;
GRANT ALL ON public.admin_login_attempts TO service_role;
CREATE POLICY "anyone can insert login attempts" ON public.admin_login_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins can read login attempts"   ON public.admin_login_attempts FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins can delete login attempts" ON public.admin_login_attempts FOR DELETE TO authenticated USING (public.is_admin());

-- =========================================================
-- 7. REMOVE OLD PLAINTEXT ADMIN PASSWORD ROW
-- =========================================================
DELETE FROM public.site_settings WHERE setting_key = 'admin_password';

-- =========================================================
-- 8. STORAGE — site-images bucket: public read, admin write
-- =========================================================
DROP POLICY IF EXISTS "Anyone can upload site images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update site images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete site images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view site images" ON storage.objects;

CREATE POLICY "public read site-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-images');

CREATE POLICY "admin upload site-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "admin update site-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "admin delete site-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.is_admin());
