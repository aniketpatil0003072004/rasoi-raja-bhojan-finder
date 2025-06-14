
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Star } from 'lucide-react';

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  messId: string;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ messId, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const onSubmit = async (values: ReviewFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a review.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        mess_id: messId,
        user_id: user.id,
        rating: values.rating,
        comment: values.comment,
      });

    if (error) {
      toast({ title: "Error submitting review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Your review has been submitted." });
      form.reset();
      onSuccess();
    }
  };

  const rating = form.watch('rating');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`cursor-pointer h-7 w-7 transition-colors ${
                        (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => field.onChange(star)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Comment (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about your experience..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;
