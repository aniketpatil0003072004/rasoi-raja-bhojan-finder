import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, IndianRupee } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const subscriptionSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  address: z.string().min(1, "Address is required."),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits.")
    .regex(/^[0-9]+$/, "Phone number must contain only digits."),
  planDuration: z.string().min(1, "Please select a plan duration."),
  paymentProof: z
    .instanceof(FileList)
    .refine(
      (files) => files !== undefined && files.length > 0,
      "Payment proof is required."
    )
    .refine((files) => {
      if (!files || files.length === 0) return false;
      const file = files[0];
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      return validTypes.includes(file.type);
    }, "Only JPG, PNG, WEBP, or PDF files are allowed.")
    .refine((files) => {
      if (!files || files.length === 0) return false;
      const file = files[0];
      return file.size <= 5 * 1024 * 1024; // 5MB
    }, "File size must be less than 5MB."),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface PricingPlan {
  months: number;
  price: number;
}

interface SubscriptionFormProps {
  messId: string;
  pricingPlans: PricingPlan[];
  onSuccess: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  messId,
  pricingPlans,
  onSuccess,
}) => {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<PricingPlan | null>(
    null
  );

  const fetchProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
      toast.error("Could not load your profile data.");
    }
    return data;
  };

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      fullName: "",
      address: "",
      phoneNumber: "",
      planDuration: "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || "",
        address: profile.address || "",
        phoneNumber: profile.phone_number || "",
        planDuration: "",
      });
    }
  }, [profile, form]);

  const handlePlanChange = (value: string) => {
    const months = parseInt(value);
    const plan = pricingPlans.find((p) => p.months === months);
    setSelectedPlan(plan || null);
    form.setValue("planDuration", value);
  };

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (!user) {
      toast.error("You must be logged in to subscribe.");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a plan.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from("user")
        .update({
          full_name: values.fullName,
          address: values.address,
          phone_number: values.phoneNumber,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        toast.error("Failed to update your profile.", {
          description: profileError.message,
        });
        setIsSubmitting(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["user", user.id] });

      // Upload payment proof
      const file = values.paymentProof[0];
      const filePath = `${messId}/${user.id}/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload payment proof.", {
          description:
            "This may be due to missing storage permissions. Please try again later.",
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + selectedPlan.months);

      // Create subscription with dynamic plan data
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          mess_id: messId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_screenshot_url: uploadData.path,
          status: "pending_owner_confirmation",
          plan_duration_months: selectedPlan.months,
          plan_price: selectedPlan.price,
        });

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        toast.error("Failed to create subscription.", {
          description: subscriptionError.message,
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("Subscription request sent!", {
        description: "The mess owner will review your payment proof shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
    );
  }

  if (!pricingPlans || pricingPlans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pricing plans available. Please contact the mess owner.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 overflow-scroll h-[80vh] overflow-x-hidden px-2"
      >
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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Your phone number" {...field} />
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
                <Textarea
                  placeholder="Your complete delivery address"
                  className="resize-none"
                  // rows={1}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="planDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Plan</FormLabel>
              <Select onValueChange={handlePlanChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose subscription duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pricingPlans.map((plan) => (
                    <SelectItem
                      key={plan.months}
                      value={plan.months.toString()}
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">
                          {plan.months} {plan.months === 1 ? "Month" : "Months"}
                        </span>
                        <span className="flex items-center text-green-600 font-semibold">
                          <IndianRupee className="w-3 h-3" />
                          {plan.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {selectedPlan && (
                  <span className="text-sm font-medium text-primary">
                    Total Amount: ₹{selectedPlan.price.toLocaleString("en-IN")}{" "}
                    for {selectedPlan.months}{" "}
                    {selectedPlan.months === 1 ? "month" : "months"}
                    {selectedPlan.months > 1 && (
                      <span className="text-muted-foreground ml-1">
                        (₹
                        {(selectedPlan.price / selectedPlan.months).toFixed(0)}
                        /month)
                      </span>
                    )}
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentProof"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Payment Screenshot</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => onChange(e.target.files)}
                  {...fieldProps}
                  className="cursor-pointer"
                />
              </FormControl>
              <FormDescription>
                Upload payment proof (JPG, PNG, WEBP, or PDF, max 5MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedPlan && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-sm">
              Payment Instructions:
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Transfer ₹{selectedPlan.price.toLocaleString("en-IN")} to the
                mess owner
              </li>
              <li>Take a screenshot of the payment confirmation</li>
              <li>Upload the screenshot above</li>
              <li>Submit the form and wait for approval</li>
            </ol>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedPlan}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for Verification
        </Button>
      </form>
    </Form>
  );
};

export default SubscriptionForm;
