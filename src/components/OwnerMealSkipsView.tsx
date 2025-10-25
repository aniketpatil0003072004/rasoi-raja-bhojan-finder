import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { MEAL_TYPE_LABELS, MealSkip } from "@/types";
import { useOwnerMesses } from "@/hooks/useOwnerMesses";

type MealSkipWithDetails = MealSkip & {
  subscriptions: {
    profiles: {
      full_name: string | null;
      address: string | null;
      phone_number: string | null;
    } | null;
  } | null;
};

export const OwnerMealSkipsView = () => {
  const { messIds } = useOwnerMesses();

  const { data: mealSkips = [], isLoading } = useQuery({
    queryKey: ["owner-meal-skips", messIds],
    queryFn: async () => {
      if (messIds.length === 0) return [];

      const { data, error } = await supabase
        .from("meal_skips")
        .select(
          `
          *,
          subscriptions!inner(
            mess_id,
            user_id
          )
        `
        )
        .in("subscriptions.mess_id", messIds)
        .gte("skip_date", new Date().toISOString().split("T")[0])
        .order("skip_date", { ascending: true });

      if (error) throw error;

      // Fetch profile details for each subscription
      const mealSkipsWithProfiles = await Promise.all(
        data.map(async (skip) => {
          const { data: profile } = await supabase
            .from("user")
            .select("full_name, address, phone_number")
            .eq("id", skip.subscriptions.user_id)
            .single();

          return {
            ...skip,
            subscriptions: {
              ...skip.subscriptions,
              profiles: profile,
            },
          };
        })
      );

      return mealSkipsWithProfiles as MealSkipWithDetails[];
    },
    enabled: messIds.length > 0,
  });

  if (isLoading) {
    return <div>Loading meal skips...</div>;
  }

  if (mealSkips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No upcoming meal skips
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter skips by meal type
  const breakfastSkips = mealSkips.filter(
    (skip) => skip.meal_type === "breakfast"
  );
  const lunchSkips = mealSkips.filter((skip) => skip.meal_type === "lunch");
  const dinnerSkips = mealSkips.filter((skip) => skip.meal_type === "dinner");

  // Helper function to group skips by date
  const groupSkipsByDate = (skips: MealSkipWithDetails[]) => {
    return skips.reduce((acc, skip) => {
      const date = skip.skip_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(skip);
      return acc;
    }, {} as Record<string, MealSkipWithDetails[]>);
  };

  // Render function for meal skip content
  const renderMealSkips = (skips: MealSkipWithDetails[]) => {
    if (skips.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No upcoming skips for this meal
            </p>
          </CardContent>
        </Card>
      );
    }

    const skipsByDate = groupSkipsByDate(skips);

    return (
      <div className="space-y-4">
        {Object.entries(skipsByDate).map(([date, dateSkips]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dateSkips.map((skip) => (
                <div key={skip.id} className="p-3 border rounded">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {skip.subscriptions?.profiles?.full_name ||
                          "Unknown Student"}
                      </span>
                    </div>
                    {skip.subscriptions?.profiles?.address && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Address:</span>{" "}
                        {skip.subscriptions.profiles.address}
                      </p>
                    )}
                    {skip.subscriptions?.profiles?.phone_number && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Phone:</span>{" "}
                        {skip.subscriptions.profiles.phone_number}
                      </p>
                    )}
                    {skip.reason && (
                      <p className="text-sm text-muted-foreground italic">
                        <span className="font-medium">Reason:</span>{" "}
                        {skip.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upcoming Meal Skips</h3>
      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakfast">
            Breakfast ({breakfastSkips.length})
          </TabsTrigger>
          <TabsTrigger value="lunch">Lunch ({lunchSkips.length})</TabsTrigger>
          <TabsTrigger value="dinner">
            Dinner ({dinnerSkips.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="breakfast" className="mt-4">
          {renderMealSkips(breakfastSkips)}
        </TabsContent>
        <TabsContent value="lunch" className="mt-4">
          {renderMealSkips(lunchSkips)}
        </TabsContent>
        <TabsContent value="dinner" className="mt-4">
          {renderMealSkips(dinnerSkips)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
