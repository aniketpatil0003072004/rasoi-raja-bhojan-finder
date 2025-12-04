import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionWithDetails } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealSkipForm } from "./MealSkipForm";
import { MealSkipsList } from "./MealSkipsList";
import { MealCancellationTimer } from "./MealCancellationTimer";

const MySubscriptions = ({
  subscriptions,
}: {
  subscriptions: SubscriptionWithDetails[];
}) => {
  const [viewingConfirmation, setViewingConfirmation] = React.useState<{
    url: string;
    messName: string;
  } | null>(null);

  const handleViewConfirmation = async (filePath: string, messName: string) => {
    const { data, error } = await supabase.storage
      .from("payment_proofs")
      .createSignedUrl(filePath, 60);

    if (error) {
      toast.error("Could not load confirmation proof.", {
        description: error.message,
      });
      return;
    }

    setViewingConfirmation({
      url: data.signedUrl,
      messName: `Confirmation from ${messName}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription History</CardTitle>
      </CardHeader>

      <CardContent>
        {!subscriptions || subscriptions.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Subscriptions Found</AlertTitle>
            <AlertDescription>
              You have not subscribed to any mess yet.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* ----- SUBSCRIPTIONS LIST TABLE ----- */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mess</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Meals Used</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {subscriptions.map((sub) => {
                  // Calculate total meals: 30 days per month * 2 meals per day (lunch + dinner)
                  // Or you can use: months * 30 * 2 for a simple calculation
                  const totalMeals = (sub.plan_duration_months || 1) * 30 * 2;

                  // Calculate days elapsed
                  const startDate = new Date(sub.start_date);
                  const today = new Date();
                  const endDate = new Date(sub.end_date);

                  // Only count days if subscription has started and hasn't ended
                  const daysElapsed = today >= startDate && today <= endDate
                    ? Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    : today > endDate
                      ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                  // Meals consumed = days elapsed * 2 (assuming lunch + dinner daily)
                  const mealsConsumed = Math.min(daysElapsed * 2, totalMeals);

                  // Calculate percentage for progress indication
                  const percentage = (mealsConsumed / totalMeals) * 100;

                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.messes?.name || "N/A"}
                      </TableCell>

                      <TableCell>
                        {sub.plan_duration_months
                          ? `${sub.plan_duration_months} ${sub.plan_duration_months === 1 ? "Month" : "Months"
                          }`
                          : "N/A"}
                      </TableCell>

                      <TableCell className="font-semibold">
                        {sub.plan_price ? `₹${sub.plan_price}` : "N/A"}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">
                              {mealsConsumed}/{totalMeals}
                            </span>
                            <Badge variant={percentage > 80 ? "destructive" : "secondary"} className="text-xs">
                              {percentage.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${percentage > 80 ? "bg-red-500" : "bg-primary"
                                }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {new Date(sub.start_date).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        {new Date(sub.end_date).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.owner_confirmation_screenshot_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewConfirmation(
                                  sub.owner_confirmation_screenshot_url!,
                                  sub.messes?.name || "Mess"
                                )
                              }
                            >
                              View Confirmation
                            </Button>
                          )}

                          <Button asChild size="sm">
                            <Link to={`/mess/${sub.mess_id}`}>Renew</Link>
                          </Button>

                          <Button asChild variant="secondary" size="sm">
                            <Link to="/messes">Find New Mess</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* ----- MEAL SKIP & TIMER SECTION ----- */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">Manage Meal Skips</h3>

              <Tabs defaultValue={subscriptions[0]?.id} className="w-full">
                <TabsList className="w-full overflow-x-auto flex-wrap h-auto">
                  {subscriptions.map((sub) => (
                    <TabsTrigger key={sub.id} value={sub.id}>
                      {sub.messes?.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {subscriptions.map((sub) => (
                  <TabsContent
                    key={sub.id}
                    value={sub.id}
                    className="space-y-4"
                  >
                    {/* Cancellation Timer */}
                    {(sub.messes as any)?.cancellation_deadline_time && (
                      <MealCancellationTimer
                        cancellationDeadlineTime={
                          (sub.messes as any).cancellation_deadline_time
                        }
                      />
                    )}

                    {/* Meal Skip Form and List */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Skip a Meal</h4>
                        <MealSkipForm
                          subscriptionId={sub.id}
                          startDate={sub.start_date}
                          endDate={sub.end_date}
                          messId={sub.mess_id}
                        />
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Your Skipped Meals</h4>
                        <MealSkipsList subscriptionId={sub.id} />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* ----- VIEW PAYMENT CONFIRMATION DIALOG ----- */}
            <Dialog
              open={!!viewingConfirmation}
              onOpenChange={(isOpen) => !isOpen && setViewingConfirmation(null)}
            >
              {viewingConfirmation && (
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{viewingConfirmation.messName}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <img
                      src={viewingConfirmation.url}
                      alt="Payment Confirmation"
                      className="w-full h-auto rounded-md"
                    />
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MySubscriptions;
