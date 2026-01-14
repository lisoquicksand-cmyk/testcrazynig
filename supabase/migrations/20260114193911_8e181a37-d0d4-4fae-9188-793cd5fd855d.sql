-- Allow anyone to delete messages (for both admin and customer)
CREATE POLICY "Anyone can delete messages"
ON public.order_messages
FOR DELETE
USING (true);