
-- Enable Row-Level Security for the 'profiles' table.
-- This is a crucial security measure to control who can access user profile data.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- This policy allows any authenticated user to view all profiles.
-- It's necessary for features across the app that need to display user information,
-- such as showing a student's name on a subscription request in the owner's dashboard.
-- Without this, queries joining with 'profiles' would fail for most users.
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
