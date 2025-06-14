
-- --- RLS Policies for 'delivery_proofs' bucket ---

-- Policy: Delivery personnel can upload proofs for their assigned deliveries.
-- The file path will be structured as: {delivery_id}/{file_type}.{extension}
-- Example: "a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4/pickup_food_photo.jpg"
CREATE POLICY "Delivery personnel can upload delivery proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'delivery_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'delivery_personnel' AND
    (SELECT delivery_person_id FROM public.deliveries WHERE id = (string_to_array(name, '/'))[1]::uuid) = auth.uid()
);

-- Policy: Delivery personnel can view the proofs they have uploaded.
CREATE POLICY "Delivery personnel can view their own delivery proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'delivery_proofs' AND
    (SELECT delivery_person_id FROM public.deliveries WHERE id = (string_to_array(name, '/'))[1]::uuid) = auth.uid()
);

-- Policy: Students can view proofs for their own deliveries.
CREATE POLICY "Students can view their delivery proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'delivery_proofs' AND
    EXISTS (
        SELECT 1 FROM public.deliveries d
        JOIN public.subscriptions s ON d.subscription_id = s.id
        WHERE d.id = (string_to_array(name, '/'))[1]::uuid AND s.user_id = auth.uid()
    )
);

-- Policy: Mess owners can view proofs for deliveries associated with their mess.
CREATE POLICY "Mess owners can view proofs for their mess deliveries"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'delivery_proofs' AND
    EXISTS (
        SELECT 1 FROM public.deliveries d
        WHERE d.id = (string_to_array(name, '/'))[1]::uuid AND d.mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid())
    )
);
