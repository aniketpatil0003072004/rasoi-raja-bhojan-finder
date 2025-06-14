
-- Drop the existing policy for viewing payment proofs which relies on parsing the file path.
DROP POLICY IF EXISTS "Mess owners can view proofs for their mess subscriptions" ON storage.objects;

-- Create a new, more secure policy that validates access by checking the subscriptions table.
-- This ensures that a mess owner can only view a payment proof if it's linked to a subscription
-- for one of their messes.
CREATE POLICY "Mess owners can view payment proofs for their mess subscriptions"
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
            subscriptions.payment_screenshot_url = name
    )
);
