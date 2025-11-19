import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useSubscriptionExpiration,
  markSubscriptionNotified,
  ExpiringSubscription,
} from "@/hooks/useSubscriptionExpiration";
import { format } from "date-fns";

export const SubscriptionExpirationDialog = () => {
  const userData = sessionStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null; // Fixed: Check if userData exists before parsing
  const { data: expiringSubscriptions } = useSubscriptionExpiration(7);
  const [currentNotification, setCurrentNotification] =
    useState<ExpiringSubscription | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!expiringSubscriptions || !user) return;

    // Filter subscriptions that haven't been notified yet
    const unnotifiedSubscriptions = expiringSubscriptions.filter(
      (sub) => !sub.expiration_notified
    );

    if (unnotifiedSubscriptions.length > 0) {
      setCurrentNotification(unnotifiedSubscriptions[0]);
      setIsOpen(true);
    }
  }, [expiringSubscriptions, user]);

  const handleClose = async () => {
    if (currentNotification) {
      await markSubscriptionNotified(currentNotification.id);
    }
    setIsOpen(false);
    setCurrentNotification(null);
  };

  if (!currentNotification) return null;

  const isOwner =
    currentNotification.mess_id && user?.id !== currentNotification.user_id;
  const daysLeft = currentNotification.days_until_expiry;
  const expirationDate = format(new Date(currentNotification.end_date), "PPP");

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOwner
              ? "Student Subscription Expiring"
              : "Your Subscription is Expiring"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isOwner ? (
              <>
                <p>
                  <strong>{currentNotification.profiles?.full_name}</strong>'s
                  subscription to{" "}
                  <strong>{currentNotification.messes?.name}</strong> is
                  expiring soon.
                </p>
                <p>
                  Days remaining:{" "}
                  <strong className="text-destructive">{daysLeft} days</strong>
                </p>
                <p>Expiration date: {expirationDate}</p>
                <p className="text-sm text-muted-foreground">
                  Contact: {currentNotification.profiles?.email}
                </p>
              </>
            ) : (
              <>
                <p>
                  Your subscription to{" "}
                  <strong>{currentNotification.messes?.name}</strong> is
                  expiring soon.
                </p>
                <p>
                  Days remaining:{" "}
                  <strong className="text-destructive">{daysLeft} days</strong>
                </p>
                <p>Expiration date: {expirationDate}</p>
                <p className="text-sm text-muted-foreground">
                  Please renew your subscription to continue enjoying the
                  service.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose}>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
