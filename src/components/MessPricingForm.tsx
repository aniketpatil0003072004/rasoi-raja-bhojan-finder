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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mess } from "@/types";

const pricingFormSchema = z.object({
  price_1_month: z.number().min(1, "1 month price must be at least ₹1"),
  price_2_months: z.number().min(1, "2 months price must be at least ₹1"),
  price_3_months: z.number().min(1, "3 months price must be at least ₹1"),
  price_6_months: z.number().min(1, "6 months price must be at least ₹1"),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

interface MessPricingFormProps {
  mess: Mess;
  onSuccess?: () => void;
}

const MessPricingForm: React.FC<MessPricingFormProps> = ({ mess, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      price_1_month: mess.price_1_month || 0,
      price_2_months: mess.price_2_months || 0,
      price_3_months: mess.price_3_months || 0,
      price_6_months: mess.price_6_months || 0,
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async (pricingData: PricingFormValues) => {
      const { error } = await supabase
        .from('messes')
        .update(pricingData)
        .eq('id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Pricing updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['ownerMesses'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update pricing: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: PricingFormValues) {
    updatePricingMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Pricing for {mess.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="price_1_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1 Month Price (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 3000" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_2_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2 Months Price (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 5800" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_3_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3 Months Price (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 8500" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_6_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6 Months Price (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 16000" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={updatePricingMutation.isPending}>
              {updatePricingMutation.isPending ? 'Updating...' : 'Update Pricing'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MessPricingForm;