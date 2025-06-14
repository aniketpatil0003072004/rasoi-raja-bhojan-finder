
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mess, SubscriptionWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [viewingProof, setViewingProof] = React.useState<{ url: string; studentName: string } | null>(null);

  const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
    const { data, error } = await supabase.from('messes').select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    return data || [];
  };

  const fetchPendingSubscriptions = async (messIds: string[]): Promise<SubscriptionWithDetails[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, profiles(full_name), messes(name)')
      .in('mess_id', messIds)
      .eq('status', 'pending_owner_confirmation');
    if (error) throw new Error(error.message);
    return data as SubscriptionWithDetails[] || [];
  };

  const { data: messes, isLoading: isMessesLoading } = useQuery({
    queryKey: ['ownerMesses', user?.id],
    queryFn: () => fetchOwnerMesses(user!.id),
    enabled: !!user,
  });

  const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

  const { data: subscriptions, isLoading: isSubsLoading, refetch } = useQuery({
    queryKey: ['pendingSubscriptions', messIds],
    queryFn: () => fetchPendingSubscriptions(messIds),
    enabled: messIds.length > 0,
  });

  const handleViewProof = async (filePath: string, studentName: string) => {
    const { data, error } = await supabase.storage.from('payment_proofs').createSignedUrl(filePath, 60); // 1 minute URL
    if (error) {
      toast.error("Could not load proof.", { description: error.message });
      return;
    }
    setViewingProof({ url: data.signedUrl, studentName });
  };
  
  // Placeholder for future functionality
  const handleApprove = (subscriptionId: string) => {
    toast.info("Approval feature coming soon!", { description: "You will be able to upload your payment confirmation here." });
  };
  
  const handleReject = (subscriptionId: string) => {
    toast.info("Rejection feature coming soon!");
  };

  const isLoading = isMessesLoading || isSubsLoading;

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
        ) : !subscriptions || subscriptions.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>You have no new subscription requests to review at this time.</AlertDescription>
          </Alert>
        ) : (
          <Dialog>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Mess</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.profiles?.full_name || 'N/A'}</TableCell>
                    <TableCell>{sub.messes?.name || 'N/A'}</TableCell>
                    <TableCell><Badge variant="secondary">{sub.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                       <DialogTrigger asChild>
                         <Button variant="outline" size="sm" onClick={() => sub.payment_screenshot_url && handleViewProof(sub.payment_screenshot_url, sub.profiles?.full_name || 'Student')}>View Proof</Button>
                       </DialogTrigger>
                       <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(sub.id)}>Approve</Button>
                       <Button variant="destructive" size="sm" onClick={() => handleReject(sub.id)}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {viewingProof && (
              <DialogContent className="sm:max-w-[600px]" onInteractOutside={() => setViewingProof(null)} onEscapeKeyDown={() => setViewingProof(null)}>
                <DialogHeader>
                  <DialogTitle>Payment Proof from {viewingProof.studentName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <img src={viewingProof.url} alt="Payment Proof" className="w-full h-auto rounded-md" />
                </div>
              </DialogContent>
            )}
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
