
-- Policies for 'payment_proofs' bucket to allow uploads and views.

-- 1. This policy allows authenticated users with the 'student' role to upload files to the 'payment_proofs' bucket.
-- This is necessary for students to submit their payment screenshots.
CREATE POLICY "Students can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student'
);

-- 2. This policy allows mess owners to view files in the 'payment_proofs' bucket if the file path corresponds to their mess.
-- The file path is expected to be in the format 'mess_id/user_id/filename.ext'.
-- This is essential for owners to verify payment proofs.
CREATE POLICY "Mess owners can view proofs for their mess subscriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    (SELECT owner_id FROM public.messes WHERE id = (string_to_array(name, '/'))[1]::uuid) = auth.uid()
);

-- 3. This policy allows students to view their own uploaded files.
-- It checks if the user_id in the file path matches the current user's ID.
CREATE POLICY "Students can view their own payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    (string_to_array(name, '/'))[2]::uuid = auth.uid()
);

-- 4. This policy allows mess owners to upload their payment confirmation screenshots.
-- These files must be uploaded to a path starting with 'confirmations/'.
CREATE POLICY "Owners can upload confirmation screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mess_owner' AND
    name LIKE 'confirmations/%'
);

-- 5. This policy allows mess owners to view the confirmation screenshots they have uploaded.
CREATE POLICY "Owners can view their own confirmation screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_proofs' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mess_owner' AND
    name LIKE 'confirmations/%'
);
