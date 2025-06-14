
-- Drop the old, overly permissive policy for owners viewing confirmations.
DROP POLICY IF EXISTS "Owners can view their own confirmation screenshots" ON storage.objects;

-- This policy allows students to view confirmation proofs for their active subscriptions.
-- It ensures that students can only see the confirmation if it's linked to one of their subscriptions.
CREATE POLICY "Students can view subscription confirmation proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE
            subscriptions.user_id = auth.uid() AND
            subscriptions.owner_confirmation_screenshot_url = name
    )
);

-- This policy allows mess owners to view confirmation proofs they uploaded for subscriptions to their messes.
-- This is more secure than the previous policy, as it ties access to the specific mess they own.
CREATE POLICY "Owners can view confirmation proofs for their mess subscriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mess_owner' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        JOIN public.messes ON subscriptions.mess_id = messes.id
        WHERE
            messes.owner_id = auth.uid() AND
            subscriptions.owner_confirmation_screenshot_url = name
    )
);
