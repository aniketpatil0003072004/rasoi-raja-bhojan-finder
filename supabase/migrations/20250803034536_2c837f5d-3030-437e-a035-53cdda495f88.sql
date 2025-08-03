-- Enable realtime for delivery_notifications table
ALTER TABLE public.delivery_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_notifications;

-- Ensure the trigger exists and is working
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'deliveries'
  AND t.trigger_name = 'notify_delivery_status_change_trigger';

-- Check if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'notify_delivery_status_change';