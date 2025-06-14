
-- Add address and phone number columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN address TEXT;
ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;

-- Create a policy that allows users to update their own profile information.
-- This is necessary for the subscription form to save the user's details.
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
