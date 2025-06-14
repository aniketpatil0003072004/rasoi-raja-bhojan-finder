
-- Drop the existing policy to replace it with a more robust version.
DROP POLICY IF EXISTS "Mess owners can view payment proofs for their mess subscriptions" ON storage.objects;

-- Recreate the policy with a fix to handle potential leading slashes in the stored URL path.
-- This makes the comparison between the path in the subscriptions table and the actual file
-- path in storage more reliable.
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
            -- Use ltrim to remove a potential leading slash for a robust comparison
            ltrim(subscriptions.payment_screenshot_url, '/') = name
    )
);
