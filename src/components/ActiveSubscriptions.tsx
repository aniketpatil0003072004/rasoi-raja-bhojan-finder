import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerSubscriptions } from "@/hooks/useOwnerSubscriptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const ActiveSubscriptions = () => {
  const { subscriptions, isLoading, error } = useOwnerSubscriptions();

  // Get mess_id from the first subscription
  const messId = useMemo(() => {
    return subscriptions && subscriptions.length > 0
      ? subscriptions[0].mess_id
      : null;
  }, [subscriptions]);

  // Fetch cancelled meals for today for this specific mess
  const getCancelMealTodayData = async (messId: string) => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("meal_skips")
      .select(
        `
        *,
        user:user_id (
          id,
          full_name,
          phone_number,
          address
        )
      `
      )
      .eq("mess_id", messId)
      .eq("skip_date", today);

    if (error) throw new Error(error.message);
    return data || [];
  };

  const {
    data: cancelMealData,
    error: cancelMealError,
    isLoading: cancelMealLoading,
  } = useQuery({
    queryKey: ["cancel_meals_data", messId],
    queryFn: () => getCancelMealTodayData(messId!),
    enabled: !!messId, // Only run query if messId exists
  });

  // Filter active deliveries (students who haven't cancelled all meals)
  const activeDeliveries = useMemo(() => {
    if (!subscriptions || !cancelMealData) return subscriptions || [];

    // Create a map of user cancellations
    const cancellationMap = new Map();
    cancelMealData.forEach((skip) => {
      cancellationMap.set(skip.user_id, {
        breakfast: skip.breakfast_cancelled,
        lunch: skip.lunch_cancelled,
        dinner: skip.dinner_cancelled,
      });
    });

    // Filter subscriptions to show only those with at least one active meal
    return subscriptions.filter((sub) => {
      const cancellation = cancellationMap.get(sub.user_id);
      if (!cancellation) return true; // No cancellation means all meals active

      // If all meals are cancelled, exclude from delivery list
      return !(
        cancellation.breakfast &&
        cancellation.lunch &&
        cancellation.dinner
      );
    });
  }, [subscriptions, cancelMealData]);

  if (isLoading || cancelMealLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meal Management</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Management</CardTitle>
        <CardDescription>
          Track cancelled meals & today's delivery list.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="cancelled">
          <TabsList className="w-full flex">
            <TabsTrigger className="flex-1" value="cancelled">
              Cancelled Meals ({cancelMealData?.length || 0})
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="delivery">
              Delivery List ({activeDeliveries?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cancelled">
            {error || cancelMealError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {(error || cancelMealError)?.message}
                </AlertDescription>
              </Alert>
            ) : !cancelMealData || cancelMealData.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Cancelled Meals</AlertTitle>
                <AlertDescription>
                  None of the students cancelled their meals today.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Breakfast</TableHead>
                      <TableHead className="text-center">Lunch</TableHead>
                      <TableHead className="text-center">Dinner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelMealData.map((meal) => (
                      <TableRow key={meal.id}>
                        <TableCell className="font-medium">
                          {meal.user?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center">
                          {meal.breakfast_cancelled ? (
                            <span className="text-red-600 font-semibold">
                              ❌ Cancelled
                            </span>
                          ) : (
                            <span className="text-green-600">✔️ Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {meal.lunch_cancelled ? (
                            <span className="text-red-600 font-semibold">
                              ❌ Cancelled
                            </span>
                          ) : (
                            <span className="text-green-600">✔️ Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {meal.dinner_cancelled ? (
                            <span className="text-red-600 font-semibold">
                              ❌ Cancelled
                            </span>
                          ) : (
                            <span className="text-green-600">✔️ Active</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivery">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : !activeDeliveries || activeDeliveries.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Deliveries Today</AlertTitle>
                <AlertDescription>
                  There are no students scheduled for delivery today.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Meals Today</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDeliveries.map((sub) => {
                      // Get cancellation info for this user
                      const cancellation = cancelMealData?.find(
                        (skip) => skip.user_id === sub.user_id
                      );

                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {sub.user?.full_name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {sub.user?.phone_number || "N/A"}
                          </TableCell>
                          <TableCell>{sub.user?.address || "N/A"}</TableCell>
                          <TableCell className="font-medium">
                            {!cancellation?.breakfast_cancelled &&
                              "🍳 Breakfast "}
                            {!cancellation?.lunch_cancelled && "🍛 Lunch "}
                            {!cancellation?.dinner_cancelled && "🍽️ Dinner"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ActiveSubscriptions;
