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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface AddStaffDialogProps {
  messId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  full_name: z.string().min(2, "Name is too short."),
  phone_number: z.string().min(10, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

const AddStaffDialog = ({ messId, isOpen, onOpenChange }: AddStaffDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      email: "",
      password: ""
    }
  });
  
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase.functions.invoke('create-delivery-personnel', {
        body: { ...values, mess_id: messId },
      })
      if (error) {
        // This block handles non-2xx server responses to show specific error messages.
        if (error instanceof FunctionsHttpError) {
          const errorJson = await error.context.json();
          throw new Error(errorJson.error || 'An unknown server error occurred.');
        }
        // Fallback for other types of errors
        throw error;
      }
      // This handles cases where the server responds with 2xx but includes an error in the body.
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Staff member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['availableDeliveryPersonnel', messId] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error('Failed to add staff', { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Delivery Person</DialogTitle>
          <DialogDescription>
            Enter the details of the new staff member. An account will be created for them to log in.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="staff@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
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
                Add Staff Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;
