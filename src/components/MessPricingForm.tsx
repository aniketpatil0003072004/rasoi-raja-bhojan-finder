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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Mess } from "@/types";
import { Plus, Trash2 } from "lucide-react";

const pricingPlanSchema = z.object({
  months: z
    .number()
    .min(1, "Duration must be at least 1 month")
    .max(24, "Duration cannot exceed 24 months"),
  price: z.number().min(1, "Price must be at least ₹1"),
});

const pricingFormSchema = z.object({
  plans: z
    .array(pricingPlanSchema)
    .min(1, "At least one pricing plan is required")
    .refine(
      (plans) => {
        const months = plans.map((p) => p.months);
        return months.length === new Set(months).size;
      },
      {
        message:
          "Duplicate durations are not allowed. Each plan must have a unique duration.",
      }
    ),
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

  // Get initial plans from the pricing_plans JSON column
  const getInitialPlans = () => {
    if (
      mess.pricing_plans &&
      Array.isArray(mess.pricing_plans) &&
      mess.pricing_plans.length > 0
    ) {
      return mess.pricing_plans;
    }
    // Default to one plan if none exist
    return [{ months: 1, price: 0 }];
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
      // Store all plans in the pricing_plans JSON column
      const { error } = await supabase
        .from("messes")
        .update({
          pricing_plans: formData.plans,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mess.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Pricing plans updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["ownerMesses"] });
      queryClient.invalidateQueries({ queryKey: ["mess", mess.id] });
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
    // Find the next available month duration
    const existingMonths = form.getValues("plans").map((p) => p.months);
    let nextMonth = 1;
    while (existingMonths.includes(nextMonth)) {
      nextMonth++;
    }
    append({ months: nextMonth, price: 0 });
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
                  className="flex gap-4 items-start p-4 border rounded-lg bg-gray-50"
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
                              max="24"
                              placeholder="e.g. 1, 2, 3, 6, 12"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter any number from 1 to 24 months
                          </FormDescription>
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
                          <FormDescription className="text-xs">
                            Total price for the duration
                          </FormDescription>
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

            {form.formState.errors.plans?.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.plans.root.message}
              </p>
            )}

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
