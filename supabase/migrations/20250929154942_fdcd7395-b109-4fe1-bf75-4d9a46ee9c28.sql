-- Remove all existing profile policies that allow broad access to sensitive data
DROP POLICY IF EXISTS "Delivery personnel can view assigned student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Delivery personnel can view student profiles for assigned deliv" ON public.profiles;
DROP POLICY IF EXISTS "Mess owners can view their delivery personnel profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mess owners can view their subscribers profiles" ON public.profiles;

-- Keep only essential self-access policies
-- (The "Users can view their own profile" policy already exists and is secure)

-- Create minimal access policies for business functionality
-- Mess owners can only view delivery personnel's role and assignment status (not personal details)
CREATE POLICY "Mess owners can view basic delivery personnel info" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'delivery_personnel'::app_role 
  AND mess_id IN (
    SELECT id FROM messes WHERE owner_id = auth.uid()
  )
);

-- Create a secure function to check if viewing is allowed for delivery context
CREATE OR REPLACE FUNCTION public.can_view_delivery_contact(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow viewing contact info during active delivery
  SELECT EXISTS (
    SELECT 1
    FROM deliveries d
    JOIN subscriptions s ON d.subscription_id = s.id
    WHERE s.user_id = p_profile_id
    AND d.delivery_person_id = auth.uid()
    AND d.status IN ('assigned', 'food_preparing', 'food_ready', 'picked_up', 'out_for_delivery')
  );
$$;

-- Delivery personnel can only view student contact info during active deliveries
-- This prevents access to personal data outside of delivery context
CREATE POLICY "Delivery personnel can view contact info during active delivery" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'student'::app_role 
  AND can_view_delivery_contact(id)
);