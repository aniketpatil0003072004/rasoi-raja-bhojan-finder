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
  const { expiringSubscription, markStudentNotified } = useSubscriptionExpiration();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (expiringSubscription) {
      setOpen(true);
    }
  }, [expiringSubscription]);

  const handleClose = () => {
    if (expiringSubscription) {
      markStudentNotified.mutate(expiringSubscription.id);
    }
    setOpen(false);
  };

  if (!expiringSubscription) return null;

  const daysUntilExpiry = Math.ceil(
    (new Date(expiringSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Subscription Expiring Soon!</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your subscription to{' '}
              <span className="font-semibold">{expiringSubscription.messes?.name}</span> will expire
              in <span className="font-semibold text-destructive">{daysUntilExpiry} day(s)</span>.
            </p>
            <p>
              Expiration date:{' '}
              <span className="font-semibold">
                {format(new Date(expiringSubscription.end_date), 'MMMM d, yyyy')}
              </span>
            </p>
            <p className="pt-2">Please renew your subscription to continue receiving meals.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose}>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
