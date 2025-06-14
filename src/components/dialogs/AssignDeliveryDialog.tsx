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
import { useAvailableDeliveryPersonnel } from '@/hooks/useAvailableDeliveryPersonnel';
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
  const { data: availablePersonnel, isLoading: isLoadingPersonnel } = useAvailableDeliveryPersonnel(subscription?.mess_id);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const hasStaff = availablePersonnel && availablePersonnel.length > 0;

  const mutation = useMutation({
    mutationFn: async (values?: z.infer<typeof formSchema>) => {
      if (!subscription) throw new Error('Subscription not selected');
      
      const { error } = await supabase.from('deliveries').insert({
        subscription_id: subscription.id,
        mess_id: subscription.mess_id,
        delivery_person_id: values ? values.delivery_person_id : null,
        status: values ? 'assigned' : 'pending_assignment',
        delivery_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(hasStaff ? 'Delivery assigned successfully!' : 'Delivery released to public pool!');
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
    mutation.mutate(values);
  };
  
  const handleReleaseToPublicPool = () => {
    mutation.mutate(undefined); // Pass undefined to satisfy the mutation function's signature
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Delivery for {subscription.profiles?.full_name}</DialogTitle>
          <DialogDescription>
            {hasStaff 
              ? "Select a staff member to deliver the meal from your mess."
              : "You have no delivery staff for this mess. You can release this delivery to the public pool for any available person to pick up."}
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm space-y-2">
            <p><strong>From (Mess):</strong> {subscription.messes?.address}</p>
            <p><strong>To (Student):</strong> {subscription.profiles?.address}</p>
        </div>
        {isLoadingPersonnel ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : hasStaff ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="delivery_person_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Person</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a staff member..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePersonnel.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {person.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={mutation.isPending}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Assignment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <DialogFooter className="pt-4">
             <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleReleaseToPublicPool} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Release to Public Pool
              </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignDeliveryDialog;
