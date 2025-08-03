-- Create trigger for delivery status notifications
CREATE TRIGGER notify_delivery_status_change_trigger
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_delivery_status_change();