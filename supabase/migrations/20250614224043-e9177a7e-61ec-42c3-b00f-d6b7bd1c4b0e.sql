
-- Allow delivery personnel to read subscription details for their assigned deliveries.
CREATE POLICY "Delivery personnel can view subscription details for assigned deliveries"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT subscription_id FROM public.deliveries WHERE delivery_person_id = auth.uid()
  )
);

-- Allow delivery personnel to read student profile details for their assigned deliveries.
CREATE POLICY "Delivery personnel can view student profiles for assigned deliveries"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT s.user_id
    FROM public.subscriptions s
    JOIN public.deliveries d ON s.id = d.subscription_id
    WHERE d.delivery_person_id = auth.uid()
  )
);
