-- Add columns to track selected subscription plan and price
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_duration_months integer,
ADD COLUMN IF NOT EXISTS plan_price integer;

-- Add helpful comment
COMMENT ON COLUMN public.subscriptions.plan_duration_months IS 'Duration of subscription plan in months (1, 2, 3, or 6)';
COMMENT ON COLUMN public.subscriptions.plan_price IS 'Price paid for the selected plan duration';