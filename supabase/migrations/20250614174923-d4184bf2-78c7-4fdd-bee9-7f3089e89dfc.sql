
-- Enable RLS for the 'messes' table to control access.
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;

-- This policy allows any authenticated user (like a student) to view all messes.
-- This is necessary for them to browse and decide which mess to subscribe to.
CREATE POLICY "Authenticated users can view all messes"
ON public.messes
FOR SELECT
TO authenticated
USING (true);

-- This policy gives mess owners full control over their own messes.
-- It's required for the owner dashboard to list pending subscriptions for messes they own.
CREATE POLICY "Mess owners can manage their own messes"
ON public.messes
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mess_owner');

-- This policy allows a student to view the confirmation proof you upload for their subscription.
-- It works by checking if the subscription ID, extracted from the file path, belongs to the current user.
CREATE POLICY "Students can view their subscription confirmations"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    name LIKE 'confirmations/%' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE
            -- The file path is 'confirmations/owner_id/subscription_id-filename.ext'.
            -- This extracts the 'subscription_id' part for verification.
            public.subscriptions.id = (string_to_array(split_part(name, '-', 1), '/'))[3]::uuid AND
            public.subscriptions.user_id = auth.uid()
    )
);
