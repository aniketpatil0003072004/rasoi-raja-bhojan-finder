
-- Add UPI columns to messes table
ALTER TABLE public.messes 
ADD COLUMN IF NOT EXISTS upi_id text,
ADD COLUMN IF NOT EXISTS upi_name text;

-- Optional: Add a check constraint to ensure upi_id looks valid (basic check)
-- ALTER TABLE public.messes ADD CONSTRAINT upi_id_check CHECK (upi_id ~ '^[\w.-]+@[\w.-]+$');
