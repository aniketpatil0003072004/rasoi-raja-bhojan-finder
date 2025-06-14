
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const subscriptionSchema = z.object({
  paymentProof: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'Payment proof is required.'),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  messId: string;
  onSuccess: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ messId, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
  });

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (!user) {
      toast.error('You must be logged in to subscribe.');
      return;
    }
    setIsSubmitting(true);

    const file = values.paymentProof[0];
    const filePath = `${user.id}/${messId}-${Date.now()}`;

    // IMPORTANT: The following upload will fail until storage policies for the 'payment_proofs' bucket are set up.
    // This will be addressed in the next step.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload payment proof.', {
        description:
          'This may be due to missing storage permissions. Please try again later.',
      });
      setIsSubmitting(false);
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      mess_id: messId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      payment_screenshot_url: uploadData.path,
      status: 'pending_owner_confirmation',
    });

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      toast.error('Failed to create subscription.', {
        description: subscriptionError.message,
      });
    } else {
      toast.success('Subscription request sent!', {
        description: 'The mess owner will review your payment proof shortly.',
      });
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentProof"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Screenshot</FormLabel>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for Verification
        </Button>
      </form>
    </Form>
  );
};

export default SubscriptionForm;
