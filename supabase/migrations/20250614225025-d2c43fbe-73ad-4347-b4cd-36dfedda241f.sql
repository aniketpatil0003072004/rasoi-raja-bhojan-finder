
-- Function to check if the current user is an assigned delivery person for a given subscription
create or replace function is_assigned_delivery_person_for_subscription(p_subscription_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from deliveries
    where deliveries.subscription_id = p_subscription_id
    and deliveries.delivery_person_id = auth.uid()
  );
$$;

-- Function to check if the current user is an assigned delivery person for a given student's profile
create or replace function is_assigned_delivery_person_for_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from subscriptions
    join deliveries on subscriptions.id = deliveries.subscription_id
    where subscriptions.user_id = p_profile_id
    and deliveries.delivery_person_id = auth.uid()
  );
$$;

-- Policy to allow assigned delivery personnel to read specific subscription details.
-- This policy will be added alongside any existing SELECT policies for other roles.
CREATE POLICY "Delivery personnel can view subscription details for assigned deliveries"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'delivery_personnel' AND
  is_assigned_delivery_person_for_subscription(id)
);

-- Policy to allow assigned delivery personnel to read specific student profile details.
-- This policy is designed to be safe and avoid the previous errors.
CREATE POLICY "Delivery personnel can view student profiles for assigned deliveries"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_assigned_delivery_person_for_profile(id)
);
