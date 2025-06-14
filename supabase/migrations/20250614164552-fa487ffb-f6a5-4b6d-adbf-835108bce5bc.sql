
-- Create a new 'enum' type to represent the different states a subscription can be in.
CREATE TYPE public.subscription_status AS ENUM ('pending_owner_confirmation', 'active', 'rejected');

-- Add a new column to the 'subscriptions' table to store the URL of the owner's confirmation screenshot.
ALTER TABLE public.subscriptions ADD COLUMN owner_confirmation_screenshot_url TEXT;

-- Before changing the 'status' column, we'll update any existing 'pending' statuses to the new default.
-- This ensures the migration works without errors on existing data.
UPDATE public.subscriptions SET status = 'pending_owner_confirmation' WHERE status = 'pending';

-- Now, we'll change the 'status' column to use our new 'subscription_status' type.
ALTER TABLE public.subscriptions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.subscriptions ALTER COLUMN status TYPE public.subscription_status USING status::text::public.subscription_status;
ALTER TABLE public.subscriptions ALTER COLUMN status SET DEFAULT 'pending_owner_confirmation';

-- Enable Row-Level Security on the 'subscriptions' table to protect the data.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- This policy allows users to see subscriptions that are relevant to them.
-- Students can see their own subscriptions, and mess owners can see subscriptions for their messes.
CREATE POLICY "Users can view relevant subscriptions" ON public.subscriptions
FOR SELECT TO authenticated USING (
    (user_id = auth.uid()) OR
    (mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid()))
);

-- This policy allows students to create new subscriptions for themselves.
CREATE POLICY "Students can create subscriptions" ON public.subscriptions
FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student'
);

-- This policy allows mess owners to update subscriptions for their messes, for example to approve or reject them.
CREATE POLICY "Owners can update their mess subscriptions" ON public.subscriptions
FOR UPDATE TO authenticated USING (
    mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid())
);
