
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SubscriptionWithDetails } from '@/types';
import { useMessStaff } from '@/hooks/useMessStaff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

interface AssignDeliveryDialogProps {
  subscription: SubscriptionWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  delivery_person_id: z.string().uuid("Please select a delivery person."),
});

const AssignDeliveryDialog = ({ subscription, isOpen, onOpenChange }: AssignDeliveryDialogProps) => {
  const { staff, isLoading: isLoadingStaff } = useMessStaff();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const assignMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!subscription) throw new Error('Subscription not selected');
      
      const { error } = await supabase.from('deliveries').insert({
        subscription_id: subscription.id,
        mess_id: subscription.mess_id,
        delivery_person_id: values.delivery_person_id,
        status: 'assigned',
        delivery_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Delivery assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['todaysDeliveries'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Assignment Failed', { description: 'A delivery for this subscription has already been created today.' });
      } else {
        toast.error('Assignment Failed', { description: error.message });
      }
    },
  });

  if (!subscription) return null;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    assignMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Delivery for {subscription.profiles?.full_name}</DialogTitle>
          <DialogDescription>
            Select a staff member to deliver the meal from {subscription.messes?.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm space-y-2">
            <p><strong>From (Mess):</strong> {subscription.messes?.address}</p>
            <p><strong>To (Student):</strong> {subscription.profiles?.address}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="delivery_person_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Person</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingStaff || assignMutation.isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a staff member..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff && staff.length > 0 ? staff.map((member) => (
                        <SelectItem key={member.delivery_person_id} value={member.delivery_person_id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {member.profiles?.full_name}
                          </div>
                        </SelectItem>
                      )) : <p className="p-2 text-sm text-muted-foreground">No staff found.</p>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={assignMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoadingStaff || assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Assignment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDeliveryDialog;
