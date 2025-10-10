-- Add cancellation deadline time column and remove hours column
ALTER TABLE public.messes 
ADD COLUMN cancellation_deadline_time time DEFAULT '23:00:00';

-- Update existing data: convert hours to time
-- For example, 2 hours before midnight would be 22:00
UPDATE public.messes 
SET cancellation_deadline_time = (
  CASE 
    WHEN cancellation_deadline_hours IS NOT NULL 
    THEN (TIME '00:00:00' + ((24 - cancellation_deadline_hours) || ' hours')::INTERVAL)
    ELSE TIME '23:00:00'
  END
);

-- Drop the old column
ALTER TABLE public.messes 
DROP COLUMN cancellation_deadline_hours;