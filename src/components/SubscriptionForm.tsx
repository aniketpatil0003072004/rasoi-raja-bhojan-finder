
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const subscriptionSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  address: z.string().min(1, 'Address is required.'),
  phoneNumber: z.string().min(1, 'Phone number is required.'),
  paymentProof: z
    .instanceof(FileList)
    .refine((files) => files !== undefined && files.length > 0, 'Payment proof is required.')
    .refine((files) => files?.length === 1, 'Payment proof is required.'),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  messId: string;
  onSuccess: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ messId, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching profile:", error);
      toast.error("Could not load your profile data.");
    }
    return data;
  };

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      fullName: '',
      address: '',
      phoneNumber: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || '',
        address: profile.address || '',
        phoneNumber: profile.phone_number || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (!user) {
      toast.error('You must be logged in to subscribe.');
      return;
    }
    setIsSubmitting(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: values.fullName,
        address: values.address,
        phone_number: values.phoneNumber,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      toast.error('Failed to update your profile.', { description: profileError.message });
      setIsSubmitting(false);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

    const file = values.paymentProof[0];
    const filePath = `${messId}/${user.id}/${Date.now()}-${file.name}`;

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

  if (isProfileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Your delivery address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
