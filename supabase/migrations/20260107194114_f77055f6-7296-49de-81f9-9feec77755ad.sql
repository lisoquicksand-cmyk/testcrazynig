-- Create a separate table for course orders
CREATE TABLE public.course_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  discord_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create course orders" 
ON public.course_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view course orders" 
ON public.course_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update course orders" 
ON public.course_orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete course orders" 
ON public.course_orders 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_course_orders_updated_at
BEFORE UPDATE ON public.course_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();