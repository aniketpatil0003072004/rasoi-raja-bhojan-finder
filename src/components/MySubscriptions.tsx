import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionWithDetails, Subscription } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const MySubscriptions = () => {
  const { user } = useAuth();
  const [viewingConfirmation, setViewingConfirmation] = React.useState<{ url: string; messName: string } | null>(null);

  const fetchUserSubscriptions = async (userId: string): Promise<SubscriptionWithDetails[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, messes(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return (data as SubscriptionWithDetails[]) || [];
  };

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['mySubscriptions', user?.id],
    queryFn: () => fetchUserSubscriptions(user!.id),
    enabled: !!user,
  });

  const handleViewConfirmation = async (filePath: string, messName: string) => {
    const { data, error } = await supabase.storage.from('payment_proofs').createSignedUrl(filePath, 60); // 1 minute URL
    if (error) {
      toast.error("Could not load confirmation proof.", { description: error.message });
      return;
    }
    setViewingConfirmation({ url: data.signedUrl, messName: `Confirmation from ${messName}` });
  };
  
  const getStatusBadge = (status: Subscription['status']) => {
    const formattedStatus = status.replace(/_/g, ' ');
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="border-green-600 bg-green-50 text-green-700 capitalize">
            {formattedStatus}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-600 bg-red-50 text-red-700 capitalize">
            {formattedStatus}
          </Badge>
        );
      case 'pending_owner_confirmation':
      default:
        return (
          <Badge variant="outline" className="border-yellow-600 bg-yellow-50 text-yellow-700 capitalize">
            {formattedStatus}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription History</CardTitle>
        <CardDescription>View the status of your current and past subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !subscriptions || subscriptions.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Subscriptions Found</AlertTitle>
            <AlertDescription>You have not subscribed to any mess yet.</AlertDescription>
          </Alert>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mess</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.messes?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {getStatusBadge(sub.status)}
                    </TableCell>
                    <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(sub.end_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {sub.status === 'active' ? (
                        <div className="flex items-center justify-end gap-2">
                          {sub.owner_confirmation_screenshot_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewConfirmation(sub.owner_confirmation_screenshot_url!, sub.messes?.name || 'Mess')}
                            >
                              View Confirmation
                            </Button>
                          )}
                          <Button asChild size="sm">
                            <Link to={`/mess/${sub.mess_id}`}>Renew</Link>
                          </Button>
                          <Button asChild variant="secondary" size="sm">
                            <Link to="/messes">Find New Mess</Link>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">No actions available</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={!!viewingConfirmation} onOpenChange={(isOpen) => !isOpen && setViewingConfirmation(null)}>
              {viewingConfirmation && (
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{viewingConfirmation.messName}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <img src={viewingConfirmation.url} alt="Payment Confirmation" className="w-full h-auto rounded-md" />
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MySubscriptions;
