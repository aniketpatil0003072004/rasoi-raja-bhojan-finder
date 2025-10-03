-- Create user_tokens table for token-based authentication
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_used BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for user_tokens
CREATE POLICY "Anyone can view unused tokens for signup"
ON public.user_tokens
FOR SELECT
USING (is_used = false);

CREATE POLICY "System can insert tokens"
ON public.user_tokens
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update tokens"
ON public.user_tokens
FOR UPDATE
USING (true);

-- Create index for faster token lookup
CREATE INDEX idx_user_tokens_token ON public.user_tokens(token);
CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);

-- Add expiration notification tracking to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS expiration_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_expiration_notified BOOLEAN DEFAULT false;

-- Create function to check for expiring subscriptions
CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions(days_before integer)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  mess_id UUID,
  end_date TIMESTAMP WITH TIME ZONE,
  days_until_expiry INTEGER
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.mess_id,
    s.end_date,
    CAST(EXTRACT(DAY FROM (s.end_date - NOW())) AS INTEGER) as days_until_expiry
  FROM subscriptions s
  WHERE s.status = 'active'
  AND s.end_date > NOW()
  AND s.end_date <= NOW() + (days_before || ' days')::INTERVAL
  AND s.expiration_notified = false;
$$;