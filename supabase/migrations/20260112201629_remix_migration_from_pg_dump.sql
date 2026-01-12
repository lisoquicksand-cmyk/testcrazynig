CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: course_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    course_name text NOT NULL,
    price numeric NOT NULL,
    discord_name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    price numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'ILS'::text NOT NULL,
    button_text text DEFAULT 'הרשמה לקורס'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid,
    package_name text NOT NULL,
    price numeric NOT NULL,
    discord_name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paypal_order_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pricing_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'ILS'::text NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    discount_percentage integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    applies_to text DEFAULT 'all'::text NOT NULL,
    usage_limit integer,
    times_used integer DEFAULT 0 NOT NULL,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT promo_codes_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'packages'::text, 'courses'::text]))),
    CONSTRAINT promo_codes_discount_percentage_check CHECK (((discount_percentage >= 0) AND (discount_percentage <= 100)))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    video_url text NOT NULL,
    video_type text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT videos_video_type_check CHECK ((video_type = ANY (ARRAY['youtube'::text, 'tiktok'::text])))
);


--
-- Name: course_orders course_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_orders
    ADD CONSTRAINT course_orders_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pricing_packages pricing_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_packages
    ADD CONSTRAINT pricing_packages_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: course_orders update_course_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_orders_updated_at BEFORE UPDATE ON public.course_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: promo_codes update_promo_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_orders course_orders_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_orders
    ADD CONSTRAINT course_orders_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: orders orders_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.pricing_packages(id);


--
-- Name: course_orders Anyone can create course orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create course orders" ON public.course_orders FOR INSERT WITH CHECK (true);


--
-- Name: orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: course_orders Anyone can delete course orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete course orders" ON public.course_orders FOR DELETE USING (true);


--
-- Name: orders Anyone can delete orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete orders" ON public.orders FOR DELETE USING (true);


--
-- Name: courses Anyone can modify courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can modify courses" ON public.courses USING (true) WITH CHECK (true);


--
-- Name: pricing_packages Anyone can modify pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can modify pricing" ON public.pricing_packages USING (true) WITH CHECK (true);


--
-- Name: promo_codes Anyone can modify promo codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can modify promo codes" ON public.promo_codes USING (true) WITH CHECK (true);


--
-- Name: site_settings Anyone can modify settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can modify settings" ON public.site_settings USING (true) WITH CHECK (true);


--
-- Name: videos Anyone can modify videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can modify videos" ON public.videos USING (true) WITH CHECK (true);


--
-- Name: course_orders Anyone can update course orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update course orders" ON public.course_orders FOR UPDATE USING (true);


--
-- Name: orders Anyone can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);


--
-- Name: courses Anyone can view active courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (true);


--
-- Name: pricing_packages Anyone can view active pricing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active pricing" ON public.pricing_packages FOR SELECT USING (true);


--
-- Name: videos Anyone can view active videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active videos" ON public.videos FOR SELECT USING (true);


--
-- Name: course_orders Anyone can view course orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view course orders" ON public.course_orders FOR SELECT USING (true);


--
-- Name: orders Anyone can view orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);


--
-- Name: promo_codes Anyone can view promo codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view promo codes" ON public.promo_codes FOR SELECT USING (true);


--
-- Name: site_settings Anyone can view site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: course_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: promo_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;