
-- The previous migration failed because of a dependency error.
-- This script fixes it by first using CASCADE to remove the function and all policies that depend on it.
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- Now, systematically drop any old versions of the policies we are about to create.
-- This ensures a clean slate.
DROP POLICY IF EXISTS "Mess owners can view payment proofs for their mess subscriptions" ON storage.objects;
DROP POLICY IF EXISTS "Mess owners can view proofs for their mess subscriptions" ON storage.objects;
DROP POLICY IF EXISTS "Owners can view their own confirmation screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Owners can view confirmation proofs for their mess subscriptions" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Students can view subscription confirmation proofs" ON storage.objects;

-- Finally, create the definitive set of simplified, robust policies.

-- 1. Policy for Mess Owners to view the student's payment proof.
CREATE POLICY "Mess owners can view payment proofs for their mess subscriptions"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'payment_proofs' AND
    EXISTS (
        SELECT 1 FROM public.subscriptions
        JOIN public.messes ON subscriptions.mess_id = messes.id
        WHERE messes.owner_id = auth.uid()
          AND ltrim(subscriptions.payment_screenshot_url, '/') = name
    )
);

-- 2. Policy for Mess Owners to view their own confirmation proof.
CREATE POLICY "Owners can view confirmation proofs for their mess subscriptions"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'payment_proofs' AND
    EXISTS (
        SELECT 1 FROM public.subscriptions
        JOIN public.messes ON subscriptions.mess_id = messes.id
        WHERE messes.owner_id = auth.uid()
          AND ltrim(subscriptions.owner_confirmation_screenshot_url, '/') = name
    )
);

-- 3. Policy for Students to view their own payment proof.
CREATE POLICY "Students can view their own payment proofs"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'payment_proofs' AND
    EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE subscriptions.user_id = auth.uid()
          AND ltrim(subscriptions.payment_screenshot_url, '/') = name
    )
);

-- 4. Policy for Students to view the owner's confirmation proof.
CREATE POLICY "Students can view subscription confirmation proofs"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'payment_proofs' AND
    EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE subscriptions.user_id = auth.uid()
          AND ltrim(subscriptions.owner_confirmation_screenshot_url, '/') = name
    )
);
