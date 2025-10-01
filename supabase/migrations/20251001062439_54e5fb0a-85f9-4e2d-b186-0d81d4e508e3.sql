-- Create enum for meal types
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner');

-- Create table for meal skips
CREATE TABLE public.meal_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  skip_date DATE NOT NULL,
  meal_type public.meal_type NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subscription_id, skip_date, meal_type)
);

-- Enable RLS
ALTER TABLE public.meal_skips ENABLE ROW LEVEL SECURITY;

-- Students can manage their own meal skips
CREATE POLICY "Students can view their own meal skips"
ON public.meal_skips
FOR SELECT
USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can create their own meal skips"
ON public.meal_skips
FOR INSERT
WITH CHECK (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own meal skips"
ON public.meal_skips
FOR DELETE
USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

-- Mess owners can view meal skips for their mess subscriptions
CREATE POLICY "Owners can view meal skips for their mess"
ON public.meal_skips
FOR SELECT
USING (
  subscription_id IN (
    SELECT s.id FROM public.subscriptions s
    JOIN public.messes m ON s.mess_id = m.id
    WHERE m.owner_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_meal_skips_subscription_date ON public.meal_skips(subscription_id, skip_date);
CREATE INDEX idx_meal_skips_date ON public.meal_skips(skip_date);