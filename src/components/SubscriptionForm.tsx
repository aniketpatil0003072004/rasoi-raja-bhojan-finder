
import React, { useEffect, useState } from "react";
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
import { Loader2, IndianRupee, QrCode, ArrowLeft, CheckCircle2, Copy, Download } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QRCode from "qrcode";

const subscriptionSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  address: z.string().min(1, "Address is required."),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits.")
    .regex(/^[0-9]+$/, "Phone number must contain only digits."),
  planDuration: z.string().min(1, "Please select a plan duration."),
  transactionId: z.string().optional(),
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
  const userData = sessionStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<PricingPlan | null>(
    null
  );
  const [showPayment, setShowPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [upiLink, setUpiLink] = useState<string>("");

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

  const fetchUpiInfo = async () => {
    const { data: upiData, error: upiDataError } = await supabase
      .from("messes")
      .select("name, upi_id, upi_name")
      .eq("id", messId)
      .single();

    if (upiDataError) {
      console.error("Error fetching UPI info:", upiDataError);
      return null;
    }
    return upiData;
  };

  const { data: upiData, isLoading: upiLoading } = useQuery({
    queryKey: ["messUpiData", messId],
    queryFn: fetchUpiInfo,
    enabled: !!user,
  });

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
      transactionId: "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || "",
        address: profile.address || "",
        phoneNumber: profile.phone_number || "",
        planDuration: "",
        transactionId: "",
      });
    }
  }, [profile, form]);

  const handlePlanChange = (value: string) => {
    const price = parseInt(value);
    const plan = pricingPlans.find((p) => p.price === price);
    setSelectedPlan(plan || null);
    form.setValue("planDuration", value);
  };

  const generatePaymentDetails = async () => {
    if (!selectedPlan || !upiData?.upi_id) {
      toast.error("Payment details not available for this mess.");
      return;
    }

    const amount = selectedPlan.price;
    const amountFormatted = Number(amount).toFixed(2);
    const payeeVPA = upiData.upi_id;
    const payeeName = upiData.upi_name || upiData.name;

    // QR Code Link: Auto-fill and Lock Amount
    // 'am' = amount, 'mam' = minimum amount (prevents editing in some apps)
    const qrLinkString = `upi://pay?pa=${payeeVPA}&pn=${encodeURIComponent(
      payeeName
    )}&am=${amountFormatted}&mam=${amountFormatted}&cu=INR`;

    // Deep Link for "Pay via App": Manual Entry (as requested)
    // We keep this flexible in case the auto-lock fails on some specific app versions
    const deepLink = `upi://pay?pa=${payeeVPA}&pn=${encodeURIComponent(
      payeeName
    )}&cu=INR`;

    setUpiLink(deepLink);

    try {
      const qrUrl = await QRCode.toDataURL(qrLinkString, { width: 300 });
      setQrCodeUrl(qrUrl);
      setShowPayment(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      toast.error("Failed to generate payment QR code.");
    }
  };

  const handleProceedToPay = async () => {
    const isValid = await form.trigger([
      "fullName",
      "address",
      "phoneNumber",
      "planDuration",
    ]);
    if (isValid) {
      generatePaymentDetails();
    }
  };

  const handleFinalSubmit = async (values: SubscriptionFormValues) => {
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
        toast.error("Failed to update your profile.");
        setIsSubmitting(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["user", user.id] });

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + selectedPlan.months);

      // Create subscription
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          mess_id: messId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          plan_duration_months: selectedPlan.months,
          plan_price: selectedPlan.price,
          // Store transaction ID if provided (assuming we add a column for it later or put it in notes)
          // For now, we just create the subscription.
          // You might want to add a 'transaction_id' column to 'subscriptions' table too.
        });

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
        toast.error("Failed to create subscription.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Subscription request sent!", {
        description: "The mess owner will verify your payment and approve it.",
      });
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading || upiLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
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

  if (showPayment) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPayment(false)}
            className="p-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h3 className="font-semibold text-lg">Complete Payment</h3>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="space-y-6 text-center px-1">

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <IndianRupee className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">High Value Transaction</h4>
                <p className="text-sm text-amber-800 mt-1">
                  For amounts over ₹2,000, scanning QR codes often fails due to banking limits.
                  <br />
                  <strong>Best Method:</strong> Copy the UPI ID below and pay manually in your app.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-xl bg-secondary/5 space-y-2">
              <p className="text-sm text-muted-foreground">Pay to UPI ID</p>
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-lg border shadow-sm">
                <input
                  type="text"
                  value={upiData?.upi_id || ""}
                  readOnly
                  className="text-lg font-mono font-semibold text-primary bg-transparent border-none outline-none flex-1"
                  onClick={(e) => {
                    e.currentTarget.select();
                    const upiId = upiData?.upi_id || "";

                    // Try to copy
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(upiId).then(() => {
                        toast.success("UPI ID copied!");
                      }).catch(() => {
                        toast.info("UPI ID selected. Long press to copy!");
                      });
                    } else {
                      // Fallback: just select the text
                      try {
                        document.execCommand('copy');
                        toast.success("UPI ID copied!");
                      } catch {
                        toast.info("UPI ID selected. Long press to copy!");
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const upiId = upiData?.upi_id || "";
                    const input = document.querySelector('input[value="' + upiId + '"]') as HTMLInputElement;

                    if (input) {
                      input.focus();
                      input.select();
                    }

                    try {
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(upiId);
                        toast.success("UPI ID copied to clipboard!");
                      } else {
                        // Fallback for older browsers or non-HTTPS
                        const textArea = document.createElement("textarea");
                        textArea.value = upiId;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        textArea.style.top = "0";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();

                        try {
                          const successful = document.execCommand('copy');
                          if (successful) {
                            toast.success("UPI ID copied!");
                          } else {
                            toast.info("Tap the UPI ID and long press to copy!");
                          }
                        } catch (err) {
                          toast.info("Tap the UPI ID and long press to copy!");
                        }

                        document.body.removeChild(textArea);
                      }
                    } catch (err) {
                      toast.info("Tap the UPI ID and long press to copy!");
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Name: <strong>{upiData?.upi_name || upiData?.name}</strong>
              </p>
              <p className="text-xs text-amber-600 italic">
                💡 Tip: Tap the UPI ID above and long-press to copy if button doesn't work
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border space-y-3 text-left">
              <h4 className="font-medium text-sm">How to pay:</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Copy the <strong>UPI ID</strong> above.</li>
                <li>Open GPay, PhonePe, or Paytm.</li>
                <li>Select <strong>"Pay to UPI ID"</strong> or <strong>"To Bank/UPI ID"</strong>.</li>
                <li>Paste the ID and enter amount: <strong>₹{selectedPlan?.price.toLocaleString("en-IN")}</strong>.</li>
              </ol>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or try QR (May limit at ₹2000)
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border inline-block mx-auto relative group">
            {qrCodeUrl ? (
              <>
                <img src={qrCodeUrl} alt="Payment QR Code" className="w-32 h-32" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = qrCodeUrl;
                    link.download = `payment-qr-${messId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("QR Code downloaded!");
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Skeleton className="w-32 h-32" />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  After Payment
                </span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFinalSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter Transaction ID / UTR (Required)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  I have completed payment
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-4 overflow-y-auto max-h-[70vh] px-1">
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
                    <SelectItem key={plan.months} value={plan.price.toString()}>
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
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          className="w-full"
          disabled={!selectedPlan || !upiData?.upi_id}
          onClick={handleProceedToPay}
        >
          Proceed to Pay
        </Button>
        {!upiData?.upi_id && (
          <p className="text-xs text-destructive text-center">
            Online payment not available for this mess.
          </p>
        )}
      </form>
    </Form>
  );
};

export default SubscriptionForm;
