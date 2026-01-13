-- Create order_messages table for communication between admin and customers
CREATE TABLE public.order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  course_order_id UUID REFERENCES public.course_orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'customer')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure at least one order reference is provided
  CONSTRAINT order_reference_check CHECK (
    (order_id IS NOT NULL AND course_order_id IS NULL) OR
    (order_id IS NULL AND course_order_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (customers check by email/discord)
CREATE POLICY "Anyone can view messages"
ON public.order_messages
FOR SELECT
USING (true);

-- Allow anyone to insert messages (for customer replies)
CREATE POLICY "Anyone can insert messages"
ON public.order_messages
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update messages (for marking as read)
CREATE POLICY "Anyone can update messages"
ON public.order_messages
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX idx_order_messages_course_order_id ON public.order_messages(course_order_id);