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
import { useEffect, useState } from "react";

const ActiveSubscriptions = () => {
  const { subscriptions, isLoading, error } = useOwnerSubscriptions("active");
  const [subsIdsName, setSubsIdsName] = useState([
    {
      id: "",
      name: "",
    },
  ]);

  useEffect(() => {
    if (subscriptions) {
      const mapped = subscriptions.map((sub) => ({
        id: sub.id,
        name: sub.user.full_name,
      }));

      setSubsIdsName(mapped);
    }
  }, [subscriptions]);

  const getCancelMealData = async () => {
    const { data, error } = await supabase
      .from("meal_skips")
      .select("*")
      .in("subscription_id", subsIds);

    if (error) throw new Error(error.message);
    return data || [];
  };

  const {
    data: cancelMealData,
    error: cancleMealError,
    isLoading: cancelMealLoading,
  } = useQuery({
    queryKey: ["cancel_meals"],
    queryFn: () => getCancelMealData(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Management</CardTitle>
        <CardDescription>
          Track cancelled meals & today’s delivery list.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="cancelled">
          <TabsList className="w-full flex">
            <TabsTrigger className="flex-1" value="cancelled">
              Cancelled Meals
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="delivery">
              Delivery List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cancelled">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Breakfast</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead>Dinner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelMealData.map((meal) => (
                    <TableRow key={meal.id}>
                      <TableCell>{meal.user.full_name}</TableCell>
                      <TableCell>
                        {meal.breakfast_cancelled
                          ? "❌ Cancelled"
                          : "✔️ Active"}
                      </TableCell>
                      <TableCell>
                        {meal.lunch_cancelled ? "❌ Cancelled" : "✔️ Active"}
                      </TableCell>
                      <TableCell>
                        {meal.dinner_cancelled ? "❌ Cancelled" : "✔️ Active"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="delivery">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : !subsIdsName || subsIdsName.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Deliveries Today</AlertTitle>
                <AlertDescription>
                  There are no students scheduled for delivery today.
                </AlertDescription>
              </Alert>
            ) : (
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
                  {subsIdsName.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      {/* <TableCell>{d.phone_number}</TableCell> */}
                      {/* <TableCell>{d.user?.address}</TableCell> */}
                      {/* <TableCell className="font-medium">
                        {d.breakfast ? "🍳 Breakfast " : ""}
                        {d.lunch ? "🍛 Lunch " : ""}
                        {d.dinner ? "🍽️ Dinner " : ""}
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ActiveSubscriptions;
