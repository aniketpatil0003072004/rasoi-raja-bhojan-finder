
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RejectSubscriptionButtonProps {
    subscriptionId: string;
}

const RejectSubscriptionButton: React.FC<RejectSubscriptionButtonProps> = ({ subscriptionId }) => {
    const queryClient = useQueryClient();

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            toast.success("Subscription has been rejected.");
            queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
        },
        onError: (error: Error) => {
            toast.error("Rejection failed.", { description: error.message });
        },
    });

    return (
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
                    <AlertDialogAction onClick={() => rejectMutation.mutate(subscriptionId)} disabled={rejectMutation.isPending}>
                        {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default RejectSubscriptionButton;
