
-- Add a date column to track which day the delivery is for.
ALTER TABLE public.deliveries 
ADD COLUMN delivery_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add a unique constraint to prevent creating duplicate deliveries for the same subscription on the same day.
ALTER TABLE public.deliveries 
ADD CONSTRAINT deliveries_subscription_id_delivery_date_key UNIQUE (subscription_id, delivery_date);
