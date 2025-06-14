
-- First, create a helper function to securely get a user's role.
-- This is needed to avoid issues with the new security policy.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

-- Next, add a new policy to allow mess owners to unassign staff
-- from the messes they own.
CREATE POLICY "Owners can unassign staff from their messes"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- The user performing the action must be a mess owner
  public.get_user_role(auth.uid()) = 'mess_owner'
  AND
  -- The profile being updated must be for a delivery person
  role = 'delivery_personnel'
  AND
  -- The delivery person must be assigned to one of the owner's messes
  mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid())
)
WITH CHECK (
  -- This check ensures an owner can only unassign (set mess_id to null)
  -- or re-assign a staff member to another mess they own.
  mess_id IS NULL OR mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid())
);
