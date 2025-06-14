import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle } from 'lucide-react';
import { useOwnerSubscriptions } from '@/hooks/useOwnerSubscriptions';
import PendingSubscriptionsTable from './PendingSubscriptionsTable';
import ViewSubscriberDetailsDialog from './dialogs/ViewSubscriberDetailsDialog';
import ViewProofDialog from './dialogs/ViewProofDialog';
import ApproveSubscriptionDialog from './dialogs/ApproveSubscriptionDialog';

const SubscriptionManagement = () => {
  const { subscriptions, isLoading, error: queryError } = useOwnerSubscriptions('pending_owner_confirmation');
  const [viewingDetails, setViewingDetails] = React.useState<SubscriptionWithDetails | null>(null);
  const [viewingProof, setViewingProof] = React.useState<{ url: string | null; studentName: string | null } | null>(null);
  const [approvingSub, setApprovingSub] = React.useState<SubscriptionWithDetails | null>(null);

  const handleViewProof = async (subscription: SubscriptionWithDetails) => {
    if (!subscription.payment_screenshot_url) return;
    
    setViewingProof({ url: null, studentName: subscription.profiles?.full_name || 'Student' });

    // Defensively remove a leading slash from the path if it exists.
    const path = subscription.payment_screenshot_url.startsWith('/')
      ? subscription.payment_screenshot_url.substring(1)
      : subscription.payment_screenshot_url;
    
    const { data, error } = await supabase.storage.from('payment_proofs').createSignedUrl(path, 60);
    
    if (error) {
      console.error("Error creating signed URL for proof:", { message: error.message, path: path });
      toast.error("Could not load proof.", { description: "There was an issue retrieving the payment proof. Please try again." });
      setViewingProof(null);
    } else {
      setViewingProof({ url: data.signedUrl, studentName: subscription.profiles?.full_name || 'Student' });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Subscription Requests</CardTitle>
        <CardDescription>Review new requests and their payment proofs. Approve or reject them here.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : queryError ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{queryError.message}</AlertDescription>
            </Alert>
        ) : !subscriptions || subscriptions.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>You have no new subscription requests to review at this time.</AlertDescription>
          </Alert>
        ) : (
          <PendingSubscriptionsTable
            subscriptions={subscriptions}
            onViewDetails={setViewingDetails}
            onViewProof={handleViewProof}
            onApprove={setApprovingSub}
          />
        )}

        <ViewSubscriberDetailsDialog
          subscription={viewingDetails}
          isOpen={!!viewingDetails}
          onOpenChange={(isOpen) => !isOpen && setViewingDetails(null)}
        />
        
        <ViewProofDialog
            proofUrl={viewingProof?.url || null}
            studentName={viewingProof?.studentName || null}
            isOpen={!!viewingProof}
            onOpenChange={(isOpen) => !isOpen && setViewingProof(null)}
        />
        
        <ApproveSubscriptionDialog
          subscription={approvingSub}
          isOpen={!!approvingSub}
          onOpenChange={(isOpen) => !isOpen && setApprovingSub(null)}
        />
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
