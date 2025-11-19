import ActiveSubscriptions from "@/components/ActiveSubscriptions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const OwnerDashboardPage = () => {
  const [todayBreakfast, setTodayBreakfast] = useState("");
  const [todayLunch, setTodayLunch] = useState("");
  const [todayDinner, setTodayDinner] = useState("");
  const userData = sessionStorage.getItem("user");
  const user = JSON.parse(userData);
  const [messId, setMessId] = useState("");

  // Mess closure states
  const [isClosed, setIsClosed] = useState(false);
  const [closedFrom, setClosedFrom] = useState("");
  const [closedUntil, setClosedUntil] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [showClosureForm, setShowClosureForm] = useState(false);

  console.log(messId);

  useEffect(() => {
    const fetchMessData = async () => {
      const { data: mess_data, error: messError } = await supabase
        .from("messes")
        .select("id, is_closed, closed_from, closed_until, closure_reason")
        .eq("owner_id", user.id)
        .single();

      console.log(mess_data);

      if (mess_data) {
        setMessId(mess_data.id);
        setIsClosed(mess_data.is_closed || false);
        setClosedFrom(
          mess_data.closed_from
            ? new Date(mess_data.closed_from).toISOString().slice(0, 16)
            : ""
        );
        setClosedUntil(
          mess_data.closed_until
            ? new Date(mess_data.closed_until).toISOString().slice(0, 16)
            : ""
        );
        setClosureReason(mess_data.closure_reason || "");
      }
    };
    fetchMessData();
  }, []);

  useEffect(() => {
    const fetchMealData = async () => {
      if (!messId) return;

      const { data, error } = await supabase
        .from("today_meals")
        .select("*")
        .eq("mess_id", messId)
        .single();

      if (data) {
        setTodayBreakfast(data.breakfast || "");
        setTodayLunch(data.lunch || "");
        setTodayDinner(data.dinner || "");
      }
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

  const handleMessClosure = async (shouldClose) => {
    if (shouldClose) {
      // Validate dates
      if (!closedFrom || !closedUntil) {
        toast.error("Please select both start and end dates");
        return;
      }

      const fromDate = new Date(closedFrom);
      const untilDate = new Date(closedUntil);

      if (untilDate <= fromDate) {
        toast.error("End date must be after start date");
        return;
      }

      const { error } = await supabase
        .from("messes")
        .update({
          is_closed: true,
          closed_from: fromDate.toISOString(),
          closed_until: untilDate.toISOString(),
          closure_reason: closureReason,
        })
        .eq("id", messId);

      if (error) {
        toast.error("Error closing mess: " + error.message);
      } else {
        setIsClosed(true);
        setShowClosureForm(false);
        toast.success("Mess closed successfully!");
      }
    } else {
      // Reopen mess
      const { error } = await supabase
        .from("messes")
        .update({
          is_closed: false,
          closed_from: null,
          closed_until: null,
          closure_reason: null,
        })
        .eq("id", messId);

      if (error) {
        toast.error("Error reopening mess: " + error.message);
      } else {
        setIsClosed(false);
        setClosedFrom("");
        setClosedUntil("");
        setClosureReason("");
        toast.success("Mess reopened successfully!");
      }
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-row justify-between w-full gap-4">
        <div className="flex flex-col gap-2 mb-5 w-[70%]">
          <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Mess Status</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isClosed
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {isClosed ? "Closed" : "Open"}
              </span>
            </div>

            {isClosed && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-medium">Closed Period:</p>
                <p className="text-sm">
                  From: {new Date(closedFrom).toLocaleString()}
                </p>
                <p className="text-sm">
                  Until: {new Date(closedUntil).toLocaleString()}
                </p>
                {closureReason && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Reason:</span> {closureReason}
                  </p>
                )}
              </div>
            )}

            {!isClosed && !showClosureForm && (
              <Button
                onClick={() => setShowClosureForm(true)}
                variant="destructive"
                className="w-full"
              >
                Close Mess
              </Button>
            )}

            {showClosureForm && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Closed From
                  </label>
                  <input
                    type="datetime-local"
                    value={closedFrom}
                    onChange={(e) => setClosedFrom(e.target.value)}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Closed Until
                  </label>
                  <input
                    type="datetime-local"
                    value={closedUntil}
                    onChange={(e) => setClosedUntil(e.target.value)}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="E.g., Festival holiday, Maintenance, etc."
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleMessClosure(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Confirm Closure
                  </Button>
                  <Button
                    onClick={() => setShowClosureForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isClosed && (
              <Button
                onClick={() => handleMessClosure(false)}
                variant="default"
                className="w-full mt-3"
              >
                Reopen Mess
              </Button>
            )}
          </div>

          <label htmlFor="today_meal">Add Today's Meal</label>
          <div className="flex flex-row gap-2">
            <input
              onBlur={(e) => {
                setTodayBreakfast(e.target.value);
                handleAddTodaysMeal("breakfast", e.target.value);
              }}
              value={todayBreakfast}
              onChange={(e) => setTodayBreakfast(e.target.value)}
              type="text"
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2"
              placeholder="Add BreakFast"
              disabled={isClosed}
            />
            <input
              type="text"
              onBlur={(e) => {
                setTodayLunch(e.target.value);
                handleAddTodaysMeal("lunch", e.target.value);
              }}
              value={todayLunch}
              onChange={(e) => setTodayLunch(e.target.value)}
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2"
              placeholder="Add Lunch"
              disabled={isClosed}
            />
            <input
              type="text"
              onBlur={(e) => {
                setTodayDinner(e.target.value);
                handleAddTodaysMeal("dinner", e.target.value);
              }}
              value={todayDinner}
              onChange={(e) => setTodayDinner(e.target.value)}
              className="border-[1px] border-black placeholder:text-sm rounded-md w-[300px] focus:outline-gray-500 px-4 py-2"
              placeholder="Add Dinner"
              disabled={isClosed}
            />
          </div>
        </div>

        <div className="w-[30%] bg-gray-200 mb-3 rounded-xl px-4 py-2">
          <h2 className="font-bold text-xl">Today's Meal</h2>
          <p className="font-bold text-md">
            Breakfast:{" "}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="font-bold">
            Meal Cancellation / Meal Delivery
          </TabsTrigger>
          {/* <TabsTrigger value="mess">Mess Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="meal-skips">Meal Skips</TabsTrigger> */}
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveSubscriptions />
        </TabsContent>

        {/* <TabsContent value="mess" className="mt-6">
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
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default OwnerDashboardPage;
