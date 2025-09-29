-- Add pricing tiers to messes table
ALTER TABLE public.messes 
ADD COLUMN IF NOT EXISTS price_1_month INTEGER,
ADD COLUMN IF NOT EXISTS price_2_months INTEGER,
ADD COLUMN IF NOT EXISTS price_3_months INTEGER,
ADD COLUMN IF NOT EXISTS price_6_months INTEGER;

-- Update existing monthly_price to price_1_month for existing data
UPDATE public.messes 
SET price_1_month = monthly_price 
WHERE monthly_price IS NOT NULL AND price_1_month IS NULL;

-- Add email column to profiles for delivery person lookup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index on email for profiles to ensure no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles(email) 
WHERE email IS NOT NULL;

-- Add function to get delivery person by email for mess owners
CREATE OR REPLACE FUNCTION public.get_delivery_person_by_email(p_email TEXT)
RETURNS TABLE(id UUID, full_name TEXT, phone_number TEXT, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone_number, p.email
  FROM profiles p
  WHERE p.email = p_email 
  AND p.role = 'delivery_personnel';
$$;

-- Create function for mess owners to assign delivery personnel by email
CREATE OR REPLACE FUNCTION public.assign_delivery_person_to_mess(p_mess_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delivery_person_id UUID;
  mess_owner_id UUID;
BEGIN
  -- Check if current user owns the mess
  SELECT owner_id INTO mess_owner_id FROM messes WHERE id = p_mess_id;
  IF mess_owner_id != auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Find delivery person by email
  SELECT id INTO delivery_person_id 
  FROM profiles 
  WHERE email = p_email AND role = 'delivery_personnel';
  
  IF delivery_person_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update delivery person's mess_id
  UPDATE profiles 
  SET mess_id = p_mess_id 
  WHERE id = delivery_person_id;
  
  -- Insert into mess_delivery_personnel if not exists
  INSERT INTO mess_delivery_personnel (mess_id, delivery_person_id)
  VALUES (p_mess_id, delivery_person_id)
  ON CONFLICT (mess_id, delivery_person_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;