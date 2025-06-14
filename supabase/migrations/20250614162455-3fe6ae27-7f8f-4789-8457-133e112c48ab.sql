
-- Create an enum type for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'mess_owner', 'delivery_personnel');

-- Add a role column to the profiles table, allowing it to be null initially
ALTER TABLE public.profiles ADD COLUMN role public.app_role;

-- Set a default role for any existing users that don't have one
UPDATE public.profiles SET role = 'student' WHERE role IS NULL;

-- Now that all rows have a value, make the column not-nullable
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Update the function that creates a profile for a new user to include their role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', (new.raw_user_meta_data->>'role')::public.app_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
