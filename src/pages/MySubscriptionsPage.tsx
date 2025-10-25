import MySubscriptions from "@/components/MySubscriptions";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const MySubscriptionsPage = () => {
  const [todayBreakfast, setTodayBreakfast] = useState("");
  const [todayLunch, setTodayLunch] = useState("");
  const [todayDinner, setTodayDinner] = useState("");
  const userData = localStorage.getItem("user");
  let user;
  if (userData) {
    user = JSON.parse(userData);
  }

  const fetchUserSubscriptions = async (userId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, messes(name, cancellation_deadline_time)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["mySubscriptions", user?.id],
    queryFn: () => fetchUserSubscriptions(user!.id),
    enabled: !!user,
  });
  console.log(subscriptions);

  useEffect(() => {
    const fetchMealData = async () => {
      const { data, error } = await supabase
        .from("today_meals")
        .select("*")
        .eq("mess_id", subscriptions[0].mess_id)
        .single();
      console.log(data);

      setTodayBreakfast(data.breakfast);
      setTodayLunch(data.lunch);
      setTodayDinner(data.dinner);
    };
    fetchMealData();
  }, [subscriptions]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>
      <div className="mb-4">
        <h2 className="font-bold text-xl">Today's Meal</h2>
        <p className="font-bold text-md">
          Breatkfast:{" "}
          <span className="text-gray-800 text-sm">{todayBreakfast}</span>
        </p>
        <p className="font-bold text-md">
          Lunch: <span className="text-gray-800 text-sm">{todayLunch}</span>
        </p>
        <p className="font-bold text-md">
          Dinner: <span className="text-gray-800 text-sm">{todayDinner}</span>
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <MySubscriptions subscriptions={subscriptions} />
      )}
    </div>
  );
};

export default MySubscriptionsPage;
