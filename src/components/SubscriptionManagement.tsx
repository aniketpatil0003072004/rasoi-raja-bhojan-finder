import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mess, SubscriptionWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const approvalSchema = z.object({
  confirmationProof: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'Confirmation proof is required.'),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewingProof, setViewingProof] = React.useState<{ url: string; studentName: string } | null>(null);
  const [approvingSub, setApprovingSub] = React.useState<SubscriptionWithDetails | null>(null);
  const [viewingDetails, setViewingDetails] = React.useState<SubscriptionWithDetails | null>(null);

  const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
    const { data, error } = await supabase.from('messes').select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    return data || [];
  };

  const fetchPendingSubscriptions = async (messIds: string[]): Promise<SubscriptionWithDetails[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, profiles(full_name, address, phone_number), messes(name)')
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

  console.log("Owner messes data:", messes);

  const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

  console.log("Extracted mess IDs:", messIds);

  const { data: subscriptions, isLoading: isSubsLoading } = useQuery({
    queryKey: ['pendingSubscriptions', messIds],
    queryFn: () => fetchPendingSubscriptions(messIds),
    enabled: messIds.length > 0,
  });

  console.log("Pending subscriptions data:", subscriptions);

  const handleViewProof = async (filePath: string, studentName: string) => {
    const { data, error } = await supabase.storage.from('payment_proofs').createSignedUrl(filePath, 60); // 1 minute URL
    if (error) {
      toast.error("Could not load proof.", { description: error.message });
      return;
    }
    setViewingProof({ url: data.signedUrl, studentName });
  };

  const approveMutation = useMutation({
    mutationFn: async ({ subscriptionId, confirmationFile }: { subscriptionId: string; confirmationFile: File }) => {
      const filePath = `confirmations/${user!.id}/${subscriptionId}-${confirmationFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, confirmationFile);

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          owner_confirmation_screenshot_url: uploadData.path,
        })
        .eq('id', subscriptionId);

      if (subscriptionError) {
        throw new Error(`Database error: ${subscriptionError.message}`);
      }
    },
    onSuccess: () => {
      toast.success("Subscription approved successfully!");
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['activeSubscriptions'] });
      setApprovingSub(null);
    },
    onError: (error: Error) => {
      toast.error("Approval failed.", { description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'rejected' })
        .eq('id', subscriptionId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Subscription has been rejected.");
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
    },
    onError: (error: Error) => {
      toast.error("Rejection failed.", { description: error.message });
    },
  });

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
  });

  const onApproveSubmit = (values: ApprovalFormValues) => {
    if (!approvingSub) return;
    approveMutation.mutate({
      subscriptionId: approvingSub.id,
      confirmationFile: values.confirmationProof[0],
    });
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
          <>
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
                       <Button variant="outline" size="sm" onClick={() => setViewingDetails(sub)}>View Details</Button>
                       <Button variant="outline" size="sm" onClick={() => sub.payment_screenshot_url && handleViewProof(sub.payment_screenshot_url, sub.profiles?.full_name || 'Student')}>View Proof</Button>
                       <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => setApprovingSub(sub)}>Approve</Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">Reject</Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will reject the subscription request and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => rejectMutation.mutate(sub.id)} disabled={rejectMutation.isPending}>
                                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Rejection
                              </AlertDialogAction>
                            </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={!!viewingProof} onOpenChange={(isOpen) => !isOpen && setViewingProof(null)}>
              {viewingProof && (
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Payment Proof from {viewingProof.studentName}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <img src={viewingProof.url} alt="Payment Proof" className="w-full h-auto rounded-md" />
                  </div>
                </DialogContent>
              )}
            </Dialog>

            <Dialog open={!!approvingSub} onOpenChange={(isOpen) => { if (!isOpen) { setApprovingSub(null); form.reset(); } }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Approve Subscription</DialogTitle>
                  <DialogDescription>
                    Upload proof of payment receipt for {approvingSub?.profiles?.full_name}. This will activate their subscription.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onApproveSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="confirmationProof"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmation Screenshot</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={approveMutation.isPending}>
                      {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Approval
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={!!viewingDetails} onOpenChange={(isOpen) => !isOpen && setViewingDetails(null)}>
              {viewingDetails && (
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Subscriber Details</DialogTitle>
                    <DialogDescription>
                      Contact information for {viewingDetails.profiles?.full_name || 'the subscriber'}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="name" className="text-right w-20 flex-shrink-0">Name</Label>
                      <p id="name" className="flex-grow">{viewingDetails.profiles?.full_name}</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <Label htmlFor="address" className="text-right w-20 flex-shrink-0 pt-1">Address</Label>
                      <p id="address" className="flex-grow">{viewingDetails.profiles?.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label htmlFor="phone" className="text-right w-20 flex-shrink-0">Phone</Label>
                      <p id="phone" className="flex-grow">{viewingDetails.profiles?.phone_number}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
