-- Create notifications table for real-time updates (if not exists)
CREATE TABLE IF NOT EXISTS public.delivery_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status public.delivery_status NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.delivery_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.delivery_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.delivery_notifications;

-- RLS policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.delivery_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS policy: System can insert notifications for users
CREATE POLICY "System can create notifications"
ON public.delivery_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS policy: Users can mark their notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.delivery_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Function to create notifications when delivery status changes
CREATE OR REPLACE FUNCTION public.notify_delivery_status_change()
RETURNS TRIGGER AS $$
DECLARE
  student_id UUID;
  delivery_person_id UUID;
  notification_message TEXT;
BEGIN
  -- Get the student and delivery person IDs
  SELECT s.user_id INTO student_id
  FROM subscriptions s 
  WHERE s.id = NEW.subscription_id;
  
  delivery_person_id := NEW.delivery_person_id;
  
  -- Create appropriate notification message
  CASE NEW.status
    WHEN 'food_preparing' THEN
      notification_message := 'Your food is being prepared';
    WHEN 'food_ready' THEN
      notification_message := 'Your food is ready for pickup';
    WHEN 'picked_up' THEN
      notification_message := 'Your food has been picked up and is on the way';
    WHEN 'out_for_delivery' THEN
      notification_message := 'Your food is out for delivery';
    WHEN 'delivered' THEN
      notification_message := 'Your food has been delivered';
    WHEN 'failed' THEN
      notification_message := 'Delivery failed - please contact support';
    ELSE
      notification_message := 'Delivery status updated';
  END CASE;
  
  -- Create notification for student
  IF student_id IS NOT NULL THEN
    INSERT INTO public.delivery_notifications (delivery_id, user_id, message, status)
    VALUES (NEW.id, student_id, notification_message, NEW.status);
  END IF;
  
  -- Create notification for delivery person (if assigned and different from student)
  IF delivery_person_id IS NOT NULL AND delivery_person_id != student_id THEN
    INSERT INTO public.delivery_notifications (delivery_id, user_id, message, status)
    VALUES (NEW.id, delivery_person_id, 'Delivery status updated: ' || notification_message, NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for delivery status changes
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON public.deliveries;
CREATE TRIGGER delivery_status_change_trigger
  AFTER UPDATE OF status ON public.deliveries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_delivery_status_change();

-- Enable realtime for notifications and deliveries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'delivery_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'deliveries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  END IF;
END $$;

-- Set replica identity for real-time updates
ALTER TABLE public.delivery_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;