
-- Create a new ENUM type for tracking the status of a delivery.
CREATE TYPE public.delivery_status AS ENUM ('pending_assignment', 'assigned', 'out_for_delivery', 'delivered', 'failed');

-- Create the main 'deliveries' table to store information for each delivery.
CREATE TABLE public.deliveries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE, -- Denormalized for simpler security rules
    delivery_person_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.delivery_status NOT NULL DEFAULT 'pending_assignment',
    
    -- URLs for proof images uploaded by the delivery person
    pickup_mess_photo_url TEXT,
    pickup_food_photo_url TEXT,
    delivery_house_photo_url TEXT,
    delivery_food_photo_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create a trigger to automatically update the 'updated_at' timestamp when a delivery record is changed.
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- This table links messes to their own internal delivery personnel.
CREATE TABLE public.mess_delivery_personnel (
    mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
    delivery_person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (mess_id, delivery_person_id)
);

-- Enable Row-Level Security on the new tables to protect the data.
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_delivery_personnel ENABLE ROW LEVEL SECURITY;

-- --- RLS Policies for 'deliveries' table ---

-- Policy: Mess owners can view and manage all deliveries associated with their messes.
CREATE POLICY "Mess owners can manage deliveries for their mess"
ON public.deliveries FOR ALL TO authenticated
USING (mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid()));

-- Policy: Students can only view the deliveries for their own subscriptions.
CREATE POLICY "Students can view their deliveries"
ON public.deliveries FOR SELECT TO authenticated
USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid()));

-- Policy: Delivery personnel can view and update deliveries that are assigned to them.
CREATE POLICY "Delivery personnel can manage their assigned deliveries"
ON public.deliveries FOR ALL TO authenticated
USING (delivery_person_id = auth.uid());

-- --- RLS Policies for 'mess_delivery_personnel' table ---

-- Policy: Mess owners can add, view, and remove their own delivery personnel.
CREATE POLICY "Mess owners can manage their delivery personnel"
ON public.mess_delivery_personnel FOR ALL TO authenticated
USING (mess_id IN (SELECT id FROM public.messes WHERE owner_id = auth.uid()));

-- Policy: Delivery personnel can see which messes they are assigned to.
CREATE POLICY "Delivery personnel can view their mess assignments"
ON public.mess_delivery_personnel FOR SELECT TO authenticated
USING (delivery_person_id = auth.uid());
