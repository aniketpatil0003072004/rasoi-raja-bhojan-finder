import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mess } from "@/types";
import { Clock } from "lucide-react";

const deadlineFormSchema = z.object({
  cancellation_deadline_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter time in HH:MM format (e.g., 23:00)"),
});

type DeadlineFormValues = z.infer<typeof deadlineFormSchema>;

interface MealCancellationDeadlineSettingsProps {
  mess: Mess;
  onSuccess?: () => void;
}

export const MealCancellationDeadlineSettings: React.FC<MealCancellationDeadlineSettingsProps> = ({ mess, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DeadlineFormValues>({
    resolver: zodResolver(deadlineFormSchema),
    defaultValues: {
      cancellation_deadline_time: (mess as any).cancellation_deadline_time || '23:00',
    },
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: async (deadlineData: DeadlineFormValues) => {
      const { error } = await supabase
        .from('messes')
        .update({ cancellation_deadline_time: deadlineData.cancellation_deadline_time })
        .eq('id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Meal cancellation deadline updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['ownerMesses'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update deadline: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: DeadlineFormValues) {
    updateDeadlineMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Meal Cancellation Deadline</CardTitle>
        </div>
        <CardDescription>
          Set the daily deadline time by which students must cancel tomorrow's meals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancellation_deadline_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Deadline Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      placeholder="23:00" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Students must cancel tomorrow's meals before this time today. For example, if set to 23:00, students can cancel tomorrow's meals until 11:00 PM today.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={updateDeadlineMutation.isPending}>
              {updateDeadlineMutation.isPending ? 'Updating...' : 'Update Deadline'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};