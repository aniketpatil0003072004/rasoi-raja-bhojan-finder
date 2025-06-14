import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionWithDetails } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const approvalSchema = z.object({
  confirmationProof: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'Confirmation proof is required.'),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

interface ApproveSubscriptionDialogProps {
    subscription: SubscriptionWithDetails | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const ApproveSubscriptionDialog: React.FC<ApproveSubscriptionDialogProps> = ({ subscription, isOpen, onOpenChange }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const form = useForm<ApprovalFormValues>({
        resolver: zodResolver(approvalSchema),
    });

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
            queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error("Approval failed.", { description: error.message });
        },
    });

    const onApproveSubmit = (values: ApprovalFormValues) => {
        if (!subscription) return;
        approveMutation.mutate({
            subscriptionId: subscription.id,
            confirmationFile: values.confirmationProof[0],
        });
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Approve Subscription</DialogTitle>
                    <DialogDescription>
                        Upload proof of payment receipt for {subscription?.profiles?.full_name}. This will activate their subscription.
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
    );
};

export default ApproveSubscriptionDialog;
