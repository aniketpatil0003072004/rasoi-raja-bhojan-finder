
-- Add a column to the profiles table to associate delivery personnel with a specific mess.
-- This allows us to easily find the staff for a mess.
-- This is nullable because students and mess owners don't belong to a single mess.
ALTER TABLE public.profiles
ADD COLUMN mess_id UUID REFERENCES public.messes(id) ON DELETE SET NULL;
