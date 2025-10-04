import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubscriptionExpiration } from '@/hooks/useSubscriptionExpiration';
import { format } from 'date-fns';

export const SubscriptionExpirationDialog = () => {
  const { expiringSubscription, markAsNotified } = useSubscriptionExpiration();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (expiringSubscription && !expiringSubscription.expiration_notified) {
      setOpen(true);
    }
  }, [expiringSubscription]);

  const handleClose = () => {
    if (expiringSubscription) {
      markAsNotified.mutate({ subscriptionId: expiringSubscription.id, isOwner: false });
    }
    setOpen(false);
  };

  if (!expiringSubscription) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Subscription Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your subscription will expire in {expiringSubscription.days_until_expiry} day
              {expiringSubscription.days_until_expiry !== 1 ? 's' : ''}.
            </p>
            <p>
              Expiration date:{' '}
              <strong>{format(new Date(expiringSubscription.end_date), 'PPP')}</strong>
            </p>
            <p className="text-sm">Please renew your subscription to continue enjoying your meals.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose}>Understood</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
