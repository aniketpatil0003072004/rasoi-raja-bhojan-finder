
-- Create a secure helper function to get the current user's role.
-- Using a SECURITY DEFINER function is a robust way to handle permissions and avoid complex RLS issues.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop and recreate the policy for mess owners viewing student payment proofs.
-- This policy was causing the error.
DROP POLICY IF EXISTS "Mess owners can view payment proofs for their mess subscriptions" ON storage.objects;
CREATE POLICY "Mess owners can view payment proofs for their mess subscriptions"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    public.get_user_role() = 'mess_owner' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        JOIN public.messes ON subscriptions.mess_id = messes.id
        WHERE
            messes.owner_id = auth.uid() AND
            ltrim(subscriptions.payment_screenshot_url, '/') = name
    )
);

-- For consistency, also update the policy for students viewing their confirmation proofs.
-- This uses the same robust pattern.
DROP POLICY IF EXISTS "Students can view subscription confirmation proofs" ON storage.objects;
CREATE POLICY "Students can view subscription confirmation proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    public.get_user_role() = 'student' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE
            subscriptions.user_id = auth.uid() AND
            ltrim(subscriptions.owner_confirmation_screenshot_url, '/') = name
    )
);

-- And also update the policy for owners viewing their own confirmation proofs.
DROP POLICY IF EXISTS "Owners can view confirmation proofs for their mess subscriptions" ON storage.objects;
CREATE POLICY "Owners can view confirmation proofs for their mess subscriptions"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    public.get_user_role() = 'mess_owner' AND
    EXISTS (
        SELECT 1
        FROM public.subscriptions
        JOIN public.messes ON subscriptions.mess_id = messes.id
        WHERE
            messes.owner_id = auth.uid() AND
            ltrim(subscriptions.owner_confirmation_screenshot_url, '/') = name
    )
);
