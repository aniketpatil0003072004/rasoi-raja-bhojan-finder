-- Create user_tokens table to store token IDs for authentication
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- Enable RLS on user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view their own tokens"
ON public.user_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Anyone can insert tokens during signup
CREATE POLICY "Anyone can insert tokens during signup"
ON public.user_tokens
FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
ON public.user_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to get user by token
CREATE OR REPLACE FUNCTION public.get_user_by_token(p_token TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role app_role
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ut.user_id, p.email, ut.role
  FROM user_tokens ut
  JOIN profiles p ON p.id = ut.user_id
  WHERE ut.token = p_token
  AND ut.is_used = true;
$$;

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON public.user_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);