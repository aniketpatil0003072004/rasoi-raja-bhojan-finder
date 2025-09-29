-- Remove overly permissive public access policies for profiles table
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Create secure policies that restrict access appropriately
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Mess owners can view profiles of their delivery personnel
CREATE POLICY "Mess owners can view their delivery personnel profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'delivery_personnel'::app_role 
  AND mess_id IN (
    SELECT id FROM messes WHERE owner_id = auth.uid()
  )
);

-- Delivery personnel can view student profiles only for assigned deliveries
CREATE POLICY "Delivery personnel can view assigned student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'student'::app_role 
  AND is_assigned_delivery_person_for_profile(id)
);

-- Mess owners can view student profiles who have subscriptions to their mess
CREATE POLICY "Mess owners can view their subscribers profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'student'::app_role 
  AND id IN (
    SELECT s.user_id 
    FROM subscriptions s 
    JOIN messes m ON s.mess_id = m.id 
    WHERE m.owner_id = auth.uid()
  )
);