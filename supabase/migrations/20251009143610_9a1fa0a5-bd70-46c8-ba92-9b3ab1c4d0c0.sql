-- Add cancellation deadline hours to messes table
ALTER TABLE public.messes 
ADD COLUMN cancellation_deadline_hours integer DEFAULT 2;

COMMENT ON COLUMN public.messes.cancellation_deadline_hours IS 'Number of hours before the meal time that students can cancel their meals';