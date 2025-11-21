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

  const messId = useMemo(() => {
    return subscriptions && subscriptions.length > 0
      ? subscriptions[0].mess_id
      : null;
  }, [subscriptions]);

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
    enabled: !!messId,
  });

  const userMealStatus = useMemo(() => {
    if (!cancelMealData) return new Map();

    const statusMap = new Map();

    cancelMealData.forEach((skip) => {
      if (!statusMap.has(skip.user_id)) {
        statusMap.set(skip.user_id, {
          user: skip.user,
          breakfast: false,
          lunch: false,
          dinner: false,
        });
      }

      const userStatus = statusMap.get(skip.user_id);

      // Mark the specific meal type as cancelled
      if (skip.meal_type === "breakfast") {
        userStatus.breakfast = true;
      } else if (skip.meal_type === "lunch") {
        userStatus.lunch = true;
      } else if (skip.meal_type === "dinner") {
        userStatus.dinner = true;
      }
    });

    return statusMap;
  }, [cancelMealData]);

  // Get list of users who have cancelled at least one meal
  const usersWithCancellations = useMemo(() => {
    return Array.from(userMealStatus.values());
  }, [userMealStatus]);

  // Filter active deliveries (students who haven't cancelled all meals)
  const activeDeliveries = useMemo(() => {
    if (!subscriptions) return [];

    return subscriptions
      .map((sub) => {
        const cancellations = userMealStatus.get(sub.user_id);

        return {
          ...sub,
          meals: {
            breakfast: !cancellations?.breakfast,
            lunch: !cancellations?.lunch,
            dinner: !cancellations?.dinner,
          },
        };
      })
      .filter((sub) => {
        // Only include if at least one meal is active
        return sub.meals.breakfast || sub.meals.lunch || sub.meals.dinner;
      });
  }, [subscriptions, userMealStatus]);

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
              Cancelled Meals ({usersWithCancellations.length})
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
            ) : usersWithCancellations.length === 0 ? (
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
                    {usersWithCancellations.map((userStatus, index) => (
                      <TableRow key={`${userStatus.user?.id}-${index}`}>
                        <TableCell className="font-medium">
                          {userStatus.user?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center">
                          {userStatus.breakfast ? (
                            <span className="text-red-600 font-semibold">
                              ❌ Cancelled
                            </span>
                          ) : (
                            <span className="text-green-600">✔️ Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {userStatus.lunch ? (
                            <span className="text-red-600 font-semibold">
                              ❌ Cancelled
                            </span>
                          ) : (
                            <span className="text-green-600">✔️ Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {userStatus.dinner ? (
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
                  All meals have been cancelled for today, or there are no
                  active subscriptions.
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
                      <TableHead>Meals to Deliver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDeliveries.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.user?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>{sub.user?.phone_number || "N/A"}</TableCell>
                        <TableCell>{sub.user?.address || "N/A"}</TableCell>
                        <TableCell className="font-medium">
                          {sub.meals.breakfast && "🍳 Breakfast "}
                          {sub.meals.lunch && "🍛 Lunch "}
                          {sub.meals.dinner && "🍽️ Dinner"}
                        </TableCell>
                      </TableRow>
                    ))}
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
