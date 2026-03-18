CREATE TABLE public.updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view updates" ON public.updates FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can modify updates" ON public.updates FOR ALL TO public USING (true) WITH CHECK (true);