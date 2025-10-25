import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";

const pricingPlanSchema = z.object({
  months: z.number().min(1, "Months must be at least 1"),
  price: z.number().min(1, "Price must be at least ₹1"),
});

const pricingFormSchema = z.object({
  plans: z
    .array(pricingPlanSchema)
    .min(1, "At least one pricing plan is required"),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

interface MessPricingFormProps {
  mess: Mess;
  onSuccess?: () => void;
}

const MessPricingForm: React.FC<MessPricingFormProps> = ({
  mess,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert existing mess pricing to plans array
  const getInitialPlans = () => {
    const plans = [];
    if (mess.price_1_month)
      plans.push({ months: 1, price: mess.price_1_month });
    if (mess.price_2_months)
      plans.push({ months: 2, price: mess.price_2_months });
    if (mess.price_3_months)
      plans.push({ months: 3, price: mess.price_3_months });
    if (mess.price_6_months)
      plans.push({ months: 6, price: mess.price_6_months });
    return plans.length > 0 ? plans : [{ months: 1, price: 0 }];
  };

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      plans: getInitialPlans(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "plans",
  });

  const updatePricingMutation = useMutation({
    mutationFn: async (formData: PricingFormValues) => {
      // Convert plans array back to individual columns
      const pricingData: any = {
        price_1_month: null,
        price_2_months: null,
        price_3_months: null,
        price_6_months: null,
        pricing_plans: formData.plans, // Store all plans in a JSON column
      };

      // Map common durations to their columns for backward compatibility
      formData.plans.forEach((plan) => {
        if (plan.months === 1) pricingData.price_1_month = plan.price;
        else if (plan.months === 2) pricingData.price_2_months = plan.price;
        else if (plan.months === 3) pricingData.price_3_months = plan.price;
        else if (plan.months === 6) pricingData.price_6_months = plan.price;
      });

      const { error } = await supabase
        .from("messes")
        .update(pricingData)
        .eq("id", mess.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Pricing plans updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["ownerMesses"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update pricing: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: PricingFormValues) {
    // Sort plans by months for better organization
    const sortedPlans = [...values.plans].sort((a, b) => a.months - b.months);
    updatePricingMutation.mutate({ plans: sortedPlans });
  }

  const addPlan = () => {
    append({ months: 1, price: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Pricing for {mess.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-start p-4 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`plans.${index}.months`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Months)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 1, 3, 6"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`plans.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 3000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="mt-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addPlan}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Plan
            </Button>

            <Button
              type="submit"
              className="w-full"
              disabled={updatePricingMutation.isPending}
            >
              {updatePricingMutation.isPending
                ? "Updating..."
                : "Update Pricing"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MessPricingForm;
