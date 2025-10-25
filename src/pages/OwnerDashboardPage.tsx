import React, { useEffect, useState } from "react";
import SubscriptionManagement from "@/components/SubscriptionManagement";
import ActiveSubscriptions from "@/components/ActiveSubscriptions";
import DeliveryManagement from "@/components/DeliveryManagement";
import MessManagement from "@/components/MessManagement";
import { OwnerMealSkipsView } from "@/components/OwnerMealSkipsView";
import { OwnerCancellationTimer } from "@/components/OwnerCancellationTimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OwnerDashboardPage = () => {
  const [todayBreakfast, setTodayBreakfast] = useState("");
  const [todayLunch, setTodayLunch] = useState("");
  const [todayDinner, setTodayDinner] = useState("");
  const userData = localStorage.getItem("user");
  const user = JSON.parse(userData);
  const [messId, setMessId] = useState("");

  useEffect(() => {
    const fetchMessData = async () => {
      const { data: mess_id, error: messError } = await supabase
        .from("messes")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      setMessId(mess_id.id);
    };
    fetchMessData();
  }, []);

  useEffect(() => {
    const fetchMealData = async () => {
      const { data, error } = await supabase
        .from("today_meals")
        .select("*")
        .eq("mess_id", messId)
        .single();
      console.log(data);

      setTodayBreakfast(data.breakfast);
      setTodayLunch(data.lunch);
      setTodayDinner(data.dinner);
    };
    fetchMealData();
  }, [messId]);

  const handleAddTodaysMeal = async (mealType, meal) => {
    if (!meal) {
      return;
    }

    const { data, error } = await supabase
      .from("today_meals")
      .upsert({ mess_id: messId, [mealType]: meal }, { onConflict: "mess_id" });

    if (error) {
      toast.error("Error updating meal: " + error.message);
    } else {
      toast.success("Meal updated successfully!");
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-col gap-2 mb-5 w-[70%]">
          <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
          <label htmlFor="today_meal">Add Today's Meal</label>
          <div className="flex flex-row gap-2">
            <input
              onBlur={(e) => {
                setTodayBreakfast(e.target.value);
                handleAddTodaysMeal("breakfast", e.target.value);
              }}
              type="text"
              autoFocus
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2 "
              placeholder="Add BreakFast"
            />
            <input
              type="text"
              onBlur={(e) => {
                setTodayLunch(e.target.value);
                handleAddTodaysMeal("lunch", e.target.value);
              }}
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2 "
              placeholder="Add Lunch"
            />
            <input
              type="text"
              onBlur={(e) => {
                setTodayDinner(e.target.value);
                handleAddTodaysMeal("dinner", e.target.value);
              }}
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2 "
              placeholder="Add Dinner"
            />
          </div>
        </div>

        <div className="w-[30%] bg-gray-200 mb-3 rounded-xl px-4 py-2">
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
      </div>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="mess">Mess Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="meal-skips">Meal Skips</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveSubscriptions />
        </TabsContent>

        <TabsContent value="mess" className="mt-6">
          <MessManagement />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="meal-skips" className="mt-6">
          <div className="space-y-6">
            <OwnerCancellationTimer />
            <OwnerMealSkipsView />
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <DeliveryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboardPage;
