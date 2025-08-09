-- Ensure trigger exists to create notifications on delivery status change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'notify_delivery_status_change_trigger'
  ) THEN
    CREATE TRIGGER notify_delivery_status_change_trigger
      AFTER UPDATE ON public.deliveries
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION public.notify_delivery_status_change();
  END IF;
END $$;